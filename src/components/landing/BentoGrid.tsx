"use client";

import * as React from "react"
import Image from "next/image"
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
import { Play, ShieldCheck, FileCheck, Database, FileText, Code, Code2, FileType, ArrowUpToLine, Download, Upload, FileCode } from "lucide-react";
import { useCTAHref } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n/use-language";
import dynamic from "next/dynamic";
import { FeatureVideo } from "@/components/landing/VideoModal";

const VideoModal = dynamic(() => import("@/components/landing/VideoModal"));

interface FeatureCardProps {
    title: string;
    description: string;
    badge?: string;
    className?: string;
    video?: FeatureVideo;
    showCTA?: boolean;
    children?: React.ReactNode;
}

function FeatureCard({ title, description, badge, className, video, showCTA, children }: FeatureCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const ctaHref = useCTAHref();
    const { t } = useLanguage();

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

    const getVideoLoopSrc = () => {
        if (!video) return null;
        if (video.videoLoopSrcLight && video.videoLoopSrcDark) {
            if (!mounted) return video.videoLoopSrcLight;
            const currentTheme = theme === "system" ? systemTheme : theme;
            return currentTheme === "dark" ? video.videoLoopSrcDark : video.videoLoopSrcLight;
        }
        return video.videoLoopSrc || null;
    };

    const videoLoopSrc = getVideoLoopSrc();
    const gifSrc = getGifSrc();

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
                    <CardContent className="p-3.5 sm:p-6 h-full flex flex-col">
                        {badge && (
                            <Badge variant="outline" className="w-fit mb-3 md:mb-4 text-[8px] md:text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                                {badge}
                            </Badge>
                        )}
                        <h3 className="text-sm md:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5 md:mb-2">
                            {title}
                        </h3>
                        <p className="text-[11px] md:text-sm text-neutral-500 dark:text-neutral-400 mb-4 md:mb-6 leading-relaxed">
                            {description}
                        </p>
                        <div className="flex-1 relative">
                            {children}
                            {video && (video.youtubeId || video.videoSrc || gifSrc || videoLoopSrc) && (
                                <div className="mt-4">
                                    {videoLoopSrc ? (
                                        <div className="w-full rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                            <video
                                                src={videoLoopSrc}
                                                className="w-full h-auto"
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                            />
                                        </div>
                                    ) : gifSrc ? (
                                        <>
                                            {/* GIF wird direkt angezeigt und spielt sich automatisch ab */}
                                            <div className="w-full rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={gifSrc}
                                                    alt={video.title || title}
                                                    className="w-full h-auto"
                                                    loading="lazy"
                                                />
                                            </div>
                                            {/* CTA Component - nur für Zitate */}
                                            {showCTA && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="mt-4 md:mt-6 p-4 md:p-6 rounded-2xl bg-neutral-900 dark:bg-neutral-950 border-2 border-neutral-800 dark:border-neutral-800 relative overflow-hidden"
                                                >
                                                    {/* Subtle background pattern */}
                                                    <div className="absolute inset-0 opacity-5">
                                                        <div className="absolute inset-0" style={{
                                                            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                                            backgroundSize: '24px 24px'
                                                        }} />
                                                    </div>

                                                    <div className="relative z-10 space-y-4">
                                                        <div className="space-y-1">
                                                            <h4 className="text-sm md:text-lg font-bold text-white dark:text-neutral-100 leading-tight">
                                                                {t('landing.bentoGrid.cta.title')}
                                                            </h4>
                                                            <p className="text-[10px] md:text-sm text-neutral-300 dark:text-neutral-400">
                                                                {t('landing.bentoGrid.cta.description')}
                                                            </p>
                                                        </div>
                                                        <Link href={ctaHref} className="block">
                                                            <Button
                                                                size="lg"
                                                                className="w-full bg-white text-neutral-900 hover:bg-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-semibold text-xs md:text-base py-4 md:py-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                                            >
                                                                {t('landing.bentoGrid.cta.button')}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setShowVideo(true)}
                                            aria-label={`Play video: ${video.title || title}`}
                                            className={cn(
                                                "w-full relative aspect-video rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 group transition-all duration-300",
                                                "hover:border-primary/50 dark:hover:border-primary/50"
                                            )}
                                        >
                                            {video.thumbnail ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={video.thumbnail}
                                                        alt={video.title || title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                </>
                                            ) : video.videoSrc ? (
                                                <video
                                                    src={video.videoSrc}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    playsInline
                                                    preload="none"
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
    const { t, language } = useLanguage()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const grammarAnalysisItems = React.useMemo(() => [
        { label: t('landing.bentoGrid.features.grammarAnalysis.grammarScore'), score: 98 },
        { label: t('landing.bentoGrid.features.grammarAnalysis.academicTone'), score: 92 },
        { label: t('landing.bentoGrid.features.grammarAnalysis.readability'), score: 95 },
    ], [t, language]);

    const exportOptionItems = React.useMemo(() => [
        { format: "DOCX", desc: t('landing.bentoGrid.features.exportOptions.formats.docx'), icon: FileType },
        { format: "LaTeX", desc: t('landing.bentoGrid.features.exportOptions.formats.latex'), icon: Code },
        { format: "HTML", desc: t('landing.bentoGrid.features.exportOptions.formats.html'), icon: Code2 },
        { format: "PDF", desc: t('landing.bentoGrid.features.exportOptions.formats.pdf'), icon: FileText },
    ], [t, language]);

    const importItems = React.useMemo(() => [
        { format: "HTML", desc: t('landing.bentoGrid.features.editorImport.formats.html'), icon: Code2 },
        { format: "Markdown", desc: t('landing.bentoGrid.features.editorImport.formats.markdown'), icon: FileText },
    ], [t, language]);

    if (!mounted) return null

    return (
        <Section className="py-8 md:py-16 bg-background" id="bento-features">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal className="mb-8 md:mb-16 text-center max-w-2xl mx-auto space-y-3">
                    <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        {t('landing.bentoGrid.badge')}
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 px-4 overflow-hidden">
                        {t('landing.bentoGrid.title')}
                    </h2>
                    <p className="text-xs md:text-base text-neutral-500 dark:text-neutral-400 px-4">
                        {t('landing.bentoGrid.description')}
                    </p>
                </ScrollReveal>

                {/* Section 1: Core Writing Features */}
                <div className="mb-12 md:mb-16">
                    <ScrollReveal className="mb-6 md:mb-8">
                        <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">{t('landing.bentoGrid.coreFeatures.title')}</h3>
                        <p className="text-[11px] md:text-sm text-neutral-500 dark:text-neutral-400">{t('landing.bentoGrid.coreFeatures.description')}</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* AI Autocomplete */}
                        <StaggerItem className="lg:col-span-2">
                            <FeatureCard
                                title={t('landing.bentoGrid.features.aiAutocomplete.title')}
                                description={t('landing.bentoGrid.features.aiAutocomplete.description')}
                                badge={t('landing.bentoGrid.featureBadges.writing')}
                                video={{
                                    gifSrc: "/autocomplete_dark.gif"
                                }}
                            >
                            </FeatureCard>
                        </StaggerItem>

                        {/* Citations */}
                        <StaggerItem>
                            <FeatureCard
                                title={t('landing.bentoGrid.features.instantCitations.title')}
                                description={t('landing.bentoGrid.features.instantCitations.description')}
                                badge={t('landing.bentoGrid.featureBadges.research')}
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
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('landing.bentoGrid.researchOrganization.title')}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('landing.bentoGrid.researchOrganization.description')}</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Chat with KI-Agenten */}
                        <StaggerItem className="lg:col-span-2">
                            <FeatureCard
                                title={t('landing.bentoGrid.features.chatWithAgent.title')}
                                description={t('landing.bentoGrid.features.chatWithAgent.description')}
                                badge={t('landing.bentoGrid.featureBadges.aiAssistant')}
                                video={{
                                    gifSrc: "/chat_dark-2.gif"
                                }}
                            >
                            </FeatureCard>
                        </StaggerItem>

                        {/* Research Library */}
                        <StaggerItem>
                            <FeatureCard
                                title={t('landing.bentoGrid.features.researchLibrary.title')}
                                description={t('landing.bentoGrid.features.researchLibrary.description')}
                                badge={t('landing.bentoGrid.featureBadges.organization')}
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
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('landing.bentoGrid.qualityAnalysis.title')}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('landing.bentoGrid.qualityAnalysis.description')}</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Plagiarism Check */}
                        <StaggerItem>
                            <FeatureCard
                                title={t('landing.bentoGrid.features.plagiarismCheck.title')}
                                description={t('landing.bentoGrid.features.plagiarismCheck.description')}
                                badge={t('landing.bentoGrid.featureBadges.quality')}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <ShieldCheck className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        <div className="flex-1">
                                            <p className="text-xs md:text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('landing.bentoGrid.features.plagiarismCheck.originalityScore')}</p>
                                            <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400">95% {t('landing.bentoGrid.features.plagiarismCheck.original')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                        <FileCheck className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                                        <div className="flex-1">
                                            <p className="text-xs md:text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('landing.bentoGrid.features.plagiarismCheck.checkedSources')}</p>
                                            <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400">250M+ {t('landing.bentoGrid.features.plagiarismCheck.documents')}</p>
                                        </div>
                                    </div>
                                </div>
                            </FeatureCard>
                        </StaggerItem>

                        {/* Grammar & Writing Analysis */}
                        <StaggerItem>
                            <FeatureCard
                                title={t('landing.bentoGrid.features.grammarAnalysis.title')}
                                description={t('landing.bentoGrid.features.grammarAnalysis.description')}
                                badge={t('landing.bentoGrid.featureBadges.quality')}
                            >
                                <div className="space-y-2">
                                    {grammarAnalysisItems.map((item, i) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.1 }}
                                            className="space-y-1"
                                        >
                                            <div className="flex justify-between text-[10px] md:text-xs">
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
                                title={t('landing.bentoGrid.features.scientificDatabases.title')}
                                description={t('landing.bentoGrid.features.scientificDatabases.description')}
                                badge={t('landing.bentoGrid.featureBadges.search')}
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
                                            <Database className="w-2.5 h-2.5 md:w-3 md:h-3 text-neutral-900 dark:text-neutral-100" />
                                            <span className="text-[10px] md:text-xs font-medium text-neutral-700 dark:text-neutral-300">{db}</span>
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
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('landing.bentoGrid.importExport.title')}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('landing.bentoGrid.importExport.description')}</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Export Options */}
                        <StaggerItem className="lg:col-span-2">
                            <FeatureCard
                                title={t('landing.bentoGrid.features.exportOptions.title')}
                                description={t('landing.bentoGrid.features.exportOptions.description')}
                                badge={t('landing.bentoGrid.featureBadges.export')}
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    {exportOptionItems.map((item, i) => {
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
                                                    <span className="text-[10px] md:text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">{item.format}</span>
                                                    <span className="text-[9px] md:text-[10px] text-neutral-500 dark:text-neutral-400">{item.desc}</span>
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
                                title={t('landing.bentoGrid.features.editorImport.title')}
                                description={t('landing.bentoGrid.features.editorImport.description')}
                                badge={t('landing.bentoGrid.featureBadges.import')}
                            >
                                <div className="space-y-3">
                                    {importItems.map((item, i) => {
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
                                                    <p className="text-xs md:text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.format}</p>
                                                    <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
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
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('landing.bentoGrid.bibliographyManagement.title')}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('landing.bentoGrid.bibliographyManagement.description')}</p>
                    </ScrollReveal>
                    <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Bib Import/Export */}
                        <StaggerItem className="lg:col-span-2">
                            <FeatureCard
                                title={t('landing.bentoGrid.features.bibtexImportExport.title')}
                                description={t('landing.bentoGrid.features.bibtexImportExport.description')}
                                badge={t('landing.bentoGrid.featureBadges.library')}
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
                                            <p className="text-xs md:text-sm font-medium text-neutral-900 dark:text-neutral-100">Import</p>
                                            <p className="text-[9px] md:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 md:mt-1">{t('landing.bentoGrid.features.bibtexImportExport.import')}</p>
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
                                            <p className="text-xs md:text-sm font-medium text-neutral-900 dark:text-neutral-100">Export</p>
                                            <p className="text-[9px] md:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 md:mt-1">{t('landing.bentoGrid.features.bibtexImportExport.export')}</p>
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
