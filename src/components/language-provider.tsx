"use client"

import * as React from "react"
import { useLanguage } from "@/lib/i18n/use-language"

/**
 * Provider-Komponente, die die Spracheinstellungen beim App-Start
 * aus Supabase lädt und synchronisiert.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const initializeFromSupabase = useLanguage((state) => state.initializeFromSupabase)

    React.useEffect(() => {
        initializeFromSupabase()
    }, [initializeFromSupabase])

    return <>{children}</>
}

