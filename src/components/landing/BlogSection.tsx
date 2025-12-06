"use client";

import { useState } from "react";
import Link from "next/link";
import {
    BentoGridTemplateTwo,
    BentoItem,
} from "@/components/ui/bento-grid-template-two";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Sample images (using the ones from the prompt for now, but these should ideally be replaced with local assets)
const sampleBentoData: BentoItem[] = [
    {
        id: "1",
        title: "Der ultimative Guide für die Bachelorarbeit",
        description:
            "Schritt für Schritt zur perfekten Abschlussarbeit mit Struktur und Plan.",
        image: "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg",
        size: "large",
        priority: 1,
        tag: "Featured",
        variant: "glass",
        link: "/blog/ultimativer-guide-bachelorarbeit",
    },
    {
        id: "2",
        title: "KI im Studium",
        description: "Wie du Künstliche Intelligenz ethisch und effektiv nutzt.",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2532&ixlib=rb-4.0.3",
        variant: "highlight",
        tag: "Neu",
        link: "/blog/ki-im-studium",
    },
    {
        id: "3",
        title: "Zitieren leicht gemacht",
        description: "APA, MLA, Harvard – Die wichtigsten Stile im Überblick.",
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=2546&ixlib=rb-4.0.3",
        variant: "solid",
        link: "/blog/zitieren-leicht-gemacht",
    },
    {
        id: "4",
        title: "Schreibblockaden überwinden",
        description: "Praktische Tipps und Techniken, um den Flow wiederzufinden.",
        image: "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg",
        variant: "default",
        size: "wide",
        link: "/blog/schreibblockaden-ueberwinden",
    },
    {
        id: "5",
        title: "Plagiatsprüfung",
        description: "Warum sie wichtig ist und wie sie funktioniert.",
        image: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3",
        variant: "solid",
        tag: "Wichtig",
        link: "/blog/plagiatspruefung",
    },
    {
        id: "6",
        title: "Forschungsmethoden",
        description: "Qualitativ vs. Quantitativ: Was passt zu deinem Projekt?",
        image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
        variant: "glass",
        link: "/blog/forschungsmethoden",
    },
    {
        id: "7",
        title: "Literaturverwaltung",
        description: "Die besten Tools um deine Quellen zu organisieren.",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=2428&ixlib=rb-4.0.3",
        variant: "solid",
        link: "/blog/literaturverwaltung",
    },
    {
        id: "8",
        title: "Community Stories",
        description: "Erfahrungsberichte von Studenten und Forschern.",
        image: "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg",
        variant: "default",
        link: "/blog/community-stories",
    },
];

export function BlogSection() {
    const [items] = useState<BentoItem[]>(sampleBentoData);

    return (
        <section id="blog" className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Neueste Artikel & Ressourcen
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Tipps, Tricks und Guides für dein akademisches Schreiben.
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
                        >
                            Alle Artikel ansehen
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
