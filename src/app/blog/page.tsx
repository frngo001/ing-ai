"use client"

import * as React from "react"
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { getAllBlogPosts, formatBlogDate } from '@/lib/blog/data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useLanguage } from '@/lib/i18n/use-language'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { m, AnimatePresence } from 'framer-motion'

export default function BlogPage() {
  const { t, language } = useLanguage()
  const [activeCategory, setActiveCategory] = React.useState<string>('All')
  const posts = getAllBlogPosts(language as 'de' | 'en' | 'es' | 'fr')

  const blogContent = React.useMemo(() => ({
    title: t('pages.blog.list.title'),
    description: t('pages.blog.list.description'),
    readMore: t('pages.blog.list.readMore'),
    allPosts: t('pages.blog.list.allPosts') || 'Alle Beiträge', // Fallback if translation missing
  }), [t, language])

  // Extract unique categories from posts
  const categories = React.useMemo(() => {
    const allTags = posts.flatMap(post => post.tags || [])
    // Count occurrences to sort by popularity if needed, or just unique
    const uniqueTags = Array.from(new Set(allTags)).sort()
    return ['All', ...uniqueTags]
  }, [posts])

  // Filter posts based on active category
  const filteredPosts = React.useMemo(() => {
    if (activeCategory === 'All') return posts
    return posts.filter(post => post.tags?.includes(activeCategory))
  }, [posts, activeCategory])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
          {/* Header */}
          <header className="mb-6 sm:mb-8 md:mb-12 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 tracking-tight">
              {blogContent.title}
            </h1>
            <p className="text-xs sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
              {blogContent.description}
            </p>
          </header>

          {/* Category Filter */}
          <div className="mb-8 md:mb-12 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex items-center gap-2 sm:gap-3 sm:justify-center min-w-max">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full transition-all text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4",
                    activeCategory === category
                      ? "shadow-md hover:shadow-lg"
                      : "hover:bg-muted bg-background/50 backdrop-blur-sm"
                  )}
                >
                  {category === 'All' ? blogContent.allPosts : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Blog Posts Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto min-h-[50vh]">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post) => (
                <m.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={`/blog/${post.id}`} className="h-full block">
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-border/60 bg-card/50 backdrop-blur-sm">
                      <CardHeader className="p-3 sm:p-5 md:p-6 space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 ring-2 ring-background">
                            <AvatarImage src={post.author.image} alt={post.author.name} />
                            <AvatarFallback className="text-[10px] sm:text-xs md:text-sm">
                              {post.author.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-sm font-medium truncate leading-tight">{post.author.name}</p>
                            <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">{formatBlogDate(post.date, language)}</p>
                          </div>
                        </div>
                        <CardTitle className="line-clamp-2 text-sm sm:text-lg md:text-xl font-bold leading-snug">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-5 md:p-6 pt-0 sm:pt-0 md:pt-0">
                        <CardDescription className="line-clamp-2 md:line-clamp-3 text-[10px] sm:text-sm text-balance leading-relaxed mb-3">
                          {post.excerpt}
                        </CardDescription>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2 sm:mb-3">
                            {post.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 text-muted-foreground">+{post.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] sm:text-sm text-primary group-hover:underline font-medium flex items-center gap-1">
                          {blogContent.readMore}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </m.div>
              ))}
            </AnimatePresence>
            {filteredPosts.length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground animate-in fade-in">
                <p>Keine Beiträge in dieser Kategorie gefunden.</p>
                <Button
                  variant="link"
                  onClick={() => setActiveCategory('All')}
                  className="mt-2"
                >
                  Alle Beiträge anzeigen
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
