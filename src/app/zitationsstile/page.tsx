"use client"

import * as React from "react"
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { getAllZitationsStile } from '@/lib/zitationsstile/data'

export default function ZitationsstilePage() {
  const stile = getAllZitationsStile()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }

        .style-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .style-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -6px hsl(var(--primary) / 0.12);
        }

        .style-card:hover .style-name {
          color: hsl(var(--primary));
        }

        .style-card:hover .style-accent {
          width: 100%;
        }

        .style-accent {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.5));
          transition: width 0.3s ease;
        }

        .comparison-table tr {
          transition: all 0.2s ease;
        }

        .comparison-table tr:hover {
          background: hsl(var(--muted) / 0.5);
        }

        .field-badge {
          transition: all 0.2s ease;
        }

        .style-card:hover .field-badge {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
      `}</style>

      <Navbar />

      <main className="flex-1 font-sans">
        {/* Hero Section */}
        <div className="border-b border-border bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-6 py-16 md:py-24 max-w-5xl">
            <div className="text-center space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                  Referenz
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                Zitationsstile
              </h1>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary/60" />
                <div className="w-2 h-2 rounded-full bg-primary/40" />
                <div className="w-2 h-2 rounded-full bg-primary/20" />
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Ein umfassender Leitfaden zu allen wichtigen Zitierstilen –
                mit Beispielen, Regeln und Best Practices.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                <div className="w-8 h-[1px] bg-border" />
                <span>{stile.length} Zitierstile</span>
                <div className="w-8 h-[1px] bg-border" />
              </div>
            </div>
          </div>
        </div>

        {/* Citation Styles Grid */}
        <div className="container mx-auto px-6 py-16 md:py-20 max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {stile.map((stil, index) => (
              <Link
                key={stil.id}
                href={`/zitationsstile/${stil.id}`}
                className="style-card block animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <article className="bg-card border border-border rounded-md p-6 h-full flex flex-col">
                  {/* Header */}
                  <div className="mb-4 pb-4 border-b border-dashed border-border">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="style-name text-2xl font-bold transition-colors">
                        {stil.name}
                      </h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-sm">
                        {stil.usedIn.length}+
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      {stil.fullName}
                    </p>
                    <div className="style-accent mt-3" />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {stil.description}
                  </p>

                  {/* Example */}
                  <div className="mb-4 bg-muted p-3 rounded-sm">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                      Im-Text-Zitat
                    </span>
                    <code className="font-mono text-xs text-primary block">
                      {stil.examples.book.inText}
                    </code>
                  </div>

                  {/* Fields */}
                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {stil.usedIn.slice(0, 3).map((fach, idx) => (
                        <span
                          key={idx}
                          className="field-badge text-xs px-2 py-1 bg-muted text-muted-foreground rounded-sm"
                        >
                          {fach}
                        </span>
                      ))}
                      {stil.usedIn.length > 3 && (
                        <span className="text-xs px-2 py-1 text-muted-foreground">
                          +{stil.usedIn.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Comparison Table */}
          <section className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Schnellvergleich
              </h2>
              <p className="text-base text-muted-foreground italic">
                Die wichtigsten Unterschiede auf einen Blick
              </p>
            </div>

            <div className="bg-card border border-border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="comparison-table w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">
                        Stil
                      </th>
                      <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">
                        Im-Text-Format
                      </th>
                      <th className="text-left p-4 text-sm font-semibold uppercase tracking-wide">
                        Hauptfachbereiche
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stile.map((stil) => (
                      <tr
                        key={stil.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="p-4">
                          <span className="font-bold">{stil.name}</span>
                        </td>
                        <td className="p-4">
                          <code className="font-mono text-xs text-primary bg-muted px-2 py-1 rounded-sm">
                            {stil.examples.book.inText}
                          </code>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {stil.usedIn.slice(0, 2).join(', ')}
                          {stil.usedIn.length > 2 && (
                            <span> +{stil.usedIn.length - 2}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table Footer Note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground italic">
                Klicke auf einen Zitierstil für detaillierte Regeln und Beispiele
              </p>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="border-t border-border bg-gradient-to-b from-muted/20 to-background">
          <div className="container mx-auto px-6 py-20 max-w-4xl">
            <div className="relative bg-card border border-border rounded-lg p-10 md:p-14 text-center shadow-sm overflow-hidden">
              {/* Decorative quotation mark */}
              <div className="absolute top-6 right-6 text-border text-7xl font-serif leading-none opacity-30">
                "
              </div>

              <div className="relative z-10 space-y-6">
                <div className="inline-block px-4 py-1 bg-primary/10 rounded-full">
                  <span className="text-xs tracking-wider text-primary font-medium">
                    AUTOMATISCHE ZITATION
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                  Nie wieder manuell<br />zitieren
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Ing AI formatiert deine Quellen automatisch in APA, MLA, Chicago, Harvard, IEEE, Vancouver und vielen weiteren Stilen – präzise und fehlerfrei.
                </p>
                <div className="pt-4">
                  <Link
                    href="/auth/signup"
                    className="inline-block px-8 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
                  >
                    Kostenlos starten →
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keine Kreditkarte erforderlich
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
