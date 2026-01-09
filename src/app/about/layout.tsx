import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'

export async function generateMetadata(): Promise<Metadata> {
  const language = (await getLanguageForServer()) as Language
  const t = translations[language]?.pages?.about || translations.de.pages.about

  return {
    title: `${t.title} - ${siteConfig.name}`,
    description: t.description,
    keywords: [
      'About Ing AI',
      'Über Ing AI',
      'AI Writing Tool',
      'Academic Writing Assistant',
      'Team',
      'Mission',
    ],
    openGraph: {
      title: `${t.title} - ${siteConfig.name}`,
      description: t.description,
      url: `${siteConfig.url}/about`,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: t.title,
        },
      ],
      locale: language,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t.title} - ${siteConfig.name}`,
      description: t.description,
      images: [`${siteConfig.url}/opengraph-image`],
    },
    alternates: {
      canonical: `${siteConfig.url}/about`,
    },
  }
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
