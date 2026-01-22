"use client"

import * as React from "react"
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { getZitationsStil } from '@/lib/zitationsstile/data'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { siteConfig } from '@/config/site'
import './citation-styles.css'

export default function ZitationsStilPage() {
  const params = useParams()
  const router = useRouter()
  const stilId = params.stil as string
  const stil = getZitationsStil(stilId)

  React.useEffect(() => {
    if (!stil) {
      router.push('/zitationsstile')
    }
  }, [stil, router])

  if (!stil) {
    return null
  }

  // Generate HowTo schema for citation guide
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${stil.fullName} - Zitieren lernen`,
    description: stil.description,
    step: [
      {
        '@type': 'HowToStep',
        name: 'Im-Text-Zitationen',
        text: `Verwende ${stil.examples.book.inText} für Verweise im Fließtext.`,
      },
      {
        '@type': 'HowToStep',
        name: 'Literaturverzeichnis',
        text: `Formatiere Einträge wie: ${stil.examples.book.reference}`,
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* SEO: HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* SEO: Breadcrumb Schema */}
      <BreadcrumbSchema items={[
        { name: 'Home', url: siteConfig.url },
        { name: 'Zitationsstile', url: `${siteConfig.url}/zitationsstile` },
        { name: stil.name, url: `${siteConfig.url}/zitationsstile/${stil.id}` }
      ]} />

      <Navbar />

      <main className="flex-1 font-sans">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-6 py-4 max-w-6xl">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/zitationsstile" className="hover:text-foreground transition-colors">
                Zitationsstile
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{stil.name}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12 md:py-16 max-w-6xl">
          {/* Header */}
          <header className="mb-12 pb-8 border-b border-border">
            <h1 className="text-3xl md:text-6xl font-bold mb-6 leading-tight">
              {stil.fullName}
            </h1>
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed max-w-3xl">
              {stil.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {stil.usedIn.map((fach, idx) => (
                <span key={idx} className="px-3 py-1 bg-muted border border-border rounded text-sm">
                  {fach}
                </span>
              ))}
            </div>
          </header>

          {/* Examples Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Beispiele: {stil.name}-Stil</h2>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Book Example */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Buch zitieren</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Im Text</p>
                    <p className="text-sm font-mono bg-muted p-3 rounded border border-border">{stil.examples.book.inText}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Literaturverzeichnis</p>
                    <p className="text-sm font-mono bg-muted p-3 rounded border border-border" dangerouslySetInnerHTML={{ __html: stil.examples.book.reference }} />
                  </div>
                </div>
              </div>

              {/* Journal Example */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Zeitschriftenartikel zitieren</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Im Text</p>
                    <p className="text-sm font-mono bg-muted p-3 rounded border border-border">{stil.examples.journal.inText}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Literaturverzeichnis</p>
                    <p className="text-sm font-mono bg-muted p-3 rounded border border-border" dangerouslySetInnerHTML={{ __html: stil.examples.journal.reference }} />
                  </div>
                </div>
              </div>

              {/* Website Example */}
              <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
                <h3 className="text-lg font-bold mb-4">Webseite zitieren</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Im Text</p>
                    <p className="text-sm font-mono bg-muted p-3 rounded border border-border">{stil.examples.website.inText}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Literaturverzeichnis</p>
                    <p className="text-sm font-mono bg-muted p-3 rounded border border-border" dangerouslySetInnerHTML={{ __html: stil.examples.website.reference }} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Rules Section */}
          <section className="mb-16 pb-16 border-b border-border">
            <h2 className="text-2xl font-bold mb-6">Regeln & Richtlinien</h2>
            <div className="bg-card border border-border rounded-lg p-8">
              <article
                className="citation-content"
                dangerouslySetInnerHTML={{ __html: stil.rules }}
              />
            </div>
          </section>

          {/* Advantages & Disadvantages */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Vor- & Nachteile</h2>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Advantages */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Vorteile</h3>
                <ul className="space-y-3">
                  {stil.advantages.map((advantage, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-muted-foreground mt-0.5">+</span>
                      <span>{advantage}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disadvantages */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Nachteile</h3>
                <ul className="space-y-3">
                  {stil.disadvantages.map((disadvantage, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-muted-foreground mt-0.5">−</span>
                      <span>{disadvantage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="mb-16 pt-12 border-t border-border">
            <div className="bg-muted/50 border border-border rounded-lg p-8 md:p-10">
              <h3 className="text-2xl font-bold mb-3">
                Automatisches Zitieren mit Ing AI
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl">
                Ing AI unterstützt {stil.name} und alle anderen gängigen Zitierstile.
                Automatische Formatierung, keine Fehler, perfekte Literaturverzeichnisse.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-block px-6 py-3 bg-foreground text-background font-medium rounded hover:bg-foreground/90 transition-colors text-center"
                >
                  Kostenlos starten
                </Link>
                <Link
                  href="/zitationsstile"
                  className="inline-block px-6 py-3 bg-muted border border-border font-medium rounded hover:bg-muted/70 transition-colors text-center"
                >
                  Alle Zitierstile
                </Link>
              </div>
            </div>
          </section>

          {/* Related Styles */}
          {stil.relatedStyles.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Ähnliche Zitierstile</h2>
              <div className="flex flex-wrap gap-3">
                {stil.relatedStyles.map((relatedId) => {
                  const related = getZitationsStil(relatedId)
                  if (!related) return null

                  return (
                    <Link
                      key={relatedId}
                      href={`/zitationsstile/${relatedId}`}
                      className="px-4 py-2 bg-muted hover:bg-muted/70 border border-border rounded text-sm font-medium transition-colors"
                    >
                      {related.fullName}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
