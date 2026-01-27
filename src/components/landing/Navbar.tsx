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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// =============================================================================
// MAIN NAVBAR COMPONENT
// =============================================================================

export default function Navbar() {
  return (
    <header className="sticky top-0 z-[100] border-b bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <DesktopNav />

        {/* Desktop Auth Buttons */}
        <AuthButtons />

        {/* Mobile Menu Toggle & Drawer */}
        <MobileDrawer />
      </div>
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
      className="group relative flex shrink-0 items-center gap-2 text-lg font-semibold transition-transform hover:scale-105"
      aria-label="Ing AI Home"
    >
      <div className="relative h-10 w-10 sm:h-16 sm:w-16 md:h-20 md:w-20">
        <Image
          src="/logos/logosApp/ing_AI.png"
          alt="Ing AI Logo"
          fill
          sizes="(max-width: 640px) 40px, (max-width: 768px) 64px, 80px"
          className="object-contain"
          priority
        />
      </div>
    </Link>
  )
}

function MobileDrawer() {
  const [open, setOpen] = React.useState(false)
  const ctaHref = useCTAHref()
  const { t } = useLanguage()

  const navItems = {
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
        { title: t('landing.navbar.resources.links.templates.title'), href: "/vorlagen" },
        { title: t('landing.navbar.resources.links.glossary.title'), href: "/glossar" },
        { title: t('landing.navbar.resources.links.citationStyles.title'), href: "/zitationsstile" },
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
  }

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-10 w-10">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Fullscreen Mobile Menu */}
      {open && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-neutral-950">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 bg-white dark:bg-neutral-950">
            <div className="h-10 w-10">
              <Image
                src="/logos/logosApp/ing_AI.png"
                alt="Ing AI"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Content */}
          <div className="h-[calc(100vh-80px)] overflow-y-auto bg-white dark:bg-neutral-950">
            <nav className="px-6 py-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="produkt" className="border-none">
                  <AccordionTrigger className="py-2.5 text-base font-medium hover:no-underline">
                    {navItems.produkt.label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2.5 pl-4 pb-2">
                      {navItems.produkt.links.map((link) => (
                        <Link
                          key={link.title}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground py-0.5"
                        >
                          {link.title}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="features" className="border-none">
                  <AccordionTrigger className="py-2.5 text-base font-medium hover:no-underline">
                    {navItems.features.label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2.5 pl-4 pb-2">
                      {navItems.features.links.map((link) => (
                        <Link
                          key={link.title}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground py-0.5"
                        >
                          {link.title}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ressourcen" className="border-none">
                  <AccordionTrigger className="py-2.5 text-base font-medium hover:no-underline">
                    {navItems.ressourcen.label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2.5 pl-4 pb-2">
                      {navItems.ressourcen.links.map((link) => (
                        <Link
                          key={link.title}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground py-0.5"
                        >
                          {link.title}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Direct Links */}
              <div className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 mt-4 pt-6">
                {navItems.directLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-base font-medium transition-colors hover:text-primary py-0.5"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Auth Buttons */}
              <div className="flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-800 mt-6 pt-6">
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm font-semibold transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  {t('landing.navbar.login')}
                </Link>
                <Button asChild size="lg" className="h-12 rounded-xl font-semibold">
                  <Link href={ctaHref} onClick={() => setOpen(false)}>
                    {t('landing.navbar.startFree')}
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
function DesktopNav() {
  const { t } = useLanguage()

  const navItems = {
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
        { title: t('landing.navbar.resources.links.templates.title'), href: "/vorlagen", description: t('landing.navbar.resources.links.templates.description') },
        { title: t('landing.navbar.resources.links.glossary.title'), href: "/glossar", description: t('landing.navbar.resources.links.glossary.description') },
        { title: t('landing.navbar.resources.links.citationStyles.title'), href: "/zitationsstile", description: t('landing.navbar.resources.links.citationStyles.description') },
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
  }

  return (
    <NavigationMenu className="hidden flex-1 px-8 md:flex">
      <NavigationMenuList className="flex items-center justify-center gap-1">
        {/* Produkt Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>{navItems.produkt.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-4">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none transition-colors hover:bg-muted focus:shadow-md"
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
            <ul className="grid gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
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
  const { t } = useLanguage()

  return (
    <div className="hidden items-center gap-3 md:flex">
      <Link
        href="/auth/login"
        className="text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
      >
        {t('landing.navbar.login')}
      </Link>
      <Button asChild size="sm" className="rounded-full px-5 font-semibold">
        <Shine asChild duration={1500} loop delay={2000} color="rgba(255, 255, 255, 0.4)">
          <Link href={ctaHref}>{t('landing.navbar.startFree')}</Link>
        </Shine>
      </Button>
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
            "block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
