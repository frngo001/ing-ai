"use client";

import * as React from "react"
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MorphyButton } from "@/components/ui/morphy-button";
import StatsCount from "@/components/ui/statscount";
import { useCTAHref } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n/use-language";
import { translations } from "@/lib/i18n/translations";

// Typing animation hook
function useTypingEffect(text: string, isInView: boolean, delay: number = 0) {
    const [displayText, setDisplayText] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!isInView) return;

        setDisplayText("");
        setIsComplete(false);

        const timeout = setTimeout(() => {
            let index = 0;
            const interval = setInterval(() => {
                if (index <= text.length) {
                    setDisplayText(text.slice(0, index));
                    index++;
                } else {
                    setIsComplete(true);
                    clearInterval(interval);
                }
            }, 30);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timeout);
    }, [text, isInView, delay]);

    return { displayText, isComplete };
}

// Upload Visual with drag animation
function UploadVisual({ isInView }: { isInView: boolean }) {
    const { language } = useLanguage()

    const visuals = React.useMemo(() => {
        const lang = language as keyof typeof translations;
        return translations[lang].landing.howItWorks.visuals.upload as unknown as { dragFiles: string; files: { name: string; size: string }[] };
    }, [language])

    return (
        <div className="space-y-2 relative">
            {/* Drop zone */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 mb-3 text-center"
            >
                <motion.div
                    animate={isInView ? { y: [0, -5, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-sm text-neutral-400"
                >
                    {visuals.dragFiles}
                </motion.div>
            </motion.div>

            {visuals.files.map((file, i) => (
                <motion.div
                    key={file.name}
                    initial={{ opacity: 0, x: -30, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.4, ease: "easeOut" }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: 0.5 + i * 0.15, type: "spring", stiffness: 200 }}
                        className="w-9 h-9 rounded bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-xs font-bold text-white dark:text-neutral-900"
                    >
                        PDF
                    </motion.div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
                            {file.name}
                        </div>
                        <div className="text-xs text-neutral-400">{file.size}</div>
                    </div>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: 0.7 + i * 0.15, type: "spring" }}
                        className="w-5 h-5 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center"
                    >
                        <span className="text-[10px] text-white dark:text-neutral-900">✓</span>
                    </motion.div>
                </motion.div>
            ))}
        </div>
    );
}

// Outline Visual with expanding animation
function OutlineVisual({ isInView }: { isInView: boolean }) {
    const { language } = useLanguage()

    const sections = React.useMemo(() => {
        const lang = language as keyof typeof translations;
        return translations[lang].landing.howItWorks.visuals.outline.sections as unknown as { title: string; subsections: string[] }[];
    }, [language])

    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => setExpandedIndex(0), 800);
            return () => clearTimeout(timer);
        }
    }, [isInView]);

    return (
        <div className="space-y-1.5">
            {sections.map((section, i) => (
                <motion.div
                    key={section.title}
                    initial={{ opacity: 0, height: 0 }}
                    animate={isInView ? { opacity: 1, height: "auto" } : {}}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                >
                    <motion.div
                        whileHover={{ x: 4 }}
                        onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                        className={cn(
                            "px-3 py-2 rounded-md border cursor-pointer transition-all duration-200",
                            expandedIndex === i
                                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                                : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                        )}
                    >
                        <span className="text-sm font-medium">{section.title}</span>
                    </motion.div>

                    {/* Subsections */}
                    <motion.div
                        initial={false}
                        animate={{
                            height: expandedIndex === i && section.subsections.length > 0 ? "auto" : 0,
                            opacity: expandedIndex === i ? 1 : 0
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden ml-4"
                    >
                        {section.subsections.map((sub, j) => (
                            <motion.div
                                key={sub}
                                initial={{ x: -10, opacity: 0 }}
                                animate={expandedIndex === i ? { x: 0, opacity: 1 } : {}}
                                transition={{ delay: j * 0.1 }}
                                className="px-3 py-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 border-l-2 border-neutral-200 dark:border-neutral-700 mt-1"
                            >
                                {sub}
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            ))}
        </div>
    );
}

// Writing Visual with typing effect
function WriteVisual({ isInView }: { isInView: boolean }) {
    const { t, language } = useLanguage()

    const visuals = React.useMemo(() => ({
        baseText: t('landing.howItWorks.visuals.write.baseText'),
        aiSuggestion: t('landing.howItWorks.visuals.write.aiSuggestion'),
        accept: t('landing.howItWorks.visuals.write.accept'),
        reject: t('landing.howItWorks.visuals.write.reject'),
        citationAdded: t('landing.howItWorks.visuals.write.citationAdded'),
    }), [t, language])

    const { displayText: typedSuggestion, isComplete } = useTypingEffect(visuals.aiSuggestion, isInView, 500);

    return (
        <div className="space-y-3">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {visuals.baseText}
                    <span className="text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-0.5 rounded">
                        {typedSuggestion}
                        {!isComplete && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="inline-block w-0.5 h-4 bg-neutral-400 ml-0.5 align-middle"
                            />
                        )}
                    </span>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <motion.kbd
                        animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.3, repeat: isComplete ? Infinity : 0, repeatDelay: 2 }}
                        className="px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-[10px] font-mono font-bold"
                    >
                        Tab
                    </motion.kbd>
                    <span className="text-xs text-neutral-400">{visuals.accept}</span>
                </div>
                <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded text-[10px] font-mono text-neutral-500 border border-neutral-300 dark:border-neutral-700">
                        Esc
                    </kbd>
                    <span className="text-xs text-neutral-400">{visuals.reject}</span>
                </div>
            </motion.div>

            {/* Citation indicator */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isComplete ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
                <div className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-neutral-100" />
                <span className="text-[10px] text-neutral-500">{visuals.citationAdded}</span>
            </motion.div>
        </div>
    );
}

// Export Visual with format selection
function ExportVisual({ isInView }: { isInView: boolean }) {
    const { t, language } = useLanguage()
    const [selected, setSelected] = useState<string | null>(null);

    const visuals = React.useMemo(() => {
        const lang = language as keyof typeof translations;
        return {
            formats: translations[lang].landing.howItWorks.visuals.export.formats as unknown as { name: string; desc: string }[],
            exporting: t('landing.howItWorks.visuals.export.exporting'),
        };
    }, [t, language])

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => setSelected("DOCX"), 1000);
            return () => clearTimeout(timer);
        }
    }, [isInView]);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                {visuals.formats.map((format, i) => (
                    <motion.div
                        key={format.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 100 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelected(format.name)}
                        className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                            selected === format.name
                                ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100"
                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                        )}
                    >
                        <div className={cn(
                            "text-sm font-bold",
                            selected === format.name
                                ? "text-white dark:text-neutral-900"
                                : "text-neutral-700 dark:text-neutral-300"
                        )}>
                            {format.name}
                        </div>
                        <div className={cn(
                            "text-[10px]",
                            selected === format.name
                                ? "text-neutral-300 dark:text-neutral-600"
                                : "text-neutral-400"
                        )}>
                            {format.desc}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Export progress */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={selected ? { opacity: 1 } : { opacity: 0 }}
                className="space-y-2"
            >
                <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">{visuals.exporting} {selected}...</span>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-neutral-900 dark:text-neutral-100 font-medium"
                    >
                        100%
                    </motion.span>
                </div>
                <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={selected ? { width: "100%" } : { width: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                    />
                </div>
            </motion.div>
        </div>
    );
}

function StepVisual({ type, isInView }: { type: string; isInView: boolean }) {
    switch (type) {
        case "upload":
            return <UploadVisual isInView={isInView} />;
        case "outline":
            return <OutlineVisual isInView={isInView} />;
        case "write":
            return <WriteVisual isInView={isInView} />;
        case "export":
            return <ExportVisual isInView={isInView} />;
        default:
            return null;
    }
}

// Step Card Component
type Step = {
    number: string;
    title: string;
    description: string;
    visual: string;
};

function StepCard({ step, index }: { step: Step; index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.01 }}
            className="group grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 p-3.5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all duration-300"
        >
            {/* Number & Content */}
            <div className={cn(
                "md:col-span-6 flex gap-3 md:gap-5",
                index % 2 === 1 && "md:order-2"
            )}>
                {/* Step Number - Mobile only */}
                <div className="flex-shrink-0 md:hidden">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm">
                        {step.number}
                    </div>
                </div>

                {/* Text Content */}
                <div className="flex-1">
                    <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5 md:mb-2"
                    >
                        {step.title}
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ delay: 0.2 }}
                        className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed"
                    >
                        {step.description}
                    </motion.p>
                </div>
            </div>

            {/* Visual */}
            <div className={cn(
                "md:col-span-6 bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 min-h-[200px]",
                index % 2 === 1 && "md:order-1"
            )}>
                <StepVisual type={step.visual} isInView={isInView} />
            </div>
        </motion.div>
    );
}

