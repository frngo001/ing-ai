"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";
import { MorphyButton } from "@/components/ui/morphy-button";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCTAHref } from "@/hooks/use-auth";

interface Tutorial {
    id: string;
    title: string;
    description: string;
    duration: string;
    thumbnail: string;
    youtubeId: string;
}

const tutorials: Tutorial[] = [
    {
        id: "1",
        title: "Erste Schritte mit Ing AI",
        description: "Lerne die Grundlagen und starte mit deinem ersten Dokument.",
        duration: "5:32",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
        youtubeId: "dQw4w9WgXcQ",
    },
    {
        id: "2",
        title: "Zitationen automatisch einfügen",
        description: "So nutzt du die automatische Zitationsfunktion richtig.",
        duration: "8:15",
        thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800",
        youtubeId: "dQw4w9WgXcQ",
    },
    {
        id: "3",
        title: "PDF-Chat für Recherche nutzen",
        description: "Stelle Fragen an deine Forschungsarbeiten und spare Zeit.",
        duration: "6:48",
        thumbnail: "https://images.unsplash.com/photo-1553484771-047a44eee27b?auto=format&fit=crop&q=80&w=800",
        youtubeId: "dQw4w9WgXcQ",
    },
    {
        id: "4",
        title: "Gliederung mit KI erstellen",
        description: "Lass die KI eine strukturierte Gliederung für deine Arbeit erstellen.",
        duration: "7:22",
        thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800",
        youtubeId: "dQw4w9WgXcQ",
    },
    {
        id: "5",
        title: "Export nach Word & LaTeX",
        description: "Exportiere deine Arbeit perfekt formatiert in verschiedene Formate.",
        duration: "4:55",
        thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800",
        youtubeId: "dQw4w9WgXcQ",
    },
    {
        id: "6",
        title: "Plagiatsprüfung durchführen",
        description: "Prüfe deine Arbeit auf Plagiate bevor du sie einreichst.",
        duration: "5:10",
        thumbnail: "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&q=80&w=800",
        youtubeId: "dQw4w9WgXcQ",
    },
];

function VideoModal({
    tutorial,
    onClose
}: {
    tutorial: Tutorial;
    onClose: () => void;
}) {
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
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Video Container */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                    <iframe
                        src={`https://www.youtube.com/embed/${tutorial.youtubeId}?autoplay=1&rel=0`}
                        title={tutorial.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                </div>

                {/* Video Title */}
                <div className="mt-4">
                    <h3 className="text-xl font-semibold text-white">{tutorial.title}</h3>
                    <p className="text-neutral-400 mt-1">{tutorial.description}</p>
                </div>
            </motion.div>
        </motion.div>
    );
}

function TutorialCard({
    tutorial,
    index,
    onPlay
}: {
    tutorial: Tutorial;
    index: number;
    onPlay: () => void;
}) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-[320px] md:w-[380px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={onPlay}
                className="block group text-left w-full"
            >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-neutral-200 dark:border-neutral-800">
                    <img
                        src={tutorial.thumbnail}
                        alt={tutorial.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Overlay */}
                    <div className={cn(
                        "absolute inset-0 bg-neutral-900/40 flex items-center justify-center transition-opacity duration-300",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}>
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                            <Play className="w-7 h-7 text-neutral-900 ml-1" fill="currentColor" />
                        </div>
                    </div>
                    {/* Duration Badge */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-neutral-900/80 rounded text-xs font-medium text-white">
                        {tutorial.duration}
                    </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                    {tutorial.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {tutorial.description}
                </p>
            </button>
        </motion.div>
    );
}

export function TutorialsSection() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
    const ctaHref = useCTAHref();

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
                                    Tutorials
                                </Badge>
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-neutral-900 dark:text-neutral-100 mb-4">
                                    Lerne Ing AI in Minuten
                                </h2>
                                <p className="text-neutral-500 dark:text-neutral-400 text-lg">
                                    Schau dir unsere Video-Tutorials an und werde zum Profi.
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
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full h-10 w-10 border-neutral-200 dark:border-neutral-800 disabled:opacity-30"
                                    onClick={() => scroll("right")}
                                    disabled={!canScrollRight}
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

                        {/* Scrollable Container */}
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
                                    onPlay={() => setSelectedTutorial(tutorial)}
                                />
                            ))}
                        </div>
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
                                Jetzt kostenlos ausprobieren
                            </MorphyButton>
                        </Link>
                        <a
                            href="https://youtube.com/@ingai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                        >
                            Alle Tutorials auf YouTube ansehen
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </a>
                    </motion.div>
                </div>
            </Section>

            {/* Video Modal */}
            <AnimatePresence>
                {selectedTutorial && (
                    <VideoModal
                        tutorial={selectedTutorial}
                        onClose={() => setSelectedTutorial(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
