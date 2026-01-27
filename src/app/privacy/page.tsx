import PrivacyPage from './client-page'
import { Metadata } from 'next'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { translations } from '@/lib/i18n/translations'
import { siteConfig } from '@/config/site'

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageForServer()
  const t = translations[language]?.metadata?.privacy || translations.de.metadata.privacy

  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${siteConfig.url}/privacy`,
      languages: {
        'de': `${siteConfig.url}/privacy`,
        'en': `${siteConfig.url}/privacy?lang=en`,
        'es': `${siteConfig.url}/privacy?lang=es`,
        'fr': `${siteConfig.url}/privacy?lang=fr`,
      },
    }
  }
}

export default function Page() {
  return <PrivacyPage />
}
