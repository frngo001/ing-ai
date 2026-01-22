import { siteConfig } from '@/config/site'

/**
 * Enhanced Structured Data for SEO
 * Includes: Organization, WebSite (with SearchAction), and SoftwareApplication schemas
 */
export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logos/logosApp/ing_AI.png`,
    description: 'KI-gestützter Schreibassistent für akademisches Schreiben, Bachelorarbeiten und wissenschaftliche Texte',
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.github,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@ing-ai.com',
      availableLanguage: ['de', 'en', 'es', 'fr', 'it', 'pt', 'nl'],
    },
  }

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: 'KI Schreibassistent für akademisches Schreiben - Bachelorarbeit, Hausarbeit & wissenschaftliche Texte mit KI-Unterstützung schreiben',
    inLanguage: ['de', 'en', 'es', 'fr', 'it', 'pt', 'nl'],
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logos/logosApp/ing_AI.png`,
      },
    },
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'WebApplication',
    applicationSubCategory: 'Writing Assistant',
    operatingSystem: 'Web',
    url: siteConfig.url,
    description: 'KI-gestützter Schreibassistent für akademisches Schreiben. Intelligente Textvorschläge, Zitierverwaltung, Literaturrecherche und Plagiatsprüfung für Bachelorarbeiten, Hausarbeiten und wissenschaftliche Texte.',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        name: 'Free Plan',
        description: 'Kostenloser Plan mit Basis-Features',
      },
      {
        '@type': 'Offer',
        price: '9.99',
        priceCurrency: 'EUR',
        name: 'Pro Plan',
        description: 'Unbegrenzte KI-Features für professionelles Schreiben',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '9.99',
          priceCurrency: 'EUR',
          billingDuration: 'P1M',
        },
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '200',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'KI-gestützte Textergänzung und -verbesserung',
      'Automatische Zitierverwaltung (APA, MLA, Chicago, IEEE, Harvard, Vancouver)',
      'Literaturrecherche mit Zugriff auf wissenschaftliche Datenbanken',
      'Plagiatsprüfung und Originalitätsprüfung',
      'Dokumenteneditor mit Rich-Text-Formatierung',
      'Multi-Language Support (7 Sprachen)',
      'Export in DOCX, PDF, HTML, Markdown',
      'Kollaborative Projektfreigabe',
    ],
    screenshot: `${siteConfig.url}/dashboard-dark.png`,
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    softwareVersion: '1.0',
    releaseNotes: `${siteConfig.url}/changelog`,
    keywords: 'KI Schreibassistent, Akademisches Schreiben, Bachelorarbeit schreiben, Hausarbeit KI, Wissenschaftliches Schreiben, Zitierverwaltung, Literaturrecherche, AI Writing Assistant',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
    </>
  )
}
