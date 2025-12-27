import {
  Paragraph,
  TextRun,
  ExternalHyperlink,
  InternalHyperlink,
  AlignmentType,
  HeadingLevel,
  SimpleField,
} from 'docx';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { BIBLIOGRAPHY_STYLE } from './styles';
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils';
import type { CitationStyle } from '@/lib/stores/citation-store';

/**
 * Generiert ein Quellenverzeichnis aus einer Liste von Zitaten
 */

export interface BibliographyEntry {
  citation: TCitationElement;
  formatted: {
    authors: string;
    rest: string;
    link?: string;
  };
}

/**
 * Formatiert Autoren für Bibliographie-Einträge
 */
function formatAuthors(authors: TCitationElement['authors']): string {
  if (!Array.isArray(authors) || authors.length === 0) return 'O. A.';

  const formatAuthor = (a: TCitationElement['authors'][number]) => {
    const lastRaw =
      a?.lastName ||
      (a?.fullName ? a.fullName.split(' ').slice(-1)[0] : '') ||
      '';
    const last = lastRaw ? lastRaw.toUpperCase() : '';
    const first =
      a?.firstName ||
      (a?.fullName ? a.fullName.split(' ')[0] : '') ||
      '';
    const initial = first ? `${first[0].toUpperCase()}.` : '';
    return [last, initial].filter(Boolean).join(', ');
  };

  const names = authors.map(formatAuthor).filter(Boolean);
  if (names.length === 0) return 'O. A.';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  if (names.length <= 6) {
    const head = names.slice(0, -1).join(', ');
    return `${head} & ${names[names.length - 1]}`;
  }
  return `${names.slice(0, 6).join(', ')}, ET AL.`;
}

/**
 * Formatiert Zugriffsdatum
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
 * Normalisiert Titel
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
 * Formatiert einen Bibliographie-Eintrag gemäß Zitierstil
 */
