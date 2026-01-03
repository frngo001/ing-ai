import type { Metadata } from 'next'
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CookieConsent } from '@/components/cookie-consent'
import { AnalyticsProvider } from '@/components/analytics-provider'
import { cookies, headers } from 'next/headers'
import { translations, type Language } from '@/lib/i18n/translations'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * Ermittelt die Sprache für Metadaten basierend auf Cookies oder Accept-Language Header.
 * Falls keine Sprache gefunden wird, wird 'de' als Fallback verwendet.
 */
async function getLanguageForMetadata(): Promise<Language> {
  const supportedLanguages = Object.keys(translations) as Language[]
  const defaultLanguage: Language = 'de'

  try {
    // Versuche zuerst, die Sprache aus Cookies zu lesen
    const cookieStore = await cookies()
    const languageCookie = cookieStore.get('language-storage')
    
    if (languageCookie?.value) {
      try {
        const parsed = JSON.parse(languageCookie.value)
        const lang = parsed?.state?.language
        if (lang && supportedLanguages.includes(lang as Language)) {
          return lang as Language
        }
      } catch {
        // Cookie konnte nicht geparst werden, weiter mit Header
      }
    }

    // Fallback: Accept-Language Header
    const headersList = await headers()
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
        if (supportedLanguages.includes(lang as Language)) {
          return lang as Language
        }
      }
    }
  } catch {
    // Fehler beim Ermitteln der Sprache - verwende Fallback
  }

  return defaultLanguage
}

/**
 * Generiert Metadaten basierend auf der aktuellen Sprache.
 */
export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageForMetadata()
  const t = translations[language]?.metadata || translations.de.metadata

  return {
    title: t.title,
    description: t.description,
    icons: {
      icon: '/logos/logosApp/ing_AI.png',
      apple: '/logos/logosApp/ing_AI.png',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const language = await getLanguageForMetadata()
  
  return (
    <html lang={language} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
          <Toaster />
          <AnalyticsProvider />
        </ThemeProvider>
        <CookieConsent />
      </body>
    </html>
  )
}
