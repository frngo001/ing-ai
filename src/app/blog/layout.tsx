import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'

export async function generateMetadata(): Promise<Metadata> {
  const language = (await getLanguageForServer()) as Language
  const t = translations[language]?.pages?.blog?.list || translations.de.pages.blog.list

  return {
    title: `${t.title} - ${siteConfig.name}`,
    description: t.description,
    keywords: [
      'Blog',
      'AI Writing Tips',
      'Academic Writing',
      'Research Tips',
      'Citation Guide',
      'Writing Tutorials',
    ],
    openGraph: {
      title: `${t.title} - ${siteConfig.name}`,
      description: t.description,
      url: `${siteConfig.url}/blog`,
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
      canonical: `${siteConfig.url}/blog`,
    },
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
