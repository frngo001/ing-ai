import { siteConfig } from '@/config/site'

/**
 * Enhanced Structured Data for SEO
 * Includes: Organization, WebSite (with SearchAction), and SoftwareApplication schemas
 */
export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ing AI Editor',
    alternateName: ['Ing AI', 'IngAI', 'Ing.AI'],
    url: siteConfig.url,
    logo: `${siteConfig.url}/logos/logosApp/ing_AI.png`,
    description: 'Ing AI Editor ist der führende KI-gestützte Texteditor für akademisches Schreiben, Bachelorarbeiten und wissenschaftliche Texte',
    sameAs: [
      siteConfig.links.twitter,
      siteConfig.links.github,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@ing-ai.com',
      availableLanguage: ['de', 'en', 'es', 'fr'],
    },
  }

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ing AI Editor',
    alternateName: 'Ing AI',
    url: siteConfig.url,
    description: 'Ing AI Editor - KI Schreibassistent für akademisches Schreiben. Schreibe Bachelorarbeit, Hausarbeit & wissenschaftliche Texte mit intelligenter KI-Unterstützung.',
    inLanguage: ['de', 'en', 'es', 'fr'],
    publisher: {
      '@type': 'Organization',
      name: 'Ing AI Editor',
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logos/logosApp/ing_AI.png`,
      },
    },
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ing AI Editor',
    alternateName: ['Ing AI', 'IngAI'],
    applicationCategory: 'WebApplication',
    applicationSubCategory: 'AI Writing Assistant',
    operatingSystem: 'Web',
    url: siteConfig.url,
    description: 'Ing AI Editor ist der führende KI-gestützte Texteditor für akademisches Schreiben. Intelligente Textvorschläge, Zitierverwaltung, Literaturrecherche und Plagiatsprüfung für Bachelorarbeiten, Hausarbeiten und wissenschaftliche Texte.',
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
      'Multi-Language Support (4 Sprachen: Deutsch, Englisch, Spanisch, Französisch)',
      'Export in DOCX, PDF, HTML, Markdown',
      'Kollaborative Projektfreigabe',
    ],
    screenshot: `${siteConfig.url}/dashboard-dark.png`,
    author: {
      '@type': 'Organization',
      name: 'Ing AI Editor',
    },
    softwareVersion: '1.0',
    releaseNotes: `${siteConfig.url}/changelog`,
    keywords: 'Ing AI, Ing AI Editor, IngAI, KI Schreibassistent, KI Editor, Akademisches Schreiben, Bachelorarbeit schreiben, Hausarbeit KI, Wissenschaftliches Schreiben, Zitierverwaltung, Literaturrecherche, AI Writing Assistant, AI Text Editor',
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
