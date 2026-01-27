"use client"

import * as React from "react"
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Marquee } from '@/components/ui/marquee'
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal'
import { m, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import Glow from '@/components/ui/glow'
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from '@/components/ui/card-hover'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/use-language'


const userGrowthData = [
    { year: "2025", users: 0.1, label: "10" },
    { year: "Oktober 2025", users: 1, label: "10" },
    { year: "November 2025", users: 2.5, label: "25" },
    { year: "Dezember 2025", users: 4, label: "40" },
    { year: "Januar 2026", users: 5, label: "200" },
]

function AnimatedCounter({
    value,
    suffix = "",
    label,
    delay = 0,
}: {
    value: number
    suffix?: string
    label: string
    delay?: number
}) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    const motionValue = useMotionValue(0)
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
        mass: 1,
    })

    const rounded = useTransform(springValue, (latest) =>
        Math.round(latest)
    )

    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        const unsubscribe = rounded.on("change", (latest) => {
            setDisplayValue(latest)
        })
        return () => unsubscribe()
    }, [rounded])

    useEffect(() => {
        if (isInView) {
            const timeout = setTimeout(() => {
                motionValue.set(value)
            }, delay * 150)
            return () => clearTimeout(timeout)
        }
    }, [isInView, value, motionValue, delay])

    return (
        <m.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: delay * 0.1 }}
            className="space-y-2"
        >
            <m.p
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent"
                initial={{ scale: 0.5 }}
                animate={isInView ? { scale: 1 } : { scale: 0.5 }}
                transition={{ duration: 0.4, delay: delay * 0.1 + 0.2, type: "spring", stiffness: 200 }}
            >
                {displayValue}{suffix}
            </m.p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </m.div>
    )
}

