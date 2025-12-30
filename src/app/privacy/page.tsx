"use client"

import * as React from "react"
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { siteConfig } from '@/config/site'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import Glow from '@/components/ui/glow'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/use-language'
import { translations } from '@/lib/i18n/translations'

export default function PrivacyPage() {
  const { t, language } = useLanguage()

  const langTranslations = React.useMemo(() => {
    return translations[language as keyof typeof translations] as any
  }, [language])

  const visitItems = langTranslations?.pages?.privacy?.sections?.dataCollection?.visit?.items || []
  const registrationItems = langTranslations?.pages?.privacy?.sections?.dataCollection?.registration?.items || []
  const dataUsageItems = langTranslations?.pages?.privacy?.sections?.dataUsage?.items || []
  const dataSharingItems = langTranslations?.pages?.privacy?.sections?.dataSharing?.items || []
  const rightsItems = langTranslations?.pages?.privacy?.sections?.rights?.items || []

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Glow variant="top" className="opacity-30" />
          </div>
          <div className="container px-4 mx-auto">
            <ScrollReveal className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-[10px] uppercase tracking-wider">
                {t('pages.privacy.badge')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                {t('pages.privacy.title')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                {t('pages.privacy.lastUpdated')} {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 border-y border-border/50">
          <div className="container px-4 mx-auto max-w-4xl">
            <ScrollReveal className="prose prose-lg dark:prose-invert max-w-none">
              <div className="space-y-8 text-muted-foreground">
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.responsible.title')}</h2>
                  <p>
                    {t('pages.privacy.sections.responsible.description')}
                  </p>
                  <p className="mt-2">
                    <strong>{siteConfig.name}</strong><br />
                    E-Mail: support@ing.ai
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.dataCollection.title')}</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{t('pages.privacy.sections.dataCollection.visit.title')}</h3>
                  <p>
                    {t('pages.privacy.sections.dataCollection.visit.description')}
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    {Array.isArray(visitItems) && visitItems.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{t('pages.privacy.sections.dataCollection.registration.title')}</h3>
                  <p>
                    {t('pages.privacy.sections.dataCollection.registration.description')}
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    {Array.isArray(registrationItems) && registrationItems.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.dataUsage.title')}</h2>
                  <p>
                    {t('pages.privacy.sections.dataUsage.description')}
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    {Array.isArray(dataUsageItems) && dataUsageItems.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.dataSharing.title')}</h2>
                  <p>
                    {t('pages.privacy.sections.dataSharing.description')}
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    {Array.isArray(dataSharingItems) && dataSharingItems.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.cookies.title')}</h2>
                  <p>
                    {t('pages.privacy.sections.cookies.description1')}
                  </p>
                  <p className="mt-2">
                    {t('pages.privacy.sections.cookies.description2')}
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.rights.title')}</h2>
                  <p>{t('pages.privacy.sections.rights.description')}</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    {Array.isArray(rightsItems) && rightsItems.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.dataSecurity.title')}</h2>
                  <p>
                    {t('pages.privacy.sections.dataSecurity.description')}
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.storageDuration.title')}</h2>
                  <p>
                    {t('pages.privacy.sections.storageDuration.description')}
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.changes.title')}</h2>
                  <p>
                    {t('pages.privacy.sections.changes.description')}
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('pages.privacy.sections.contact.title')}</h2>
                  <p>
                    {t('pages.privacy.sections.contact.description')}
                  </p>
                  <p className="mt-2">
                    <strong>{siteConfig.name}</strong><br />
                    E-Mail: support@ing.ai
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

