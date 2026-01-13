"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { CircleCheckIcon, Menu, X } from "lucide-react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { useCTAHref } from "@/hooks/use-auth"
import { useLanguage } from "@/lib/i18n/use-language"

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
      aria-label="Ing AI Home"
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
  const [mounted, setMounted] = React.useState(false)
  const { t, language } = useLanguage()

  const navItems = React.useMemo(() => ({
    produkt: {
      label: t('landing.navbar.product.label'),
      featured: {
        title: siteConfig.name,
        description: t('landing.navbar.product.featured.description'),
        href: "/",
      },
      links: [
        { title: t('landing.navbar.product.links.functions.title'), href: "/#bento-features", description: t('landing.navbar.product.links.functions.description') },
        { title: t('landing.navbar.product.links.useCases.title'), href: "/#use-cases", description: t('landing.navbar.product.links.useCases.description') },
        { title: t('landing.navbar.product.links.workflow.title'), href: "/#how-it-works", description: t('landing.navbar.product.links.workflow.description') },
        { title: t('landing.navbar.product.links.advantages.title'), href: "/#why-ing", description: t('landing.navbar.product.links.advantages.description') },
      ],
    },
    features: {
      label: t('landing.navbar.features.label'),
      links: [
        { title: t('landing.navbar.features.links.autocomplete.title'), href: "/#bento-features", description: t('landing.navbar.features.links.autocomplete.description') },
        { title: t('landing.navbar.features.links.citations.title'), href: "/#bento-features", description: t('landing.navbar.features.links.citations.description') },
        { title: t('landing.navbar.features.links.pdfChat.title'), href: "/#bento-features", description: t('landing.navbar.features.links.pdfChat.description') },
        { title: t('landing.navbar.features.links.library.title'), href: "/#bento-features", description: t('landing.navbar.features.links.library.description') },
        { title: t('landing.navbar.features.links.multilingual.title'), href: "/#bento-features", description: t('landing.navbar.features.links.multilingual.description') },
        { title: t('landing.navbar.features.links.plagiarism.title'), href: "/#why-ing", description: t('landing.navbar.features.links.plagiarism.description') },
      ],
    },
    ressourcen: {
      label: t('landing.navbar.resources.label'),
      links: [
        { title: t('landing.navbar.resources.links.blog.title'), href: "/blog", description: t('landing.navbar.resources.links.blog.description') },
        { title: t('landing.navbar.resources.links.tutorials.title'), href: "/#tutorials", description: t('landing.navbar.resources.links.tutorials.description') },
        { title: t('landing.navbar.resources.links.changelog.title'), href: "/changelog", description: t('landing.navbar.resources.links.changelog.description') },
        { title: t('landing.navbar.resources.links.testimonials.title'), href: "/#testimonials", description: t('landing.navbar.resources.links.testimonials.description') },
        { title: t('landing.navbar.resources.links.faq.title'), href: "/#faq", description: t('landing.navbar.resources.links.faq.description') },
      ],
    },
    directLinks: [
      { label: t('landing.navbar.directLinks.pricing'), href: "/#pricing" },
      { label: t('landing.navbar.directLinks.about'), href: "/about" },
    ],
  }), [t, language])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <nav className="hidden flex-1 md:flex">
        <div className="flex items-center justify-center gap-1" />
      </nav>
    )
  }

  return (
    <NavigationMenu className="hidden flex-1 md:flex">
      <NavigationMenuList className="flex items-center justify-center gap-1">
        {/* Produkt Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>{navItems.produkt.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-4">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none transition-colors hover:bg-muted focus:shadow-md"
                    href={navItems.produkt.featured.href}
                  >
                    <CircleCheckIcon className="h-6 w-6 text-primary" />
                    <div className="mb-2 mt-4 text-lg font-medium">
                      {navItems.produkt.featured.title}
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      {navItems.produkt.featured.description}
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {navItems.produkt.links.map((item) => (
                <NavListItem key={item.title} href={item.href} title={item.title}>
                  {item.description}
                </NavListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Features Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>{navItems.features.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {navItems.features.links.map((item) => (
                <NavListItem key={item.title} href={item.href} title={item.title}>
                  {item.description}
                </NavListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Ressourcen Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>{navItems.ressourcen.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px]">
              {navItems.ressourcen.links.map((item) => (
                <NavListItem key={item.title} href={item.href} title={item.title}>
                  {item.description}
                </NavListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Direct Links */}
        {navItems.directLinks.map((link) => (
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
  const ctaHref = useCTAHref()
  const { t, language } = useLanguage()

  return (
    <div className="hidden items-center gap-3 md:flex">
      <Link
        href="/auth/login"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t('landing.navbar.login')}
      </Link>
      <Button asChild size="sm" className="rounded-full px-4">
        <Shine asChild duration={1500} loop delay={2000} color="rgba(255, 255, 255, 0.4)">
          <Link href={ctaHref}>{t('landing.navbar.startFree')}</Link>
        </Shine>
      </Button>
    </div>
  )
}

function MobileMenuToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { t, language } = useLanguage()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={onToggle}
      aria-label={isOpen ? t('landing.navbar.menuClose') : t('landing.navbar.menuOpen')}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  )
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const ctaHref = useCTAHref()
  const { t, language } = useLanguage()

  const navItems = React.useMemo(() => ({
    produkt: {
      label: t('landing.navbar.product.label'),
      links: [
        { title: t('landing.navbar.product.links.functions.title'), href: "/#bento-features" },
        { title: t('landing.navbar.product.links.useCases.title'), href: "/#use-cases" },
        { title: t('landing.navbar.product.links.workflow.title'), href: "/#how-it-works" },
        { title: t('landing.navbar.product.links.advantages.title'), href: "/#why-ing" },
      ],
    },
    features: {
      label: t('landing.navbar.features.label'),
      links: [
        { title: t('landing.navbar.features.links.autocomplete.title'), href: "/#bento-features" },
        { title: t('landing.navbar.features.links.citations.title'), href: "/#bento-features" },
        { title: t('landing.navbar.features.links.pdfChat.title'), href: "/#bento-features" },
        { title: t('landing.navbar.features.links.library.title'), href: "/#bento-features" },
        { title: t('landing.navbar.features.links.multilingual.title'), href: "/#bento-features" },
        { title: t('landing.navbar.features.links.plagiarism.title'), href: "/#why-ing" },
      ],
    },
    ressourcen: {
      label: t('landing.navbar.resources.label'),
      links: [
        { title: t('landing.navbar.resources.links.blog.title'), href: "/blog" },
        { title: t('landing.navbar.resources.links.tutorials.title'), href: "/#tutorials" },
        { title: t('landing.navbar.resources.links.changelog.title'), href: "/changelog" },
        { title: t('landing.navbar.resources.links.testimonials.title'), href: "/#testimonials" },
        { title: t('landing.navbar.resources.links.faq.title'), href: "/#faq" },
      ],
    },
    directLinks: [
      { label: t('landing.navbar.directLinks.pricing'), href: "/#pricing" },
      { label: t('landing.navbar.directLinks.about'), href: "/about" },
    ],
  }), [t, language])

  return (
    <div className="border-t bg-background px-4 py-4 md:hidden">
      <nav className="flex flex-col gap-4">
        {/* Produkt Section */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {navItems.produkt.label}
          </p>
          <div className="flex flex-col gap-2">
            {navItems.produkt.links.map((link) => (
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
            {navItems.features.label}
          </p>
          <div className="flex flex-col gap-2">
            {navItems.features.links.map((link) => (
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
            {navItems.ressourcen.label}
          </p>
          <div className="flex flex-col gap-2">
            {navItems.ressourcen.links.map((link) => (
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
          {navItems.directLinks.map((link) => (
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
            {t('landing.navbar.login')}
          </Link>
          <Button asChild size="sm" className="rounded-full">
            <Link href={ctaHref} onClick={onClose}>
              {t('landing.navbar.startFree')}
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
