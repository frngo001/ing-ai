import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/editor'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/editor'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user is new (created within last 2 minutes)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email) {
        const isNewUser = new Date(user.created_at).getTime() > Date.now() - 2 * 60 * 1000
        if (isNewUser) {
          // Send welcome email
          const { sendEmail } = await import('@/lib/resend')
          const { WelcomeEmail } = await import('@/components/emails/WelcomeEmail')

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

          await sendEmail({
            to: user.email,
            subject: 'Welcome to Ing AI',
            react: WelcomeEmail({ userName: profile?.full_name || 'User' }),
          })
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=oauth`)
}

