import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Calculator, FileText, Search } from 'lucide-react'

import { useCases } from '@/lib/seo/use-cases'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { siteConfig } from '@/config/site'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface UseCasePageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateMetadata({ params }: UseCasePageProps): Promise<Metadata> {
    const { slug } = await params
    const useCase = useCases.find((c) => c.slug === slug)

    if (!useCase) {
        return {
            title: 'Anwendungsfall nicht gefunden - Ing AI',
        }
    }

    return {
        title: useCase.metaTitle,
        description: useCase.metaDescription,
        alternates: {
            canonical: `${siteConfig.url}/use-cases/${slug}`,
        },
        openGraph: {
            title: useCase.metaTitle,
            description: useCase.metaDescription,
            url: `${siteConfig.url}/use-cases/${slug}`,
            type: 'article',
        },
    }
}

export async function generateStaticParams() {
    return useCases.map((useCase) => ({
        slug: useCase.slug,
    }))
}

export default async function UseCasePage({ params }: UseCasePageProps) {
    const { slug } = await params
    const useCase = useCases.find((c) => c.slug === slug)

    if (!useCase) {
        return notFound()
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                    <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
                    <div className="container mx-auto max-w-6xl relative z-10 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Zurück zur Übersicht
                        </Link>

                        <div className="flex justify-center mb-6">
                            <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full bg-primary/10 text-primary border-primary/20">
                                {useCase.title}
                            </Badge>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
                            {useCase.heroTitle}
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                            {useCase.heroDescription}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild className="rounded-full h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/20">
                                <Link href="/auth/signup">
                                    Jetzt kostenlos anfangen <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Benefits Grid */}
                <section className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid md:grid-cols-3 gap-8">
                            {useCase.benefits.map((benefit, index) => (
                                <div key={index} className="bg-background rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                                        {index === 0 ? <FileText className="h-6 w-6" /> :
                                            index === 1 ? <Search className="h-6 w-6" /> :
                                                <CheckCircle2 className="h-6 w-6" />}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-24 px-4">
                    <div className="container mx-auto max-w-3xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Häufige Fragen zu {useCase.title}</h2>
                            <p className="text-muted-foreground">Wir haben die Antworten auf deine wichtigsten Fragen.</p>
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                            {useCase.faq.map((item, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/60">
                                    <AccordionTrigger className="text-left text-lg font-medium py-6 hover:no-underline hover:text-primary transition-colors">
                                        {item.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 pr-4">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

                {/* CTA Bottom */}
                <section className="py-24 bg-primary text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                            Mach deine Arbeit zum Meisterwerk
                        </h2>
                        <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
                            Schließe dich tausenden Studenten an, die mit Ing AI bessere Noten schreiben – stressfrei und effizient.
                        </p>
                        <Button size="lg" variant="secondary" asChild className="h-14 px-10 rounded-full text-lg font-bold text-primary hover:bg-white/90">
                            <Link href="/auth/signup">
                                Kostenlos loslegen
                            </Link>
                        </Button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
