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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"

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
      <div className="relative h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20">
        <Image
          src="/logos/logosApp/ing_AI.png"
          alt="Ing AI"
          fill
          sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 80px"
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
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-10 w-10 shrink-0">
            <Menu className={cn("h-6 w-6 transition-all", open ? "scale-0 opacity-0" : "scale-100 opacity-100")} />
            <X className={cn("absolute h-6 w-6 transition-all", open ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm [&>button]:hidden h-[100dvh]">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Access our product, features, resources, and pricing.
          </SheetDescription>

          <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-4">
            <div className="h-10 w-10">
              <Image
                src="/logos/logosApp/ing_AI.png"
                alt="Ing AI"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-6 w-6" />
              </Button>
            </SheetClose>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6">
                <nav className="flex flex-col py-8">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="produkt" className="border-none">
                      <AccordionTrigger className="py-2 text-lg font-medium hover:no-underline">
                        {navItems.produkt.label}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-3 pl-4 pt-2">
                          {navItems.produkt.links.map((link) => (
                            <Link
                              key={link.title}
                              href={link.href}
                              onClick={() => setOpen(false)}
                              className="text-base text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="features" className="border-none">
                      <AccordionTrigger className="py-2 text-lg font-medium hover:no-underline">
                        {navItems.features.label}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-3 pl-4 pt-2">
                          {navItems.features.links.map((link) => (
                            <Link
                              key={link.title}
                              href={link.href}
                              onClick={() => setOpen(false)}
                              className="text-base text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="ressourcen" className="border-none">
                      <AccordionTrigger className="py-2 text-lg font-medium hover:no-underline">
                        {navItems.ressourcen.label}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-3 pl-4 pt-2">
                          {navItems.ressourcen.links.map((link) => (
                            <Link
                              key={link.title}
                              href={link.href}
                              onClick={() => setOpen(false)}
                              className="text-base text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="flex flex-col gap-4 border-t pt-6">
                    {navItems.directLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>

              <div className="flex-shrink-0 border-t bg-muted/30 p-6 backdrop-blur-lg">
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="flex h-11 items-center justify-center rounded-xl border bg-background text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    {t('landing.navbar.login')}
                  </Link>
                  <Button asChild size="lg" className="h-11 rounded-xl font-semibold shadow-lg shadow-primary/20">
                    <Link href={ctaHref} onClick={() => setOpen(false)}>
                      {t('landing.navbar.startFree')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
        </SheetContent>
      </Sheet>
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
