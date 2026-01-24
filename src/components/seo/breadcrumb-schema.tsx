import { siteConfig } from '@/config/site'

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

/**
 * BreadcrumbList Schema for SEO
 * Helps Google understand site hierarchy and shows breadcrumbs in search results
 *
 * Usage:
 * <BreadcrumbSchema items={[
 *   { name: 'Home', url: 'https://ingai-editor.xyz' },
 *   { name: 'Blog', url: 'https://ingai-editor.xyz/blog' }
 * ]} />
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  )
}
