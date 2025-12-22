"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import { Play, X, ArrowRight, Sparkles, ShieldCheck, FileCheck, Database, FileText, Code, Code2, FileType, ArrowUpToLine, Download, Upload, FileCode } from "lucide-react";

interface FeatureVideo {
    youtubeId?: string;
    videoSrc?: string; // Für lokale Videos
    gifSrc?: string; // Für GIF-Dateien (spielen sich automatisch ab)
    gifSrcLight?: string; // Für GIF-Dateien im Light-Mode
    gifSrcDark?: string; // Für GIF-Dateien im Dark-Mode
    thumbnail?: string;
    title?: string;
}

interface FeatureCardProps {
    title: string;
    description: string;
    badge?: string;
    className?: string;
    video?: FeatureVideo;
    showCTA?: boolean;
    children?: React.ReactNode;
}

function VideoModal({
    video,
    onClose
}: {
    video: FeatureVideo;
    onClose: () => void;
}) {
    if (!video.youtubeId && !video.videoSrc) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/90 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                    {video.youtubeId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                            title={video.title || "Feature Video"}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        />
                    ) : video.videoSrc ? (
                        <video
                            src={video.videoSrc}
                            controls
                            autoPlay
                            className="absolute inset-0 w-full h-full"
                        />
                    ) : null}
                </div>

                {video.title && (
                    <div className="mt-4">
                        <h3 className="text-xl font-semibold text-white">{video.title}</h3>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

function FeatureCard({ title, description, badge, className, video, showCTA, children }: FeatureCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getGifSrc = () => {
        if (!video) return null;
        if (video.gifSrcLight && video.gifSrcDark) {
            if (!mounted) return video.gifSrcLight;
            const currentTheme = theme === "system" ? systemTheme : theme;
            return currentTheme === "dark" ? video.gifSrcDark : video.gifSrcLight;
        }
        return video.gifSrc || null;
    };

    return (
        <>
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
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
                            {video && (video.youtubeId || video.videoSrc || video.gifSrc || video.gifSrcLight || video.gifSrcDark) && (
                                <div className="mt-4">
                                    {getGifSrc() ? (
                                        <>
                                            {/* GIF wird direkt angezeigt und spielt sich automatisch ab */}
                                            <div className="w-full rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                                <img
                                                    src={getGifSrc() || ""}
                                                    alt={video.title || title}
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                            {/* CTA Component - nur für Zitate */}
                                            {showCTA && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="mt-6 p-4 rounded-xl bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700"
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                                            <Sparkles className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                                Über 9000 Zitierstile verfügbar
                                                            </h4>
                                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                                                Probiere es jetzt kostenlos aus
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Link href="/editor" className="block">
                                                        <Button size="lg" className="w-full">
                                                            Jetzt kostenlos starten
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </motion.div>
                                            )}
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setShowVideo(true)}
                                            className={cn(
                                                "w-full relative aspect-video rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 group transition-all duration-300",
                                                "hover:border-primary/50 dark:hover:border-primary/50"
                                            )}
                                        >
                                            {video.thumbnail ? (
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title || title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : video.videoSrc ? (
                                                <video
                                                    src={video.videoSrc}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center">
                                                    <div className="w-16 h-16 rounded-full bg-white/90 dark:bg-neutral-800/90 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                                        <Play className="w-7 h-7 text-neutral-900 dark:text-neutral-100 ml-1" fill="currentColor" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className={cn(
                                                "absolute inset-0 bg-neutral-900/40 flex items-center justify-center transition-opacity duration-300",
                                                isHovered ? "opacity-100" : "opacity-0"
                                            )}>
                                                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                                    <Play className="w-7 h-7 text-neutral-900 ml-1" fill="currentColor" />
                                                </div>
                                            </div>
                                        </button>
                                    )}
                                    {video.title && (
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                                            {video.title}
                                        </p>
                                    )}
                                </div>
                            )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>

            <AnimatePresence>
                {showVideo && video && (
                    <VideoModal
                        video={video}
                        onClose={() => setShowVideo(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

export default function BentoGrid() {
    return (
        <Section className="py-24 bg-muted dark:bg-neutral-900" id="bento-features">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal className="mb-20 text-center max-w-2xl mx-auto">
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

                {/* Section 1: Core Writing Features */}
                <div className="mb-16">
                    <ScrollReveal className="mb-8">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Kernfunktionen</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Intelligente Schreibhilfen für deine akademische Arbeit</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* AI Autocomplete */}
                        <StaggerItem className="lg:col-span-2">
                        <FeatureCard
                            title="KI-Autocomplete"
                                description="Intelligente Satzvervollständigung, die deinen Kontext und Schreibstil versteht. Schlage einfach Tab, um Vorschläge zu akzeptieren."
                            badge="Schreiben"
                                video={{
                                    gifSrc: "/autocomplete_dark.gif"
                                }}
                            >
                        </FeatureCard>
                    </StaggerItem>

                    {/* Citations */}
                        <StaggerItem>
                        <FeatureCard
                            title="Sofortige Zitationen"
                                description="Generiere perfekt formatierte Zitate in über 9000 Zitierstilen – von APA, MLA, Chicago, Harvard bis hin zu spezifischen Journal-Formaten. Automatische Formatierung in Sekunden."
                            badge="Forschung"
                                showCTA={true}
                                video={{
                                    gifSrcLight: "/zitate-white.gif",
                                    gifSrcDark: "/zitate-dark.gif"
                                }}
                            >
                        </FeatureCard>
                    </StaggerItem>
                    </StaggerContainer>
                </div>

                {/* Section 2: Research & Organization */}
                <div className="mb-16">
                    <ScrollReveal className="mb-8">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Recherche & Organisation</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Finde Quellen, organisiere deine Bibliothek und arbeite mit KI-Agenten</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Chat with KI-Agenten */}
                        <StaggerItem className="lg:col-span-2">
                        <FeatureCard
                                title="Chat mit KI-Agenten"
                                description="Chatte mit spezialisierten KI-Agenten für deine Forschungsarbeiten. Der Bachelor/Master-Agent führt dich Schritt für Schritt durch Literaturrecherche, Methodik-Entwicklung und Schreibprozess."
                            badge="KI-Assistent"
                                video={{
                                    gifSrc: "/chat_dark-2.gif"
                                }}
                            >
                        </FeatureCard>
                    </StaggerItem>

                    {/* Research Library */}
                        <StaggerItem>
                        <FeatureCard
                            title="Forschungsbibliothek"
                                description="Organisiere deine PDFs, Notizen und Quellen an einem Ort. Importiere .bib-Dateien und verwalte deine Referenzen effizient."
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
                    </StaggerContainer>
                </div>

                {/* Section 3: Quality & Analysis */}
                <div className="mb-16">
                    <ScrollReveal className="mb-8">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Qualität & Analyse</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Prüfe deine Arbeit auf Plagiate, Grammatik und akademischen Stil</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Plagiarism Check */}
                        <StaggerItem>
                            <FeatureCard
                                title="Plagiatsprüfung"
                                description="Prüfe deine Arbeit auf Plagiate bevor du sie einreichst. Automatische Erkennung von ähnlichen Texten, Quellenangaben und Originalitäts-Score."
                                badge="Qualität"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <ShieldCheck className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Originalitäts-Score</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">95% Original</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <FileCheck className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Geprüfte Quellen</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">250M+ Dokumente</p>
                                        </div>
                                    </div>
                                </div>
                            </FeatureCard>
                        </StaggerItem>

                        {/* Grammar & Writing Analysis */}
                        <StaggerItem>
                            <FeatureCard
                                title="Grammatik & Schreibanalyse"
                                description="Automatische Grammatik- und Rechtschreibprüfung mit detaillierten Verbesserungsvorschlägen. Analysiere den akademischen Ton, Formulierungen und Stil."
                                badge="Qualität"
                            >
                                <div className="space-y-2">
                                    {[
                                        { label: "Grammatik-Score", score: 98 },
                                        { label: "Akademischer Ton", score: 92 },
                                        { label: "Lesbarkeit", score: 95 },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.1 }}
                                            className="space-y-1"
                                        >
                                            <div className="flex justify-between text-xs">
                                                <span className="text-neutral-600 dark:text-neutral-400">{item.label}</span>
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{item.score}%</span>
                                            </div>
                                            <div className="h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.score}%` }}
                                                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                                                    className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </FeatureCard>
                        </StaggerItem>

                        {/* Scientific Databases */}
                        <StaggerItem>
                        <FeatureCard
                                title="14+ Wissenschaftliche Datenbanken"
                                description="Durchsuche über 250M+ wissenschaftliche Papers aus CrossRef, OpenAlex, Semantic Scholar, PubMed, arXiv, CORE, BASE und mehr."
                                badge="Recherche"
                            >
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        "CrossRef", "OpenAlex", "PubMed", "arXiv",
                                        "Semantic Scholar", "CORE", "BASE", "Europe PMC"
                                    ].map((db, i) => (
                                    <motion.div
                                            key={db}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 + i * 0.05 }}
                                        whileHover={{ scale: 1.05 }}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                                        >
                                            <Database className="w-3 h-3 text-neutral-900 dark:text-neutral-100" />
                                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{db}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </FeatureCard>
                    </StaggerItem>
                </StaggerContainer>
                </div>

                {/* Section 4: Import & Export */}
                <div className="mb-16">
                    <ScrollReveal className="mb-8">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Import & Export</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Importiere bestehende Dokumente und exportiere in verschiedene Formate</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Export Options */}
                        <StaggerItem className="lg:col-span-2">
                            <FeatureCard
                                title="Export-Optionen"
                                description="Exportiere deine Arbeit in verschiedene Formate: .docx für Word, LaTeX für wissenschaftliche Publikationen, HTML für Web und PDF."
                                badge="Export"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { format: "DOCX", desc: "Microsoft Word", icon: FileType },
                                        { format: "LaTeX", desc: "Wissenschaftlich", icon: Code },
                                        { format: "HTML", desc: "Web-Format", icon: Code2 },
                                        { format: "PDF", desc: "Druckfertig", icon: FileText },
                                    ].map((item, i) => {
                                        const IconComponent = item.icon;
                                        return (
                                            <motion.button
                                                key={item.format}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1 + i * 0.05 }}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="relative flex flex-col items-center gap-2 px-3 py-3 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-200 overflow-hidden group cursor-pointer"
                                            >
                                                {/* Ripple Effect Background */}
                                                <motion.div
                                                    className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 rounded-md"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    whileTap={{ scale: 2, opacity: [0, 0.3, 0] }}
                                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                                />
                                                {/* Icon with animation */}
                                                <motion.div
                                                    whileTap={{ rotate: [0, -10, 10, -10, 0] }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <IconComponent className="w-5 h-5 text-neutral-900 dark:text-neutral-100 relative z-10" />
                                                </motion.div>
                                                <div className="text-center relative z-10">
                                                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">{item.format}</span>
                                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{item.desc}</span>
                                                </div>
                                                {/* Shine effect on hover */}
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                                                    initial={{ x: "-100%" }}
                                                    whileHover={{ x: "100%" }}
                                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                                />
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </FeatureCard>
                        </StaggerItem>

                        {/* Editor Import */}
                        <StaggerItem>
                            <FeatureCard
                                title="Editor Import"
                                description="Importiere bestehende Dokumente direkt in den Editor. Unterstützt HTML und Markdown-Formate."
                                badge="Import"
                            >
                                <div className="space-y-3">
                                    {[
                                        { format: "HTML", desc: "Aus HTML importieren", icon: Code2 },
                                        { format: "Markdown", desc: "Aus Markdown importieren", icon: FileText },
                                    ].map((item, i) => {
                                        const IconComponent = item.icon;
                                        return (
                                            <motion.div
                                                key={item.format}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + i * 0.1 }}
                                                whileHover={{ scale: 1.02, x: 4 }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-200 cursor-pointer group"
                                            >
                                                <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                                                    <IconComponent className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.format}</p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                                                </div>
                                                <ArrowUpToLine className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </FeatureCard>
                        </StaggerItem>
                    </StaggerContainer>
                </div>

                {/* Section 5: Bibliography Management */}
                <div>
                    <ScrollReveal className="mb-8">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Bibliotheksverwaltung</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Importiere und exportiere BibTeX-Dateien für Kompatibilität mit anderen Tools</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Bib Import/Export */}
                        <StaggerItem className="lg:col-span-2">
                            <FeatureCard
                                title="BibTeX Import & Export"
                                description="Importiere bestehende .bib-Dateien in deine Bibliothek oder exportiere deine Quellen als BibTeX-Datei. Perfekt für die Kompatibilität mit LaTeX, Overleaf, Zotero, Mendeley und anderen Referenz-Management-Tools."
                                badge="Bibliothek"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        className="flex flex-col items-center gap-3 px-4 py-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                                            <Upload className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Import</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Importiere .bib-Dateien</p>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        className="flex flex-col items-center gap-3 px-4 py-4 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                                            <Download className="w-6 h-6 text-neutral-900 dark:text-neutral-100" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Export</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Exportiere als .bib-Datei</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </FeatureCard>
                        </StaggerItem>
                    </StaggerContainer>
                </div>
            </div>
        </Section>
    );
}
