"use client"

import Image from "next/image"
import Link from "next/link"
import { FooterThemeToggle } from "@/components/footer-theme-toggle"
import { Twitter, Github, Linkedin, Youtube } from "lucide-react"
import { MovingLinesBackground } from "@/components/ui/movinglines-background"
import { siteConfig } from "@/config/site"

const footerLinks = {
    produkt: {
        title: "Produkt",
        links: [
            { label: "Funktionen", href: "#bento-features" },
            { label: "Anwendungsfälle", href: "#use-cases" },
            { label: "Workflow", href: "#how-it-works" },
            { label: "Vorteile", href: "#why-ing" },
            { label: "Preise", href: "#pricing" },
        ],
    },
    ressourcen: {
        title: "Ressourcen",
        links: [
            { label: "Blog", href: "#blog" },
            { label: "Tutorials", href: "#tutorials" },
            { label: "FAQ", href: "#faq" },
            { label: "Testimonials", href: "#testimonials" },
            { label: "Changelog", href: "/changelog" },
        ],
    },
    unternehmen: {
        title: "Unternehmen",
        links: [
            { label: "Über uns", href: "/about" },
            { label: "Karriere", href: "/careers" },
            { label: "Kontakt", href: "/contact" },
        ],
    },
    rechtliches: {
        title: "Rechtliches",
        links: [
            { label: "Datenschutz", href: "/privacy" },
            { label: "AGB", href: "/terms" },
            { label: "Impressum", href: "/imprint" },
        ],
    },
}

const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/ingai", label: "Twitter" },
    { icon: Github, href: "https://github.com/ingai", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com/company/ingai", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/@ingai", label: "YouTube" },
]

export function Footer() {
    return (
        <footer className="border-t border-border bg-background/50 backdrop-blur-xl">
            <MovingLinesBackground className="pt-16 pb-8">
                <div className="container px-4 mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
                        {/* Brand */}
                        <div className="col-span-2">
                            <Link href="/" className="flex items-center space-x-3 mb-4">
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
                            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                                Der KI-gestützte Schreibassistent für akademische Arbeiten.
                                Schreibe schneller, zitiere korrekt und überwinde jede Schreibblockade.
                            </p>
                            <div className="flex space-x-4">
                                {socialLinks.map((social) => (
                                    <Link
                                        key={social.label}
                                        href={social.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={social.label}
                                    >
                                        <social.icon className="size-5" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Produkt */}
                        <div>
                            <h4 className="font-semibold mb-4 text-foreground">{footerLinks.produkt.title}</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                {footerLinks.produkt.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="hover:text-foreground transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Ressourcen */}
                        <div>
                            <h4 className="font-semibold mb-4 text-foreground">{footerLinks.ressourcen.title}</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                {footerLinks.ressourcen.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="hover:text-foreground transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Unternehmen */}
                        <div>
                            <h4 className="font-semibold mb-4 text-foreground">{footerLinks.unternehmen.title}</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                {footerLinks.unternehmen.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="hover:text-foreground transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Rechtliches */}
                        <div>
                            <h4 className="font-semibold mb-4 text-foreground">{footerLinks.rechtliches.title}</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                {footerLinks.rechtliches.links.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="hover:text-foreground transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} {siteConfig.name}. Alle Rechte vorbehalten.</p>
                        <div className="flex items-center gap-6 relative z-50">
                            <Link href="/privacy" className="hover:text-foreground transition-colors">
                                Datenschutz
                            </Link>
                            <Link href="/terms" className="hover:text-foreground transition-colors">
                                AGB
                            </Link>
                            <FooterThemeToggle />
                        </div>
                    </div>
                </div>
            </MovingLinesBackground>
        </footer>
    )
}
