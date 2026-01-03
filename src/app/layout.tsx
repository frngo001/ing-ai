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
import { getLanguageFromGeolocation } from '@/lib/geolocation/language'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * Ermittelt die Sprache für Metadaten basierend auf:
 * 1. Cookies (wenn vorhanden - gespeicherte Präferenz)
 * 2. Geolocation (IP-basierte Lokalisierung)
 * 3. Accept-Language Header (Browser-Präferenz)
 * 4. Fallback: 'de' (Deutsch)
 * 
*/
async function getLanguageForMetadata(): Promise<Language> {
  const supportedLanguages = Object.keys(translations) as Language[]
  const defaultLanguage: Language = 'de'

  try {
    // 1. Versuche zuerst, die Sprache aus Cookies zu lesen (gespeicherte Präferenz)
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
        // Cookie konnte nicht geparst werden, weiter mit Geolocation
      }
    }

    // 2. Verwende Geolocation (IP-basierte Lokalisierung)
    // Dies entspricht der Logik der Client-seitigen Initialisierung
    const headersList = await headers()
    try {
      const geoLang = await getLanguageFromGeolocation(headersList)
      if (geoLang && supportedLanguages.includes(geoLang)) {
        return geoLang
      }
    } catch {
      // Fehler bei Geolocation, weiter mit Accept-Language Header
    }

    // 3. Fallback: Accept-Language Header (Browser-Präferenz)
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

  // 4. Finaler Fallback
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
