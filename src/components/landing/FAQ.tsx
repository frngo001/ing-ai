"use client";

import * as React from "react"
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
import { useLanguage } from "@/lib/i18n/use-language";
import { FAQSchema } from "@/components/seo/faq-schema";

export function FAQ() {
    const { t, language } = useLanguage()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const faqs = React.useMemo(() => [
        {
            question: t('landing.faq.questions.citationGeneration.question'),
            answer: t('landing.faq.questions.citationGeneration.answer'),
        },
        {
            question: t('landing.faq.questions.plagiarismFree.question'),
            answer: t('landing.faq.questions.plagiarismFree.answer'),
        },
        {
            question: t('landing.faq.questions.exportFormats.question'),
            answer: t('landing.faq.questions.exportFormats.answer'),
        },
        {
            question: t('landing.faq.questions.dataSecurity.question'),
            answer: t('landing.faq.questions.dataSecurity.answer'),
        },
        {
            question: t('landing.faq.questions.otherLanguages.question'),
            answer: t('landing.faq.questions.otherLanguages.answer'),
        },
        {
            question: t('landing.faq.questions.cancelSubscription.question'),
            answer: t('landing.faq.questions.cancelSubscription.answer'),
        },
    ], [t, language])

    if (!mounted) return null

    return (
        <section id="faq" className="md:min-h-screen flex items-center justify-center px-4 py-8 md:py-16 bg-muted dark:bg-background relative overflow-hidden">
            {/* SEO: FAQPage Schema */}
            <FAQSchema />

            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <Glow variant="above" className="opacity-15 left-1/2 -translate-x-1/2" />
                <div className="absolute top-1/4 -left-20 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="flex flex-col md:flex-row items-start gap-x-12 gap-y-6 container max-w-6xl mx-auto">
                <div className="flex-1 w-full text-center md:text-left">
                    <Badge variant="outline" className="mb-3 text-[8px] md:text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        {t('landing.faq.badge')}
                    </Badge>
                    <h2 className="text-lg md:text-4xl lg:text-5xl leading-tight! md:leading-[1.15]! font-semibold tracking-[-0.035em] mb-3 px-4">
                        {t('landing.faq.title')} <br className="hidden md:block" /> {t('landing.faq.titleLine2')}
                    </h2>
                    <p className="text-xs md:text-lg text-muted-foreground mb-6 max-w-lg mx-auto md:mx-0 px-4">
                        {t('landing.faq.description')}
                    </p>
                    <Link href="mailto:support@ing-ai.com" className="inline-block">
                        <MorphyButton className="scale-90 md:scale-100">
                            {t('landing.faq.contactSupport')}
                        </MorphyButton>
                    </Link>
                </div>

                <Accordion type="single" defaultValue="item-0" className="flex-1 w-full max-w-xl mt-6 md:mt-0">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-b border-neutral-200 dark:border-neutral-800 mb-1 last:border-b-0">
                            <AccordionTrigger className="text-left text-sm md:text-lg font-medium hover:no-underline hover:text-primary transition-colors py-3">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-[11px] md:text-base text-muted-foreground leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
