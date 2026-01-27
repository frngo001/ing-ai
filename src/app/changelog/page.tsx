import ChangelogPage from './client-page'
import { Metadata } from 'next'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { translations } from '@/lib/i18n/translations'
import { siteConfig } from '@/config/site'

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageForServer()
  const t = translations[language]?.metadata?.changelog || translations.de.metadata.changelog

  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${siteConfig.url}/changelog`,
      languages: {
        'de': `${siteConfig.url}/changelog`,
        'en': `${siteConfig.url}/changelog?lang=en`,
        'es': `${siteConfig.url}/changelog?lang=es`,
        'fr': `${siteConfig.url}/changelog?lang=fr`,
      },
    }
  }
}

export default function Page() {
  return <ChangelogPage />
}
