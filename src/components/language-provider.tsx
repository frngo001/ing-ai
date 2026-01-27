"use client"

import * as React from "react"
import { useLanguage } from "@/lib/i18n/use-language"
import { Language } from "@/lib/i18n/translations"

/**
 * Provider-Komponente, die die Spracheinstellungen beim App-Start
 * aus Supabase lädt und synchronisiert.
 */
export function LanguageProvider({
    children,
    initialLanguage
}: {
    children: React.ReactNode,
    initialLanguage?: Language
}) {
    const initializeFromSupabase = useLanguage((state) => state.initializeFromSupabase)
    const isInitialized = useLanguage((state) => state.isInitialized)
    const language = useLanguage((state) => state.language)

    // Synchronisiere initialLanguage auf der Server-Seite des Client-Components
    // Dies stellt sicher, dass das SSR-HTML die korrekte Sprache verwendet.
    // Wir verwenden einen Ref, um sicherzustellen, dass dies nur einmal pro Render-Pass passiert
    // und keine endlosen Re-renders auslöst, falls es sich ändert.
    const initializedOnServer = React.useRef(false)

    if (initialLanguage && !isInitialized && typeof window === 'undefined' && !initializedOnServer.current) {
        if (language !== initialLanguage) {
            useLanguage.setState({ language: initialLanguage })
        }
        initializedOnServer.current = true
    }

    React.useEffect(() => {
        initializeFromSupabase()
    }, [initializeFromSupabase])

    return <>{children}</>
}

