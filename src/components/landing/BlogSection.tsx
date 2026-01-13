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
        image: "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg",
        size: "large",
        priority: 1,
        variant: "glass",
        link: "/blog/ultimativer-guide-bachelorarbeit",
    },
    "2": {
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2532&ixlib=rb-4.0.3",
        variant: "highlight",
        link: "/blog/ki-im-studium",
    },
    "3": {
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=2546&ixlib=rb-4.0.3",
        variant: "solid",
        link: "/blog/zitieren-leicht-gemacht",
    },
    "4": {
        image: "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg",
        variant: "default",
        size: "wide",
        link: "/blog/schreibblockaden-ueberwinden",
    },
    "5": {
        image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3",
        variant: "solid",
        link: "/blog/plagiatspruefung",
    },
    "6": {
        image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
        variant: "glass",
        link: "/blog/forschungsmethoden",
    },
    "7": {
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=2428&ixlib=rb-4.0.3",
        variant: "solid",
        link: "/blog/literaturverwaltung",
    },
    "8": {
        image: "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg",
        variant: "default",
        link: "/blog/community-stories",
    },
};

export function BlogSection() {
    const { t, language } = useLanguage()

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

    return (
        <section id="blog" className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        {t('landing.blog.title')}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {t('landing.blog.description')}
                    </p>
                </div>
                <BentoGridTemplateTwo items={items} gap={6} animate={true} />

                {/* View All Blog Posts Button */}
                <div className="mt-12 text-center">
                    <Link href="/blog">
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-full group"
                            asChild
                        >
                            <span>
                                {t('landing.blog.viewAll')}
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
