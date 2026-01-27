import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check, X, ArrowLeft, ArrowRight, Zap, GraduationCap, FileCheck } from 'lucide-react'

import { competitors } from '@/lib/seo/competitors'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { siteConfig } from '@/config/site'

interface ComparisonPageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateMetadata({ params }: ComparisonPageProps): Promise<Metadata> {
    const { slug } = await params
    const competitor = competitors.find((c) => c.slug === slug)

    if (!competitor) {
        return {
            title: 'Vergleich nicht gefunden - Ing AI',
        }
    }

    return {
        title: competitor.metaTitle,
        description: competitor.metaDescription,
        alternates: {
            canonical: `${siteConfig.url}/compare/${slug}`,
        },
        openGraph: {
            title: competitor.metaTitle,
            description: competitor.metaDescription,
            url: `${siteConfig.url}/compare/${slug}`,
            type: 'article',
        },
    }
}

export async function generateStaticParams() {
    return competitors.map((competitor) => ({
        slug: competitor.slug,
    }))
}

export default async function ComparisonPage({ params }: ComparisonPageProps) {
    const { slug } = await params
    const competitor = competitors.find((c) => c.slug === slug)

    if (!competitor) {
        return notFound()
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-b from-muted/30 to-background">
                    <div className="container mx-auto max-w-6xl relative z-10 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Zurück zur Startseite
                        </Link>

                        <Badge variant="outline" className="mb-6 mx-auto w-fit uppercase tracking-wider text-xs">
                            Vergleich
                        </Badge>

                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                            Ing AI <span className="text-muted-foreground">vs.</span> {competitor.name}
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                            {competitor.metaDescription}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild className="rounded-full h-12 px-8 text-base">
                                <Link href="/auth/signup">
                                    Ing AI kostenlos testen <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="rounded-full h-12 px-8 text-base">
                                <Link href="#vergleich">
                                    Vergleich ansehen
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Feature Comparison Table */}
                <section id="vergleich" className="py-20 px-4">
                    <div className="container mx-auto max-w-5xl">
                        <div className="grid md:grid-cols-2 gap-8 items-start">

                            {/* Competitor Card */}
                            <div className="bg-card border rounded-2xl p-8 shadow-sm opacity-80 scale-95">
                                <h3 className="text-2xl font-bold mb-2">{competitor.name}</h3>
                                <p className="text-muted-foreground mb-6 text-sm">Der Bekannte</p>

                                <ul className="space-y-4 mb-8">
                                    {Object.entries(competitor.features).map(([key, hasFeature]) => (
                                        <li key={key} className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {key === 'citation' && 'Akademische Zitationen'}
                                                {key === 'aiWriting' && 'KI Ghostwriter'}
                                                {key === 'plagiarism' && 'Plagiatsprüfung'}
                                                {key === 'multilingual' && 'Mehrsprachig'}
                                                {key === 'pdfChat' && 'PDF Chat'}
                                            </span>
                                            {hasFeature ? (
                                                <Check className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <X className="h-5 w-5 text-red-500" />
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                                    <h4 className="font-semibold text-red-600 mb-2 text-sm uppercase tracking-wide">Nachteile</h4>
                                    <ul className="space-y-2">
                                        {competitor.cons.map((con, i) => (
                                            <li key={i} className="flex items-start text-sm text-foreground/80">
                                                <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                                                {con}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Ing AI Card */}
                            <div className="bg-background border-2 border-primary/20 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
                                    GENNER EMPFEHLUNG
                                </div>

                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-2xl font-bold">Ing AI</h3>
                                    <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">Testsieger</Badge>
                                </div>
                                <p className="text-muted-foreground mb-6 text-sm">Die akademische Lösung</p>

                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm font-medium">Akademische Zitationen</span>
                                        <Check className="h-5 w-5 text-primary" />
                                    </li>
                                    <li className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm font-medium">KI Ghostwriter</span>
                                        <Check className="h-5 w-5 text-primary" />
                                    </li>
                                    <li className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm font-medium">Plagiatsprüfung</span>
                                        <Check className="h-5 w-5 text-primary" />
                                    </li>
                                    <li className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm font-medium">Mehrsprachig (DE/EN)</span>
                                        <Check className="h-5 w-5 text-primary" />
                                    </li>
                                    <li className="flex items-center justify-between py-2 border-b border-border/50">
                                        <span className="text-sm font-medium">PDF Chat Analysis</span>
                                        <Check className="h-5 w-5 text-primary" />
                                    </li>
                                </ul>

                                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                    <h4 className="font-semibold text-primary mb-2 text-sm uppercase tracking-wide">Vorteile Ing AI</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-start text-sm">
                                            <Zap className="h-4 w-4 text-primary mr-2 mt-0.5 shrink-0" />
                                            Echte Quellen & Zitationen (keine Halluzinationen)
                                        </li>
                                        <li className="flex items-start text-sm">
                                            <GraduationCap className="h-4 w-4 text-primary mr-2 mt-0.5 shrink-0" />
                                            Spezialisiert auf Bachelor- & Masterarbeiten
                                        </li>
                                        <li className="flex items-start text-sm">
                                            <FileCheck className="h-4 w-4 text-primary mr-2 mt-0.5 shrink-0" />
                                            Datenschutzkonform & Werbefrei
                                        </li>
                                    </ul>
                                </div>

                                <div className="mt-8 pt-6 border-t border-border/50">
                                    <Button size="lg" className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                                        Jetzt Ing AI kostenlos nutzen
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-3">
                                        Keine Kreditkarte erforderlich. 200 Wörter gratis pro Tag.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Verdict Section */}
                <section className="py-20 bg-muted/30 px-4">
                    <div className="container mx-auto max-w-3xl text-center">
                        <h2 className="text-3xl font-bold mb-6">Unser Fazit</h2>
                        <div className="bg-background rounded-2xl p-8 border shadow-sm">
                            <p className="text-lg leading-relaxed text-foreground/90">
                                &ldquo;{competitor.verdict}&rdquo;
                            </p>
                        </div>

                        <div className="mt-10">
                            <h3 className="text-xl font-semibold mb-6">Bereit für bessere Noten?</h3>
                            <Button size="lg" asChild className="rounded-full px-10 h-14 text-lg">
                                <Link href="/auth/signup">
                                    Kostenlos mit Ing AI starten
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
