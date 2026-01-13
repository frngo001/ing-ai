"use client";

import * as React from "react"
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import { MorphyButton } from "@/components/ui/morphy-button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCTAHref } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n/use-language";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";

interface Tutorial {
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    youtubeId: string;
}

/**
 * YouTube-Video-Links für die Tutorials
 * 
 * Unterstützte Formate:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * 
 * Die Metadaten (Titel, Beschreibung, Thumbnail, Dauer) werden automatisch
 * aus YouTube extrahiert.
 */
const YOUTUBE_VIDEO_URLS = [
    "https://youtu.be/04Qoal8et84?si=FHIVI5fKAVgez_Qn", // Beispiel - ersetze durch echte YouTube-Links
    "https://youtu.be/JryftzFzeuk?si=rhsa5A1p3meHu_PH",
    "https://youtu.be/LdYJgpzOvtI?si=CPv8NKeRRZBy-8cH",
    "https://youtu.be/E4WjguR2y94?si=4BvmW1BC-etcBeiw",
    "https://youtu.be/EGgdGLYdoLg?si=QttZCs-RvGoFuKk9",
    "https://youtu.be/o3lbD_01JnI?si=5BnmiZuO3kjp5PRU",
];

function TutorialCard({
    tutorial,
    index
}: {
    tutorial: Tutorial;
    index: number;
}) {
    const { t, language } = useLanguage()

    const authorPrefix = React.useMemo(() => t('landing.tutorials.author'), [t, language])
    const displayDescription = React.useMemo(() => {
        // Wenn die Beschreibung nur ein Autor-Name ist (kein "Von" Präfix), füge das übersetzte Präfix hinzu
        if (tutorial.description && tutorial.description !== 'YouTube Video' && !tutorial.description.startsWith('Von ') && !tutorial.description.startsWith('By ') && !tutorial.description.startsWith('Por ') && !tutorial.description.startsWith('Par ')) {
            return `${authorPrefix} ${tutorial.description}`
        }
        return tutorial.description
    }, [tutorial.description, authorPrefix, language])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-[320px] md:w-[380px]"
        >
            <div className="block text-left w-full">
                {/* Video Embed */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-neutral-200 dark:border-neutral-800">
                    <LiteYouTubeEmbed
                        id={tutorial.youtubeId}
                        title={tutorial.title}
                        wrapperClass={cn(
                            "rounded-xl overflow-hidden",
                            "relative block cursor-pointer bg-black bg-center bg-cover [contain:content]",
                            "after:block after:pb-[56.25%] after:content-['']",
                            "[&_>_iframe]:absolute [&_>_iframe]:top-0 [&_>_iframe]:left-0 [&_>_iframe]:size-full",
                            "[&_>_.lty-playbtn]:z-1 [&_>_.lty-playbtn]:h-[46px] [&_>_.lty-playbtn]:w-[70px] [&_>_.lty-playbtn]:rounded-[14%] [&_>_.lty-playbtn]:bg-[#212121] [&_>_.lty-playbtn]:opacity-80 [&_>_.lty-playbtn]:[transition:all_0.2s_cubic-bezier(0,_0,_0.2,_1)]",
                            "[&:hover_>_.lty-playbtn]:bg-[#ff0000] [&:hover_>_.lty-playbtn]:opacity-100",
                            "[&_>_.lty-playbtn]:before:border-[transparent_transparent_transparent_#fff] [&_>_.lty-playbtn]:before:border-y-[11px] [&_>_.lty-playbtn]:before:border-r-0 [&_>_.lty-playbtn]:before:border-l-[19px] [&_>_.lty-playbtn]:before:content-['']",
                            "[&_>_.lty-playbtn]:absolute [&_>_.lty-playbtn]:top-1/2 [&_>_.lty-playbtn]:left-1/2 [&_>_.lty-playbtn]:[transform:translate3d(-50%,-50%,0)]",
                            "[&.lyt-activated]:before:hidden"
                        )}
                    />
                    {/* Duration Badge */}
                    {tutorial.duration !== "N/A" && (
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-neutral-900/80 rounded text-xs font-medium text-white pointer-events-none">
                            {tutorial.duration}
                        </div>
                    )}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    {tutorial.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {displayDescription}
                </p>
            </div>
        </motion.div>
    );
}

export function TutorialsSection() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const ctaHref = useCTAHref();
    const { t, language } = useLanguage();

    // Lade YouTube-Metadaten beim Mount
    useEffect(() => {
        async function loadTutorials() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/youtube/metadata', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ videoUrls: YOUTUBE_VIDEO_URLS }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch YouTube metadata');
                }

                const data = await response.json();
                const loadedTutorials: Tutorial[] = data.videos.map((video: any, index: number) => ({
                    id: String(index + 1),
                    title: video.title,
                    description: video.description,
                    duration: video.duration,
                    thumbnail: video.thumbnail,
                    youtubeId: video.youtubeId,
                }));

                setTutorials(loadedTutorials);
            } catch (error) {
                console.error('Error loading tutorials:', error);
                // Fallback: Leere Liste oder Fehlerzustand
                setTutorials([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadTutorials();
    }, []);

    // Initialisiere Scroll-Buttons wenn Tutorials geladen werden
    useEffect(() => {
        if (tutorials.length > 0) {
            // Warte kurz, damit das DOM gerendert ist
            setTimeout(() => {
                checkScrollButtons();
            }, 100);
        }
    }, [tutorials]);

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
            setTimeout(checkScrollButtons, 300);
        }
    };

    return (
        <>
            <Section id="tutorials" className="py-24 bg-muted dark:bg-neutral-900 relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <ScrollReveal className="mb-12">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                            <div className="max-w-2xl">
                                <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                                    {t('landing.tutorials.badge')}
                                </Badge>
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-neutral-900 dark:text-neutral-100 mb-4">
                                    {t('landing.tutorials.title')}
                                </h2>
                                <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                                    {t('landing.tutorials.description')}
                                </p>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full h-10 w-10 border-neutral-200 dark:border-neutral-800 disabled:opacity-30"
                                    onClick={() => scroll("left")}
                                    disabled={!canScrollLeft}
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full h-10 w-10 border-neutral-200 dark:border-neutral-800 disabled:opacity-30"
                                    onClick={() => scroll("right")}
                                    disabled={!canScrollRight}
                                    aria-label="Next"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Carousel */}
                    <div className="relative">
                        {/* Gradient Overlays */}
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-muted dark:from-neutral-900 to-transparent" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-muted dark:from-neutral-900 to-transparent" />

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                            </div>
                        )}

                        {/* Scrollable Container */}
                        {!isLoading && tutorials.length > 0 && (
                            <div
                                ref={scrollContainerRef}
                                onScroll={checkScrollButtons}
                                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                                {tutorials.map((tutorial, index) => (
                                    <TutorialCard
                                        key={tutorial.id}
                                        tutorial={tutorial}
                                        index={index}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && tutorials.length === 0 && (
                            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                                {t('landing.tutorials.noTutorials')}
                            </div>
                        )}
                    </div>

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="mt-16 flex flex-col items-center gap-6"
                    >
                        <Link href={ctaHref}>
                            <MorphyButton size="lg">
                                {t('landing.tutorials.tryNow')}
                            </MorphyButton>
                        </Link>
                        <a
                            href="https://youtube.com/@ingai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                        >
                            {t('landing.tutorials.watchAll')}
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </a>
                    </motion.div>
                </div>
            </Section>
        </>
    );
}
