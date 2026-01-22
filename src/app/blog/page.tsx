"use client"

import * as React from "react"
import Navbar from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { getAllBlogPosts, formatBlogDate } from '@/lib/blog/data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useLanguage } from '@/lib/i18n/use-language'

export default function BlogPage() {
  const { t, language } = useLanguage()
  const posts = getAllBlogPosts(language as 'de' | 'en' | 'es' | 'fr')

  const blogContent = React.useMemo(() => ({
    title: t('pages.blog.list.title'),
    description: t('pages.blog.list.description'),
    readMore: t('pages.blog.list.readMore'),
  }), [t, language])

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {blogContent.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {blogContent.description}
            </p>
          </header>

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author.image} alt={post.author.name} />
                        <AvatarFallback>
                          {post.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBlogDate(post.date, language)}</p>
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                    <div className="mt-4 text-sm text-primary hover:underline">
                      {blogContent.readMore}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
