"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Zap,
    Quote,
    Library,
    MessageSquareText,
    PenTool,
    ListTree,
    FileOutput,
    Languages,
    Moon,
    BarChart3,
    Workflow
} from "lucide-react"
import Link from "next/link"
import { MorphyButton } from "@/components/ui/morphy-button"
import { useCTAHref } from "@/hooks/use-auth"

const features = [
    {
        title: "AI Autocomplete",
        description: "Beat writer’s block with intelligent sentence and paragraph completions that adapt to your style.",
        icon: Zap,
        className: "md:col-span-2",
    },
    {
        title: "Smart Citations",
        description: "Auto-format citations in APA, MLA, Chicago, IEEE, and more.",
        icon: Quote,
        className: "md:col-span-1",
    },
    {
        title: "Research Library",
        description: "Upload PDFs, import .bib files, and organize your sources in one place.",
        icon: Library,
        className: "md:col-span-1",
    },
    {
        title: "Research Chat",
        description: "Chat with your PDFs to get summaries, find answers, and extract insights instantly.",
        icon: MessageSquareText,
        className: "md:col-span-2",
    },
    {
        title: "Paraphrasing & Rewrite",
        description: "Rewrite text for clarity, adjust tone, and paraphrase content while maintaining meaning.",
        icon: PenTool,
        className: "md:col-span-1",
    },
    {
        title: "Outline Builder",
        description: "Generate structured outlines for your papers based on your topic and requirements.",
        icon: ListTree,
        className: "md:col-span-1",
    },
    {
        title: "Export Options",
        description: "Export your work to .docx, LaTeX, or HTML ready for submission.",
        icon: FileOutput,
        className: "md:col-span-1",
    },
    {
        title: "Multilingual",
        description: "Write and research in multiple languages with native-quality support.",
        icon: Languages,
        className: "md:col-span-1",
    },
    {
        title: "Dark Mode",
        description: "Easy on the eyes for late-night writing sessions.",
        icon: Moon,
        className: "md:col-span-1",
    },
    {
        title: "Visuals & Charts",
        description: "Create professional charts and diagrams directly within your document.",
        icon: BarChart3,
        className: "md:col-span-1 border-primary/50 bg-primary/5",
    },
    {
        title: "Full Workflow",
        description: "From research to final export, everything you need in one unified platform.",
        icon: Workflow,
        className: "md:col-span-2",
    },
]

export function Features() {
    const ctaHref = useCTAHref()

    return (
        <section id="features" className="py-8 md:py-16 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
                    <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        Funktionen
                    </Badge>
                    <h2 className="text-lg md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 px-4">
                        Alles was du zum schneller Schreiben brauchst
                    </h2>
                    <p className="text-xs md:text-lg text-muted-foreground px-4">
                        Leistungsstarke Tools, entwickelt für Studierende und Forscher.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-6 max-w-7xl mx-auto">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className={`bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 group ${feature.className} dark:bg-neutral-900/40 dark:hover:border-primary/40 dark:hover:shadow-lg dark:hover:shadow-primary/5`}
                        >
                            <CardHeader className="p-3.5 sm:p-6">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5 md:mb-4 group-hover:bg-primary/20 transition-colors">
                                    <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                </div>
                                <CardTitle className="text-base md:text-xl">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3.5 sm:p-6 pt-0 sm:pt-0">
                                <p className="text-[11px] md:text-sm text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-center mt-8 md:mt-16">
                    <Link href={ctaHref}>
                        <MorphyButton size="lg" className="scale-90 md:scale-100">
                            Alle Features freischalten
                        </MorphyButton>
                    </Link>
                </div>
            </div>
        </section>
    )
}
