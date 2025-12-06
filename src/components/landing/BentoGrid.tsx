"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

interface FeatureCardProps {
    title: string;
    description: string;
    badge?: string;
    className?: string;
    children?: React.ReactNode;
}

function FeatureCard({ title, description, badge, className, children }: FeatureCardProps) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
        >
            <Card className={cn(
                "h-full border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200",
                className
            )}>
                <CardContent className="p-6 h-full flex flex-col">
                    {badge && (
                        <Badge variant="outline" className="w-fit mb-4 text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                            {badge}
                        </Badge>
                    )}
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
                        {description}
                    </p>
                    <div className="flex-1 relative">
                        {children}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function BentoGrid() {
    return (
        <Section className="py-24 bg-muted dark:bg-neutral-900" id="bento-features">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal className="mb-16 text-center max-w-2xl mx-auto">
                    <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        Funktionen
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-neutral-900 dark:text-neutral-100 mb-4">
                        Alles was du für bessere Forschung brauchst
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Eine komplette Suite von KI-Tools für akademisches Schreiben und Forschung.
                    </p>
                </ScrollReveal>

                <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[minmax(320px,auto)]">
                    {/* AI Autocomplete - Large Card */}
                    <StaggerItem className="md:col-span-4">
                        <FeatureCard
                            title="KI-Autocomplete"
                            description="Intelligente Satzvervollständigung, die deinen Kontext und Schreibstil versteht."
                            badge="Schreiben"
                        >
                            <div className="absolute inset-0 flex flex-col justify-center">
                                <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
                                    <div className="font-mono text-sm leading-relaxed">
                                        <span className="text-neutral-900 dark:text-neutral-100">
                                            Der Einfluss von künstlicher Intelligenz auf das Gesundheitswesen ist
                                        </span>
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5, duration: 0.5 }}
                                            className="text-neutral-400 dark:text-neutral-500"
                                        >
                                            {" "}tiefgreifend und vielschichtig, revolutioniert die Diagnostik..._
                                        </motion.span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded text-[10px] font-mono text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                                            Tab
                                        </kbd>
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500">zum Akzeptieren</span>
                                    </div>
                                </div>
                            </div>
                        </FeatureCard>
                    </StaggerItem>

                    {/* Citations */}
                    <StaggerItem className="md:col-span-2">
                        <FeatureCard
                            title="Sofortige Zitationen"
                            description="Generiere Zitate in APA, MLA, Chicago und 20+ weiteren Formaten."
                            badge="Forschung"
                        >
                            <div className="space-y-2">
                                {["APA 7th", "MLA 9th", "Chicago", "Harvard"].map((style, i) => (
                                    <motion.div
                                        key={style}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        className={cn(
                                            "px-3 py-2 rounded-md text-sm border transition-colors cursor-pointer",
                                            i === 0
                                                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                                                : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                                        )}
                                    >
                                        {style}
                                    </motion.div>
                                ))}
                            </div>
                        </FeatureCard>
                    </StaggerItem>

                    {/* Chat with PDFs */}
                    <StaggerItem className="md:col-span-2">
                        <FeatureCard
                            title="Chat mit PDFs"
                            description="Stelle Fragen zu deinen Forschungsarbeiten und erhalte sofortige Antworten."
                            badge="KI-Assistent"
                        >
                            <div className="space-y-3">
                                <div className="flex justify-end">
                                    <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-3 py-2 rounded-lg rounded-br-sm max-w-[80%]">
                                        Fasse die Methodik zusammen
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs px-3 py-2 rounded-lg rounded-bl-sm max-w-[90%]">
                                        Die Studie verwendete eine randomisierte kontrollierte Studie mit 500 Teilnehmern über 12 Monate...
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                                    <span className="flex-1 text-xs text-neutral-400">Stelle eine Frage...</span>
                                    <div className="w-4 h-4 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                </div>
                            </div>
                        </FeatureCard>
                    </StaggerItem>

                    {/* Research Library */}
                    <StaggerItem className="md:col-span-2">
                        <FeatureCard
                            title="Forschungsbibliothek"
                            description="Organisiere deine PDFs, Notizen und Quellen an einem Ort."
                            badge="Organisation"
                        >
                            <div className="grid grid-cols-2 gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -2 }}
                                        className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 p-2 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                                    >
                                        <div className="h-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-sm mb-2" />
                                        <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full w-full mb-1" />
                                        <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full w-2/3" />
                                    </motion.div>
                                ))}
                            </div>
                        </FeatureCard>
                    </StaggerItem>

                    {/* Multilingual */}
                    <StaggerItem className="md:col-span-2">
                        <FeatureCard
                            title="Mehrsprachig"
                            description="Schreibe und übersetze in Englisch, Deutsch, Spanisch, Französisch und mehr."
                            badge="Sprachen"
                        >
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { code: "EN", name: "English" },
                                    { code: "DE", name: "Deutsch" },
                                    { code: "ES", name: "Español" },
                                    { code: "FR", name: "Français" },
                                    { code: "IT", name: "Italiano" },
                                    { code: "PT", name: "Português" },
                                ].map((lang, i) => (
                                    <motion.div
                                        key={lang.code}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 + i * 0.05 }}
                                        whileHover={{ scale: 1.05 }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors",
                                            i === 0
                                                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                                                : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                                        )}
                                    >
                                        {lang.code}
                                    </motion.div>
                                ))}
                            </div>
                        </FeatureCard>
                    </StaggerItem>
                </StaggerContainer>
            </div>
        </Section>
    );
}
