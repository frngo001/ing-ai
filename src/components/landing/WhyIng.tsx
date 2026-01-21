"use client";

import * as React from "react"
import {
    BrainCircuitIcon,
    CheckCircleIcon,
    GlobeIcon,
    PaletteIcon,
    RocketIcon,
    ShieldCheckIcon,
    SparklesIcon,
    ZapIcon,
} from "lucide-react";
import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import Glow from "@/components/ui/glow";
import { Item, ItemDescription, ItemIcon, ItemTitle } from "@/components/ui/item";
import { Section } from "@/components/ui/section";
import { useLanguage } from "@/lib/i18n/use-language";

interface ItemProps {
    title: string;
    description: string;
    icon: ReactNode;
}

interface WhyIngProps {
    title?: string;
    description?: string;
    items?: ItemProps[] | false;
    className?: string;
}

export default function WhyIng({
    title,
    description,
    items,
    className,
}: WhyIngProps) {
    const { t, language } = useLanguage()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const defaultItems = React.useMemo<ItemProps[]>(() => [
        {
            title: t('landing.whyIng.items.aiCompletion.title'),
            description: t('landing.whyIng.items.aiCompletion.description'),
            icon: <BrainCircuitIcon className="size-5 stroke-1 text-primary" />,
        },
        {
            title: t('landing.whyIng.items.fastPerformance.title'),
            description: t('landing.whyIng.items.fastPerformance.description'),
            icon: <ZapIcon className="size-5 stroke-1 text-primary" />,
        },
        {
            title: t('landing.whyIng.items.academicQuality.title'),
            description: t('landing.whyIng.items.academicQuality.description'),
            icon: <CheckCircleIcon className="size-5 stroke-1 text-primary" />,
        },
        {
            title: t('landing.whyIng.items.gdprCompliant.title'),
            description: t('landing.whyIng.items.gdprCompliant.description'),
            icon: <ShieldCheckIcon className="size-5 stroke-1 text-primary" />,
        },
        {
            title: t('landing.whyIng.items.multilingual.title'),
            description: t('landing.whyIng.items.multilingual.description'),
            icon: <GlobeIcon className="size-5 stroke-1 text-primary" />,
        },
        {
            title: t('landing.whyIng.items.fullyCustomizable.title'),
            description: t('landing.whyIng.items.fullyCustomizable.description'),
            icon: <PaletteIcon className="size-5 stroke-1 text-primary" />,
        },
        {
            title: t('landing.whyIng.items.productionReady.title'),
            description: t('landing.whyIng.items.productionReady.description'),
            icon: <RocketIcon className="size-5 stroke-1 text-primary" />,
        },
        {
            title: t('landing.whyIng.items.constantImprovement.title'),
            description: t('landing.whyIng.items.constantImprovement.description'),
            icon: <SparklesIcon className="size-5 stroke-1 text-primary" />,
        },
    ], [t, language])

    const finalTitle = title ?? t('landing.whyIng.title')
    const finalDescription = description ?? t('landing.whyIng.description')
    const finalItems = items ?? defaultItems

    if (!mounted) return null

    return (
        <Section className={`py-12 md:py-16 relative overflow-hidden bg-background ${className || ''}`} id="why-ing">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <Glow variant="center" className="opacity-15" />
                <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] bg-primary/5 rounded-full blur-[80px]" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        {t('landing.whyIng.badge')}
                    </Badge>
                    <h2 className="max-w-[560px] mx-auto text-center text-2xl leading-tight font-semibold sm:text-3xl sm:leading-tight">
                        {finalTitle}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {finalDescription}
                    </p>
                </div>

                {/* Items Grid */}
                {finalItems !== false && finalItems.length > 0 && (
                    <div className="grid auto-rows-fr grid-cols-2 gap-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 max-w-6xl mx-auto">
                        {finalItems.map((item, index) => (
                            <Item
                                key={index}
                                className="group transition-all duration-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 dark:hover:border-primary/20 dark:hover:shadow-[0_0_20px_-12px_rgba(62,207,142,0.3)]"
                            >
                                <ItemTitle className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary dark:bg-primary/5 dark:group-hover:bg-primary/10 transition-colors">
                                        <div className="group-hover:scale-110 transition-transform duration-300">
                                            {item.icon}
                                        </div>
                                    </div>
                                    <span className="group-hover:text-primary transition-colors duration-300">{item.title}</span>
                                </ItemTitle>
                                <ItemDescription className="mt-2 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                    {item.description}
                                </ItemDescription>
                            </Item>
                        ))}
                    </div>
                )}
            </div>
        </Section>
    );
}

