"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, User, Users, Crown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCTAHref } from "@/hooks/use-auth";

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

const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Kostenlos",
    description: "Perfekt zum Ausprobieren und für gelegentliches Schreiben",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: undefined,
    cta: {
      label: "Kostenlos starten",
      href: siteConfig.pricing.free,
    },
    features: [
      "200 Wörter KI-Generierung / Tag",
      "Unbegrenzte Dokumente",
      "Grundlegende Zitationssuche",
      "1 aktives Projekt",
      "Plagiatsprüfung (begrenzt)",
      "Export als PDF & DOCX",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Für Studierende und Forscher mit regelmäßigem Schreibbedarf",
    monthlyPrice: 12,
    yearlyPrice: 8,
    icon: <User className="h-5 w-5" />,
    popular: true,
    highlight: true,
    cta: {
      label: "Pro wählen",
      href: siteConfig.pricing.pro,
    },
    features: [
      "Unbegrenzte KI-Generierung",
      "Unbegrenzte Dokumente & Projekte",
      "Erweiterte Zitationssuche (20+ Quellen)",
      "Vollständige Plagiatsprüfung",
      "Akademischer Stil-Assistent",
      "Mehrsprachige Unterstützung",
      "Prioritäts-Support",
      "Versionsverlauf (30 Tage)",
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "Für Forschungsgruppen und akademische Institutionen",
    monthlyPrice: 25,
    yearlyPrice: 19,
    icon: <Users className="h-5 w-5" />,
    cta: {
      label: "Team starten",
      href: siteConfig.pricing.team,
    },
    features: [
      "Alles aus Pro, plus:",
      "Bis zu 10 Teammitglieder",
      "Gemeinsame Projekt-Bibliothek",
      "Team-Zitationsdatenbank",
      "Kollaboratives Schreiben",
      "Admin-Dashboard & Statistiken",
      "SSO-Integration verfügbar",
      "Dedizierter Konto Manager",
      "Unbegrenzter Versionsverlauf",
    ],
  },
];

// =============================================================================
// PRICING CARD COMPONENT
// =============================================================================

function PricingCard({
  plan,
  isYearly,
  index,
}: {
  plan: PricingPlan;
  isYearly: boolean;
  index: number;
}) {
  const ctaHref = useCTAHref()
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = plan.monthlyPrice > 0
    ? Math.round(((plan.monthlyPrice - plan.yearlyPrice) / plan.monthlyPrice) * 100)
    : 0;
  
  // Für Pricing-Pläne: Wenn der Plan eine spezifische URL hat (z.B. mit Plan-Parameter), diese verwenden, sonst CTA-Href
  const href = plan.cta.href.includes("plan=") ? plan.cta.href : ctaHref;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all duration-300",
        plan.highlight
          ? "border-primary bg-gradient-to-b from-primary/5 via-background to-background shadow-xl shadow-primary/10 dark:from-primary/10 dark:border-primary/40 dark:shadow-primary/20"
          : "border-border bg-card hover:border-primary/50 hover:shadow-lg dark:hover:border-primary/30 dark:hover:shadow-primary/5 dark:bg-neutral-900/50"
      )}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 px-4 py-1">
            <Crown className="mr-1 h-3 w-3" />
            Am beliebtesten
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            plan.highlight
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {plan.icon}
          </div>
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground min-h-[40px]">
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">
            {price === 0 ? "Kostenlos" : `€${price}`}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground">/Monat</span>
          )}
        </div>
        {isYearly && savings > 0 && (
          <p className="mt-1 text-sm text-primary font-medium">
            {savings}% gespart bei jährlicher Zahlung
          </p>
        )}
        {!isYearly && price > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Bei monatlicher Abrechnung
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Button
        asChild
        size="lg"
        variant={plan.highlight ? "default" : "outline"}
        className={cn(
          "mb-6 w-full group",
          plan.highlight && "shadow-lg shadow-primary/20"
        )}
      >
        <Link href={href}>
          {plan.cta.label}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>

      {/* Divider */}
      <div className="mb-6 h-px bg-border" />

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <Check className={cn(
              "h-5 w-5 shrink-0 mt-0.5",
              plan.highlight ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// =============================================================================
// MAIN PRICING COMPONENT
// =============================================================================

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="relative py-10 md:py-12 overflow-hidden bg-muted dark:bg-neutral-900">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] bg-gradient-to-b from-primary/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute -left-20 top-1/3 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute -right-20 bottom-1/3 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800">
            Preise
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Wähle deinen Plan
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Starte kostenlos und upgrade jederzeit. Keine versteckten Kosten.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn(
              "text-sm font-medium transition-colors",
              !isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Monatlich
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={cn(
              "text-sm font-medium transition-colors",
              isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Jährlich
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">
                Spare bis zu 33%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isYearly={isYearly}
              index={index}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Alle Preise zzgl. MwSt. · Jederzeit kündbar · 14 Tage Geld-zurück-Garantie
          </p>
          <p className="mt-4 text-sm">
            <span className="text-muted-foreground">Brauchst du einen individuellen Plan? </span>
            <Link
              href="/contact"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Kontaktiere uns
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
