"use client";

import { useState } from "react";
import * as React from "react";
import Link from "next/link";
import { Check, User, Users, Crown, ArrowRight, Gift } from "lucide-react";
import { motion } from "framer-motion";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCTAHref } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n/use-language";
import { translations } from "@/lib/i18n/translations";

// =============================================================================
// TYPES
// =============================================================================

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ReactNode;
  popular?: boolean;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  highlight?: boolean;
}

// =============================================================================
// PRICING DATA
// =============================================================================

// =============================================================================
// PRICING CARD COMPONENT
// =============================================================================

function PricingCard({
  plan,
  isYearly,
  index,
  t,
}: {
  plan: PricingPlan;
  isYearly: boolean;
  index: number;
  t: (key: string) => string;
}) {
  const ctaHref = useCTAHref()
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = plan.monthlyPrice > 0
    ? Math.round(((plan.monthlyPrice - plan.yearlyPrice) / plan.monthlyPrice) * 100)
    : 0;

  const href = plan.cta.href.includes("plan=") ? plan.cta.href : ctaHref;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn(
        "group relative flex flex-col rounded-3xl border p-6 sm:p-7 transition-all duration-500",
        plan.highlight
          ? "border-primary/50 bg-background shadow-2xl shadow-primary/10 dark:shadow-primary/20"
          : "border-border bg-background/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl dark:bg-neutral-900/40"
      )}
    >
      {/* Glow Effect for Highlighted Card */}
      {plan.highlight && (
        <div className="absolute -inset-[1px] -z-10 rounded-3xl bg-gradient-to-b from-primary/50 via-primary/20 to-transparent opacity-20 blur-sm transition-opacity group-hover:opacity-30" />
      )}

      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 px-4 py-1 text-[10px] uppercase tracking-wider font-bold">
            {t('landing.pricing.plans.pro.popular')}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110",
            plan.highlight
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted text-muted-foreground"
          )}>
            {React.cloneElement(plan.icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5" })}
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
            {plan.highlight && <p className="text-[9px] uppercase tracking-widest text-primary font-bold">{t('landing.pricing.badge')}</p>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight">
            {price === 0 ? t('landing.pricing.free') : `€${price}`}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground font-medium text-xs">{t('landing.pricing.perMonth')}</span>
          )}
        </div>
        <div className="mt-1.5 h-6">
          {isYearly && savings > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] font-bold">
              {savings}% {t('landing.pricing.saved')}
            </Badge>
          )}
          {!isYearly && price > 0 && (
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
              {t('landing.pricing.monthlyBilling')}
            </p>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        asChild
        size="lg"
        variant={plan.highlight ? "default" : "outline"}
        className={cn(
          "mb-6 w-full group/btn h-11 rounded-2xl font-bold text-sm transition-all duration-300",
          plan.highlight
            ? "shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
            : "hover:bg-primary/5 hover:border-primary/30"
        )}
      >
        <Link href={href}>
          {plan.cta.label}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Link>
      </Button>

      {/* Features */}
      <div className="space-y-3.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {t('landing.pricing.features')}
        </p>
        <ul className="space-y-2.5">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <div className={cn(
                "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full mt-0.5 transition-colors",
                plan.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <span className="text-foreground/80 leading-tight text-xs sm:text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN PRICING COMPONENT
// =============================================================================

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const { t, language } = useLanguage();

  const pricingPlans = React.useMemo<PricingPlan[]>(() => {
    const langTranslations = translations[language as keyof typeof translations] as any
    const freeFeatures = langTranslations?.landing?.pricing?.plans?.free?.features || []
    const proFeatures = langTranslations?.landing?.pricing?.plans?.pro?.features || []
    const teamFeatures = langTranslations?.landing?.pricing?.plans?.team?.features || []

    return [
      {
        id: "free",
        name: t('landing.pricing.plans.free.name'),
        description: t('landing.pricing.plans.free.description'),
        monthlyPrice: 0,
        yearlyPrice: 0,
        icon: <Gift />,
        cta: {
          label: t('landing.pricing.plans.free.cta'),
          href: siteConfig.pricing.free,
        },
        features: Array.isArray(freeFeatures) ? freeFeatures : [],
      },
      {
        id: "pro",
        name: t('landing.pricing.plans.pro.name'),
        description: t('landing.pricing.plans.pro.description'),
        monthlyPrice: 20,
        yearlyPrice: 13,
        icon: <User />,
        popular: true,
        highlight: true,
        cta: {
          label: t('landing.pricing.plans.pro.cta'),
          href: siteConfig.pricing.pro,
        },
        features: Array.isArray(proFeatures) ? proFeatures : [],
      },
      {
        id: "team",
        name: t('landing.pricing.plans.team.name'),
        description: t('landing.pricing.plans.team.description'),
        monthlyPrice: 40,
        yearlyPrice: 27,
        icon: <Users />,
        cta: {
          label: t('landing.pricing.plans.team.cta'),
          href: siteConfig.pricing.team,
        },
        features: Array.isArray(teamFeatures) ? teamFeatures : [],
      },
    ]
  }, [t, language]);

  return (
    <section id="pricing" className="relative py-16 px-4 md:py-24 overflow-hidden bg-background">
      {/* Ambient Background Lights */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[10%] h-[500px] w-[500px] bg-primary/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute right-[5%] bottom-[15%] h-[400px] w-[400px] bg-primary/5 blur-[100px] rounded-full opacity-30" />
      </div>

      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-5">
              {t('landing.pricing.badge')}
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              {t('landing.pricing.description')}
            </p>
          </motion.div>

          {/* Premium Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center pt-4"
          >
            <div className="inline-flex items-center p-1 rounded-2xl bg-muted/50 border border-border backdrop-blur-md">
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-300",
                  !isYearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  "relative px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-300",
                  isYearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('landing.pricing.yearly')}
                {isYearly && (
                  <span className="absolute -top-3 -right-2 px-1.5 py-0.5 rounded-md bg-primary text-[8px] text-primary-foreground font-black uppercase tracking-tighter">
                    -35%
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isYearly={isYearly}
              index={index}
              t={t}
            />
          ))}
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center space-y-5"
        >
          <p className="text-muted-foreground/80 text-xs font-medium tracking-wide">
            {t('landing.pricing.footer')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-bold">
            <span className="text-muted-foreground">{t('landing.pricing.needCustom')}</span>
            <Link
              href="/contact"
              className="text-primary hover:text-primary/80 underline-offset-8 decoration-primary/30 hover:decoration-primary transition-all duration-300"
            >
              {t('landing.pricing.contactUs')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


