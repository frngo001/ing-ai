"use client";

import * as React from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MorphyButton } from "@/components/ui/morphy-button";
import Glow from "@/components/ui/glow";
import { Marquee } from "@/components/ui/marquee";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCTAHref } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n/use-language";
import { translations } from "@/lib/i18n/translations";

// Static images for testimonials
const testimonialImages = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
];

function TestimonialCard({
    name,
    handle,
    content,
    avatar,
    image,
}: {
    name: string;
    handle: string;
    content: string;
    avatar: string;
    image: string | null;
}) {
    return (
        <figure
            className={cn(
                "relative w-56 sm:w-72 md:w-80 cursor-pointer overflow-hidden rounded-xl border p-2.5 sm:p-4 md:p-5 mx-2 sm:mx-3",
                // Light mode styles
                "border-neutral-200 bg-white/80 backdrop-blur-sm hover:bg-neutral-50",
                // Dark mode styles
                "dark:border-neutral-800 dark:bg-neutral-950/80 dark:hover:bg-neutral-900/80 dark:hover:border-primary/20 dark:hover:shadow-[0_0_20px_-12px_rgba(62,207,142,0.3)]",
                // Transition
                "transition-all duration-300 hover:shadow-lg"
            )}
        >
            {/* Content */}
            <blockquote className="text-[11px] sm:text-sm text-foreground/90 leading-relaxed mb-2.5 sm:mb-4">
                {content}
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-neutral-100 dark:border-neutral-800/50">
                <Avatar className="h-7 w-7 sm:h-10 sm:w-10 border-2 border-white dark:border-neutral-900 shadow-sm">
                    {image && (
                        <AvatarImage
                            src={image}
                            alt={name}
                            loading="lazy"
                        />
                    )}
                    <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-[9px] sm:text-xs font-semibold">
                        {avatar}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <figcaption className="text-[11px] sm:text-sm font-semibold text-foreground">
                        {name}
                    </figcaption>
                    <p className="text-[9px] sm:text-xs text-muted-foreground">{handle}</p>
                </div>
            </div>
        </figure>
    );
}

export function Testimonials() {
    const ctaHref = useCTAHref()
    const { t, language } = useLanguage()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const testimonials = React.useMemo(() => {
        const lang = language as keyof typeof translations;
        const items = translations[lang].landing.testimonials.items as unknown as { name: string; handle: string; content: string }[];
        return items.map((item, index) => ({
            ...item,
            avatar: item.name.split(' ').map(n => n[0]).join(''),
            image: testimonialImages[index] || null,
        }));
    }, [language]);

    const firstRow = React.useMemo(() => testimonials.slice(0, Math.ceil(testimonials.length / 2)), [testimonials]);
    const secondRow = React.useMemo(() => testimonials.slice(Math.ceil(testimonials.length / 2)), [testimonials]);

    if (!mounted) return null

    return (
        <section
            id="testimonials"
            className="py-8 md:py-24 bg-muted dark:bg-neutral-900 relative overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <Glow variant="top" className="opacity-20" />
                <div className="absolute bottom-0 left-0 w-[200px] sm:w-[300px] md:w-[400px] h-[200px] sm:h-[300px] md:h-[400px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 right-0 w-[150px] sm:w-[200px] md:w-[300px] h-[150px] sm:h-[200px] md:h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="container px-4 mx-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <ScrollReveal className="text-center mb-6 md:mb-16 space-y-2 md:space-y-4">
                        <Badge variant="outline" className="mb-2 md:mb-4 text-[8px] md:text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                            {t('landing.testimonials.badge')}
                        </Badge>
                        <h2 className="text-xl md:text-5xl font-bold tracking-tight mb-2 md:mb-4">
                            {t('landing.testimonials.title')}
                        </h2>
                        <p className="text-muted-foreground text-xs md:text-lg max-w-2xl mx-auto px-2">
                            {t('landing.testimonials.description')}
                        </p>
                    </ScrollReveal>

                    {/* Marquee Rows */}
                    <div className="relative flex flex-col gap-4 sm:gap-5 md:gap-6">
                        {/* Gradient overlays */}
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 z-10 bg-gradient-to-r from-background to-transparent" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-32 z-10 bg-gradient-to-l from-background to-transparent" />

                        {/* First row - scrolls left */}
                        <Marquee pauseOnHover duration="50s">
                            {firstRow.map((testimonial, index) => (
                                <TestimonialCard key={index} {...testimonial} />
                            ))}
                        </Marquee>

                        {/* Second row - scrolls right */}
                        <Marquee pauseOnHover reverse duration="50s">
                            {secondRow.map((testimonial, index) => (
                                <TestimonialCard key={index} {...testimonial} />
                            ))}
                        </Marquee>
                    </div>

                    <div className="flex justify-center mt-8 sm:mt-10 md:mt-12 relative z-20">
                        <Link href={ctaHref}>
                            <MorphyButton size="lg" className="text-sm sm:text-base">
                                {t('landing.testimonials.cta')}
                            </MorphyButton>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
