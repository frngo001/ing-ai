"use client";

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

const defaultItems: ItemProps[] = [
    {
        title: "KI-gestützte Vervollständigung",
        description: "Intelligente Vorschläge, die deinen Kontext und Schreibstil verstehen.",
        icon: <BrainCircuitIcon className="size-5 stroke-1 text-primary" />,
    },
    {
        title: "Blitzschnelle Performance",
        description: "Sofortige Antworten und flüssiges Schreiben ohne Wartezeiten.",
        icon: <ZapIcon className="size-5 stroke-1 text-primary" />,
    },
    {
        title: "Akademische Qualität",
        description: "Zitationen, Plagiatsprüfung und Formatierung nach wissenschaftlichen Standards.",
        icon: <CheckCircleIcon className="size-5 stroke-1 text-primary" />,
    },
    {
        title: "DSGVO-konform & sicher",
        description: "Deine Daten bleiben verschlüsselt und werden nie für Modell-Training genutzt.",
        icon: <ShieldCheckIcon className="size-5 stroke-1 text-primary" />,
    },
    {
        title: "Mehrsprachig",
        description: "Schreibe und recherchiere in Deutsch, Englisch und 20+ weiteren Sprachen.",
        icon: <GlobeIcon className="size-5 stroke-1 text-primary" />,
    },
    {
        title: "Voll anpassbar",
        description: "Passe Schreibstil, Tonalität und Formatierung an deine Bedürfnisse an.",
        icon: <PaletteIcon className="size-5 stroke-1 text-primary" />,
    },
    {
        title: "Produktionsbereit",
        description: "Export in Word, PDF, LaTeX und HTML – ohne Nacharbeit.",
        icon: <RocketIcon className="size-5 stroke-1 text-primary" />,
    },
    {
        title: "Ständige Verbesserung",
        description: "Regelmäßige Updates mit neuen Features und verbesserten KI-Modellen.",
        icon: <SparklesIcon className="size-5 stroke-1 text-primary" />,
    },
];

export default function WhyIng({
    title = "Warum Ing AI?",
    description = "Die Werkzeuge, die du brauchst – ohne Ballast.",
    items = defaultItems,
    className,
}: WhyIngProps) {
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
                        Vorteile
                    </Badge>
                    <h2 className="max-w-[560px] mx-auto text-center text-2xl leading-tight font-semibold sm:text-3xl sm:leading-tight">
                        {title}
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        {description}
                    </p>
                </div>

                {/* Items Grid */}
                {items !== false && items.length > 0 && (
                    <div className="grid auto-rows-fr grid-cols-2 gap-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 max-w-6xl mx-auto">
                        {items.map((item, index) => (
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

