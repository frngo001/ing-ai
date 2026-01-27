import { siteConfig } from "@/config/site";

export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Ing AI",
    "operatingSystem": "Web",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    },
    "description": "KI-gestützter Schreibassistent für akademische Arbeiten. Bachelorarbeit, Hausarbeit und Essays schreiben mit künstlicher Intelligenz.",
    "url": siteConfig.url,
    "image": `${siteConfig.url}/opengraph-image.png`,
    "author": {
      "@type": "Organization",
      "name": "Ing AI",
      "url": siteConfig.url
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
