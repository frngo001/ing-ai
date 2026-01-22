import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { getBlogPost } from '@/lib/blog/data'
import { getLanguageForServer } from '@/lib/i18n/server-language'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = getBlogPost(id)
  const language = await getLanguageForServer()

  if (!post) {
    return {
      title: 'Blog Post - ' + siteConfig.name,
    }
  }

  return {
    title: `${post.title} - ${siteConfig.name}`,
    description: post.excerpt,
    keywords: post.tags || ['Blog', 'AI Writing', 'Academic Writing'],
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${siteConfig.url}/blog/${id}`,
      siteName: siteConfig.name,
      images: [
        {
          url: post.image || `${siteConfig.url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: language,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image || `${siteConfig.url}/opengraph-image`],
    },
    alternates: {
      canonical: `${siteConfig.url}/blog/${id}`,
    },
  }
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
