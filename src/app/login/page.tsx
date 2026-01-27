import { LoginForm } from "@/components/login-form"
import { Metadata } from 'next'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { translations } from '@/lib/i18n/translations'
import { siteConfig } from '@/config/site'

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageForServer()
  const t = translations[language]?.metadata?.login || translations.de.metadata.login

  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${siteConfig.url}/login`,
      languages: {
        'de': `${siteConfig.url}/login`,
        'en': `${siteConfig.url}/login?lang=en`,
        'es': `${siteConfig.url}/login?lang=es`,
        'fr': `${siteConfig.url}/login?lang=fr`,
      },
    }
  }
}

export default function LoginPage() {
  return (
    <div className="bg-muted flex max-h-screen flex-col items-center justify-center px-6 md:px-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  )
}
