"use client";

import * as React from "react"
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
import { useLanguage } from "@/lib/i18n/use-language";

interface UseCase {
    title: string;
    description: string;
    icon: LucideIcon;
}

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
    const { t, language } = useLanguage()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const useCases = React.useMemo<UseCase[]>(() => [
        {
            title: t('landing.useCases.cases.students.title'),
            description: t('landing.useCases.cases.students.description'),
            icon: GraduationCap,
        },
        {
            title: t('landing.useCases.cases.phd.title'),
            description: t('landing.useCases.cases.phd.description'),
            icon: BookOpen,
        },
        {
            title: t('landing.useCases.cases.researchers.title'),
            description: t('landing.useCases.cases.researchers.description'),
            icon: FlaskConical,
        },
        {
            title: t('landing.useCases.cases.lawyers.title'),
            description: t('landing.useCases.cases.lawyers.description'),
            icon: Scale,
        },
        {
            title: t('landing.useCases.cases.doctors.title'),
            description: t('landing.useCases.cases.doctors.description'),
            icon: Stethoscope,
        },
        {
            title: t('landing.useCases.cases.contentCreators.title'),
            description: t('landing.useCases.cases.contentCreators.description'),
            icon: FileText,
        },
        {
            title: t('landing.useCases.cases.consultants.title'),
            description: t('landing.useCases.cases.consultants.description'),
            icon: Briefcase,
        },
        {
            title: t('landing.useCases.cases.technicalWriters.title'),
            description: t('landing.useCases.cases.technicalWriters.description'),
            icon: Code2,
        },
    ], [t, language])

    if (!mounted) return null

    return (
        <Section id="use-cases" className="py-8 md:py-16 bg-muted dark:bg-neutral-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <ScrollReveal className="mb-8 md:mb-16 text-center max-w-2xl mx-auto space-y-3">
                    <Badge variant="outline" className="text-[10px] md:text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
                        {t('landing.useCases.badge')}
                    </Badge>
                    <h2 className="text-lg font-bold tracking-tight sm:text-4xl text-neutral-900 dark:text-neutral-100">
                        {t('landing.useCases.title')}
                    </h2>
                    <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 px-4">
                        {t('landing.useCases.description')}
                    </p>
                </ScrollReveal>

                {/* Grid */}
                <StaggerContainer staggerDelay={0.06} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 max-w-6xl mx-auto">
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
