import type { Metadata } from 'next'
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CookieConsent } from '@/components/cookie-consent'
import { AnalyticsProvider } from '@/components/analytics-provider'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

/**
 * Ermittelt die Sprache für Metadaten.
 * Verwendet die exakt gleiche Logik wie die Client-seitige Initialisierung.
 */
async function getLanguageForMetadata(): Promise<Language> {
  return await getLanguageForServer()
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
      <head>
        <meta name="google-site-verification" content="C2lA7r1tRdBBpcRarmOfJ4ZXwwfGr1x0oXFSgQcYKeQ" />
      </head>
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