export default function AboutPage() {
    const { t, language } = useLanguage()

    const stats = React.useMemo(() => [
        { value: 200, suffix: "+", label: t('pages.about.stats.activeUsers') },
        { value: 20, suffix: "+", label: t('pages.about.stats.universities') },
        { value: 10, suffix: "K+", label: t('pages.about.stats.documents') },
        { value: 3, suffix: "+", label: t('pages.about.stats.languages') },
    ], [t, language])

    const values = React.useMemo(() => [
        {
            title: t('pages.about.values.userOriented.title'),
            description: t('pages.about.values.userOriented.description'),
        },
        {
            title: t('pages.about.values.academicIntegrity.title'),
            description: t('pages.about.values.academicIntegrity.description'),
        },
        {
            title: t('pages.about.values.innovation.title'),
            description: t('pages.about.values.innovation.description'),
        },
        {
            title: t('pages.about.values.inclusivity.title'),
            description: t('pages.about.values.inclusivity.description'),
        },
    ], [t, language])

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Navbar />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 md:py-32 overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <Glow variant="top" className="opacity-30" />
                    </div>
                    <div className="container px-4 mx-auto">
                        <ScrollReveal className="max-w-3xl mx-auto text-center">
                            <Badge variant="outline" className="mb-6 text-xs uppercase tracking-wider">
                                {t('pages.about.badge')}
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground">
                                {t('pages.about.title')} <span className="text-foreground">{t('pages.about.titleHighlight')}</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground">
                                {t('pages.about.description')}
                            </p>
                        </ScrollReveal>
                    </div>
                </section>

                {/* Stats Section with animated counters */}
                <section className="py-16 border-y border-border/50">
                    <div className="container px-4 mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
                            {stats.map((stat, index) => (
                                <AnimatedCounter
                                    key={stat.label}
                                    value={stat.value}
                                    suffix={stat.suffix}
                                    label={stat.label}
                                    delay={index}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Mission & Vision Tabs */}
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
                        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
                    </div>
                    <div className="container px-4 mx-auto">
                        <ScrollReveal className="max-w-3xl mx-auto">
                            <Tabs defaultValue="mission" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-8">
                                    <TabsTrigger value="mission">{t('pages.about.mission.tab')}</TabsTrigger>
                                    <TabsTrigger value="vision">{t('pages.about.vision.tab')}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="mission" className="mt-0">
                                    <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/20">
                                        <CardContent className="pt-6">
                                            <h3 className="text-2xl font-bold mb-4">{t('pages.about.mission.title')}</h3>
                                            <p className="text-muted-foreground leading-relaxed mb-4">
                                                {t('pages.about.mission.description1')}
                                            </p>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {t('pages.about.mission.description2')}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="vision" className="mt-0">
                                    <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/20">
                                        <CardContent className="pt-6">
                                            <h3 className="text-2xl font-bold mb-4">{t('pages.about.vision.title')}</h3>
                                            <p className="text-muted-foreground leading-relaxed mb-4">
                                                {t('pages.about.vision.description1')}
                                            </p>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {t('pages.about.vision.description2')}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </ScrollReveal>
                    </div>
                </section>

                {/* Values Section - Animated Cards */}
                <section className="py-20 bg-muted/30">
                    <div className="container px-4 mx-auto">
                        <ScrollReveal className="text-center mb-12">
                            <Badge variant="outline" className="mb-4 text-xs uppercase tracking-wider">
                                {t('pages.about.values.badge')}
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('pages.about.values.title')}</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {t('pages.about.values.description')}
                            </p>
                        </ScrollReveal>
                        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {values.map((value, index) => (
                                <StaggerItem key={value.title}>
                                    <Card variant="lift" className="h-full group cursor-pointer">
                                        <CardContent className="pt-6">
                                            <div className="h-2 w-12 rounded-full bg-gradient-to-r from-primary to-emerald-400 mb-4 group-hover:w-20 transition-all duration-300" />
                                            <CardTitle className="mb-3">{value.title}</CardTitle>
                                            <CardDescription>{value.description}</CardDescription>
                                        </CardContent>
                                    </Card>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    </div>
                </section>

                {/* Timeline / Milestones */}
                <section className="py-20">
                    <div className="container px-4 mx-auto">
                        <ScrollReveal className="text-center mb-12">
                            <Badge variant="outline" className="mb-4 text-xs uppercase tracking-wider">
                                {t('pages.about.journey.badge')}
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('pages.about.journey.title')}</h2>
                        </ScrollReveal>
                        <div className="max-w-4xl mx-auto">
                            <StaggerContainer className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-transparent" />
                                {/* Milestones Timeline - kann später mit dynamischen Daten gefüllt werden */}
                            </StaggerContainer>
                        </div>
                    </div>
                </section>

                {/* Team Section - Marquee */}
                <section className="py-20 bg-muted/30 overflow-hidden">
                    <div className="container px-4 mx-auto">
                        <ScrollReveal className="text-center mb-12">
                            <Badge variant="outline" className="mb-4 text-xs uppercase tracking-wider">
                                {t('pages.about.team.badge')}
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('pages.about.team.title')}</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {t('pages.about.team.description')}
                            </p>
                        </ScrollReveal>
                    </div>

                    {/* Team Marquee */}
                    <div className="relative">
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-muted/30 to-transparent" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-muted/30 to-transparent" />

                        <Marquee pauseOnHover duration="40s">
                            <TeamCard
                                name="Franc Ngongang"
                                role="Co-Founder & CEO"
                                description={t('pages.about.team.badge')}
                                avatar="FN"
                                image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"
                            />
                            <TeamCard
                                name="Samou Ingrid"
                                role="Co-Founder & CTO"
                                description={t('pages.about.team.badge')}
                                avatar="SI"
                                image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
                            />
                        </Marquee>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <Glow variant="bottom" className="opacity-20" />
                    </div>
                    <div className="container px-4 mx-auto">
                        <div className="max-w-3xl mx-auto">
                            <ScrollReveal className="text-center mb-8">
                                <Badge variant="outline" className="mb-4 text-xs uppercase tracking-wider">
                                    {t('pages.about.story.badge')}
                                </Badge>
                                <h2 className="text-3xl md:text-4xl font-bold">{t('pages.about.story.title')}</h2>
                            </ScrollReveal>
                            <ScrollReveal delay={0.2}>
                                <div className="space-y-6 text-muted-foreground leading-relaxed">
                                    <p>
                                        {t('pages.about.story.description1')}
                                    </p>
                                    <p>
                                        {t('pages.about.story.description2')}
                                    </p>
                                    <p>
                                        {t('pages.about.story.description3')}
                                    </p>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </section>

                {/* User Growth Chart Section */}
                <section className="py-20 bg-muted/30 overflow-hidden">
                    <div className="container px-4 mx-auto">
                        <ScrollReveal className="text-center mb-12">
                            <Badge variant="outline" className="mb-4 text-xs uppercase tracking-wider">
                                {t('pages.about.growth.badge')}
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('pages.about.growth.title')}</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {t('pages.about.growth.description')}
                            </p>
                        </ScrollReveal>
                        <GrowthChart />
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20">
                    <div className="container px-4 mx-auto">
                        <ScrollReveal className="max-w-2xl mx-auto text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                {t('pages.about.cta.title')}
                            </h2>
                            <p className="text-muted-foreground mb-8">
                                {t('pages.about.cta.description')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg" className="rounded-full">
                                    <Link href="/auth/signup">{t('pages.about.cta.startFree')}</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="rounded-full">
                                    <Link href="/contact">{t('pages.about.cta.contact')}</Link>
                                </Button>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}

function GrowthChart() {
    const ref = useRef<HTMLDivElement>(null)
    const { t } = useLanguage()
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    const chartWidth = 800
    const chartHeight = 300
    const padding = { top: 40, right: 40, bottom: 40, left: 60 }
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom

    const maxUsers = Math.max(...userGrowthData.map(d => d.users))

    // Calculate points for the line
    const points = userGrowthData.map((d, i) => ({
        x: padding.left + (i / (userGrowthData.length - 1)) * innerWidth,
        y: padding.top + innerHeight - (d.users / maxUsers) * innerHeight,
        ...d
    }))

    // Create smooth curve path
    const linePath = points.reduce((path, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`
        const prev = points[i - 1]
        const cpX = (prev.x + point.x) / 2
        return `${path} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`
    }, "")

    // Create area path (for gradient fill)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`

    return (
        <div ref={ref} className="w-full max-w-4xl mx-auto">
            <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* Gradient for line */}
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="50%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>

                    {/* Gradient for area fill */}
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    const y = padding.top + (i / 5) * innerHeight
                    return (
                        <m.line
                            key={i}
                            x1={padding.left}
                            y1={y}
                            x2={chartWidth - padding.right}
                            y2={y}
                            className="stroke-border/30"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                        />
                    )
                })}

                {/* Y-axis labels */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                    const y = padding.top + (i / 5) * innerHeight
                    const value = Math.round((5 - i) * (maxUsers / 5))
                    return (
                        <m.text
                            key={i}
                            x={padding.left - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="fill-muted-foreground text-xs"
                            initial={{ opacity: 0, x: -10 }}
                            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                            transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
                        >
                            {value}M
                        </m.text>
                    )
                })}

                {/* Area fill */}
                <m.path
                    d={areaPath}
                    fill="url(#areaGradient)"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                />

                {/* Animated line */}
                <m.path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
                />

                {/* Data points and labels */}
                {points.map((point, i) => (
                    <g key={point.year}>
                        {/* Vertical line to point */}
                        <m.line
                            x1={point.x}
                            y1={padding.top + innerHeight}
                            x2={point.x}
                            y2={point.y}
                            className="stroke-primary/20"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 + i * 0.2 }}
                        />

                        {/* Outer glow circle */}
                        <m.circle
                            cx={point.x}
                            cy={point.y}
                            r="12"
                            className="fill-primary/20"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 + i * 0.15 }}
                        />

                        {/* Data point */}
                        <m.circle
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            className="fill-primary stroke-background"
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={isInView ? { scale: 1 } : { scale: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.8 + i * 0.15,
                                type: "spring",
                                stiffness: 300
                            }}
                        />

                        {/* Value label above point */}
                        <m.text
                            x={point.x}
                            y={point.y - 20}
                            textAnchor="middle"
                            className="fill-foreground text-sm font-semibold"
                            initial={{ opacity: 0, y: 10 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                            transition={{ duration: 0.4, delay: 1 + i * 0.15 }}
                        >
                            {point.label}
                        </m.text>

                        {/* Year label below */}
                        <m.text
                            x={point.x}
                            y={padding.top + innerHeight + 25}
                            textAnchor="middle"
                            className="fill-muted-foreground text-sm"
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                        >
                            {point.year}
                        </m.text>
                    </g>
                ))}
            </svg>

            {/* Legend */}
            <m.div
                className="flex justify-center gap-8 mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 1.5 }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-1 rounded-full bg-gradient-to-r from-primary to-emerald-400" />
                    <span className="text-sm text-muted-foreground">{t('pages.about.growth.legend.userGrowth')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">{t('pages.about.growth.legend.dataPoints')}</span>
                </div>
            </m.div>
        </div>
    )
}

function TeamCard({
    name,
    role,
    description,
    avatar,
    image,
}: {
    name: string
    role: string
    description: string
    avatar: string
    image: string
}) {
    return (
        <figure
            className={cn(
                "relative w-72 cursor-pointer overflow-hidden rounded-xl border p-5 mx-3",
                "border-neutral-200 bg-white/80 backdrop-blur-sm hover:bg-neutral-50",
                "dark:border-neutral-800 dark:bg-neutral-950/80 dark:hover:bg-neutral-900/80",
                "transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            )}
        >
            <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-14 w-14 border-2 border-white dark:border-neutral-900 shadow-sm">
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {avatar}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <figcaption className="font-semibold text-foreground">{name}</figcaption>
                    <p className="text-sm text-primary">{role}</p>
                </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </figure>
    )
}
