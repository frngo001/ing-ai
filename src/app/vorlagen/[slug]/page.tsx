"use client"

import * as React from "react"
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { getTemplate } from '@/lib/vorlagen/data'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { siteConfig } from '@/config/site'
import './template-styles.css'

export default function VorlagePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const template = getTemplate(slug)

  React.useEffect(() => {
    if (!template) {
      router.push('/vorlagen')
    }
  }, [template, router])

  if (!template) {
    return null
  }

  // Generate article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: template.title,
    description: template.description,
    keywords: template.keywords.join(', '),
    articleSection: 'Academic Writing Templates',
    inLanguage: 'de-DE',
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logos/logosApp/ing_AI.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/vorlagen/${template.id}`,
    },
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* SEO: Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* SEO: Breadcrumb Schema */}
      <BreadcrumbSchema items={[
        { name: 'Home', url: siteConfig.url },
        { name: 'Vorlagen', url: `${siteConfig.url}/vorlagen` },
        { name: template.title, url: `${siteConfig.url}/vorlagen/${template.id}` }
      ]} />

      <Navbar />

      <main className="flex-1 font-sans">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-6 py-4 max-w-5xl">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/vorlagen" className="hover:text-foreground transition-colors">
                Vorlagen
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{template.category}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12 md:py-16 max-w-5xl">
          {/* Header */}
          <header className="mb-12 pb-8 border-b border-border">
            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {template.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {template.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
              {template.description}
            </p>
          </header>

          {/* Top CTA */}
          <aside className="mb-12 bg-muted/50 border border-border rounded-lg p-6 md:p-8">
            <h2 className="text-lg font-bold mb-2">
              Mit Ing AI automatisch erstellen
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Nutze Ing AI, um deine {template.category === 'bachelorarbeit' ? 'Bachelorarbeit' : template.category} automatisch zu strukturieren und zu schreiben. KI-gestützte Vorschläge, Zitierverwaltung und mehr.
            </p>
            <Link
              href="/auth/signup"
              className="inline-block px-6 py-3 bg-foreground text-background font-medium rounded hover:bg-foreground/90 transition-colors text-sm"
            >
              Kostenlos starten
            </Link>
          </aside>

          {/* Content */}
          <article
            className="template-content mb-16"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />

          {/* Related Templates */}
          {template.relatedTemplates.length > 0 && (
            <section className="mb-12 pt-12 border-t border-border">
              <h2 className="text-2xl font-bold mb-6">Verwandte Vorlagen</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {template.relatedTemplates.map((relatedId) => {
                  const related = getTemplate(relatedId)
                  if (!related) return null

                  return (
                    <Link
                      key={relatedId}
                      href={`/vorlagen/${relatedId}`}
                      className="block bg-card border border-border rounded-lg p-6 hover:border-foreground/20 transition-colors"
                    >
                      <h3 className="text-lg font-bold mb-2">{related.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {related.description}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Bottom CTA */}
          <section className="pt-12 border-t border-border">
            <div className="bg-muted/50 border border-border rounded-lg p-8 md:p-10 text-center">
              <h3 className="text-2xl font-bold mb-3">
                Bereit, deine {template.category === 'bachelorarbeit' ? 'Bachelorarbeit' : template.category} zu schreiben?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Starte jetzt kostenlos mit Ing AI und nutze KI-Unterstützung für bessere Texte.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block px-8 py-4 bg-foreground text-background font-medium rounded hover:bg-foreground/90 transition-colors"
              >
                Jetzt kostenlos starten
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
