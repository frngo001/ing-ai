import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/dashboard";

    if (code) {
        try {
            const supabase = await createClient();
            await supabase.auth.exchangeCodeForSession(code);
        } catch (error) {
            console.error("OAuth callback error", error);
            return NextResponse.redirect(new URL("/auth/login?error=oauth", requestUrl.origin));
        }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
}