// Animated counter
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            const duration = 2000;
            const steps = 60;
            const increment = value / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setCount(value);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [isInView, value]);

    return <span ref={ref}>{count}{suffix}</span>;
}

export function HowItWorks() {
    const ctaHref = useCTAHref()
    const { t, language } = useLanguage()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const steps = React.useMemo(() => [
        {
            number: t('landing.howItWorks.steps.upload.number'),
            title: t('landing.howItWorks.steps.upload.title'),
            description: t('landing.howItWorks.steps.upload.description'),
            visual: "upload",
        },
        {
            number: t('landing.howItWorks.steps.outline.number'),
            title: t('landing.howItWorks.steps.outline.title'),
            description: t('landing.howItWorks.steps.outline.description'),
            visual: "outline",
        },
        {
            number: t('landing.howItWorks.steps.write.number'),
            title: t('landing.howItWorks.steps.write.title'),
            description: t('landing.howItWorks.steps.write.description'),
            visual: "write",
        },
        {
            number: t('landing.howItWorks.steps.export.number'),
            title: t('landing.howItWorks.steps.export.title'),
            description: t('landing.howItWorks.steps.export.description'),
            visual: "export",
        },
    ], [t, language])

    if (!mounted) return null

    return (
        <section id="how-it-works" className="py-8 md:py-16 bg-gradient-to-b from-muted/80 via-muted/40 to-background dark:from-background dark:via-background dark:to-background relative overflow-hidden">
            {/* Subtle background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse:60%_50%_at_50%_0%,#000_70%,transparent_110%)] -z-10" />

            <div className="container px-4 mx-auto">
                <ScrollReveal className="text-center max-w-2xl mx-auto mb-8 md:mb-16 space-y-3">
                    <Badge variant="outline" className="text-[10px] md:text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        {t('landing.howItWorks.badge')}
                    </Badge>
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 px-4">
                        {t('landing.howItWorks.title')}
                    </h2>
                    <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 px-4">
                        {t('landing.howItWorks.description')}
                    </p>
                </ScrollReveal>

                <div className="max-w-5xl mx-auto">
                    {/* Progress line */}
                    <div className="hidden md:block relative mb-8">
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-neutral-200 dark:bg-neutral-800" />
                        <div className="flex justify-between relative">
                            {steps.map((step, i) => (
                                <motion.div
                                    key={step.number}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                                    className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm z-10"
                                >
                                    {step.number}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {steps.map((step, index) => (
                            <StepCard key={index} step={step} index={index} />
                        ))}
                    </div>

                    {/* Bottom Stats - Replaced with StatsCount */}
                    <div className="mt-16">
                        <StatsCount
                            stats={[
                                { value: 3, suffix: "x", label: t('landing.howItWorks.stats.faster.label') },
                                { value: 85, suffix: "%", label: t('landing.howItWorks.stats.timeSaved.label') },
                                { value: 50, suffix: "+", label: t('landing.howItWorks.stats.citationStyles.label') }
                            ]}
                            title={t('landing.howItWorks.stats.title')}
                            showDividers={true}
                            className="bg-card text-card-foreground backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm"
                        />
                    </div>

                    <div className="flex justify-center mt-10 md:mt-12">
                        <Link href={ctaHref}>
                            <MorphyButton size="lg" className="scale-90 md:scale-100">
                                {t('landing.howItWorks.cta')}
                            </MorphyButton>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
