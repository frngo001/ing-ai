import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'
import { devLog, devError } from '@/lib/utils/logger'
import { isEmailNotificationEnabled } from '@/lib/supabase/utils/notification-settings'
import NewProjectEmail from '@/components/emails/NewProjectEmail'
import ActivitySummaryEmail from '@/components/emails/ActivitySummaryEmail'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, payload } = body

    if (!type) {
      return NextResponse.json({ error: 'Missing notification type' }, { status: 400 })
    }

    // Check if email notifications are enabled
    const emailEnabled = await isEmailNotificationEnabled(user.id)
    if (!emailEnabled) {
      devLog('[NOTIFICATIONS] Email notifications disabled for user:', user.id)
      return NextResponse.json({
        success: true,
        message: 'Email notifications disabled',
        sent: false,
      })
    }

    // Get user profile for email and name
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      devError('[NOTIFICATIONS] No email found for user:', user.id)
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    let result

    switch (type) {
      case 'project_created': {
        const { projectName, projectDescription } = payload || {}

        if (!projectName) {
          return NextResponse.json({ error: 'Missing project name' }, { status: 400 })
        }

        result = await sendEmail({
          to: profile.email,
          subject: `New Project Created: ${projectName}`,
          react: NewProjectEmail({
            userName: profile.full_name || 'User',
            projectName,
            projectDescription,
          }),
        })
        break
      }

      case 'activity_summary': {
        const { period, activities, stats } = payload || {}

        if (!period) {
          return NextResponse.json({ error: 'Missing period' }, { status: 400 })
        }

        const subject = period === 'daily'
          ? 'Your Daily Activity Summary'
          : 'Your Weekly Activity Summary'

        result = await sendEmail({
          to: profile.email,
          subject,
          react: ActivitySummaryEmail({
            userName: profile.full_name || 'User',
            period,
            activities: activities || [],
            stats: stats || { documentsCreated: 0, documentsEdited: 0, citationsAdded: 0, wordsWritten: 0 },
          }),
        })
        break
      }

      default:
        return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 })
    }

    if (!result?.success) {
      devError('[NOTIFICATIONS] Failed to send email:', result?.error)
      return NextResponse.json(
        { error: 'Failed to send email', details: result?.error },
        { status: 500 }
      )
    }

    devLog('[NOTIFICATIONS] Email sent successfully:', type)
    return NextResponse.json({ success: true, sent: true })
  } catch (error) {
    devError('[NOTIFICATIONS] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
