import TermsPage from './client-page'
import { Metadata } from 'next'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { translations } from '@/lib/i18n/translations'
import { siteConfig } from '@/config/site'

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageForServer()
  const t = translations[language]?.metadata?.terms || translations.de.metadata.terms

  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${siteConfig.url}/terms`,
      languages: {
        'de': `${siteConfig.url}/terms`,
        'en': `${siteConfig.url}/terms?lang=en`,
        'es': `${siteConfig.url}/terms?lang=es`,
        'fr': `${siteConfig.url}/terms?lang=fr`,
      },
    }
  }
}

export default function Page() {
  return <TermsPage />
}
