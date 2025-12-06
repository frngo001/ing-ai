"use client";

import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Glow from "@/components/ui/glow";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { MorphyButton } from "@/components/ui/morphy-button";
import Link from "next/link";

const faqs = [
    {
        question: "Wie funktioniert die KI-Zitiergenerierung?",
        answer: "Unsere KI scannt deinen Text und schlägt passende Zitate aus unserer Datenbank mit Millionen von akademischen Arbeiten vor. Du kannst auch deine eigenen PDFs hochladen und die KI zieht Zitate direkt daraus. Wir unterstützen alle wichtigen Zitierstile wie APA, MLA, Chicago, Harvard und IEEE.",
    },
    {
        question: "Ist der Inhalt plagiatfrei?",
        answer: "Ja. Ing AI wurde entwickelt, um dir beim Schreiben origineller Inhalte zu helfen. Unsere KI-Vorschläge sind einzigartig und wir haben einen integrierten Plagiatsprüfer, um sicherzustellen, dass deine Arbeit zu 100% original ist.",
    },
    {
        question: "Kann ich meine Arbeit nach Word oder LaTeX exportieren?",
        answer: "Absolut. Du kannst dein gesamtes Dokument jederzeit im Microsoft Word (.docx), LaTeX (.tex) oder HTML-Format exportieren. Alle Formatierungen und Zitate bleiben erhalten.",
    },
    {
        question: "Sind meine Daten sicher?",
        answer: "Wir nehmen Datensicherheit sehr ernst. Alle deine Forschungen und Texte werden verschlüsselt und sicher gespeichert. Wir verwenden deine privaten Daten nicht, um unsere öffentlichen Modelle ohne deine ausdrückliche Erlaubnis zu trainieren.",
    },
    {
        question: "Unterstützt es andere Sprachen als Deutsch?",
        answer: "Ja! Ing AI unterstützt das Schreiben und Recherchieren in mehreren Sprachen, darunter Englisch, Spanisch, Französisch, Chinesisch, Japanisch und viele mehr.",
    },
    {
        question: "Kann ich mein Abonnement jederzeit kündigen?",
        answer: "Ja, du kannst dein Abonnement jederzeit kündigen. Dein Zugang bleibt bis zum Ende deines Abrechnungszeitraums bestehen, und dir wird nichts mehr berechnet.",
    },
];

export function FAQ() {
    return (
        <section id="faq" className="min-h-screen flex items-center justify-center px-6 py-12 bg-muted/40 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <Glow variant="above" className="opacity-15 left-1/2 -translate-x-1/2" />
                <div className="absolute top-1/4 -left-20 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="flex flex-col md:flex-row items-start gap-x-12 gap-y-6 container max-w-6xl mx-auto">
                <div className="flex-1">
                    <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        FAQ
                    </Badge>
                    <h2 className="text-4xl lg:text-5xl leading-[1.15]! font-semibold tracking-[-0.035em] mb-4">
                        Häufig gestellte <br /> Fragen
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Alles was du über Ing AI wissen musst.
                    </p>
                    <Link href="mailto:support@ing-ai.com">
                        <MorphyButton>
                            Support kontaktieren
                        </MorphyButton>
                    </Link>
                </div>

                <Accordion type="single" defaultValue="item-0" className="flex-1 w-full max-w-xl">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-b-0 mb-4">
                            <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-primary transition-colors py-2">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
