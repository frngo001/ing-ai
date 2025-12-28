import {
  TextRun,
  SimpleField,
  InternalHyperlink,
  ExternalHyperlink,
  Paragraph,
  AlignmentType,
} from 'docx';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { formatCitation } from '@/lib/stores/citation-store';

/**
 * Konvertiert ein Zitat-Element zu Word-kompatiblen Feldern
 */

export interface CitationContext {
  citationStyle: string;
  citationFormat: 'author' | 'author-date' | 'label' | 'note' | 'numeric';
  citationNumberFormat: 'bracket' | 'parentheses' | 'superscript' | 'plain' | 'dot';
  citationOrder: Map<string, number>; 
}

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

/**
 * Erstellt einen Inline-Zitat-Paragraph (für Verwendung innerhalb von Text)
 * Verwendet Hyperlinks zur Bibliographie für bessere Word-Erkennung
 */
export function createInlineCitation(
  citation: TCitationElement,
  context: CitationContext
): (TextRun | SimpleField | ExternalHyperlink)[] {
  const { citationFormat, citationNumberFormat, citationOrder, citationStyle } = context;

  const sourceTag = createSourceTag(citation);
  
  // Debug: Logge den Tag für Konsistenz-Prüfung
  if (process.env.NODE_ENV === 'development') {
    console.log('[Citation Field] Creating citation with tag:', sourceTag, 'for sourceId:', citation.sourceId);
  }

  if (citationFormat === 'numeric') {
    const orderNumber = citationOrder.get(citation.sourceId) || 1;
    const citationText = formatNumericCitation(orderNumber, citationNumberFormat);
 
    const fieldInstruction = `CITATION ${sourceTag} \\l 1031`;
    return [
      new SimpleField(fieldInstruction, citationText),
    ];
  }

  if (citationFormat === 'author-date' || citationFormat === 'author') {
    const citationData = {
      sourceId: citation.sourceId,
      authors: citation.authors || [],
      year: citation.year,
      title: typeof citation.title === 'string' ? citation.title : String(citation.title || ''),
      doi: citation.doi,
      url: citation.url,
    };

    const formatted = formatCitation(citationData, citationStyle);
    const fieldInstruction = `CITATION ${sourceTag} \\l 1031`;
    return [
      new SimpleField(fieldInstruction, formatted),
    ];
  }

  // Fallback
  const title = typeof citation.title === 'string' ? citation.title : String(citation.title || '');
  return [
    new TextRun({
      text: `[${title}]`,
    }),
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

