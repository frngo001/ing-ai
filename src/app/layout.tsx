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
import { siteConfig } from '@/config/site'
import { StructuredData } from '@/components/seo/structured-data'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
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
    metadataBase: new URL(siteConfig.url),
    title: t.title,
    description: t.description,
    keywords: [
      // Primary Keywords (DE)
      'KI Schreibassistent',
      'Bachelorarbeit schreiben',
      'Hausarbeit schreiben',
      'Wissenschaftliches Schreiben',
      'KI Schreiben',
      'Akademisches Schreiben KI',

      // Primary Keywords (EN)
      'AI Writing Assistant',
      'Academic Writing AI',
      'Thesis Writing Tool',
      'Research Paper AI',

      // Feature Keywords
      'Zitierverwaltung',
      'Citation Management',
      'Literaturrecherche',
      'Literature Research',
      'Plagiatsprüfung',
      'Plagiarism Check',

      // Long-Tail Keywords (DE)
      'Bachelorarbeit mit KI schreiben',
      'Hausarbeit KI Hilfe',
      'Wissenschaftliche Texte verbessern',
      'Automatische Quellenangabe',
      'KI Tool für akademisches Schreiben',

      // Product & Brand
      'Ing AI',
      'AI Editor',
      'Text Editor',
      'Document Editor',
      'Research Tool',
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: language,
      url: siteConfig.url,
      title: t.title,
      description: t.description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: t.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.description,
      images: [siteConfig.ogImage],
    },
    alternates: {
      canonical: siteConfig.url,
      languages: {
        'de': `${siteConfig.url}`,
        'en': `${siteConfig.url}?lang=en`,
        'es': `${siteConfig.url}?lang=es`,
        'fr': `${siteConfig.url}?lang=fr`,
        'it': `${siteConfig.url}?lang=it`,
        'pt': `${siteConfig.url}?lang=pt`,
        'nl': `${siteConfig.url}?lang=nl`,
        'x-default': `${siteConfig.url}`,
      },
    },
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
        <link rel="preconnect" href="https://i.pravatar.cc" />
        <StructuredData />
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
