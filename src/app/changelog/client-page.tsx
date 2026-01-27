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
        id: 'collaboration-update',
        date: 'Jan 22, 2026',
        title: 'Kollaboration & Teilen (220126)',
        content: [
            {
                heading: 'Echtzeit-Zusammenarbeit',
                description: 'Arbeiten Sie gleichzeitig mit Ihren Kollegen an denselben Dokumenten. Sehen Sie Cursor in Echtzeit und tauschen Sie Feedback sofort aus.',
                image: '/changelog/collaboration.png',
                details: [
                    'Live-Cursor-Anzeige aller aktiven Bearbeiter',
                    'Nahtlose Synchronisation von Änderungen',
                    'Verbessertes Kommentarsystem für direktes Feedback',
                ],
            },
            {
                heading: 'Projekt-Teilen & Berechtigungen',
                description: 'Teilen Sie ganze Projekte mit nur einem Klick und behalten Sie die volle Kontrolle über den Zugriff.',
                details: [
                    'Flexible Rollen: Betrachter, Editor oder Vorschlagsmodus',
                    'Teilen via Link oder E-Mail-Einladung',
                    'Optionale Ablaufdaten für geteilte Links',
                ],
            },
        ],
    },
    {
        id: 'word-import',
        date: 'Jan 15, 2026',
        title: 'Word Import (150126)',
        content: [
            {
                heading: 'Import aus Microsoft Word',
                description: 'Bringen Sie Ihre bestehenden Arbeiten mühelos in Ing AI. Importieren Sie .docx Dateien unter Beibehaltung aller Formatierungen.',
                image: '/changelog/word-import.png',
                details: [
                    'Beibehaltung von Überschriften, Listen und Tabellen',
                    'Automatische Konvertierung von Word-Kommentaren',
                    'Unterstützung für Fußnoten und Verzeichnisse',
                ],
                links: [
                    { label: 'Zum Editor', href: '/editor' },
                ],
            },
        ],
    },
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
                <section className="pt-8 pb-6 md:pt-24 md:pb-12">
                    <div className="container px-4 mx-auto text-center md:text-left">
                        <h1 className="text-2xl md:text-5xl font-bold tracking-tight mb-2">
                            Changelog
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto md:mx-0">
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
        <div className={cn("relative grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-10", !isLast && "pb-12 lg:pb-16")}>

            {/* Mobile Timeline Line */}
            <div className={cn(
                "absolute left-[5px] top-3 bottom-0 w-px bg-border/50 lg:hidden",
                isLast && "h-full bottom-auto bg-gradient-to-b from-border/50 to-transparent"
            )} />

            {/* Left Column - Meta (Date/Title) */}
            <div className="relative pl-8 lg:pl-0 lg:text-right">
                {/* Mobile Dot */}
                <div className="absolute left-[1px] top-2 w-[9px] h-[9px] rounded-full bg-primary ring-4 ring-background lg:hidden z-10 shadow-sm" />

                <div className="lg:sticky lg:top-32">
                    <time className="text-xs md:text-xs font-semibold text-primary uppercase tracking-wider mb-1 block">
                        {entry.date}
                    </time>
                    <h2 className="text-base md:text-lg font-bold text-foreground leading-snug">
                        {entry.title}
                    </h2>
                </div>
            </div>

            {/* Right Column - Content */}
            <div className="relative pl-8 lg:pl-10 lg:border-l lg:border-border/50">
                {/* Desktop Dot */}
                <div className="absolute -left-[5px] top-[5px] w-[9px] h-[9px] rounded-full bg-primary ring-4 ring-background hidden lg:block z-10 shadow-sm" />

                <div className="space-y-8 md:space-y-12">
                    {entry.content.map((section, index) => (
                        <div key={index} className="space-y-4 md:space-y-5 animate-appear">
                            {/* Section Heading */}
                            <h3 className="text-lg md:text-2xl font-bold text-foreground tracking-tight">
                                {section.heading}
                            </h3>

                            {/* Image */}
                            {section.image && (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted/30 shadow-sm">
                                    <Image
                                        src={section.image}
                                        alt={section.heading}
                                        fill
                                        className="object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                </div>
                            )}

                            {/* Description */}
                            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                {section.description}
                            </p>

                            {/* Details List */}
                            {section.details && section.details.length > 0 && (
                                <ul className="grid sm:grid-cols-1 gap-2 pt-2">
                                    {section.details.map((detail, detailIndex) => (
                                        <li
                                            key={detailIndex}
                                            className="text-sm md:text-sm text-muted-foreground leading-relaxed flex items-start gap-2.5"
                                        >
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                            <span>{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Links */}
                            {section.links && section.links.length > 0 && (
                                <div className="flex flex-wrap gap-3 pt-2">
                                    {section.links.map((link, linkIndex) => (
                                        <Link
                                            key={linkIndex}
                                            href={link.href}
                                            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 px-3 py-1.5 rounded-md hover:bg-primary/10"
                                        >
                                            {link.label}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="ml-1.5 w-3.5 h-3.5"
                                            >
                                                <path d="M5 12h14" />
                                                <path d="m12 5 7 7-7 7" />
                                            </svg>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
