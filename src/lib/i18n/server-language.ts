import { cookies, headers } from 'next/headers'
import { translations, type Language } from './translations'
import { createClient } from '@/lib/supabase/server'
import { getLanguageFromGeolocation } from '@/lib/geolocation/language'

const supportedLanguages = Object.keys(translations) as Language[]
const DEFAULT_FALLBACK_LANGUAGE: Language = 'en'

/**
 * Prüft, ob eine Sprache unterstützt wird.
 */
function isValidLanguage(lang: string): lang is Language {
    return supportedLanguages.includes(lang as Language)
}

/**
 * Server-seitige Funktion zur Ermittlung der Sprache.
 * Verwendet die exakt gleiche Logik wie die Client-seitige Initialisierung:
 * 1. Cookies (gespeicherte Präferenz)
 * 2. Supabase User Preferences (wenn User eingeloggt)
 * 3. Geolocation (IP-basierte Lokalisierung)
 * 4. Accept-Language Header (Browser-Präferenz)
 * 5. Fallback: 'en' (Englisch)
 */
export async function getLanguageForServer(): Promise<Language> {
    try {
        // 1. Versuche zuerst, die Sprache aus Cookies zu lesen (gespeicherte Präferenz)
        const cookieStore = await cookies()
        const languageCookie = cookieStore.get('language-storage')
        
        if (languageCookie?.value) {
            try {
                const parsed = JSON.parse(languageCookie.value)
                const lang = parsed?.state?.language
                if (lang && isValidLanguage(lang)) {
                    return lang
                }
            } catch {
                // Cookie konnte nicht geparst werden, weiter mit Supabase
            }
        }

        // 2. Prüfe Supabase User Preferences (wenn User eingeloggt)
        try {
            const supabase = await createClient()
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            
            if (!userError && user?.id) {
                const userId = user.id
                // Verwende direkt den Server-Client für User Preferences
                const { data: prefs, error } = await supabase
                    .from('user_preferences')
                    .select('language')
                    .eq('user_id', userId)
                    .single()
                
                if (!error && prefs?.language && isValidLanguage(prefs.language)) {
                    return prefs.language
                }
            }
        } catch {
            // Fehler beim Abrufen der User Preferences, weiter mit Geolocation
        }

        // 3. Verwende Geolocation (IP-basierte Lokalisierung)
        const headersList = await headers()
        try {
            const geoLang = await getLanguageFromGeolocation(headersList)
            if (geoLang && isValidLanguage(geoLang)) {
                return geoLang
            }
        } catch {
            // Fehler bei Geolocation, weiter mit Accept-Language Header
        }

        // 4. Fallback: Accept-Language Header (Browser-Präferenz)
        const acceptLanguage = headersList.get('accept-language')
        
        if (acceptLanguage) {
            // Parse Accept-Language Header (z.B. "de-DE,de;q=0.9,en;q=0.8")
            const languages = acceptLanguage
                .split(',')
                .map(lang => {
                    const [code] = lang.trim().split(';')
                    return code.split('-')[0].toLowerCase()
                })

            for (const lang of languages) {
                if (isValidLanguage(lang)) {
                    return lang
                }
            }
        }
    } catch {
        // Fehler beim Ermitteln der Sprache - verwende Fallback
    }

    // 5. Finaler Fallback
    return DEFAULT_FALLBACK_LANGUAGE
}

