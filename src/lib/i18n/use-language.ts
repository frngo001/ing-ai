'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations, type Language } from './translations'
import { getCurrentUserId } from '@/lib/supabase/utils/auth'
import {
    getUserPreferences,
    ensureUserPreferencesExist,
    updateUserLanguage,
} from '@/lib/supabase/utils/user-preferences'

const supportedLanguages = Object.keys(translations) as Language[]

/**
 * Standard-Fallback-Sprache, wenn Geolocation fehlschlägt.
 */
const DEFAULT_FALLBACK_LANGUAGE: Language = 'en'

/**
 * Cache für die geolocation-basierte Sprache, um mehrfache API-Calls zu vermeiden.
 */
let cachedGeolocationLanguage: Language | null = null
let geolocationCacheTimestamp: number = 0
const GEOLOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 Stunden

/**
 * Ermittelt die Standardsprache basierend auf der geografischen Position des Benutzers.
 * Ruft die Geolocation-API auf, um das Land zu ermitteln und mappt es zur entsprechenden Sprache.
 * Verwendet einen Cache, um mehrfache API-Calls zu vermeiden.
 * 
 * @returns Promise mit der ermittelten Sprache oder Fallback-Sprache
 */
async function getLanguageFromGeolocation(): Promise<Language> {
    // Prüfe Cache zuerst
    const now = Date.now()
    if (cachedGeolocationLanguage && (now - geolocationCacheTimestamp) < GEOLOCATION_CACHE_DURATION) {
        return cachedGeolocationLanguage
    }

    try {
        const response = await fetch('/api/geolocation', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            console.warn('[LANGUAGE] Fehler beim Abrufen der Geolocation:', response.status)
            return DEFAULT_FALLBACK_LANGUAGE
        }

        const data = await response.json()
        
        if (data.language && supportedLanguages.includes(data.language as Language)) {
            // Cache aktualisieren
            cachedGeolocationLanguage = data.language as Language
            geolocationCacheTimestamp = now
            return data.language as Language
        }

        return DEFAULT_FALLBACK_LANGUAGE
    } catch (error) {
        console.warn('[LANGUAGE] Fehler bei der Geolocation-API:', error)
        return DEFAULT_FALLBACK_LANGUAGE
    }
}

/**
 * Synchroner Fallback für die Standardsprache.
 * Wird verwendet, wenn asynchrone Geolocation noch nicht verfügbar ist.
 */
function getDefaultLanguage(): Language {
    return DEFAULT_FALLBACK_LANGUAGE
}

/**
 * Prüft, ob eine Sprache unterstützt wird.
 */
function isValidLanguage(lang: string): lang is Language {
    return supportedLanguages.includes(lang as Language)
}

interface LanguageState {
    language: Language
    isInitialized: boolean
    setLanguage: (lang: Language) => void
    initializeFromSupabase: () => Promise<void>
    t: (key: string, params?: Record<string, string>) => string
}

export const useLanguage = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: getDefaultLanguage(),
            isInitialized: false,

            setLanguage: (lang) => {
                set({ language: lang })

                // Speichere Sprache auch in Cookies für server-seitige Metadaten
                try {
                    const state = { state: { language: lang } }
                    document.cookie = `language-storage=${JSON.stringify(state)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
                } catch (error) {
                    console.warn('Fehler beim Speichern der Sprache in Cookies:', error)
                }

                // Asynchron in Supabase speichern
                getCurrentUserId().then((userId) => {
                    if (userId) {
                        updateUserLanguage(userId, lang).catch((error) => {
                            console.warn('Fehler beim Speichern der Sprache in Supabase:', error)
                        })
                    }
                })
            },

            initializeFromSupabase: async () => {
                if (get().isInitialized) return

                try {
                    const userId = await getCurrentUserId()
                    if (!userId) {
                        // Kein User: Verwende Geolocation-basierte Sprache
                        const geoLang = await getLanguageFromGeolocation()
                        set({ language: geoLang, isInitialized: true })
                        // Speichere Sprache auch in Cookies
                        try {
                            const state = { state: { language: geoLang } }
                            document.cookie = `language-storage=${JSON.stringify(state)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
                        } catch (error) {
                            console.warn('Fehler beim Speichern der Sprache in Cookies:', error)
                        }
                        return
                    }

                    const prefs = await getUserPreferences(userId)

                    if (prefs?.language && isValidLanguage(prefs.language)) {
                        const lang = prefs.language
                        set({ language: lang, isInitialized: true })
                        // Speichere Sprache auch in Cookies
                        try {
                            const state = { state: { language: lang } }
                            document.cookie = `language-storage=${JSON.stringify(state)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
                        } catch (error) {
                            console.warn('Fehler beim Speichern der Sprache in Cookies:', error)
                        }
                    } else {
                        // Keine Präferenzen: Ermittle Sprache basierend auf Geolocation
                        const geoLang = await getLanguageFromGeolocation()
                        await ensureUserPreferencesExist(userId, geoLang)
                        set({ language: geoLang, isInitialized: true })
                        // Speichere Sprache auch in Cookies
                        try {
                            const state = { state: { language: geoLang } }
                            document.cookie = `language-storage=${JSON.stringify(state)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
                        } catch (error) {
                            console.warn('Fehler beim Speichern der Sprache in Cookies:', error)
                        }
                    }
                } catch (error) {
                    console.warn('Fehler beim Laden der Sprache aus Supabase:', error)
                    // Fallback auf Geolocation-basierte Sprache
                    const geoLang = await getLanguageFromGeolocation()
                    set({ language: geoLang, isInitialized: true })
                    // Speichere Sprache auch in Cookies
                    try {
                        const state = { state: { language: geoLang } }
                        document.cookie = `language-storage=${JSON.stringify(state)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
                    } catch (error) {
                        console.warn('Fehler beim Speichern der Sprache in Cookies:', error)
                    }
                }
            },

            t: (path: string, params?: Record<string, string>) => {
                const lang = get().language
                const keys = path.split('.')
                let current: any = translations[lang]

                for (const key of keys) {
                    if (current[key] === undefined) {
                        console.warn(`Translation missing for key: ${path} in language: ${lang}`)
                        return path
                    }
                    current = current[key]
                }

                let result = current as string
                
                if (params) {
                    Object.entries(params).forEach(([paramKey, value]) => {
                        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value)
                    })
                }

                return result
            },
        }),
        {
            name: 'language-storage',
        }
    )
)
