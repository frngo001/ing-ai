import {
  TextRun,
  SimpleField,
  InternalHyperlink,
  ExternalHyperlink,
  Paragraph,
  AlignmentType,
  FootnoteReferenceRun,
  Bookmark,
} from 'docx';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { formatCitation } from '@/lib/stores/citation-store';

/**
 * Konvertiert ein Zitat-Element zu Word-kompatiblen Feldern
 *
 * Word Citation Fields:
 * - Verwenden das Format: CITATION SourceTag \l LCID \s StyleName
 * - SourceTag muss mit dem Tag im Custom XML übereinstimmen
 * - LCID: 1031 (Deutsch), 1033 (Englisch), 3082 (Spanisch), 1036 (Französisch)
 * - StyleName: APA, MLA, Chicago, etc.
 */

export interface CitationContext {
  citationStyle: string;
  citationFormat: 'author' | 'author-date' | 'label' | 'note' | 'numeric';
  citationNumberFormat: 'bracket' | 'parentheses' | 'superscript' | 'plain' | 'dot';
  citationOrder: Map<string, number>;
  citationAuthorDateVariant?: 'comma' | 'no-comma';
  citationAuthorVariant?: 'with-parens' | 'bare';
  citationLabelVariant?: 'bracket' | 'parentheses' | 'plain';
  citationNoteVariant?: 'superscript' | 'inline';
  // Für Fußnoten-Referenzen
  footnoteRefs?: Map<string, number>;
}

/** Mapt Citation-Style zu Word-Style-Name */
const WORD_STYLE_MAP: Record<string, string> = {
  'apa': 'APA',
  'mla': 'MLA',
  'chicago': 'Chicago',
  'harvard': 'Harvard - Anglia',
  'ieee': 'IEEE',
  'vancouver': 'Vancouver',
};

/** Mapt Sprache zu LCID */
const LCID_MAP: Record<string, number> = {
  'de': 1031,
  'en': 1033,
  'es': 3082,
  'fr': 1036,
  'it': 1040,
  'pt': 2070,
  'nl': 1043,
};

/**
 * Erstellt einen Word Citation Field für ein Zitat
 * Verwendet Word Citation Fields für bessere Erkennung
 */
export function createCitationField(
  citation: TCitationElement,
  context: CitationContext
): Paragraph {
  const inlineCitation = createInlineCitation(citation, context);
  
  return new Paragraph({
    children: inlineCitation,
  });
}

/**
 * Formatiert eine nummerische Zitation
 */
function formatNumericCitation(
  number: number,
  format: 'bracket' | 'parentheses' | 'superscript' | 'plain' | 'dot'
): string {
  switch (format) {
    case 'bracket':
      return `[${number}]`;
    case 'parentheses':
      return `(${number})`;
    case 'superscript':
      return String(number);
    case 'dot':
      return `${number}.`;
    case 'plain':
    default:
      return String(number);
  }
}

/** Konvertiert Zahl zu Hochzahl-Zeichen */
function toSuperscript(n: number): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  };
  return String(n).split('').map((d) => map[d] ?? d).join('');
}

