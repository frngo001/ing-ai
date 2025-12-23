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
import { getBlogPost } from '@/lib/blog/data'
import { BlogTableOfContents } from '@/components/blog/blog-table-of-contents'

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const blogContent = getBlogPost(postId)

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
      <Navbar />
      {/* Table of Contents - außerhalb des main Elements für fixierte Positionierung */}
      <BlogTableOfContents content={blogContent.content} />
      <main className="flex-1 relative">
        <article className="container mx-auto px-4 py-8 md:py-12 max-w-3xl xl:mr-[280px]">
          {/* Blog Header */}
          <header className="mb-12">
            {/* Author and Date */}
            <div className="text-sm text-muted-foreground mb-6">
              By {blogContent.author.name} - {blogContent.date}
            </div>
            
            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-10 leading-tight tracking-tight">
              {blogContent.title}
            </h1>

            {/* Author Information Card */}
            <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card/50 mb-8">
              <Avatar className="h-14 w-14 flex-shrink-0 border border-border">
                <AvatarImage src={blogContent.author.image} alt={blogContent.author.name} />
                <AvatarFallback className="text-sm">
                  {blogContent.author.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-semibold text-base mb-1">{blogContent.author.name}</h3>
                <p className="text-xs text-muted-foreground mb-1.5">{blogContent.author.title}</p>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                  {blogContent.author.education}
                </p>
                <Link 
                  href={blogContent.author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  LinkedIn
                </Link>
              </div>
            </div>
          </header>

          {/* Blog Content */}
          <div 
            className="blog-content max-w-none prose-lg"
            dangerouslySetInnerHTML={{ __html: blogContent.content }}
          />
        </article>
      </main>
      
      {/* Call to Action Section - Full Width */}
      <section className="w-full mt-16 mb-12">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden p-8 md:p-12">
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
            
            <div className="relative max-w-2xl mx-auto text-center space-y-6">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-medium">
                Bereit zum Starten?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Starte noch heute mit Jenni AI
              </h2>
              <p className="text-lg text-muted-foreground">
                Erlebe die Kraft von KI-gestütztem wissenschaftlichem Schreiben. 
                Schließe dich Millionen von Nutzern an, die bereits schneller und besser schreiben.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link href="/auth/signup">
                  <MorphyButton size="lg">
                    Kostenlos starten
                  </MorphyButton>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full"
                  >
                    Demo ansehen
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Keine Kreditkarte nötig · Kostenloser Plan verfügbar · Jederzeit kündbar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles / Additional CTA - Full Width */}
      <section className="w-full mt-12 mb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
              <h3 className="font-semibold text-lg mb-2">Mehr erfahren</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Entdecke weitere Artikel und Tipps zum wissenschaftlichen Schreiben.
              </p>
              <Link href="/blog" className="text-sm text-primary hover:underline font-medium">
                Alle Artikel ansehen →
              </Link>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
              <h3 className="font-semibold text-lg mb-2">Features entdecken</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Lerne alle Funktionen von Jenni AI kennen und werde produktiver.
              </p>
              <Link href="/#bento-features" className="text-sm text-primary hover:underline font-medium">
                Features ansehen →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

