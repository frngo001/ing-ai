"use client";

import { motion } from "framer-motion";
import {
    GraduationCap,
    BookOpen,
    FileText,
    Briefcase,
    FlaskConical,
    Scale,
    Stethoscope,
    Code2
} from "lucide-react";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardIcon,
    CardTitle
} from "@/components/ui/card-hover";
import { Section } from "@/components/ui/section";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UseCase {
    title: string;
    description: string;
    icon: LucideIcon;
}

const useCases: UseCase[] = [
    {
        title: "Studierende",
        description: "Bachelor-, Master- und Seminararbeiten schneller und besser schreiben.",
        icon: GraduationCap,
    },
    {
        title: "Doktoranden",
        description: "Dissertationen strukturieren und mit korrekten Zitationen versehen.",
        icon: BookOpen,
    },
    {
        title: "Forscher",
        description: "Wissenschaftliche Paper und Publikationen effizient verfassen.",
        icon: FlaskConical,
    },
    {
        title: "Juristen",
        description: "Rechtsgutachten und juristische Texte präzise formulieren.",
        icon: Scale,
    },
    {
        title: "Mediziner",
        description: "Medizinische Fachartikel und Studienberichte erstellen.",
        icon: Stethoscope,
    },
    {
        title: "Content Creator",
        description: "Blogs, Reports und Whitepapers professionell verfassen.",
        icon: FileText,
    },
    {
        title: "Consultants",
        description: "Analysen, Berichte und Präsentationen strukturiert aufbauen.",
        icon: Briefcase,
    },
    {
        title: "Tech Writer",
        description: "Technische Dokumentationen klar und verständlich schreiben.",
        icon: Code2,
    },
];

function UseCaseCard({ useCase }: { useCase: UseCase }) {
    const Icon = useCase.icon;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
        >
            <Card className="h-full border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 [&_p]:my-0">
                <CardHeader>
                    <div>
                        <CardIcon>
                            <Icon className="w-5 h-5 text-foreground" />
                        </CardIcon>
                    </div>

                    <CardAction>
                        <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {useCase.title}
                        </CardTitle>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {useCase.description}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function UseCases() {
    return (
        <Section id="use-cases" className="py-24 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="mb-16 text-center max-w-2xl mx-auto">
                    <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        Anwendungsfälle
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-neutral-900 dark:text-neutral-100 mb-4">
                        Für jeden Schreibbedarf entwickelt
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Egal ob Thesis, Fachartikel oder Blog – Jenni AI passt sich deinem Workflow an.
                    </p>
                </ScrollReveal>

                {/* Grid */}
                <StaggerContainer staggerDelay={0.06} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                    {useCases.map((useCase) => (
                        <StaggerItem key={useCase.title}>
                            <UseCaseCard useCase={useCase} />
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </Section>
    );
}
