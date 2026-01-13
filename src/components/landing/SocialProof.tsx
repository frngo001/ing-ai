"use client";

import * as React from "react"
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/use-language";

const germanUniversities = [
    { name: "LMU München", logo: "/logos/lmu-muenchen.svg" },
    { name: "TU München", logo: "/logos/tu-muenchen.svg" },
    { name: "Uni Heidelberg", logo: "/logos/heidelberg.svg" },
    { name: "HU Berlin", logo: "/logos/hu-berlin.svg" },
    { name: "FU Berlin", logo: "/logos/fu-berlin.svg" },
    { name: "RWTH Aachen", logo: "/logos/rwth-aachen.svg" },
    { name: "Uni Hamburg", logo: "/logos/uni-hamburg.svg" },
    { name: "Uni Köln", logo: "/logos/uni-koeln.svg" },
    { name: "Goethe Frankfurt", logo: "/logos/goethe-frankfurt.svg" },
    { name: "FAU Erlangen", logo: "/logos/fau-erlangen.svg" },
    { name: "Uni Münster", logo: "/logos/uni-muenster.svg" },
    { name: "RUB Bochum", logo: "/logos/rub-bochum.svg" },
    { name: "Uni Tübingen", logo: "/logos/uni-tuebingen.svg" },
    { name: "Uni Freiburg", logo: "/logos/uni-freiburg.svg" },
    { name: "Uni Bonn", logo: "/logos/uni-bonn.svg" },
    { name: "Uni Marburg", logo: "/logos/uni-marburg.svg" },
    { name: "Uni Mannheim", logo: "/logos/uni-mannheim.svg" },
    { name: "Uni Stuttgart", logo: "/logos/uni-stuttgart.svg" },
    { name: "TU Berlin", logo: "/logos/tu-berlin.svg" },
    { name: "Uni Leipzig", logo: "/logos/uni-leipzig.svg" },
];

export default function SocialProof() {
    const { t, language } = useLanguage()

    return (
        <section className="py-16 border-y border-neutral-100 dark:border-neutral-900/50 bg-gradient-to-b from-neutral-50/50 to-transparent dark:from-neutral-950/50 overflow-hidden">
            <div className="container mx-auto px-4">
                <ScrollReveal>
                    <p className="text-sm font-medium text-muted-foreground mb-10 uppercase tracking-widest text-center">
                        {t('landing.socialProof.title')}
                    </p>
                </ScrollReveal>

                {/* Infinite scrolling marquee - 80% width centered */}
                <div className="relative w-[80%] mx-auto overflow-hidden">
                    {/* Gradient masks for smooth edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-neutral-50 dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-neutral-50 dark:from-neutral-950 to-transparent z-10 pointer-events-none" />

                    <div className="flex gap-6 md:gap-8 animate-marquee">
                        {/* First set of logos */}
                        {germanUniversities.map((uni) => (
                            <div
                                key={uni.name}
                                className="flex-shrink-0 flex items-center justify-center"
                            >
                                <div className="w-32 h-14 md:w-40 md:h-16 relative grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300 dark:invert">
                                    <Image
                                        src={uni.logo}
                                        alt={uni.name}
                                        fill
                                        sizes="(max-width: 768px) 128px, 160px"
                                        loading="lazy"
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                        {/* Duplicate set for seamless loop */}
                        {germanUniversities.map((uni) => (
                            <div
                                key={`${uni.name}-duplicate`}
                                className="flex-shrink-0 flex items-center justify-center"
                            >
                                <div className="w-32 h-14 md:w-40 md:h-16 relative grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300 dark:invert">
                                    <Image
                                        src={uni.logo}
                                        alt={uni.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
