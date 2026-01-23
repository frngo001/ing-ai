"use client";

import * as React from "react";
import Link from "next/link";
import {
    BentoGridTemplateTwo,
    BentoItem,
} from "@/components/ui/bento-grid-template-two";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import { translations } from "@/lib/i18n/translations";

// Statische Metadaten für die Blog-Items (Bilder, Links, Varianten, Größen)
const blogMetadata: Record<string, Omit<BentoItem, 'id' | 'title' | 'description' | 'tag'>> = {
    "1": {
        image: "/assets/blog/guide-bachelorarbeit.png",
        size: "large",
        priority: 1,
        variant: "glass",
        link: "/blog/ultimativer-guide-bachelorarbeit",
    },
    "2": {
        image: "/assets/blog/ai-im-studium-original.png",
        variant: "highlight",
        link: "/blog/ki-im-studium",
    },
    "3": {
        image: "/assets/blog/zitieren-leicht-gemacht.png",
        variant: "solid",
        link: "/blog/zitieren-leicht-gemacht",
    },
    "4": {
        image: "/assets/blog/schreibblockaden-ueberwinden.png",
        variant: "default",
        size: "wide",
        link: "/blog/schreibblockaden-ueberwinden",
    },
    "5": {
        image: "/assets/blog/plagiatspruefung.png",
        variant: "solid",
        link: "/blog/plagiatspruefung",
    },
    "6": {
        image: "/assets/blog/forschungsmethoden.png",
        variant: "glass",
        link: "/blog/forschungsmethoden",
    },
    "7": {
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=2546",
        variant: "solid",
        link: "/blog/literaturverwaltung",
    },
    "8": {
        image: "/assets/blog/community-stories-original.png",
        variant: "default",
        link: "/blog/community-stories",
    },
};

export function BlogSection() {
    const { t, language } = useLanguage()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const items = React.useMemo(() => {
        const blogItems = translations[language as keyof typeof translations].landing.blog.items;
        return blogItems.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            tag: 'tag' in item ? item.tag : undefined,
            ...blogMetadata[item.id],
        })) as BentoItem[];
    }, [language])

    if (!mounted) return null

    return (
        <section id="blog" className="py-8 md:py-16 bg-gradient-to-b from-muted/80 via-muted/40 to-background dark:from-background dark:via-background dark:to-background relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="mb-8 text-center space-y-3">
                    <h2 className="text-lg md:text-4xl font-bold tracking-tight px-4">
                        {t('landing.blog.title')}
                    </h2>
                    <p className="text-muted-foreground text-xs md:text-lg max-w-2xl mx-auto px-4">
                        {t('landing.blog.description')}
                    </p>
                </div>
                <BentoGridTemplateTwo items={items} gap={3} animate={true} />

                {/* View All Blog Posts Button */}
                <div className="mt-10 md:mt-12 text-center">
                    <Link href="/blog">
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-full group scale-90 md:scale-100 origin-center"
                            asChild
                        >
                            <span>
                                {t('landing.blog.viewAll')}
                                <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
