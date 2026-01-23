"use client";

import * as React from "react"
import { useState, useEffect } from "react";
import { Section } from "@/components/ui/section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import { useLanguage } from "@/lib/i18n/use-language";

export default function BentoGrid() {
    const { t, language } = useLanguage()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const bentoContent = React.useMemo(() => [
        // Section 1: Core Writing Features
        {
            category: t('landing.bentoGrid.coreFeatures.title'),
            categoryDescription: t('landing.bentoGrid.coreFeatures.description'),
            title: t('landing.bentoGrid.features.aiAutocomplete.title'),
            description: t('landing.bentoGrid.features.aiAutocomplete.description'),
            content: (
                <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
                    <video
                        src="/assets/videos/autocomplete.mp4"
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            )
        },
        {
            category: t('landing.bentoGrid.coreFeatures.title'),
            categoryDescription: t('landing.bentoGrid.coreFeatures.description'),
            title: t('landing.bentoGrid.features.instantCitations.title'),
            description: t('landing.bentoGrid.features.instantCitations.description'),
            content: (
                <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
                    <video
                        src="/assets/videos/zitationen.mp4"
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            )
        },
        // Section 2: Research & Organization
        {
            category: t('landing.bentoGrid.researchOrganization.title'),
            categoryDescription: t('landing.bentoGrid.researchOrganization.description'),
            title: t('landing.bentoGrid.features.chatWithAgent.title'),
            description: t('landing.bentoGrid.features.chatWithAgent.description'),
            content: (
                <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
                    <video
                        src="/assets/videos/chat.mp4"
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            )
        },
        {
            category: t('landing.bentoGrid.researchOrganization.title'),
            categoryDescription: t('landing.bentoGrid.researchOrganization.description'),
            title: t('landing.bentoGrid.features.researchLibrary.title'),
            description: t('landing.bentoGrid.features.researchLibrary.description'),
            content: (
                <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
                    <video
                        src="/assets/videos/research-library.mp4"
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            )
        },
        // Section 3: Quality & Analysis TODO: Add implementation
        // {
        //     category: t('landing.bentoGrid.qualityAnalysis.title'),
        //     categoryDescription: t('landing.bentoGrid.qualityAnalysis.description'),
        //     title: t('landing.bentoGrid.features.plagiarismCheck.title'),
        //     description: t('landing.bentoGrid.features.plagiarismCheck.description'),
        //     content: (
        //         <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
        //             <video
        //                 src="/assets/videos/plagiarism-check.mp4"
        //                 className="w-full h-auto"
        //                 autoPlay
        //                 loop
        //                 muted
        //                 playsInline
        //             />
        //         </div>
        //     )
        // },
        // {
        //     category: t('landing.bentoGrid.qualityAnalysis.title'),
        //     categoryDescription: t('landing.bentoGrid.qualityAnalysis.description'),
        //     title: t('landing.bentoGrid.features.grammarAnalysis.title'),
        //     description: t('landing.bentoGrid.features.grammarAnalysis.description'),
        //     content: (
        //         <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
        //             <video
        //                 src="/assets/videos/grammar-analysis.mp4"
        //                 className="w-full h-auto"
        //                 autoPlay
        //                 loop
        //                 muted
        //                 playsInline
        //             />
        //         </div>
        //     )
        // },
        // {
        //     category: t('landing.bentoGrid.qualityAnalysis.title'),
        //     categoryDescription: t('landing.bentoGrid.qualityAnalysis.description'),
        //     title: t('landing.bentoGrid.features.scientificDatabases.title'),
        //     description: t('landing.bentoGrid.features.scientificDatabases.description'),
        //     content: (
        //         <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
        //             <video
        //                 src="/assets/videos/scientific-databases.mp4"
        //                 className="w-full h-auto"
        //                 autoPlay
        //                 loop
        //                 muted
        //                 playsInline
        //             />
        //         </div>
        //     )
        // },
        // Section 4: Import & Export
        {
            category: t('landing.bentoGrid.importExport.title'),
            categoryDescription: t('landing.bentoGrid.importExport.description'),
            title: t('landing.bentoGrid.features.exportOptions.title'),
            description: t('landing.bentoGrid.features.exportOptions.description'),
            content: (
                <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
                    <video
                        src="/assets/videos/export-options.mp4"
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            )
        },
        {
            category: t('landing.bentoGrid.importExport.title'),
            categoryDescription: t('landing.bentoGrid.importExport.description'),
            title: t('landing.bentoGrid.features.editorImport.title'),
            description: t('landing.bentoGrid.features.editorImport.description'),
            content: (
                <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
                    <video
                        src="/assets/videos/editor-import.mp4"
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            )
        },
        // Section 5: Bibliography Management
        {
            category: t('landing.bentoGrid.bibliographyManagement.title'),
            categoryDescription: t('landing.bentoGrid.bibliographyManagement.description'),
            title: t('landing.bentoGrid.features.bibtexImportExport.title'),
            description: t('landing.bentoGrid.features.bibtexImportExport.description'),
            content: (
                <div className="w-full rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg lg:shadow-2xl border border-neutral-200/80 dark:border-neutral-700/50">
                    <video
                        src="/assets/videos/bibtex.mp4"
                        className="w-full h-auto"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>
            )
        }
    ], [t, language]);

    if (!mounted) return null

    return (
        <Section className="py-8 sm:py-12 md:py-16 lg:py-32 bg-gradient-to-b from-muted/60 via-background to-muted/40 dark:from-background dark:via-background dark:to-background" id="bento-features">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal className="mb-6 sm:mb-8 md:mb-10 lg:mb-6 text-center max-w-3xl mx-auto space-y-1.5 sm:space-y-2">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('landing.bentoGrid.title')}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-md sm:max-w-xl md:max-w-2xl mx-auto leading-relaxed">
                        {t('landing.bentoGrid.description')}
                    </p>
                </ScrollReveal>

                <StickyScroll content={bentoContent} />
            </div>
        </Section>
    );
}
