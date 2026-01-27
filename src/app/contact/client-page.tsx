"use client"

import * as React from "react"
import Link from "next/link"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { siteConfig } from '@/config/site'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import Glow from '@/components/ui/glow'
import {
    Card,
    CardContent,
} from '@/components/ui/card-hover'
import { Send, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/use-language'

type ContactFormValues = z.infer<ReturnType<typeof getContactFormSchema>>

function getContactFormSchema(t: (key: string) => string) {
    return z.object({
        name: z.string().min(2, {
            message: t('pages.contact.validation.nameMin'),
        }),
        email: z.string().email({
            message: t('pages.contact.validation.emailInvalid'),
        }),
        subject: z.string().min(3, {
            message: t('pages.contact.validation.subjectMin'),
        }),
        message: z.string().min(10, {
            message: t('pages.contact.validation.messageMin'),
        }),
    })
}

export default function ContactPage() {
    const { t, language } = useLanguage()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const contactFormSchema = React.useMemo(() => getContactFormSchema(t), [t, language])

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    })

    async function onSubmit(data: ContactFormValues) {
        setIsSubmitting(true)

        // Simuliere API-Aufruf
        await new Promise((resolve) => setTimeout(resolve, 1500))

        console.log("Formular gesendet:", data)

        setIsSubmitting(false)
        setIsSubmitted(true)
        form.reset()

        // Nach 5 Sekunden zurücksetzen
        setTimeout(() => {
            setIsSubmitted(false)
        }, 5000)
    }

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
                                {t('pages.contact.badge')}
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground">
                                {t('pages.contact.title')}
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground">
                                {t('pages.contact.description')}
                            </p>
                        </ScrollReveal>
                    </div>
                </section>

                {/* Contact Form & Info Section */}
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
                        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
                    </div>
                    <div className="container px-4 mx-auto">
                        <div className="max-w-2xl mx-auto">
                            {/* Contact Form */}
                            <ScrollReveal>
                                <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/20">
                                    <CardContent className="pt-6">
                                        <h2 className="text-2xl font-bold mb-6">{t('pages.contact.form.title')}</h2>

                                        {isSubmitted ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">{t('pages.contact.form.success.title')}</h3>
                                                <p className="text-muted-foreground">
                                                    {t('pages.contact.form.success.description')}
                                                </p>
                                            </div>
                                        ) : (
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t('pages.contact.form.name')}</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder={t('pages.contact.form.namePlaceholder')} {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t('pages.contact.form.email')}</FormLabel>
                                                                <FormControl>
                                                                    <Input type="email" placeholder={t('pages.contact.form.emailPlaceholder')} {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="subject"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t('pages.contact.form.subject')}</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder={t('pages.contact.form.subjectPlaceholder')} {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="message"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{t('pages.contact.form.message')}</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder={t('pages.contact.form.messagePlaceholder')}
                                                                        className="min-h-32"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <Button
                                                        type="submit"
                                                        size="lg"
                                                        className="w-full rounded-full"
                                                        disabled={isSubmitting}
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <span className="mr-2">{t('pages.contact.form.sending')}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="mr-2 h-4 w-4" />
                                                                {t('pages.contact.form.submit')}
                                                            </>
                                                        )}
                                                    </Button>
                                                </form>
                                            </Form>
                                        )}
                                    </CardContent>
                                </Card>
                            </ScrollReveal>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-muted/30">
                    <div className="container px-4 mx-auto">
                        <ScrollReveal className="max-w-2xl mx-auto text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                {t('pages.contact.cta.title')}
                            </h2>
                            <p className="text-muted-foreground mb-8">
                                {t('pages.contact.cta.description')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg" className="rounded-full">
                                    <Link href="/auth/signup">{t('pages.contact.cta.startFree')}</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="rounded-full">
                                    <Link href="/about">{t('pages.contact.cta.learnMore')}</Link>
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
