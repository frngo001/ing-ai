"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MorphyButton } from "@/components/ui/morphy-button";
import Glow from "@/components/ui/glow";
import { Marquee } from "@/components/ui/marquee";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";
import Link from "next/link";

const testimonials = [
    {
        name: "Sarah Chen",
        handle: "@sarahchen_phd",
        content:
            "Jenni hat meinen Schreibprozess komplett verändert. Die KI-Vorschläge sind unglaublich präzise und der Zitationsmanager ist ein Lebensretter.",
        avatar: "SC",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "Dr. James Wilson",
        handle: "@jwilson_prof",
        content:
            "Ich empfehle Jenni allen meinen Studierenden. Es hilft ihnen, ihre Argumente besser zu strukturieren und kein Zitat zu vergessen.",
        avatar: "JW",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "Emily Rodriguez",
        handle: "@emilyrod_med",
        content:
            "Die Möglichkeit, mit meinen PDFs zu chatten und wichtige Erkenntnisse zu extrahieren, hat mir Hunderte Stunden Lesezeit erspart.",
        avatar: "ER",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "Michael Park",
        handle: "@mpark_mit",
        content:
            "Das beste Schreibwerkzeug, das ich je benutzt habe. Die Autovervollständigung fühlt sich an wie ein Co-Autor, der meine Forschung wirklich versteht.",
        avatar: "MP",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "Dr. Lisa Thompson",
        handle: "@lisathompson_ox",
        content:
            "Allein Jennis Zitierungsfunktionen sind das Abonnement wert. Es integriert sich nahtlos in meinen Workflow.",
        avatar: "LT",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "Alex Kim",
        handle: "@alexkim_writes",
        content:
            "Nicht nur für Akademiker! Ich nutze Jenni für alle meine längeren Texte. Es ist wie ein professioneller Lektor auf Abruf.",
        avatar: "AK",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "Dr. Maria Santos",
        handle: "@msantos_research",
        content:
            "Der Plagiatsprüfer gibt mir Sicherheit. Ich kann meine Arbeit einreichen und weiß, dass sie original und korrekt zitiert ist.",
        avatar: "MS",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "David Chen",
        handle: "@dchen_dev",
        content:
            "Als technischer Redakteur hilft mir Jenni, komplexe Konzepte klar zu erklären. Die KI versteht den Kontext perfekt.",
        avatar: "DC",
        image: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "Prof. Anna Müller",
        handle: "@amuller_berlin",
        content:
            "Jenni hat das Schreiben meiner Forschungsarbeiten um das 3-fache beschleunigt. Ein unverzichtbares Tool für jeden ernsthaften Akademiker.",
        avatar: "AM",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    },
    {
        name: "Rachel Green",
        handle: "@rachelg_law",
        content:
            "Juristische Recherche ist jetzt einfacher. Jenni hilft mir, Fallzitate zu organisieren und stärkere Argumente aufzubauen.",
        avatar: "RG",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    },
];

const firstRow = testimonials.slice(0, Math.ceil(testimonials.length / 2));
const secondRow = testimonials.slice(Math.ceil(testimonials.length / 2));

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
                "relative w-80 cursor-pointer overflow-hidden rounded-xl border p-5 mx-3",
                // Light mode styles
                "border-neutral-200 bg-white/80 backdrop-blur-sm hover:bg-neutral-50",
                // Dark mode styles
                "dark:border-neutral-800 dark:bg-neutral-950/80 dark:hover:bg-neutral-900/80 dark:hover:border-primary/20 dark:hover:shadow-[0_0_20px_-12px_rgba(62,207,142,0.3)]",
                // Transition
                "transition-all duration-300 hover:shadow-lg"
            )}
        >
            {/* Content */}
            <blockquote className="text-sm text-foreground/90 leading-relaxed mb-4">
                {content}
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/50">
                <Avatar className="h-10 w-10 border-2 border-white dark:border-neutral-900 shadow-sm">
                    {image && <AvatarImage src={image} alt={name} />}
                    <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold">
                        {avatar}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <figcaption className="text-sm font-semibold text-foreground">
                        {name}
                    </figcaption>
                    <p className="text-xs text-muted-foreground">{handle}</p>
                </div>
            </div>
        </figure>
    );
}

export function Testimonials() {
    return (
        <section
            id="testimonials"
            className="py-24 bg-background relative overflow-hidden"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <Glow variant="top" className="opacity-20" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="container px-4 mx-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <ScrollReveal className="text-center mb-12 md:mb-16 space-y-4">
                        <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                            Testimonials
                        </Badge>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                            Geliebt von 5M+ Forschern
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Werde Teil der Community von Akademikern, die besser, schneller und mit mehr Vertrauen schreiben.
                        </p>
                    </ScrollReveal>

                    {/* Marquee Rows */}
                    <div className="relative flex flex-col gap-6">
                        {/* Gradient overlays */}
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-background to-transparent" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-background to-transparent" />

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

                    <div className="flex justify-center mt-12 relative z-20">
                        <Link href="/auth/signup">
                            <MorphyButton size="lg">
                                Werde Teil der Community
                            </MorphyButton>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
