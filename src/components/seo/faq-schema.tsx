import { siteConfig } from '@/config/site'

/**
 * FAQPage Schema for SEO
 * Used in the FAQ section of the landing page
 */
export function FAQSchema() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Wie funktioniert die automatische Zitiergenerierung?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ing AI generiert automatisch korrekte Zitiervorschläge in verschiedenen Formaten (APA, MLA, Chicago, IEEE, Harvard, Vancouver). Füge einfach eine Quelle hinzu und wähle deinen Zitierstil - die Formatierung erfolgt automatisch.',
        },
      },
      {
        '@type': 'Question',
        name: 'Ist der von Ing AI erstellte Text plagiatsrei?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ing AI generiert originelle Textvorschläge basierend auf deinen Eingaben. Die KI schreibt nicht von anderen Quellen ab, sondern hilft dir, eigene Formulierungen zu finden. Dennoch empfehlen wir, alle Texte mit einem Plagiatsprüfungstool zu überprüfen.',
        },
      },
      {
        '@type': 'Question',
        name: 'In welchen Formaten kann ich meine Arbeit exportieren?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Du kannst deine Dokumente in folgenden Formaten exportieren: DOCX (Microsoft Word), PDF, HTML und Markdown. Alle Formatierungen, Zitierungen und Strukturen bleiben dabei erhalten.',
        },
      },
      {
        '@type': 'Question',
        name: 'Wie sicher sind meine Daten?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Deine Daten werden verschlüsselt in der Supabase-Datenbank gespeichert. Wir verwenden modernste Sicherheitsstandards und geben deine Daten niemals an Dritte weiter. Du behältst jederzeit die volle Kontrolle über deine Dokumente.',
        },
      },
      {
        '@type': 'Question',
        name: 'Funktioniert Ing AI auch in anderen Sprachen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja, Ing AI unterstützt 7 Sprachen: Deutsch, Englisch, Spanisch, Französisch, Italienisch, Portugiesisch und Niederländisch. Die KI-Unterstützung funktioniert in allen Sprachen.',
        },
      },
      {
        '@type': 'Question',
        name: 'Kann ich mein Abonnement jederzeit kündigen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ja, du kannst dein Abonnement jederzeit kündigen. Es gibt keine langfristigen Verpflichtungen. Nach der Kündigung hast du noch bis zum Ende des bezahlten Zeitraums Zugriff auf alle Pro-Features.',
        },
      },
    ],
    about: {
      '@type': 'SoftwareApplication',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  )
}
