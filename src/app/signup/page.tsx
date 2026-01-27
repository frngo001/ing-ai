import { SignupForm } from "@/components/signup-form"
import { Metadata } from 'next'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { translations } from '@/lib/i18n/translations'
import { siteConfig } from '@/config/site'

export async function generateMetadata(): Promise<Metadata> {
  const language = await getLanguageForServer()
  const t = translations[language]?.metadata?.signup || translations.de.metadata.signup

  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${siteConfig.url}/signup`,
      languages: {
        'de': `${siteConfig.url}/signup`,
        'en': `${siteConfig.url}/signup?lang=en`,
        'es': `${siteConfig.url}/signup?lang=es`,
        'fr': `${siteConfig.url}/signup?lang=fr`,
      },
    }
  }
}

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}
