import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { createSourceTag } from './citation-converter';

/**
 * Sources XML Generator für Word-Kompatibilität
 *
 * Word speichert Literaturquellen im Open XML Bibliography Format.
 * Diese Datei generiert das XML für word/customXml/item1.xml
 *
 * Wichtige Felder für Word:
 * - Tag: Eindeutiger Identifier (muss mit CITATION-Feld übereinstimmen)
 * - SourceType: Art der Quelle (Book, JournalArticle, InternetSite, etc.)
 * - Author: Autorenliste mit Vor- und Nachnamen
 * - Title: Titel der Quelle
 * - Year: Erscheinungsjahr
 * - JournalName/BookTitle/InternetSiteTitle: Container-Titel
 * - Publisher: Verlag
 * - City: Erscheinungsort
 * - Volume/Issue/Pages: Zeitschriften-Details
 * - URL: Web-Adresse
 * - DOI/StandardNumber: Identifier
 */

/**
 * Normalisiert Titel - extrahiert String aus verschiedenen Formaten
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
 * Formatiert Datum für Word (Jahr, Monat, Tag separat)
 */
function parseDateParts(
  accessedAt?: string,
  accessParts?: number[]
): { year?: string; month?: string; day?: string } {
  const fromParts = () => {
    if (!accessParts || accessParts.length === 0) return undefined;
    const [y, m, d] = accessParts;
    if (!y) return undefined;
    return { year: String(y), month: m ? String(m) : undefined, day: d ? String(d) : undefined };
  };

  if (accessParts && accessParts.length > 0) {
    return fromParts() || {};
  }

  if (accessedAt && !Number.isNaN(new Date(accessedAt).getTime())) {
    const date = new Date(accessedAt);
    return {
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1),
      day: String(date.getDate()),
    };
  }

  return {};
}

/**
 * Formatiert Zugriffsdatum als String
 */
function formatAccessDate(accessedAt?: string, accessParts?: number[]): string | undefined {
  const parts = parseDateParts(accessedAt, accessParts);
  if (!parts.year) return undefined;

  const day = parts.day?.padStart(2, '0') || '01';
  const month = parts.month?.padStart(2, '0') || '01';
  return `${day}.${month}.${parts.year}`;
}

export interface WordSource {
  tag: string;
  citation: TCitationElement;
}

/**
 * Konvertiert ein Zitat zu vollständigem Word Source XML
 *
 * Word Bibliography Source Format (ECMA-376):
 * Alle Felder müssen im korrekten Format sein, damit Word sie erkennt
 */