export function formatBibliographyEntry(
  item: TCitationElement,
  citationStyle: CitationStyle
): { authors: string; rest: string; link?: string } {
  const title = normalizeTitle(item.title) || 'Unbenannt';
  const authors = formatAuthors(item.authors || []);
  const year = item.year ?? 'n.d.';

  const link = getCitationLink({
    url: item.url,
    doi: item.doi,
    pdfUrl: (item as any).pdfUrl,
  });

  const doiValue = getNormalizedDoi(item.doi);
  const url = item.url || '';

  const accessDate = formatAccessDate(
    item.accessedAt,
    item.accessed?.['date-parts']?.[0]
  );

  const venue =
    item.containerTitle || item.journal || item.collectionTitle || '';
  const publisher = item.publisher || '';
  const volumeIssue = (() => {
    if (!item.volume && !item.issue) return '';
    if (item.volume && item.issue) return `Vol. ${item.volume} (Nr. ${item.issue})`;
    if (item.volume) return `Vol. ${item.volume}`;
    return `Nr. ${item.issue}`;
  })();
  const pages = item.pages || (item as any)?.page || '';
  const identifiers = [
    item.isbn ? `ISBN ${item.isbn}` : '',
    item.issn ? `ISSN ${item.issn}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const idSegment = doiValue
    ? `DOI: ${doiValue}`
    : url
      ? `URL: ${url}`
      : '';

  const accessSegment =
    url && accessDate ? `Zugriff am ${accessDate}` : '';

  const detailSegments = [
    venue ? (item.sourceType === 'conference' ? `In ${venue}` : venue) : '',
    publisher,
    volumeIssue,
    pages ? `pages ${pages}` : '',
    identifiers,
  ]
    .filter(Boolean)
    .join('; ');

  const trailingSegments = [detailSegments, idSegment, accessSegment]
    .filter(Boolean)
    .join('; ');

  const build = (rest: string) => ({
    authors,
    rest: rest.trim(),
    link,
  });

  let baseRest: string;

  switch (citationStyle) {
    case 'mla':
      baseRest = `. "${title}." ${year}.`;
      break;
    case 'chicago':
      baseRest = `. (${year}). ${title}.`;
      break;
    case 'harvard':
      baseRest = ` (${year}). ${title}.`;
      break;
    case 'ieee':
      baseRest = `, "${title}," ${year}`;
      break;
    case 'vancouver': {
      const parts = ['.', `${title}.`, `${year}.`].filter(Boolean);
      baseRest = parts.join(' ');
      break;
    }
    case 'apa':
    default:
      baseRest = ` (${year}). ${title}.`;
  }

  const normalizedBase = baseRest.trim().replace(/\s+/g, ' ');
  const baseWithPeriod = normalizedBase.endsWith('.')
    ? normalizedBase
    : `${normalizedBase}.`;
  const fullRest = trailingSegments
    ? `${baseWithPeriod} ${trailingSegments}${trailingSegments.endsWith('.') ? '' : '.'}`
    : baseWithPeriod;
  return build(fullRest);
}

/**
 * Erstellt einen Bibliographie-Eintrag als Word-Paragraph
 */
export function createBibliographyParagraph(
  entry: BibliographyEntry,
  index?: number,
  citationStyle: CitationStyle = 'apa'
): Paragraph {
  const { formatted } = entry;
  const prefix = citationStyle === 'vancouver' && index !== undefined ? `[${index + 1}] ` : '';

  const children: (TextRun | ExternalHyperlink)[] = [];

  // Prefix für nummerische Stile
  if (prefix) {
    children.push(
      new TextRun({
        text: prefix,
        bold: true,
      })
    );
  }

  // Autoren
  if (formatted.authors) {
    children.push(
      new TextRun({
        text: formatted.authors,
        bold: true,
      })
    );
  }

  // Rest des Eintrags
  if (formatted.rest) {
    children.push(
      new TextRun({
        text: formatted.rest,
      })
    );
  }

  // Link als Hyperlink (falls vorhanden)
  if (formatted.link) {
    children.push(
      new TextRun({
        text: ' ',
      })
    );
    // Link wird als Text hinzugefügt, da ExternalHyperlink komplexer ist
    // In Word kann der Benutzer den Link manuell hinzufügen
  }

  return new Paragraph({
    style: BIBLIOGRAPHY_STYLE.id,
    children,
  });
}

/**
 * Erstellt das vollständige Quellenverzeichnis
 */
export function createBibliographySection(
  citations: TCitationElement[],
  citationStyle: CitationStyle = 'apa'
): Paragraph[] {
  if (citations.length === 0) {
    return [];
  }

  const paragraphs: Paragraph[] = [];

  // Überschrift "Literaturverzeichnis" mit korrektem Style
  paragraphs.push(
    new Paragraph({
      text: 'Literaturverzeichnis',
      heading: HeadingLevel.HEADING_1,
      style: 'Heading1', // Wichtig: Style-Name für Word-Erkennung
      spacing: {
        before: 480, // 24pt before
        after: 240, // 12pt after
      },
    })
  );

  // Erstelle Word Bibliography Field - Word erkennt dies als automatisches Literaturverzeichnis
  // Syntax: BIBLIOGRAPHY \l 1031 \s "APA"
  // \l 1031 = Sprache (Deutsch) - WICHTIG: 1031, nicht 1033!
  // \s "APA" = Style (kann angepasst werden)
  const bibliographyStyleMap: Record<string, string> = {
    'apa': 'APA',
    'mla': 'MLA',
    'chicago': 'Chicago',
    'harvard': 'Harvard',
    'ieee': 'IEEE',
    'vancouver': 'Vancouver',
  };
  const wordStyle = bibliographyStyleMap[citationStyle] || 'APA';
  
  // Erstelle Bibliography Field
  paragraphs.push(
    new Paragraph({
      children: [
        new SimpleField(
          `BIBLIOGRAPHY \\l 1031 \\s "${wordStyle}"`,
          'Literaturverzeichnis' // Cached value für Anzeige
        ),
      ],
      spacing: {
        after: 120,
      },
    })
  );

  // Sortiere Einträge
  const entries: BibliographyEntry[] = citations.map((citation) => ({
    citation,
    formatted: formatBibliographyEntry(citation, citationStyle),
  }));

  // Sortierung nach Stil
  if (citationStyle === 'vancouver') {
    // Vancouver: Reihenfolge beibehalten (bereits sortiert)
  } else {
    // Alphabetisch sortieren
    entries.sort((a, b) => {
      const keyA = `${a.formatted.authors} ${a.citation.year ?? ''} ${normalizeTitle(a.citation.title)}`.toLowerCase();
      const keyB = `${b.formatted.authors} ${b.citation.year ?? ''} ${normalizeTitle(b.citation.title)}`.toLowerCase();
      return keyA.localeCompare(keyB);
    });
  }

  // Erstelle Einträge
  entries.forEach((entry, index) => {
    paragraphs.push(
      createBibliographyParagraph(entry, index, citationStyle)
    );
  });

  return paragraphs;
}

