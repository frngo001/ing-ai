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
 * Ermittelt die bevorzugte Sprache des Browsers und prüft,
 * ob diese in den unterstützten Sprachen vorhanden ist.
 * Fallback auf 'en' wenn keine Übereinstimmung gefunden wird.
 */
function getDefaultLanguage(): Language {
    if (typeof window === 'undefined') {
        return 'en'
    }

    const browserLanguages = navigator.languages || [navigator.language]

    for (const browserLang of browserLanguages) {
        const langCode = browserLang.split('-')[0].toLowerCase()

        if (supportedLanguages.includes(langCode as Language)) {
            return langCode as Language
        }
    }

    return 'en'
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
    t: (key: string) => string
}

export const useLanguage = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: getDefaultLanguage(),
            isInitialized: false,

            setLanguage: (lang) => {
                set({ language: lang })

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
                        set({ isInitialized: true })
                        return
                    }

                    const prefs = await getUserPreferences(userId)

                    if (prefs?.language && isValidLanguage(prefs.language)) {
                        set({ language: prefs.language, isInitialized: true })
                    } else {
                        // Erstelle User-Präferenzen mit Browser-Sprache
                        const browserLang = getDefaultLanguage()
                        await ensureUserPreferencesExist(userId, browserLang)
                        set({ language: browserLang, isInitialized: true })
                    }
                } catch (error) {
                    console.warn('Fehler beim Laden der Sprache aus Supabase:', error)
                    set({ isInitialized: true })
                }
            },

            t: (path: string) => {
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

                return current as string
            },
        }),
        {
            name: 'language-storage',
        }
    )
)
