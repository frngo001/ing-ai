'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations, type Language } from './translations'

interface LanguageState {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

export const useLanguage = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'en',
            setLanguage: (lang) => set({ language: lang }),
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
