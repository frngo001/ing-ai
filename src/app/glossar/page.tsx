"use client"

import * as React from "react"
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { getAllGlossarEntries } from '@/lib/glossar/data'

export default function GlossarOverviewPage() {
  const entries = getAllGlossarEntries()

  const entriesByCategory = entries.reduce((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = []
    acc[entry.category].push(entry)
    return acc
  }, {} as Record<string, typeof entries>)

  const categoryLabels = {
    zitation: 'Zitation & Quellen',
    methodik: 'Forschungsmethodik',
    struktur: 'Struktur & Aufbau',
    plagiat: 'Plagiat & Originalität',
    formatierung: 'Formatierung',
  }

  const categoryDescriptions = {
    zitation: 'Regeln und Methoden wissenschaftlicher Quellenangaben',
    methodik: 'Wissenschaftliche Forschungsansätze und Verfahren',
    struktur: 'Aufbau und Gliederung akademischer Texte',
    plagiat: 'Integrität und korrekte Verwendung fremder Arbeiten',
    formatierung: 'Formale Gestaltung wissenschaftlicher Dokumente',
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .glossar-entry {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glossar-entry:hover {
          transform: translateX(4px);
        }

        .glossar-entry:hover .entry-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .entry-arrow {
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <Navbar />

      <main className="flex-1 font-sans">
        {/* Hero Section */}
        <div className="border-b border-border bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-6 py-16 md:py-24 max-w-5xl">
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="inline-block">
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                  Kompendium
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                Glossar
              </h1>
              <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto" />
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Alle wichtigen Begriffe des wissenschaftlichen Schreibens –
                präzise definiert und verständlich erklärt.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                <div className="w-8 h-[1px] bg-border" />
                <span>{entries.length} Einträge</span>
                <div className="w-8 h-[1px] bg-border" />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="container mx-auto px-6 py-16 md:py-20 max-w-6xl">
          <div className="space-y-20">
            {Object.entries(entriesByCategory).map(([category, items], categoryIndex) => (
              <section
                key={category}
                className="animate-fade-in-up"
                style={{ animationDelay: `${categoryIndex * 100}ms` }}
              >
                {/* Category Header */}
                <div className="mb-10 pb-6 border-b border-dashed border-border">
                  <div className="flex items-baseline justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold mb-2">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </h2>
                      <p className="text-base text-muted-foreground italic">
                        {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {items.length} {items.length === 1 ? 'Begriff' : 'Begriffe'}
                    </div>
                  </div>
                </div>

                {/* Entries List */}
                <div className="space-y-1">
                  {items.map((entry, index) => (
                    <Link
                      key={entry.id}
                      href={`/glossar/${entry.id}`}
                      className="glossar-entry block group"
                    >
                      <article className="py-6 px-6 border-l-2 border-transparent hover:border-primary hover:bg-muted/30 rounded-r">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-baseline gap-3">
                              <span className="text-xs text-muted-foreground font-medium font-mono min-w-[2rem]">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                                {entry.term}
                              </h3>
                            </div>
                            <p className="text-base text-muted-foreground leading-relaxed ml-11 line-clamp-2">
                              {entry.shortDefinition}
                            </p>
                          </div>
                          <div className="entry-arrow flex-shrink-0 mt-2">
                            <svg
                              className="w-5 h-5 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="border-t border-border bg-gradient-to-b from-muted/20 to-background">
          <div className="container mx-auto px-6 py-16 max-w-4xl text-center">
            <div className="space-y-6">
              <h3 className="text-3xl md:text-4xl font-bold">
                Bereit für deine wissenschaftliche Arbeit?
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Nutze Ing AI für automatische Zitationen, Plagiatsprüfung und KI-gestützte Schreibhilfe.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                Kostenlos starten
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
