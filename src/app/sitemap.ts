import { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'
import { getAllBlogPosts } from '@/lib/blog/data'
import { getAllTemplates } from '@/lib/vorlagen/data'
import { getAllGlossarEntries } from '@/lib/glossar/data'
import { getAllZitationsStile } from '@/lib/zitationsstile/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url
  const currentDate = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  // Dynamic blog posts (using German as default for sitemap)
  const blogPosts = getAllBlogPosts('de')
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Vorlagen (Templates) pages - HIGH PRIORITY for SEO
  const templates = getAllTemplates()
  const vorlagenPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/vorlagen`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    ...templates.map((template) => ({
      url: `${baseUrl}/vorlagen/${template.id}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]

  // Glossar (Glossary) pages - HIGH PRIORITY for SEO
  const glossarEntries = getAllGlossarEntries()
  const glossarPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/glossar`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    ...glossarEntries.map((entry) => ({
      url: `${baseUrl}/glossar/${entry.id}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]

  // Zitationsstile (Citation Styles) pages - HIGH PRIORITY for SEO
  const zitationsstile = getAllZitationsStile()
  const zitationsstilePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/zitationsstile`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    ...zitationsstile.map((stil) => ({
      url: `${baseUrl}/zitationsstile/${stil.id}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9, // Very high priority - citation styles are highly searched
    })),
  ]

  return [...staticPages, ...blogPages, ...vorlagenPages, ...glossarPages, ...zitationsstilePages]
}
