"use client"

import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { siteConfig } from '@/config/site'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ChangelogEntry {
  id: string
  date: string
  title: string
  content: {
    heading: string
    description: string
    image?: string
    details?: string[]
    links?: { label: string; href: string }[]
  }[]
}

const changelogData: ChangelogEntry[] = [
  {
    id: 'autocomplete-2',
    date: 'Nov 28, 2024',
    title: 'Editor Updates (281124)',
    content: [
      {
        heading: 'KI-Autocomplete 2.0',
        description: 'Unser neues Autocomplete-System versteht jetzt den gesamten Kontext Ihrer Arbeit und liefert noch präzisere Vorschläge. Die Latenz wurde um 40% reduziert.',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200&h=600',
        details: [
          'Berücksichtigt das gesamte Dokument und Ihre Forschungsbibliothek',
          'Kontextbezogene Fachterminologie basierend auf Ihrem Forschungsgebiet',
          'Vorschläge erscheinen nahezu in Echtzeit',
        ],
        links: [
          { label: 'Dokumentation', href: '#' },
        ],
      },
    ],
  },
  {
    id: 'citations-update',
    date: 'Nov 15, 2024',
    title: 'Zitationen Update (151124)',
    content: [
      {
        heading: 'Erweiterte Zitationsstile',
        description: 'Wir haben 10 weitere Zitationsstile hinzugefügt, um noch mehr wissenschaftliche Disziplinen abzudecken.',
        details: [
          'Neue Stile: IEEE, Vancouver, Nature, Science, OSCOLA, Bluebook, AGLC, McGill, MHRA, Turabian',
          'Automatische Erkennung des bevorzugten Stils basierend auf Ihrem Fachgebiet',
          'Verbesserte Formatierung für Online-Quellen und DOI-Links',
        ],
      },
    ],
  },
  {
    id: 'performance',
    date: 'Nov 8, 2024',
    title: 'Performance Updates (081124)',
    content: [
      {
        heading: 'Optimierungen für große Dokumente',
        description: 'Dokumente mit über 50.000 Wörtern werden jetzt 3x schneller geladen und bearbeitet.',
        details: [
          'Neue inkrementelle Speicherung reduziert Wartezeiten',
          'Optimierte Rendering-Engine für flüssiges Scrollen',
          'Reduzierter Speicherverbrauch um bis zu 60%',
        ],
      },
    ],
  },
  {
    id: 'security-update',
    date: 'Nov 1, 2024',
    title: 'Security Updates (011124)',
    content: [
      {
        heading: 'Verbesserte Datenverschlüsselung',
        description: 'Wir haben unsere Verschlüsselungsprotokolle aktualisiert und zusätzliche Sicherheitsmaßnahmen implementiert.',
        details: [
          'Upgrade auf AES-256-GCM Verschlüsselung für alle gespeicherten Dokumente',
          'Neue Zwei-Faktor-Authentifizierung mit Hardware-Keys (FIDO2)',
          'Verbesserte Audit-Logs für Enterprise-Kunden',
        ],
      },
    ],
  },
  {
    id: 'pdf-library',
    date: 'Oct 20, 2024',
    title: 'Bibliothek Updates (201024)',
    content: [
      {
        heading: 'Neue Forschungsbibliothek',
        description: 'Organisieren Sie Ihre Quellen besser und annotieren Sie PDFs direkt in der App.',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=1200&h=600',
        details: [
          'Drag & Drop Upload für mehrere PDFs gleichzeitig',
          'Highlighter, Notizen und Tags direkt im PDF',
          'Automatische Metadaten-Extraktion aus PDFs',
        ],
        links: [
          { label: 'Zur Bibliothek', href: '#' },
        ],
      },
      {
        heading: 'PDF-Annotation',
        description: 'Markieren Sie wichtige Stellen und verknüpfen Sie Annotationen direkt mit Ihrem Dokument.',
      },
    ],
  },
  {
    id: 'team-features',
    date: 'Oct 1, 2024',
    title: 'Team Features (011024)',
    content: [
      {
        heading: 'Kollaboration für Universitäten',
        description: 'Neue Features für akademische Institutionen und Forschungsgruppen ermöglichen effizientere Zusammenarbeit.',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200&h=600',
        details: [
          'Gemeinsame Arbeitsbereiche für Forschungsgruppen',
          'Rollenbasierte Zugriffsrechte (Admin, Editor, Viewer)',
          'Echtzeit-Kollaboration mit Cursor-Anzeige',
          'Kommentar- und Review-System für Peer-Feedback',
        ],
      },
      {
        heading: 'Enterprise SSO',
        description: 'Institutionelle Lizenzierung mit Single Sign-On Integration für nahtlose Authentifizierung.',
      },
    ],
  },
  {
    id: 'pdf-chat',
    date: 'Aug 15, 2024',
    title: 'AI Features (150824)',
    content: [
      {
        heading: 'Chat mit PDFs',
        description: 'Stellen Sie Fragen an Ihre hochgeladenen PDFs und erhalten Sie sofortige Antworten mit Quellenangaben.',
        image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&q=80&w=1200&h=600',
        details: [
          'Natürlichsprachliche Fragen an einzelne oder mehrere PDFs',
          'Automatische Quellenangaben mit Seitenzahlen',
          'Zusammenfassungen von komplexen Forschungsarbeiten',
          'Export von Erkenntnissen direkt in Ihr Dokument',
        ],
        links: [
          { label: 'Feature-Guide', href: '#' },
          { label: 'hier', href: '#' },
        ],
      },
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="pt-16 pb-8 md:pt-24 md:pb-12">
          <div className="container px-4 mx-auto">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
              Changelog
            </h1>
            <p className="text-muted-foreground">
              Neue Updates und Verbesserungen bei {siteConfig.name}.
            </p>
          </div>
        </section>

        {/* Changelog Entries */}
        <section className="py-12 md:py-16">
          <div className="container px-4 mx-auto">
            <div className="max-w-5xl">
              {changelogData.map((entry, index) => (
                <ChangelogEntryRow key={entry.id} entry={entry} isFirst={index === 0} isLast={index === changelogData.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* Load More */}
        <section className="pb-16 md:pb-24 border-t border-border pt-8">
          <div className="container px-4 mx-auto">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ältere Updates laden →
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function ChangelogEntryRow({ entry, isFirst, isLast }: { entry: ChangelogEntry; isFirst?: boolean; isLast?: boolean }) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-[280px_1fr] lg:gap-12", !isLast && "pb-16 md:pb-20")}>
      {/* Left Column - Timeline + Title + Date */}
      <div className="relative pl-6 lg:pl-8">
        {/* Title + Date + Dot - Sticky */}
        <div className="lg:sticky lg:top-32 z-20 bg-background">
          {/* Dot - direkt auf der Linie, zentriert */}
          <div className="hidden lg:block absolute left-0 top-0 w-[14px] h-[14px] -translate-x-1/2 z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          
          <div className="pl-4">
            <h2 className="text-[15px] font-medium text-foreground mb-1 leading-snug">
              {entry.title}
            </h2>
            <time className="text-sm text-muted-foreground">
              {entry.date}
            </time>
          </div>
        </div>
      </div>

      {/* Right Column - Content */}
      <div className="space-y-10 pt-4 lg:pt-0">
        {entry.content.map((section, index) => (
          <div key={index} className="space-y-4">
            {/* Section Heading */}
            <h3 className="text-2xl md:text-3xl font-semibold text-foreground">
              {section.heading}
            </h3>

            {/* Image */}
            {section.image && (
              <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden border border-border bg-muted">
                <Image
                  src={section.image}
                  alt={section.heading}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {section.description}
            </p>

            {/* Details List */}
            {section.details && section.details.length > 0 && (
              <ul className="space-y-2 pt-2">
                {section.details.map((detail, detailIndex) => (
                  <li
                    key={detailIndex}
                    className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-muted-foreground/50 mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Links */}
            {section.links && section.links.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                {section.links.map((link, linkIndex) => (
                  <Link
                    key={linkIndex}
                    href={link.href}
                    className="text-sm text-foreground underline decoration-muted-foreground/50 hover:decoration-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
