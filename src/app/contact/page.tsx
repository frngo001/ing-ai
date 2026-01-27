import ContactPage from './client-page'
import { Metadata } from 'next'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { translations } from '@/lib/i18n/translations'
import { siteConfig } from '@/config/site'

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageForServer()
  const t = translations[language]?.metadata?.contact || translations.de.metadata.contact

  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${siteConfig.url}/contact`,
      languages: {
        'de': `${siteConfig.url}/contact`,
        'en': `${siteConfig.url}/contact?lang=en`,
        'es': `${siteConfig.url}/contact?lang=es`,
        'fr': `${siteConfig.url}/contact?lang=fr`,
      },
    }
  }
}

export default function Page() {
  return <ContactPage />
}
