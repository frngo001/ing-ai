import { siteConfig } from '@/config/site'

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Web',
    url: siteConfig.url,
    description: 'AI-powered text and document editor for academic writing and research. Get intelligent suggestions, manage citations, and write with confidence.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '200',
    },
    featureList: [
      'AI-powered text autocomplete',
      'Citation management',
      'Research support',
      'Document editing',
      'Multi-language support',
    ],
    screenshot: `${siteConfig.url}/dashboard-dark.png`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
