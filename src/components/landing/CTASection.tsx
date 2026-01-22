"use client";

import * as React from "react"
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MorphyButton } from "@/components/ui/morphy-button";
import StatsCount from "@/components/ui/statscount";
import Glow from "@/components/ui/glow";
import { useCTAHref } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n/use-language";

export function CTASection() {
    const ctaHref = useCTAHref()
    const { t, language } = useLanguage()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const stats = React.useMemo(() => [
        { value: 2, suffix: "M+", label: t('landing.cta.statsTitle') },
        { value: 50, suffix: "M+", label: t('landing.cta.statsTitle') },
        { value: 4.9, suffix: "", label: t('landing.cta.statsTitle') },
    ], [t, language])

    if (!mounted) return null

    return (
        <Section className="py-8 md:py-24 bg-muted dark:bg-neutral-900 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <Glow variant="center" className="opacity-10" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal>
                    <div className="max-w-4xl mx-auto">
                        {/* Main CTA Card */}
                        <div className="relative rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 md:p-12 lg:p-16">
                            <div className="text-center space-y-4 md:space-y-8">
                                {/* Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                                        {t('landing.cta.badge')}
                                    </Badge>
                                </motion.div>

                                {/* Headline */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl font-bold tracking-tight md:text-5xl text-neutral-900 dark:text-neutral-100"
                                >
                                    {t('landing.cta.title')}
                                    <br />
                                    {t('landing.cta.titleLine2')}
                                </motion.h2>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xs md:text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto"
                                >
                                    {t('landing.cta.description')}
                                </motion.p>

                                {/* CTA Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-1 md:pt-2"
                                >
                                    <Link href={ctaHref}>
                                        <MorphyButton size="lg" className="scale-90 md:scale-100">
                                            {t('landing.cta.startFree')}
                                        </MorphyButton>
                                    </Link>
                                    <Link href="#pricing">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="rounded-full h-10 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium"
                                        >
                                            {t('landing.cta.viewPricing')}
                                        </Button>
                                    </Link>
                                </motion.div>

                                {/* Trust Signals */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 }}
                                    className="pt-2 md:pt-4"
                                >
                                    <p className="text-[10px] md:text-sm text-neutral-400 dark:text-neutral-500">
                                        {t('landing.cta.trustSignals')}
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Stats with animated counters */}
                        <div className="mt-8 md:mt-12">
                            <StatsCount
                                stats={stats}
                                title={t('landing.cta.statsTitle')}
                                showDividers={true}
                            />
                        </div>

                        {/* Bottom CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="mt-6 md:mt-8 flex justify-center"
                        >
                            <Link href={ctaHref}>
                                <MorphyButton size="lg" className="scale-90 md:scale-100">
                                    {t('landing.cta.startNow')}
                                </MorphyButton>
                            </Link>
                        </motion.div>
                    </div>
                </ScrollReveal>
            </div>
        </Section>
    );
}
