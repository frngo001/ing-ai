import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { createSourceTag } from './citation-converter';

/**
 * Normalisiert Titel - verwendet die gleiche Logik wie im Quellenverzeichnis
 */
function normalizeTitle(title: TCitationElement['title']): string {
  if (typeof title === 'string') return title.trim();
  if (title && typeof (title as any).title === 'string') return String((title as any).title).trim();
  const identifiers = (title as any)?.identifiers;
  if (Array.isArray(identifiers)) {
    const candidate = identifiers.find((i: any) => i?.title);
    if (candidate?.title) return String(candidate.title).trim();
  }
  return '';
}

/**
 * Formatiert Zugriffsdatum - verwendet die gleiche Logik wie im Quellenverzeichnis
 */
function formatAccessDate(accessedAt?: string, accessParts?: number[]): string | undefined {
  const fromParts = () => {
    if (!accessParts || accessParts.length === 0) return undefined;
    const [y, m, d] = accessParts;
    if (!y) return undefined;
    return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  };

  const date =
    accessedAt && !Number.isNaN(new Date(accessedAt).getTime())
      ? new Date(accessedAt)
      : fromParts();

  if (!date || Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Erstellt XML für Word Sources-Liste
 * Word benötigt eine Sources-Liste im Custom XML, damit Citation Fields funktionieren
 */

export interface WordSource {
  tag: string;
  citation: TCitationElement;
}

/**
 * Konvertiert ein Zitat zu Word Source XML
 */
function citationToSourceXML(source: WordSource): string {
  const { tag, citation } = source;
  
  // Extrahiere Titel - verwende die gleiche Logik wie im Quellenverzeichnis
  const title = normalizeTitle(citation.title) || 'Unbenannt';
  
  // Extrahiere Jahr - prüfe verschiedene Quellen
  const year = citation.year || 
               (citation.issued?.['date-parts']?.[0]?.[0]) || 
               (citation as any)?.publicationYear ||
               new Date().getFullYear();
  
  // Formatiere Autoren - verwende die gleiche Logik wie im Quellenverzeichnis
  const authors = citation.authors || [];
  const authorNames = authors.length > 0
    ? authors.map(author => {
        // Verwende die gleiche Logik wie formatAuthors in bibliography.ts
        const lastName = author.lastName || 
                        (author.fullName ? author.fullName.split(' ').slice(-1)[0] : '') || 
                        '';
        const firstName = author.firstName || 
                         (author.fullName ? author.fullName.split(' ').slice(0, -1).join(' ') : '') || 
                         '';
        // Stelle sicher, dass mindestens ein Name vorhanden ist
        if (!lastName && !firstName) {
          return '<b:Person><b:Last>O. A.</b:Last></b:Person>';
        }
        return `<b:Person><b:Last>${escapeXml(lastName || 'O. A.')}</b:Last><b:First>${escapeXml(firstName)}</b:First></b:Person>`;
      }).join('')
    : '<b:Person><b:Last>O. A.</b:Last></b:Person>';

  // Extrahiere alle verfügbaren Metadaten - verwende die gleichen Felder wie im Quellenverzeichnis
  // Prüfe auch alternative Felder und Typen
  const journal = (typeof citation.journal === 'string' ? citation.journal : '') ||
                  (typeof citation.containerTitle === 'string' ? citation.containerTitle : '') ||
                  (typeof (citation as any)?.journal === 'object' && (citation as any).journal?.title ? String((citation as any).journal.title) : '') ||
                  '';
  const publisher = (typeof citation.publisher === 'string' ? citation.publisher : '') || '';
  const pages = (typeof citation.pages === 'string' ? citation.pages : '') ||
                (typeof (citation as any)?.page === 'string' ? (citation as any).page : '') ||
                '';
  const volume = (typeof citation.volume === 'string' ? citation.volume : '') || '';
  const issue = (typeof citation.issue === 'string' ? citation.issue : '') || '';
  const doi = (typeof citation.doi === 'string' ? citation.doi : '') || '';
  const url = (typeof citation.url === 'string' ? citation.url : '') ||
              (typeof (citation as any)?.URL === 'string' ? (citation as any).URL : '') ||
              '';
  const isbn = (typeof citation.isbn === 'string' ? citation.isbn : '') || '';
  const issn = (typeof citation.issn === 'string' ? citation.issn : '') || '';
  const note = (typeof citation.note === 'string' ? citation.note : '') || '';
  
  // Zugriffsdatum
  const accessedDate = formatAccessDate(citation.accessedAt, citation.accessed?.['date-parts']?.[0]);

  // Erstelle XML mit allen Feldern
  // Word benötigt bestimmte Felder für die korrekte Erkennung
  // WICHTIG: Alle Felder müssen vorhanden sein, auch wenn sie leer sind, damit Word sie erkennt
  const xmlParts = [
    `<b:Tag>${escapeXml(tag)}</b:Tag>`,
    `<b:SourceType>${getSourceType(citation.sourceType)}</b:SourceType>`,
    `<b:Author>
        <b:Author>
          <b:NameList>
            ${authorNames}
          </b:NameList>
        </b:Author>
      </b:Author>`,
    `<b:Title>${escapeXml(title)}</b:Title>`,
    `<b:Year>${year}</b:Year>`,
  ];
  
  // Füge alle Felder hinzu - auch leere, damit Word sie erkennt
  // Journal/Container Title
  if (journal) {
    xmlParts.push(`<b:JournalName>${escapeXml(journal)}</b:JournalName>`);
  }
  
  // Publisher
  if (publisher) {
    xmlParts.push(`<b:Publisher>${escapeXml(publisher)}</b:Publisher>`);
  }
  
  // Pages
  if (pages) {
    xmlParts.push(`<b:Pages>${escapeXml(pages)}</b:Pages>`);
  }
  
  // Volume
  if (volume) {
    xmlParts.push(`<b:Volume>${escapeXml(volume)}</b:Volume>`);
  }
  
  // Issue
  if (issue) {
    xmlParts.push(`<b:Issue>${escapeXml(issue)}</b:Issue>`);
  }
  
  // Standard Numbers (DOI, ISBN, ISSN)
  // Word verwendet StandardNumber für verschiedene Identifier
  if (doi) {
    xmlParts.push(`<b:StandardNumber>${escapeXml(doi)}</b:StandardNumber>`);
  } else if (isbn) {
    xmlParts.push(`<b:StandardNumber>${escapeXml(isbn)}</b:StandardNumber>`);
  } else if (issn) {
    xmlParts.push(`<b:StandardNumber>${escapeXml(issn)}</b:StandardNumber>`);
  }
  
  // URL
  if (url) {
    xmlParts.push(`<b:URL>${escapeXml(url)}</b:URL>`);
  }
  
  // Accessed Date
  if (accessedDate) {
    xmlParts.push(`<b:Accessed>${escapeXml(accessedDate)}</b:Accessed>`);
  }
  
  // Comments/Note
  if (note) {
    xmlParts.push(`<b:Comments>${escapeXml(note)}</b:Comments>`);
  }
  
  return `
    <b:Source>
      ${xmlParts.join('\n      ')}
    </b:Source>`;
}

/**
 * Erstellt vollständiges Sources XML für Word
 */
export function createSourcesXML(citations: TCitationElement[]): string {
  const sources: WordSource[] = citations.map(citation => {
    const tag = createSourceTag(citation);
    
    // Debug: Logge den Tag für Konsistenz-Prüfung
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sources XML] Creating source with tag:', tag, 'for sourceId:', citation.sourceId);
    }
    
    return {
      tag,
      citation,
    };
  });

  // Debug: Logge die extrahierten Metadaten
  if (process.env.NODE_ENV === 'development') {
    sources.forEach((source, index) => {
      console.log(`[Sources XML] Citation ${index + 1}:`, {
        tag: source.tag,
        sourceId: source.citation.sourceId,
        title: normalizeTitle(source.citation.title),
        authors: source.citation.authors,
        year: source.citation.year,
        journal: source.citation.journal || source.citation.containerTitle,
        publisher: source.citation.publisher,
        pages: source.citation.pages,
        volume: source.citation.volume,
        issue: source.citation.issue,
        doi: source.citation.doi,
        url: source.citation.url,
        sourceType: source.citation.sourceType,
      });
    });
  }

  const sourcesXML = sources.map(citationToSourceXML).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<b:Sources SelectedStyle="\\APA.XSL" xmlns:b="http://schemas.openxmlformats.org/officeDocument/2006/bibliography" xmlns="http://schemas.openxmlformats.org/officeDocument/2006/bibliography">
${sourcesXML}
</b:Sources>`;
}

/**
 * Escaped XML-Sonderzeichen
 */
function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Konvertiert Source-Type zu Word Source-Type
 */
function getSourceType(sourceType?: string): string {
  const typeMap: Record<string, string> = {
    'article-journal': 'ArticleInAPeriodical',
    'article': 'ArticleInAPeriodical',
    'book': 'Book',
    'chapter': 'ArticleInAPeriodical',
    'paper-conference': 'ConferenceProceedings',
    'conference': 'ConferenceProceedings',
    'thesis': 'Thesis',
    'webpage': 'InternetSite',
    'website': 'InternetSite',
    'report': 'Report',
  };

  return typeMap[sourceType || ''] || 'Book';
}

