import { siteConfig } from '@/config/site'
import { BlogPost } from '@/lib/blog/data'

interface BlogPostSchemaProps {
  post: BlogPost
}

/**
 * BlogPosting Schema for individual blog posts
 * Helps Google understand the content and show rich snippets
 */
export function BlogPostSchema({ post }: BlogPostSchemaProps) {
  const blogPostSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.title,
      description: post.author.education,
      url: post.author.linkedin,
      image: post.author.image,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logos/logosApp/ing_AI.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${post.id}`,
    },
    url: `${siteConfig.url}/blog/${post.id}`,
    image: post.image || `${siteConfig.url}/opengraph-image`,
    keywords: post.tags?.join(', ') || 'Wissenschaftliches Schreiben, KI Schreibassistent, Akademisches Schreiben',
    articleSection: 'Academic Writing',
    inLanguage: 'de-DE',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema) }}
    />
  )
}