/** Formatiert Autoren für kurze Anzeige */
function formatAuthorsShort(authors: TCitationElement['authors']): string {
  const names = authors
    ?.map((a) => a.lastName || a.fullName || a.firstName)
    .filter(Boolean) || [];
  if (!names.length) return '';
  if (names.length === 1) return names[0] as string;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} et al.`;
}

/** Formatiert Author-Date Citation */
function formatAuthorDate(
  citation: TCitationElement,
  variant: 'comma' | 'no-comma' = 'comma'
): string {
  const authorText = formatAuthorsShort(citation.authors);
  const yearText = citation.year ? String(citation.year) : 'n.d.';
  const comma = variant === 'comma' ? ', ' : ' ';
  return authorText ? `(${authorText}${comma}${yearText})` : `(${yearText})`;
}

/** Formatiert Author-Only Citation */
function formatAuthorOnly(
  citation: TCitationElement,
  variant: 'with-parens' | 'bare' = 'with-parens'
): string {
  const authorText = formatAuthorsShort(citation.authors) || 'o. A.';
  return variant === 'with-parens' ? `(${authorText})` : authorText;
}

/** Formatiert Label Citation (z.B. [Smi20]) */
function formatLabel(
  citation: TCitationElement,
  variant: 'bracket' | 'parentheses' | 'plain' = 'bracket'
): string {
  const name = citation.authors?.[0];
  const last = name?.lastName || name?.fullName || 'src';
  const year = citation.year ? String(citation.year).slice(-2) : '';
  const base = `${last.slice(0, 3)}${year}`.replace(/\s+/g, '');
  switch (variant) {
    case 'parentheses': return `(${base})`;
    case 'plain': return base;
    case 'bracket':
    default: return `[${base}]`;
  }
}

/**
 * Erstellt einen Inline-Zitat-Paragraph (für Verwendung innerhalb von Text)
 * Verwendet Word Citation Fields für bessere Word-Erkennung
 *
 * Word erkennt Zitate durch:
 * 1. CITATION Field mit korrektem Source-Tag
 * 2. Sources im Custom XML (word/customXml/item1.xml)
 * 3. Style-Angabe für korrekte Formatierung
 */
export function createInlineCitation(
  citation: TCitationElement,
  context: CitationContext
): (TextRun | SimpleField | ExternalHyperlink)[] {
  const {
    citationFormat,
    citationNumberFormat,
    citationOrder,
    citationStyle,
    citationAuthorDateVariant = 'comma',
    citationAuthorVariant = 'with-parens',
    citationLabelVariant = 'bracket',
    citationNoteVariant = 'superscript',
  } = context;

  const sourceTag = createSourceTag(citation);
  const wordStyle = WORD_STYLE_MAP[citationStyle] || 'APA';
  // Verwende deutsches LCID als Standard (kann später dynamisch werden)
  const lcid = 1031;

  // Debug: Logge den Tag für Konsistenz-Prüfung
  if (process.env.NODE_ENV === 'development') {
    console.log('[Citation Field] Creating citation with tag:', sourceTag, 'for sourceId:', citation.sourceId, 'style:', wordStyle);
  }

  // Word Citation Field Instruction
  // Format: CITATION Tag \l LCID \s "StyleName" \m AuthorYear
  const fieldInstruction = `CITATION ${sourceTag} \\l ${lcid} \\s "${wordStyle}"`;

  if (citationFormat === 'numeric') {
    const orderNumber = citationOrder.get(citation.sourceId) || 1;
    let citationText: string;
    let isSuperscript = false;

    if (citationNumberFormat === 'superscript') {
      citationText = toSuperscript(orderNumber);
      isSuperscript = true;
    } else {
      citationText = formatNumericCitation(orderNumber, citationNumberFormat);
    }

    // Für Superscript verwenden wir TextRun mit superScript-Eigenschaft
    if (isSuperscript) {
      return [
        new SimpleField(fieldInstruction, String(orderNumber)),
      ];
    }

    return [
      new SimpleField(fieldInstruction, citationText),
    ];
  }

  if (citationFormat === 'author-date') {
    const formatted = formatAuthorDate(citation, citationAuthorDateVariant);
    return [
      new SimpleField(fieldInstruction, formatted),
    ];
  }

  if (citationFormat === 'author') {
    const formatted = formatAuthorOnly(citation, citationAuthorVariant);
    return [
      new SimpleField(fieldInstruction, formatted),
    ];
  }

  if (citationFormat === 'label') {
    const formatted = formatLabel(citation, citationLabelVariant);
    return [
      new SimpleField(fieldInstruction, formatted),
    ];
  }

  if (citationFormat === 'note') {
    // Für note-Format: Fußnoten-artige Referenz
    const orderNumber = citationOrder.get(citation.sourceId) || 1;
    let citationText: string;

    if (citationNoteVariant === 'superscript') {
      citationText = toSuperscript(orderNumber);
    } else {
      citationText = formatNumericCitation(orderNumber, 'plain');
    }

    return [
      new SimpleField(fieldInstruction, citationText),
    ];
  }

  // Fallback: Verwende formatCitation aus dem Store
  const citationData = {
    sourceId: citation.sourceId,
    authors: citation.authors || [],
    year: citation.year,
    title: typeof citation.title === 'string' ? citation.title : String(citation.title || ''),
    doi: citation.doi,
    url: citation.url,
  };

  const formatted = formatCitation(citationData, citationStyle);
  return [
    new SimpleField(fieldInstruction, formatted || `[${citationData.title}]`),
  ];
}


/**
 * Sammelt alle Zitate aus dem Dokument und erstellt eine Order-Map
 */
export function buildCitationOrderMap(
  nodes: Array<{ type: string; sourceId?: string }>
): Map<string, number> {
  const orderMap = new Map<string, number>();
  const seen = new Set<string>();
  let counter = 0;

  for (const node of nodes) {
    if (node.type === 'citation' && node.sourceId) {
      // Für nummerische Zitate: jede Quelle bekommt eine Nummer
      if (!seen.has(node.sourceId)) {
        counter++;
        orderMap.set(node.sourceId, counter);
        seen.add(node.sourceId);
      }
    }
  }

  return orderMap;
}

/**
 * Erstellt einen eindeutigen Source-Tag für Word Citation Fields
 * Word verwendet Tags wie "Author2024" oder "Source1"
 */
export function createSourceTag(citation: TCitationElement): string {
  // Verwende sourceId als Basis, falls vorhanden
  if (citation.sourceId) {
    // Bereinige sourceId für Word (nur alphanumerisch und Unterstriche)
    return citation.sourceId.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);
  }

  // Fallback: Erstelle Tag aus Autor und Jahr
  const firstAuthor = citation.authors?.[0];
  const authorName = firstAuthor?.lastName || firstAuthor?.fullName?.split(' ').pop() || 'Author';
  const year = citation.year || new Date().getFullYear();
  const cleanAuthor = authorName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  
  return `${cleanAuthor}${year}`;
}

