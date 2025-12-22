"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MorphyButton } from "@/components/ui/morphy-button";
import StatsCount from "@/components/ui/statscount";
import Glow from "@/components/ui/glow";

const stats = [
    { value: 2, suffix: "M+", label: "Aktive Nutzer" },
    { value: 50, suffix: "M+", label: "Dokumente erstellt" },
    { value: 4.9, suffix: "", label: "Bewertung" },
];

export function CTASection() {
    return (
        <Section className="py-24 md:py-32 bg-muted dark:bg-neutral-900 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <Glow variant="center" className="opacity-10" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal>
                    <div className="max-w-4xl mx-auto">
                        {/* Main CTA Card */}
                        <div className="relative rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-8 md:p-12 lg:p-16">
                            <div className="text-center space-y-8">
                                {/* Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                                        Starte noch heute
                                    </Badge>
                                </motion.div>

                                {/* Headline */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-neutral-900 dark:text-neutral-100"
                                >
                                    Bereit dein Schreiberlebnis
                                    <br />
                                    zu transformieren?
                                </motion.h2>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 }}
                                    className="text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto"
                                >
                                    Schließe dich Millionen von Forschern, Studierenden und Professionals an,
                                    die bereits besser und schneller mit Jenni AI schreiben.
                                </motion.p>

                                {/* CTA Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
                                >
                                    <Link href="/editor">
                                        <MorphyButton size="lg">
                                            Kostenlos starten
                                        </MorphyButton>
                                    </Link>
                                    <Link href="#pricing">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="rounded-full"
                                        >
                                            Preise ansehen
                                        </Button>
                                    </Link>
                                </motion.div>

                                {/* Trust Signals */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.5 }}
                                    className="pt-4"
                                >
                                    <p className="text-sm text-neutral-400 dark:text-neutral-500">
                                        Keine Kreditkarte nötig · Kostenloser Plan für immer · Jederzeit kündbar
                                    </p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Stats with animated counters */}
                        <div className="mt-12">
                            <StatsCount
                                stats={stats}
                                title="VERTRAUT VON MILLIONEN"
                                showDividers={true}
                            />
                        </div>

                        {/* Bottom CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="mt-8 flex justify-center"
                        >
                            <Link href="/editor">
                                <MorphyButton size="lg">
                                    Jetzt kostenlos starten
                                </MorphyButton>
                            </Link>
                        </motion.div>
                    </div>
                </ScrollReveal>
            </div>
        </Section>
    );
}
