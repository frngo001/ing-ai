"use client"

import * as React from "react"
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { getAllTemplates } from '@/lib/vorlagen/data'

export default function VorlagenPage() {
  const templates = getAllTemplates()

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, typeof templates>)

  const categoryLabels = {
    bachelorarbeit: 'Bachelorarbeit',
    hausarbeit: 'Hausarbeit',
    masterarbeit: 'Masterarbeit',
    expose: 'Exposé',
    seminararbeit: 'Seminararbeit',
  }

  const categoryIcons = {
    bachelorarbeit: '📚',
    hausarbeit: '📝',
    masterarbeit: '🎓',
    expose: '🗂️',
    seminararbeit: '📄',
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-up {
          animation: slideInUp 0.5s ease-out forwards;
        }

        .template-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .template-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px solid transparent;
          border-radius: calc(var(--radius) - 2px);
          transition: all 0.3s ease;
        }

        .template-card:hover::before {
          border-color: hsl(var(--primary));
        }

        .template-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px hsl(var(--primary) / 0.15);
        }

        .template-card:hover .card-number {
          color: hsl(var(--primary));
        }

        .keyword-tag {
          transition: all 0.2s ease;
        }

        .template-card:hover .keyword-tag {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
      `}</style>

      <Navbar />

      <main className="flex-1 font-sans">
        {/* Hero Section */}
        <div className="border-b border-border bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-24 max-w-5xl">
            <div className="text-center space-y-4 md:space-y-6 animate-slide-in-up">
              <div className="inline-block">
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                  Ressourcen
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Vorlagen
              </h1>
              <div className="w-16 md:w-24 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto" />
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                Professionelle Vorlagen für wissenschaftliche Arbeiten –
                strukturiert, formatiert und sofort einsatzbereit.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground pt-2 md:pt-4">
                <div className="w-6 md:w-8 h-[1px] bg-border" />
                <span>{templates.length} Vorlagen verfügbar</span>
                <div className="w-6 md:w-8 h-[1px] bg-border" />
              </div>
            </div>
          </div>
        </div>

        {/* Templates by Category */}
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-20 max-w-7xl">
          <div className="space-y-12 md:space-y-20">
            {Object.entries(templatesByCategory).map(([category, items], categoryIndex) => (
              <section
                key={category}
                className="animate-slide-in-up"
                style={{ animationDelay: `${categoryIndex * 100}ms` }}
              >
                {/* Category Header */}
                <div className="mb-6 md:mb-10">
                  <div className="flex items-center gap-3 md:gap-4 mb-3">
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </h2>
                      <div className="h-[1px] bg-gradient-to-r from-primary/50 to-transparent mt-1 md:mt-2" />
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium px-2 sm:px-4 py-1 sm:py-2 border border-border rounded-full flex-shrink-0">
                      {items.length}
                    </div>
                  </div>
                </div>

                {/* Template Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                  {items.map((template, index) => (
                    <Link
                      key={template.id}
                      href={`/vorlagen/${template.id}`}
                      className="template-card block"
                    >
                      <article className="bg-card border border-border rounded-md p-4 sm:p-5 md:p-6 h-full flex flex-col">
                        {/* Card Number */}
                        <div className="flex items-start justify-between mb-3 md:mb-4">
                          <span className="card-number text-[10px] sm:text-xs font-medium font-mono text-muted-foreground tracking-wider">
                            VORLAGE #{String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 md:mb-3 leading-tight line-clamp-2 flex-grow">
                          {template.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 md:mb-4 line-clamp-3">
                          {template.description}
                        </p>

                        {/* Keywords */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-auto pt-3 md:pt-4 border-t border-dashed border-border">
                          {template.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="keyword-tag text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted text-muted-foreground rounded-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-t border-border bg-gradient-to-b from-muted/20 to-background">
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 max-w-4xl">
            <div className="bg-card border border-border rounded-lg p-6 sm:p-8 md:p-10 lg:p-14 text-center shadow-sm">
              <div className="space-y-4 md:space-y-6">
                <div className="inline-block px-3 sm:px-4 py-1 bg-primary/10 rounded-full">
                  <span className="text-[10px] sm:text-xs tracking-wider text-primary font-medium">
                    KI-GESTÜTZTE SCHREIBHILFE
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                  Schreibe smarter mit<br />Ing AI
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Automatische Gliederungen, intelligente Formulierungshilfen
                  und professionelle Zitierverwaltung – alles in einem Tool.
                </p>
                <div className="pt-2 md:pt-4">
                  <Link
                    href="/auth/signup"
                    className="inline-block px-5 sm:px-8 py-2.5 sm:py-4 bg-primary text-primary-foreground text-sm sm:text-base font-medium rounded-lg hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                  >
                    Kostenlos starten →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
