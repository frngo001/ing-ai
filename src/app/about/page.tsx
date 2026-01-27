import AboutPage from './client-page'
import { Metadata } from 'next'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { translations } from '@/lib/i18n/translations'
import { siteConfig } from '@/config/site'

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageForServer()
  const t = translations[language]?.metadata?.about || translations.de.metadata.about

  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${siteConfig.url}/about`,
      languages: {
        'de': `${siteConfig.url}/about`,
        'en': `${siteConfig.url}/about?lang=en`,
        'es': `${siteConfig.url}/about?lang=es`,
        'fr': `${siteConfig.url}/about?lang=fr`,
      },
    }
  }
}

export default function Page() {
  return <AboutPage />
}
