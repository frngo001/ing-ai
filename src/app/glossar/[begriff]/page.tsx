"use client"

import * as React from "react"
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { getGlossarEntry } from '@/lib/glossar/data'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { siteConfig } from '@/config/site'
import './glossar-styles.css'

export default function GlossarPage() {
  const params = useParams()
  const router = useRouter()
  const begriff = params.begriff as string
  const entry = getGlossarEntry(begriff)

  React.useEffect(() => {
    if (!entry) {
      router.push('/glossar')
    }
  }, [entry, router])

  if (!entry) {
    return null
  }

  const categoryLabels = {
    zitation: 'Zitation',
    methodik: 'Methodik',
    struktur: 'Struktur',
    plagiat: 'Plagiat & Originalität',
    formatierung: 'Formatierung',
  }

  // Generate DefinedTerm schema
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: entry.term,
    description: entry.shortDefinition,
    inDefinedTermSet: `${siteConfig.url}/glossar`,
    termCode: entry.id,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* SEO: DefinedTerm Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }}
      />

      {/* SEO: Breadcrumb Schema */}
      <BreadcrumbSchema items={[
        { name: 'Home', url: siteConfig.url },
        { name: 'Glossar', url: `${siteConfig.url}/glossar` },
        { name: entry.term, url: `${siteConfig.url}/glossar/${entry.id}` }
      ]} />

      <Navbar />

      <main className="flex-1 font-sans">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-6 py-4 max-w-4xl">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/glossar" className="hover:text-foreground transition-colors">
                Glossar
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{entry.term}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12 md:py-16 max-w-4xl">
          {/* Header */}
          <header className="mb-12 pb-8 border-b border-border">
            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {categoryLabels[entry.category]}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {entry.term}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {entry.shortDefinition}
            </p>
          </header>

          {/* Definition */}
          <article
            className="glossar-content mb-12"
            dangerouslySetInnerHTML={{ __html: entry.longDefinition }}
          />

          {/* Examples */}
          {entry.examples.length > 0 && (
            <section className="mb-12 pb-12 border-b border-border">
              <h2 className="text-2xl font-bold mb-6">Beispiele</h2>
              <div className="space-y-4">
                {entry.examples.map((example, idx) => (
                  <div key={idx} className="pl-4 border-l-2 border-border bg-muted/30 p-4 rounded-r">
                    <p className="text-sm leading-relaxed">{example}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Terms */}
          {entry.relatedTerms.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Verwandte Begriffe</h2>
              <div className="flex flex-wrap gap-3">
                {entry.relatedTerms.map((relatedId) => {
                  const related = getGlossarEntry(relatedId)
                  if (!related) return null

                  return (
                    <Link
                      key={relatedId}
                      href={`/glossar/${relatedId}`}
                      className="px-4 py-2 bg-muted hover:bg-muted/70 border border-border rounded text-sm font-medium transition-colors"
                    >
                      {related.term}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="mt-16 pt-12 border-t border-border">
            <div className="bg-muted/50 border border-border rounded-lg p-8 md:p-10">
              <h3 className="text-2xl font-bold mb-3">
                {entry.term} in der Praxis
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Nutze Ing AI für automatische Zitierverwaltung, Plagiatsprüfung und professionelle
                Formatierung. Schreibe bessere wissenschaftliche Arbeiten mit KI-Unterstützung.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block px-6 py-3 bg-foreground text-background font-medium rounded hover:bg-foreground/90 transition-colors"
              >
                Kostenlos starten
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
