import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // PKCE wird automatisch verwendet (Standard für Authorization Code Flow)
                // Der Code Verifier wird automatisch im localStorage gespeichert
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
                autoRefreshToken: true,
                persistSession: true,
            },
        }
    )
}
