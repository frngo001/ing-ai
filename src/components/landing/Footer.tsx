"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { FooterThemeToggle } from "@/components/footer-theme-toggle"
import { Twitter, Github, Linkedin, Youtube } from "lucide-react"
import { MovingLinesBackground } from "@/components/ui/movinglines-background"
import { siteConfig } from "@/config/site"
import { useLanguage } from "@/lib/i18n/use-language"

const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/ingai", label: "Twitter" },
    { icon: Github, href: "https://github.com/ingai", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com/company/ingai", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/@ingai", label: "YouTube" },
]

export function Footer() {
    const { t, language } = useLanguage()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const footerLinks = React.useMemo(() => ({
        produkt: {
            title: t('landing.footer.product.title'),
            links: [
                { label: t('landing.footer.product.links.features'), href: "#bento-features" },
                { label: t('landing.footer.product.links.useCases'), href: "#use-cases" },
                { label: t('landing.footer.product.links.workflow'), href: "#how-it-works" },
                { label: t('landing.footer.product.links.advantages'), href: "#why-ing" },
                { label: t('landing.footer.product.links.pricing'), href: "#pricing" },
            ],
        },
        ressourcen: {
            title: t('landing.footer.resources.title'),
            links: [
                { label: t('landing.footer.resources.links.blog'), href: "#blog" },
                { label: t('landing.footer.resources.links.tutorials'), href: "#tutorials" },
                { label: t('landing.footer.resources.links.faq'), href: "#faq" },
                { label: t('landing.footer.resources.links.testimonials'), href: "#testimonials" },
                { label: t('landing.footer.resources.links.changelog'), href: "/changelog" },
            ],
        },
        unternehmen: {
            title: t('landing.footer.company.title'),
            links: [
                { label: t('landing.footer.company.links.about'), href: "/about" },
                { label: t('landing.footer.company.links.careers'), href: "/careers" },
                { label: t('landing.footer.company.links.contact'), href: "/contact" },
            ],
        },
        rechtliches: {
            title: t('landing.footer.legal.title'),
            links: [
                { label: t('landing.footer.legal.links.privacy'), href: "/privacy" },
                { label: t('landing.footer.legal.links.terms'), href: "/terms" },
                { label: t('landing.footer.legal.links.imprint'), href: "/imprint" },
            ],
        },
    }), [t, language])

    if (!mounted) return null

    return (
        <footer className="border-t border-border bg-background/50 backdrop-blur-xl">
            <MovingLinesBackground className="pt-8 pb-6 md:pt-16 md:pb-12">
                <div className="container px-4 mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-8 md:gap-8 mb-10 md:mb-12">
                        {/* Brand */}
                        <div className="col-span-2">
                            <Link href="/" className="flex items-center space-x-3 mb-3" aria-label="Ing AI Home">
                                <div className="relative h-12 w-12 md:h-20 md:w-20">
                                    <Image
                                        src="/logos/logosApp/ing_AI.png"
                                        alt="Ing AI"
                                        fill
                                        sizes="(max-width: 768px) 48px, 80px"
                                        className="object-contain"
                                        loading="lazy"
                                    />
                                </div>
                            </Link>
                            <p className="text-[10px] md:text-sm text-muted-foreground mb-5 md:mb-6 max-w-xs leading-relaxed">
                                {t('landing.footer.description')}
                            </p>
                            <div className="flex space-x-3 md:space-x-4">
                                {socialLinks.map((social) => (
                                    <Link
                                        key={social.label}
                                        href={social.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={social.label}
                                    >
                                        <social.icon className="size-4 md:size-5" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Produkt */}
                        <div>
                            <h3 className="font-semibold mb-3 md:mb-4 text-xs md:text-base text-foreground">{footerLinks.produkt.title}</h3>
                            <ul className="space-y-2 md:space-y-3 text-[11px] md:text-sm text-muted-foreground">
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
                            <h3 className="font-semibold mb-3 md:mb-4 text-xs md:text-base text-foreground">{footerLinks.ressourcen.title}</h3>
                            <ul className="space-y-2 md:space-y-3 text-[11px] md:text-sm text-muted-foreground">
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
                            <h3 className="font-semibold mb-3 md:mb-4 text-xs md:text-base text-foreground">{footerLinks.unternehmen.title}</h3>
                            <ul className="space-y-2 md:space-y-3 text-[11px] md:text-sm text-muted-foreground">
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
                            <h3 className="font-semibold mb-3 md:mb-4 text-xs md:text-base text-foreground">{footerLinks.rechtliches.title}</h3>
                            <ul className="space-y-2 md:space-y-3 text-[11px] md:text-sm text-muted-foreground">
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
                    <div className="border-t border-border pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-[10px] md:text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} {siteConfig.name}. {t('landing.footer.copyright')}</p>
                        <div className="flex items-center gap-4 md:gap-6 relative z-50">
                            <Link href="/privacy" className="hover:text-foreground transition-colors">
                                {t('landing.footer.privacy')}
                            </Link>
                            <Link href="/terms" className="hover:text-foreground transition-colors">
                                {t('landing.footer.terms')}
                            </Link>
                            <FooterThemeToggle />
                        </div>
                    </div>
                </div>
            </MovingLinesBackground>
        </footer>
    )
}
