"use client"

import * as React from "react"
import { ArrowRight, Sparkles, Zap, FileText, Quote } from "lucide-react"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { useLanguage } from "@/lib/i18n/use-language"

import Glow, { Spotlight } from "@/components/ui/glow"
import { Mockup, MockupFrame, FloatingCard, PerspectiveWrapper } from "@/components/ui/mockup"
import Screenshot from "@/components/ui/screenshot"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/ui/announcement"

// =============================================================================
// HERO COMPONENT - Premium Design with Glassmorphism & 3D Effects
// =============================================================================

export default function Hero() {
  const { t, language } = useLanguage()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const heroContent = React.useMemo(() => ({
    badge: t('landing.hero.badge'),
    title: t('landing.hero.title'),
    titleHighlight: t('landing.hero.titleHighlight'),
    subtitle: t('landing.hero.subtitle'),
    socialProof: {
      users: t('landing.hero.socialProof.users'),
      label: t('landing.hero.socialProof.label'),
      trust: t('landing.hero.socialProof.trust'),
    },
  }), [t, language])

  if (!mounted) return null

  return (
    <section className="line-b px-4 fade-bottom w-full overflow-hidden py-0 sm:py-0 md:py-0">
      <div className="max-w-7xl line-y line-dashed relative mx-auto flex flex-col gap-0 pt-12 sm:pt-32 md:pt-10">
        <div className="relative z-10 flex flex-col items-center text-center gap-2 sm:gap-3">

          {/* Badge */}
          <div className="animate-appear bg-background/50 backdrop-blur-sm rounded-full">
            <Link href="/auth/login" aria-label={heroContent.badge}>
              <Announcement movingBorder className="px-2.5 py-0 h-6">
                <AnnouncementTitle className="gap-1 text-[11px] font-medium">
                  <span className="text-muted-foreground">{heroContent.badge}</span>
                  <ArrowRight className="size-2.5 text-muted-foreground" aria-hidden="true" />
                </AnnouncementTitle>
              </Announcement>
            </Link>
          </div>

          {/* H1 */}
          <h1 className="animate-appear inline-block max-w-[840px] text-4xl leading-tight font-semibold text-balance drop-shadow-2xl sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight text-foreground dark:text-white">
            {heroContent.title} <br />
            <span className="text-foreground dark:text-white">
              {heroContent.titleHighlight}
            </span>
          </h1>
          {/* Subtext */}
          <p className="text-md animate-appear text-muted-foreground max-w-[840px] font-medium text-balance opacity-0 delay-100 lg:text-xl">
            {heroContent.subtitle}
          </p>

          {/* Social Proof */}
          <div className="animate-appear opacity-0 delay-300 flex justify-center items-center mt-8">
            <div className="group relative flex items-center gap-3 px-4 py-2.5 rounded-full bg-background/60 backdrop-blur-md border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-border/80">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="relative w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted shadow-sm hover:scale-110 transition-transform duration-200 z-0 hover:z-10"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt={`User ${i}`}
                      width={40}
                      height={40}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  <span className="text-primary font-bold">{heroContent.socialProof.users}</span> {heroContent.socialProof.label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {heroContent.socialProof.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Background Glow */}
        <div className="absolute w-full top-[50%] left-0 animate-appear-zoom mt-32 opacity-0 delay-2000 lg:mt-4 pointer-events-none z-0">
          <div className="absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-[radial-gradient(circle,rgba(62,207,142,0.4)_0%,transparent_60%)] opacity-20 sm:h-[512px] dark:opacity-40 -translate-y-1/2"></div>
          <div className="absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-[radial-gradient(circle,rgba(62,207,142,0.6)_0%,transparent_60%)] opacity-20 sm:h-[256px] dark:opacity-50 -translate-y-1/2"></div>
        </div>

        {/* 3D Mockup Section */}
        <div className="group relative sm:px-24 h-[600px] sm:h-[700px] md:h-[800px] flex justify-center items-center perspective-[2000px] z-10 -mt-8 sm:-mt-12">

          <div className="absolute left-[5%] sm:left-[10%] z-10 w-[80%] sm:w-[60%] md:w-[55%] transition-all delay-200 duration-1000 ease-in-out group-hover:left-[5%] sm:group-hover:left-[5%] group-hover:-translate-x-10">
            <PerspectiveWrapper intensity="subtle">
              <Mockup type="browser" className="opacity-60 shadow-2xl">
                <Screenshot
                  srcLight="/dashboard-light-1.png"
                  srcDark="/dashboard-dark-1.png"
                  alt="Ing AI Editor Dashboard"
                  width={1248}
                  height={1065}
                  sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain w-full h-auto"
                  loading="lazy"
                />
              </Mockup>
            </PerspectiveWrapper>
          </div>

          <div className="absolute right-[5%] sm:right-[10%] z-10 w-[80%] sm:w-[60%] md:w-[55%] transition-all delay-200 duration-1000 ease-in-out group-hover:right-[5%] sm:group-hover:right-[5%] group-hover:translate-x-10">
            <PerspectiveWrapper intensity="subtle">
              <Mockup type="browser" className="opacity-60 shadow-2xl">
                <Screenshot
                  srcLight="/dashboard-light-2.png"
                  srcDark="/dashboard-dark-2.png"
                  alt="Ing AI Dashboard 2"
                  width={1248}
                  height={1065}
                  sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain w-full h-auto"
                  loading="lazy"
                />
              </Mockup>
            </PerspectiveWrapper>
          </div>

          <div className="relative z-20 w-[90%] sm:w-[75%] md:w-[70%] transition-all delay-200 duration-1000 ease-in-out hover:!scale-105 hover:!z-30">
            <PerspectiveWrapper intensity="medium">
              <Mockup type="browser" className="shadow-2xl ring-1 ring-white/10">
                <Screenshot
                  srcLight="/dashboard-light-3.png"
                  srcDark="/dashboard-dark-3.png"
                  alt="Ing AI Dashboard 3"
                  width={1248}
                  height={1065}
                  sizes="(max-width: 768px) 90vw, (max-width: 1200px) 75vw, 70vw"
                  priority
                  className="object-contain w-full h-auto"
                />
              </Mockup>
            </PerspectiveWrapper>
          </div>

        </div>
      </div>
    </section>
  )
}