function citationToSourceXML(source: WordSource): string {
  const { tag, citation } = source;

  // === Basis-Felder ===
  const title = normalizeTitle(citation.title) || 'Unbenannt';
  const sourceType = getSourceType(citation.sourceType);

  // Jahr aus verschiedenen Quellen extrahieren
  const year = citation.year ||
               (citation.issued?.['date-parts']?.[0]?.[0]) ||
               (citation as any)?.publicationYear;

  // === Autoren ===
  const authors = citation.authors || [];
  const authorXml = authors.length > 0
    ? authors.map(author => {
        const lastName = author.lastName ||
                        (author.fullName ? author.fullName.split(' ').slice(-1)[0] : '') ||
                        '';
        const firstName = author.firstName ||
                         (author.fullName ? author.fullName.split(' ').slice(0, -1).join(' ') : '') ||
                         '';
        const middle = (author as any).middleName || '';

        if (!lastName && !firstName) {
          return '<b:Person><b:Last>O. A.</b:Last></b:Person>';
        }

        const personParts = [`<b:Last>${escapeXml(lastName || 'O. A.')}</b:Last>`];
        if (firstName) personParts.push(`<b:First>${escapeXml(firstName)}</b:First>`);
        if (middle) personParts.push(`<b:Middle>${escapeXml(middle)}</b:Middle>`);

        return `<b:Person>${personParts.join('')}</b:Person>`;
      }).join('\n              ')
    : '<b:Person><b:Last>O. A.</b:Last></b:Person>';

  // === Metadaten extrahieren ===
  const journal = (typeof citation.journal === 'string' ? citation.journal : '') ||
                  (typeof citation.containerTitle === 'string' ? citation.containerTitle : '') ||
                  (typeof (citation as any)?.journal === 'object' ? String((citation as any).journal?.title || '') : '');
  const collectionTitle = (typeof citation.collectionTitle === 'string' ? citation.collectionTitle : '');
  const publisher = (typeof citation.publisher === 'string' ? citation.publisher : '');
  const city = (typeof (citation as any)?.city === 'string' ? (citation as any).city : '') ||
               (typeof (citation as any)?.publisherPlace === 'string' ? (citation as any).publisherPlace : '');
  const pages = (typeof citation.pages === 'string' ? citation.pages : '') ||
                (typeof (citation as any)?.page === 'string' ? (citation as any).page : '');
  const volume = (typeof citation.volume === 'string' ? citation.volume : '');
  const issue = (typeof citation.issue === 'string' ? citation.issue : '');
  const edition = (typeof (citation as any)?.edition === 'string' ? (citation as any).edition : '');
  const doi = (typeof citation.doi === 'string' ? citation.doi : '');
  const url = (typeof citation.url === 'string' ? citation.url : '') ||
              (typeof (citation as any)?.URL === 'string' ? (citation as any).URL : '');
  const isbn = (typeof citation.isbn === 'string' ? citation.isbn : '');
  const issn = (typeof citation.issn === 'string' ? citation.issn : '');
  const note = (typeof citation.note === 'string' ? citation.note : '');
  const abstract = (typeof (citation as any)?.abstract === 'string' ? (citation as any).abstract : '');
  const language = (typeof (citation as any)?.language === 'string' ? (citation as any).language : '');

  // Zugriffsdatum parsen
  const accessParts = parseDateParts(citation.accessedAt, citation.accessed?.['date-parts']?.[0]);

  // Erscheinungsdatum parsen
  const issuedParts = parseDateParts(
    undefined,
    citation.issued?.['date-parts']?.[0]
  );

  // === XML aufbauen ===
  const xmlParts: string[] = [];

  // Pflichtfelder
  xmlParts.push(`<b:Tag>${escapeXml(tag)}</b:Tag>`);
  xmlParts.push(`<b:SourceType>${sourceType}</b:SourceType>`);
  xmlParts.push(`<b:Guid>{${generateGuid()}}</b:Guid>`);

  // Autoren (verschiedene Rollen unterstützt)
  xmlParts.push(`<b:Author>
      <b:Author>
        <b:NameList>
          ${authorXml}
        </b:NameList>
      </b:Author>
    </b:Author>`);

  // Titel
  xmlParts.push(`<b:Title>${escapeXml(title)}</b:Title>`);

  // Jahr
  if (year) {
    xmlParts.push(`<b:Year>${year}</b:Year>`);
  }

  // Monat und Tag (wenn vorhanden)
  if (issuedParts.month) {
    xmlParts.push(`<b:Month>${issuedParts.month}</b:Month>`);
  }
  if (issuedParts.day) {
    xmlParts.push(`<b:Day>${issuedParts.day}</b:Day>`);
  }

  // Container-Titel je nach SourceType
  if (journal) {
    if (sourceType === 'JournalArticle' || sourceType === 'ArticleInAPeriodical') {
      xmlParts.push(`<b:JournalName>${escapeXml(journal)}</b:JournalName>`);
    } else if (sourceType === 'BookSection') {
      xmlParts.push(`<b:BookTitle>${escapeXml(journal)}</b:BookTitle>`);
    } else if (sourceType === 'ConferenceProceedings') {
      xmlParts.push(`<b:ConferenceName>${escapeXml(journal)}</b:ConferenceName>`);
    } else {
      xmlParts.push(`<b:JournalName>${escapeXml(journal)}</b:JournalName>`);
    }
  }

  // Weitere Container-Titel
  if (collectionTitle && collectionTitle !== journal) {
    xmlParts.push(`<b:BookTitle>${escapeXml(collectionTitle)}</b:BookTitle>`);
  }

  // Publisher
  if (publisher) {
    xmlParts.push(`<b:Publisher>${escapeXml(publisher)}</b:Publisher>`);
  }

  // Stadt
  if (city) {
    xmlParts.push(`<b:City>${escapeXml(city)}</b:City>`);
  }

  // Volume
  if (volume) {
    xmlParts.push(`<b:Volume>${escapeXml(volume)}</b:Volume>`);
  }

  // Issue
  if (issue) {
    xmlParts.push(`<b:Issue>${escapeXml(issue)}</b:Issue>`);
  }

  // Pages
  if (pages) {
    xmlParts.push(`<b:Pages>${escapeXml(pages)}</b:Pages>`);
  }

  // Edition
  if (edition) {
    xmlParts.push(`<b:Edition>${escapeXml(edition)}</b:Edition>`);
  }

  // Standard Numbers - DOI hat Priorität
  if (doi) {
    // DOI als StandardNumber
    xmlParts.push(`<b:StandardNumber>DOI: ${escapeXml(doi)}</b:StandardNumber>`);
  } else if (isbn) {
    xmlParts.push(`<b:StandardNumber>ISBN: ${escapeXml(isbn)}</b:StandardNumber>`);
  } else if (issn) {
    xmlParts.push(`<b:StandardNumber>ISSN: ${escapeXml(issn)}</b:StandardNumber>`);
  }

  // URL
  if (url) {
    xmlParts.push(`<b:URL>${escapeXml(url)}</b:URL>`);
  }

  // Zugriffsdatum (für Websites wichtig)
  if (accessParts.year) {
    xmlParts.push(`<b:YearAccessed>${accessParts.year}</b:YearAccessed>`);
    if (accessParts.month) {
      xmlParts.push(`<b:MonthAccessed>${accessParts.month}</b:MonthAccessed>`);
    }
    if (accessParts.day) {
      xmlParts.push(`<b:DayAccessed>${accessParts.day}</b:DayAccessed>`);
    }
  }

  // Sprache
  if (language) {
    xmlParts.push(`<b:LCID>${getLanguageLCID(language)}</b:LCID>`);
  }

  // Kommentare/Notizen
  if (note) {
    xmlParts.push(`<b:Comments>${escapeXml(note)}</b:Comments>`);
  }

  // Abstract
  if (abstract) {
    xmlParts.push(`<b:Abstract>${escapeXml(abstract)}</b:Abstract>`);
  }

  return `
    <b:Source>
      ${xmlParts.join('\n      ')}
    </b:Source>`;
}

