import {
  Paragraph,
  TextRun,
  ExternalHyperlink,
  InternalHyperlink,
  AlignmentType,
  HeadingLevel,
  SimpleField,
  Bookmark,
} from 'docx';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { BIBLIOGRAPHY_STYLE, FONTS, FONT_SIZES } from './styles';
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils';
import type { CitationStyle } from '@/lib/stores/citation-store';
import { createSourceTag } from './citation-converter';

/** Mapt Citation-Style zu Word-Style-Name */
const WORD_STYLE_MAP: Record<string, string> = {
  'apa': 'APA',
  'mla': 'MLA',
  'chicago': 'Chicago',
  'harvard': 'Harvard - Anglia',
  'ieee': 'IEEE',
  'vancouver': 'Vancouver',
};

/**
 * Generiert ein Quellenverzeichnis aus einer Liste von Zitaten
 */

export interface BibliographyEntry {
  /** Das originale Citation-Element */
  citation: TCitationElement;
  /** Formatierte Teile für die Anzeige */
  formatted: {
    authors: string;
    rest: string;
    link?: string;
  };
  /** Index in der Reihenfolge der Erwähnung (für Vancouver/IEEE) */
  orderIndex?: number;
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
 * Mit echten Hyperlinks für DOI und URL
 */
export function createBibliographyParagraph(
  entry: BibliographyEntry,
  index?: number,
  citationStyle: CitationStyle = 'apa'
): Paragraph {
  const { formatted, citation } = entry;
  const prefix = citationStyle === 'vancouver' && index !== undefined ? `[${index + 1}] ` : '';
  const sourceTag = createSourceTag(citation);

  const children: (TextRun | ExternalHyperlink | Bookmark)[] = [];

  // Bookmark für interne Verlinkung (z.B. von Zitaten im Text)
  children.push(
    new Bookmark({
      id: `bib_${sourceTag}`,
      children: [],
    })
  );

  // Prefix für nummerische Stile (IEEE, Vancouver)
  if (prefix) {
    children.push(
      new TextRun({
        text: prefix,
        bold: true,
        font: FONTS.default,
        size: FONT_SIZES.default,
      })
    );
  }

  // Autoren
  if (formatted.authors) {
    children.push(
      new TextRun({
        text: formatted.authors,
        bold: true,
        font: FONTS.default,
        size: FONT_SIZES.default,
      })
    );
  }

  // Rest des Eintrags (ohne URL/DOI am Ende, die werden als Hyperlinks hinzugefügt)
  if (formatted.rest) {
    // Entferne URL und DOI aus dem Rest, da wir sie als Hyperlinks hinzufügen
    let cleanRest = formatted.rest;

    // Entferne DOI-Segment wenn vorhanden
    const doiValue = getNormalizedDoi(citation.doi);
    if (doiValue) {
      cleanRest = cleanRest.replace(`DOI: ${doiValue}`, '').replace(/;\s*;/g, ';').replace(/;\s*$/, '.');
    }

    // Entferne URL-Segment wenn vorhanden
    const url = citation.url || '';
    if (url) {
      cleanRest = cleanRest.replace(`URL: ${url}`, '').replace(/;\s*;/g, ';').replace(/;\s*$/, '.');
    }

    children.push(
      new TextRun({
        text: cleanRest,
        font: FONTS.default,
        size: FONT_SIZES.default,
      })
    );
  }

  // DOI als klickbarer Hyperlink
  const doiValue = getNormalizedDoi(citation.doi);
  if (doiValue) {
    children.push(
      new TextRun({
        text: ' DOI: ',
        font: FONTS.default,
        size: FONT_SIZES.default,
      })
    );
    children.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: doiValue,
            style: 'Hyperlink',
            color: '0563C1',
            underline: {},
            font: FONTS.default,
            size: FONT_SIZES.default,
          }),
        ],
        link: `https://doi.org/${doiValue}`,
      })
    );
  }

  // URL als klickbarer Hyperlink (nur wenn kein DOI vorhanden)
  const url = citation.url || '';
  if (url && !doiValue) {
    children.push(
      new TextRun({
        text: ' URL: ',
        font: FONTS.default,
        size: FONT_SIZES.default,
      })
    );
    children.push(
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: url,
            style: 'Hyperlink',
            color: '0563C1',
            underline: {},
            font: FONTS.default,
            size: FONT_SIZES.default,
          }),
        ],
        link: url,
      })
    );
  }

  return new Paragraph({
    style: BIBLIOGRAPHY_STYLE.id,
    children,
  });
}

/** Mapt Citation-Style zu Word-internem Style-Pfad */
const WORD_BIBLIOGRAPHY_STYLE_MAP: Record<string, string> = {
  'apa': '\\APASixthEditionOfficeOnline.XSL',
  'mla': '\\MLASeventhEdition.XSL',
  'chicago': '\\ChicagoFifteenthEdition.XSL',
  'harvard': '\\HarvardAnglia2008OfficeOnline.XSL',
  'ieee': '\\IEEE2006OfficeOnline.XSL',
  'vancouver': '\\Turabian.XSL',
};

/**
 * Erstellt das Quellenverzeichnis NUR als Word BIBLIOGRAPHY-Feld
 * Word generiert das Verzeichnis automatisch aus den Sources im Custom XML
 *
 * WICHTIG: Die eigentlichen Einträge werden NICHT manuell erstellt!
 * Word generiert sie automatisch basierend auf:
 * 1. Den CITATION-Feldern im Dokument
 * 2. Den Sources im customXml/item1.xml
 * 3. Dem ausgewählten Stil
 */
export function createBibliographySection(
  citations: TCitationElement[],
  citationStyle: CitationStyle = 'apa'
): Paragraph[] {
  if (citations.length === 0) {
    return [];
  }

  const paragraphs: Paragraph[] = [];

  // Word Bibliography Field - generiert automatisch das Quellenverzeichnis
  // Syntax: BIBLIOGRAPHY \l LCID
  // \l 1031 = Sprache (Deutsch)
  // Word verwendet die Sources aus customXml/item1.xml
  const wordStylePath = WORD_BIBLIOGRAPHY_STYLE_MAP[citationStyle] || '\\APASixthEditionOfficeOnline.XSL';

  // Das BIBLIOGRAPHY-Feld wird von Word beim Öffnen oder F9 aktualisiert
  // und generiert automatisch alle Einträge aus den CITATION-Quellen
  paragraphs.push(
    new Paragraph({
      children: [
        // Leerer Platzhalter - Word füllt dies beim Aktualisieren
        new SimpleField(
          `BIBLIOGRAPHY \\l 1031`,
          '' // Leer - Word generiert den Inhalt automatisch
        ),
      ],
      spacing: {
        before: 480,
        after: 240,
      },
    })
  );

  return paragraphs;
}

/**
 * Erstellt ein manuelles Quellenverzeichnis (als Fallback)
 * Wird nur verwendet, wenn automatische Generierung nicht gewünscht ist
 */
export function createManualBibliographySection(
  citations: TCitationElement[],
  citationStyle: CitationStyle = 'apa'
): Paragraph[] {
  if (citations.length === 0) {
    return [];
  }

  const paragraphs: Paragraph[] = [];

  // Überschrift
  paragraphs.push(
    new Paragraph({
      text: 'Literaturverzeichnis',
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 480,
        after: 240,
      },
    })
  );

  // Sortiere Einträge
  const entries: BibliographyEntry[] = citations.map((citation) => ({
    citation,
    formatted: formatBibliographyEntry(citation, citationStyle),
  }));

  // Sortierung nach Stil
  if (citationStyle !== 'vancouver') {
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

