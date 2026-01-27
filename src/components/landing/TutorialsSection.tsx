"use client";

import * as React from "react"
import { useRef, useState, useEffect } from "react";
import { m } from "framer-motion";
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
import dynamic from "next/dynamic";
const LiteYouTubeEmbed = dynamic(() => import("react-lite-youtube-embed"));
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
        <m.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex flex-col w-[280px] sm:w-[320px] md:w-[360px] flex-shrink-0 group cursor-default"
        >
            {/* Video Embed */}
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-neutral-100 dark:bg-neutral-800 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
                <LiteYouTubeEmbed
                    id={tutorial.youtubeId}
                    title={tutorial.title}
                    thumbnail={tutorial.thumbnail}
                    wrapperClass={cn(
                        "rounded-2xl overflow-hidden",
                        "relative block cursor-pointer bg-neutral-200 dark:bg-neutral-900 bg-center bg-cover [contain:content]",
                        "after:block after:pb-[56.25%] after:content-['']",
                        "[&_>_iframe]:absolute [&_>_iframe]:top-0 [&_>_iframe]:left-0 [&_>_iframe]:size-full",
                        "[&_>_.lty-playbtn]:absolute [&_>_.lty-playbtn]:top-1/2 [&_>_.lty-playbtn]:left-1/2 [&_>_.lty-playbtn]:[transform:translate3d(-50%,-50%,0)]",
                        "[&.lyt-activated]:before:hidden"
                    )}
                />
                {/* Duration Badge */}
                {tutorial.duration !== "N/A" && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-md text-xs font-medium text-white pointer-events-none">
                        {tutorial.duration}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col pr-2">
                <h3 className="text-[15px] md:text-base font-semibold tracking-tight text-foreground mb-0.5 md:mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {tutorial.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                    {displayDescription}
                </p>
            </div>
        </m.div>
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = Math.min(scrollContainerRef.current.clientWidth - 80, 450);
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
            setTimeout(checkScrollButtons, 500);
        }
    };

    if (!mounted) return null

    return (
        <Section id="tutorials" className="relative py-10 md:py-24 bg-gradient-to-b from-background via-muted/50 to-muted/80 dark:from-background dark:via-background dark:to-background overflow-hidden">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-10 mb-8 md:mb-12">
                    <m.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-2xl"
                    >
                        <Badge variant="secondary" className="mb-3 md:mb-4 text-[10px] md:text-[10px] uppercase tracking-wider font-semibold">
                            {t('landing.tutorials.badge')}
                        </Badge>
                        <h2 className="text-xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 text-foreground">
                            {t('landing.tutorials.title')}
                        </h2>
                        <p className="text-muted-foreground text-xs md:text-lg leading-relaxed">
                            {t('landing.tutorials.description')}
                        </p>
                    </m.div>

                    {/* Navigation Buttons */}
                    <div className="hidden md:flex gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-12 w-12 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-colors"
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            aria-label="Previous"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-12 w-12 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-colors"
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            aria-label="Next"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                {/* Carousel Container */}
                <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    {/* Minimalist Masking */}
                    <div className="pointer-events-none absolute left-0 top-0 bottom-10 w-20 z-10 bg-gradient-to-r from-background to-transparent hidden sm:block" />
                    <div className="pointer-events-none absolute right-0 top-0 bottom-10 w-20 z-10 bg-gradient-to-l from-background to-transparent hidden sm:block" />

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-20">
                            <m.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Loader2 className="w-8 h-8 text-muted-foreground" />
                            </m.div>
                        </div>
                    )}

                    {/* Scrollable Container */}
                    {!isLoading && tutorials.length > 0 && (
                        <div
                            ref={scrollContainerRef}
                            onScroll={checkScrollButtons}
                            className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 pt-2 snap-x"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                            {tutorials.map((tutorial, index) => (
                                <div key={tutorial.id} className="snap-start first:pl-4 last:pr-4 sm:first:pl-0 sm:last:pr-0">
                                    <TutorialCard
                                        tutorial={tutorial}
                                        index={index}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && tutorials.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            {t('landing.tutorials.noTutorials')}
                        </div>
                    )}
                </div>

                {/* CTA & Footer Context */}
                <m.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 md:mt-8 flex flex-col items-center"
                >
                    <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
                        <Link href={ctaHref}>
                            <Button size="lg" className="rounded-full px-6 md:px-8 text-sm md:text-base font-semibold shadow-none scale-90 md:scale-100">
                                {t('landing.tutorials.tryNow')}
                            </Button>
                        </Link>

                        <a
                            href="https://youtube.com/@ingai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('landing.tutorials.watchAll')}
                            <ChevronRight className="ml-0.5 md:ml-1 h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                    </div>

                    {/* Mobile Navigation (Swipe Indicator fallback) */}
                    <div className="mt-8 flex md:hidden items-center gap-2">
                        {tutorials.slice(0, 3).map((_, i) => (
                            <div key={i} className="h-1.5 w-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                        ))}
                    </div>
                </m.div>
            </div>
        </Section>
    );
}
