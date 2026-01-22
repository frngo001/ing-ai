"use client"

import * as React from "react"
import { useEffect } from "react"
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MorphyButton } from '@/components/ui/morphy-button'
import { Badge } from '@/components/ui/badge'
import { getBlogPost, formatBlogDate } from '@/lib/blog/data'
import { BlogTableOfContents } from '@/components/blog/blog-table-of-contents'
import { useLanguage } from '@/lib/i18n/use-language'
import { BlogPostSchema } from '@/components/seo/blog-post-schema'
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema'
import { siteConfig } from '@/config/site'

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const postId = params.id as string
  const blogContent = getBlogPost(postId, language as 'de' | 'en' | 'es' | 'fr')

  const translations = React.useMemo(() => ({
    by: t('pages.blog.post.by'),
    linkedin: t('pages.blog.post.linkedin'),
    cta: {
      badge: t('pages.blog.post.cta.badge'),
      title: t('pages.blog.post.cta.title'),
      description: t('pages.blog.post.cta.description'),
      startFree: t('pages.blog.post.cta.startFree'),
      viewDemo: t('pages.blog.post.cta.viewDemo'),
      trustSignals: t('pages.blog.post.cta.trustSignals'),
    },
    related: {
      learnMore: {
        title: t('pages.blog.post.related.learnMore.title'),
        description: t('pages.blog.post.related.learnMore.description'),
        link: t('pages.blog.post.related.learnMore.link'),
      },
      discoverFeatures: {
        title: t('pages.blog.post.related.discoverFeatures.title'),
        description: t('pages.blog.post.related.discoverFeatures.description'),
        link: t('pages.blog.post.related.discoverFeatures.link'),
      },
    },
  }), [t, language])

  useEffect(() => {
    if (!blogContent) {
      router.push('/blog')
    }
  }, [blogContent, router])

  useEffect(() => {
    // Smooth scroll für Anchor-Links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        const href = target.getAttribute('href')
        if (href) {
          const id = href.substring(1)
          const element = document.getElementById(id)
          if (element) {
            e.preventDefault()
            const headerOffset = 80
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            })
          }
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)

    return () => {
      document.removeEventListener('click', handleAnchorClick)
    }
  }, [])

  if (!blogContent) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* SEO: BlogPosting Schema */}
      <BlogPostSchema post={blogContent} />

      {/* SEO: Breadcrumb Schema */}
      <BreadcrumbSchema items={[
        { name: 'Home', url: siteConfig.url },
        { name: 'Blog', url: `${siteConfig.url}/blog` },
        { name: blogContent.title, url: `${siteConfig.url}/blog/${blogContent.id}` }
      ]} />

      <Navbar />
      <div className="flex-1 flex relative" style={{ marginTop: 0 }}>
        {/* Blog Content - Left Column */}
        <main className="flex-1 overflow-y-auto">
          <article className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
            {/* Blog Header */}
            <header className="mb-8 md:mb-12">
              {/* Author and Date */}
              <div className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                {translations.by} {blogContent.author.name} - {formatBlogDate(blogContent.date, language)}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-10 leading-snug tracking-tight">
                {blogContent.title}
              </h1>

              {/* Author Information Card */}
              <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border border-border bg-card/50 mb-6 md:mb-8">
                <Avatar className="h-10 w-10 md:h-14 md:w-14 flex-shrink-0 border border-border">
                  <AvatarImage src={blogContent.author.image} alt={blogContent.author.name} />
                  <AvatarFallback className="text-xs md:text-sm">
                    {blogContent.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="font-semibold text-sm md:text-base mb-0.5 md:mb-1">{blogContent.author.name}</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-1.5">{blogContent.author.title}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1.5 md:mb-2 leading-relaxed line-clamp-2 md:line-clamp-none">
                    {blogContent.author.education}
                  </p>
                  <Link
                    href={blogContent.author.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] md:text-xs text-primary hover:underline font-medium"
                  >
                    {translations.linkedin}
                  </Link>
                </div>
              </div>
            </header>

            {/* Blog Content */}
            <div
              className="blog-content max-w-none prose prose-neutral dark:prose-invert prose-sm sm:prose-base md:prose-lg"
              dangerouslySetInnerHTML={{ __html: blogContent.content }}
            />
          </article>
        </main>

        {/* TOC - Right Column (Fixed) */}
        <BlogTableOfContents content={blogContent.content} />
      </div>

      {/* Call to Action Section - Full Width */}
      <section className="w-full mt-0 mb-12 bg-muted/30 dark:bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 bg-background border border-border">
            {/* Dynamic Animated Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              {/* Primary animated blob */}
              <div
                className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-40 blur-[100px] animate-blob-pulse"
                style={{
                  background: "linear-gradient(135deg, rgba(62, 207, 142, 0.3) 0%, rgba(20, 184, 166, 0.2) 50%, rgba(16, 185, 129, 0.15) 100%)",
                }}
              />
              {/* Secondary floating blob - left */}
              <div
                className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full opacity-30 blur-[80px] animate-float-slow"
                style={{
                  background: "radial-gradient(circle, rgba(62, 207, 142, 0.4) 0%, transparent 70%)",
                }}
              />
              {/* Tertiary floating blob - right */}
              <div
                className="absolute top-[30%] right-[5%] w-[400px] h-[400px] rounded-full opacity-25 blur-[70px] animate-float-delayed"
                style={{
                  background: "radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, transparent 70%)",
                }}
              />
              {/* Base gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5" />
            </div>

            <div className="relative max-w-2xl mx-auto text-center space-y-4 md:space-y-6">
              <Badge variant="outline" className="text-[10px] md:text-xs uppercase tracking-wider font-medium">
                {translations.cta.badge}
              </Badge>
              <h2 className="text-xl md:text-4xl font-bold tracking-tight">
                {translations.cta.title}
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground">
                {translations.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-2">
                <Link href="/auth/signup">
                  <MorphyButton size="lg" className="scale-90 md:scale-100">
                    {translations.cta.startFree}
                  </MorphyButton>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-10 md:h-12 px-6 md:px-8 text-sm md:text-base"
                  >
                    {translations.cta.viewDemo}
                  </Button>
                </Link>
              </div>
              <p className="text-[10px] md:text-sm text-muted-foreground pt-2">
                {translations.cta.trustSignals}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles / Additional CTA - Full Width */}
      <section className="w-full mt-12 mb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-4 md:p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
              <h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">{translations.related.learnMore.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                {translations.related.learnMore.description}
              </p>
              <Link href="/blog" className="text-xs md:text-sm text-primary hover:underline font-medium">
                {translations.related.learnMore.link}
              </Link>
            </div>
            <div className="p-4 md:p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
              <h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">{translations.related.discoverFeatures.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                {translations.related.discoverFeatures.description}
              </p>
              <Link href="/#bento-features" className="text-xs md:text-sm text-primary hover:underline font-medium">
                {translations.related.discoverFeatures.link}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