/**
 * Generiert eine GUID für Word
 */
function generateGuid(): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`.toUpperCase();
}

/**
 * Konvertiert Sprachcode zu LCID
 */
function getLanguageLCID(language: string): number {
  const lcidMap: Record<string, number> = {
    'de': 1031,
    'en': 1033,
    'es': 3082,
    'fr': 1036,
    'it': 1040,
    'pt': 2070,
    'nl': 1043,
    'ru': 1049,
    'zh': 2052,
    'ja': 1041,
    'ko': 1042,
  };
  const code = language.toLowerCase().split('-')[0];
  return lcidMap[code] || 1033;
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
 *
 * Word unterstützt folgende SourceTypes:
 * - Book, BookSection, JournalArticle, ArticleInAPeriodical
 * - ConferenceProceedings, Report, InternetSite, DocumentFromInternetSite
 * - ElectronicSource, Art, SoundRecording, Performance
 * - Film, Interview, Patent, Case, Misc
 */
function getSourceType(sourceType?: string): string {
  if (!sourceType) return 'JournalArticle';

  const type = sourceType.toLowerCase().replace(/[-_\s]/g, '');

  // Zeitschriftenartikel
  if (type.includes('articlejournal') || type === 'article') {
    return 'JournalArticle';
  }

  // Bücher
  if ((type.includes('book') && !type.includes('section') && !type.includes('chapter')) ||
      type === 'monograph') {
    return 'Book';
  }

  // Buchkapitel/Abschnitte
  if (type.includes('chapter') || type.includes('section') || type.includes('inbook') ||
      type.includes('incollection') || type === 'booksection') {
    return 'BookSection';
  }

  // Konferenzpapiere
  if (type.includes('conference') || type.includes('proceeding') || type.includes('inproceedings') ||
      type.includes('paperconference')) {
    return 'ConferenceProceedings';
  }

  // Dissertationen und Thesen
  if (type.includes('thesis') || type.includes('dissertation') || type.includes('phdthesis') ||
      type.includes('masterthesis')) {
    return 'Report';
  }

  // Websites
  if (type.includes('website') || type.includes('webpage') || type.includes('internet') ||
      type.includes('online') || type.includes('web')) {
    return 'InternetSite';
  }

  // Berichte
  if (type.includes('report') || type.includes('techreport') || type.includes('technicalreport')) {
    return 'Report';
  }

  // Patente
  if (type.includes('patent')) {
    return 'Patent';
  }

  // Zeitungsartikel
  if (type.includes('newspaper') || type.includes('magazine') || type.includes('periodical') ||
      type.includes('articleinaperiodical')) {
    return 'ArticleInAPeriodical';
  }

  // Elektronische Quellen
  if (type.includes('electronic') || type.includes('software') || type.includes('dataset')) {
    return 'ElectronicSource';
  }

  // Rechtsfälle
  if (type.includes('case') || type.includes('legal') || type.includes('legislation')) {
    return 'Case';
  }

  // Filme/Videos
  if (type.includes('film') || type.includes('video') || type.includes('movie') ||
      type.includes('broadcast')) {
    return 'Film';
  }

  // Interviews
  if (type.includes('interview')) {
    return 'Interview';
  }

  // Kunst
  if (type.includes('art') || type.includes('artwork') || type.includes('graphic')) {
    return 'Art';
  }

  // Audio
  if (type.includes('sound') || type.includes('audio') || type.includes('music') ||
      type.includes('recording') || type.includes('song')) {
    return 'SoundRecording';
  }

  // Aufführungen
  if (type.includes('performance')) {
    return 'Performance';
  }

  // Sonstiges
  if (type.includes('misc') || type.includes('other')) {
    return 'Misc';
  }

  // Default: Zeitschriftenartikel
  return 'JournalArticle';
}

