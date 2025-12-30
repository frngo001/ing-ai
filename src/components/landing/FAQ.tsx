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

export function FAQ() {
    const { t, language } = useLanguage()

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
                        {t('landing.faq.badge')}
                    </Badge>
                    <h2 className="text-4xl lg:text-5xl leading-[1.15]! font-semibold tracking-[-0.035em] mb-4">
                        {t('landing.faq.title')} <br /> {t('landing.faq.titleLine2')}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        {t('landing.faq.description')}
                    </p>
                    <Link href="mailto:support@ing-ai.com">
                        <MorphyButton>
                            {t('landing.faq.contactSupport')}
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
