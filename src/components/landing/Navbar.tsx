"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { CircleCheckIcon, Menu, X } from "lucide-react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Shine } from "@/components/animate-ui/primitives/effects/shine"

// =============================================================================
// NAVIGATION DATA
// =============================================================================

const NAV_ITEMS = {
  produkt: {
    label: "Produkt",
    featured: {
      title: siteConfig.name,
      description: "KI-gestütztes Schreiben, Recherchieren und Veröffentlichen in einem Editor.",
      href: "/",
    },
    links: [
      { title: "Funktionen", href: "/#bento-features", description: "KI-Autocomplete, Zitationen und mehr." },
      { title: "Anwendungsfälle", href: "/#use-cases", description: "Für Studierende, Forscher und Professionals." },
      { title: "Workflow", href: "/#how-it-works", description: "Von der leeren Seite zur fertigen Arbeit." },
      { title: "Vorteile", href: "/#why-ing", description: "Warum Ing AI die beste Wahl ist." },
    ],
  },
  features: {
    label: "Features",
    links: [
      { title: "KI-Autocomplete", href: "/#bento-features", description: "Intelligente Satzvervollständigung mit Kontext." },
      { title: "Sofortige Zitationen", href: "/#bento-features", description: "APA, MLA, Chicago und 20+ weitere Stile." },
      { title: "Chat mit PDFs", href: "/#bento-features", description: "Fragen an deine Forschungsarbeiten stellen." },
      { title: "Forschungsbibliothek", href: "/#bento-features", description: "PDFs, Notizen und Quellen organisieren." },
      { title: "Mehrsprachig", href: "/#bento-features", description: "Schreiben in 20+ Sprachen." },
      { title: "Plagiatsprüfung", href: "/#why-ing", description: "Sicherheit beim Veröffentlichen." },
    ],
  },
  ressourcen: {
    label: "Ressourcen",
    links: [
      { title: "Blog", href: "/blog", description: "Tipps und Guides für akademisches Schreiben." },
      { title: "Tutorials", href: "/#tutorials", description: "Video-Anleitungen für alle Features." },
      { title: "Changelog", href: "/changelog", description: "Neue Updates und Verbesserungen." },
      { title: "Testimonials", href: "/#testimonials", description: "Erfahrungen von 5M+ Forschern." },
      { title: "FAQ", href: "/#faq", description: "Antworten auf häufige Fragen." },
    ],
  },
  directLinks: [
    { label: "Preise", href: "/#pricing" },
    { label: "Über uns", href: "/about" },
  ],
} as const

// =============================================================================
// MAIN NAVBAR COMPONENT
// =============================================================================

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <DesktopNav />

        {/* Auth Buttons */}
        <AuthButtons />

        {/* Mobile Menu Toggle */}
        <MobileMenuToggle
          isOpen={mobileMenuOpen}
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
    </header>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function Logo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 text-lg font-semibold"
    >
      <div className="relative h-20 w-20">
        <Image
          src="/logos/logosApp/ing_AI.png"
          alt="Ing AI"
          fill
          sizes="80px"
          className="object-contain"
          priority
        />
      </div>
    </Link>
  )
}

function DesktopNav() {
  return (
    <NavigationMenu className="hidden flex-1 md:flex">
      <NavigationMenuList className="flex items-center justify-center gap-1">
        {/* Produkt Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>{NAV_ITEMS.produkt.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-4">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none transition-colors hover:bg-muted focus:shadow-md"
                    href={NAV_ITEMS.produkt.featured.href}
                  >
                    <CircleCheckIcon className="h-6 w-6 text-primary" />
                    <div className="mb-2 mt-4 text-lg font-medium">
                      {NAV_ITEMS.produkt.featured.title}
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      {NAV_ITEMS.produkt.featured.description}
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {NAV_ITEMS.produkt.links.map((item) => (
                <NavListItem key={item.title} href={item.href} title={item.title}>
                  {item.description}
                </NavListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Features Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>{NAV_ITEMS.features.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {NAV_ITEMS.features.links.map((item) => (
                <NavListItem key={item.title} href={item.href} title={item.title}>
                  {item.description}
                </NavListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Ressourcen Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>{NAV_ITEMS.ressourcen.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px]">
              {NAV_ITEMS.ressourcen.links.map((item) => (
                <NavListItem key={item.title} href={item.href} title={item.title}>
                  {item.description}
                </NavListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Direct Links */}
        {NAV_ITEMS.directLinks.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href={link.href}>{link.label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function AuthButtons() {
  return (
    <div className="hidden items-center gap-3 md:flex">
      <Link
        href="/auth/login"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Login
      </Link>
      <Button asChild size="sm" className="rounded-full px-4">
        <Shine asChild duration={1500} loop delay={2000} color="rgba(255, 255, 255, 0.4)">
          <Link href="/editor">Kostenlos starten</Link>
        </Shine>
      </Button>
    </div>
  )
}

function MobileMenuToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={onToggle}
      aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  )
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-t bg-background px-4 py-4 md:hidden">
      <nav className="flex flex-col gap-4">
        {/* Produkt Section */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {NAV_ITEMS.produkt.label}
          </p>
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.produkt.links.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                onClick={onClose}
                className="text-sm text-foreground/80 transition-colors hover:text-foreground"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {NAV_ITEMS.features.label}
          </p>
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.features.links.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                onClick={onClose}
                className="text-sm text-foreground/80 transition-colors hover:text-foreground"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Ressourcen Section */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {NAV_ITEMS.ressourcen.label}
          </p>
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.ressourcen.links.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                onClick={onClose}
                className="text-sm text-foreground/80 transition-colors hover:text-foreground"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Direct Links */}
        <div className="flex flex-col gap-2">
          {NAV_ITEMS.directLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="mt-2 flex flex-col gap-2 border-t pt-4">
          <Link
            href="/auth/login"
            onClick={onClose}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/editor" onClick={onClose}>
              Kostenlos starten
            </Link>
          </Button>
        </div>
      </nav>
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function NavListItem({
  title,
  children,
  href,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
