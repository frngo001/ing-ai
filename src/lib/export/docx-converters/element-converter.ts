import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ExternalHyperlink,
  HeadingLevel,
  ShadingType,
  SimpleField,
} from 'docx';
import type { TElement, TText } from 'platejs';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import {
  HEADING_LEVEL_MAP,
  HEADING_STYLES,
  FONTS,
  FONT_SIZES,
  CODE_STYLE,
  BLOCKQUOTE_STYLE,
} from './styles';
import { createInlineCitation, type CitationContext } from './citation-converter';

/**
 * Konvertiert Editor-Elemente zu DOCX-Elementen
 */

export interface ConverterContext extends CitationContext {
  // Zusätzlicher Kontext für die Konvertierung
}

/**
 * Konvertiert Text-Marks (bold, italic, etc.) zu TextRun-Formatierung
 */
function convertTextMarks(text: TText): Partial<{
  bold?: boolean;
  italics?: boolean;
  underline?: {};
  strike?: boolean;
  font?: string;
  size?: number;
  superScript?: boolean;
  subScript?: boolean;
  color?: string;
}> {
  const options: Partial<{
    bold?: boolean;
    italics?: boolean;
    underline?: {};
    strike?: boolean;
    font?: string;
    size?: number;
    superScript?: boolean;
    subScript?: boolean;
    color?: string;
  }> = {};

  if (text.bold) options.bold = true;
  if (text.italic) options.italics = true;
  if (text.underline) options.underline = {};
  if (text.strikethrough) options.strike = true;
  if (text.code) {
    options.font = FONTS.code;
    options.size = FONT_SIZES.code;
  }
  if (text.superscript) options.superScript = true;
  if (text.subscript) options.subScript = true;

  // Font-Größe (falls vorhanden)
  if ((text as any).fontSize) {
    options.size = (text as any).fontSize * 2; // Convert pt to half-points
  }

  // Font-Familie (falls vorhanden)
  if ((text as any).fontFamily) {
    options.font = (text as any).fontFamily;
  }

  return options;
}

/**
 * Konvertiert Text-Knoten zu TextRuns
 */
function convertTextNode(
  text: TText,
  context: ConverterContext
): (TextRun | ExternalHyperlink)[] {
  const textContent = text.text || '';
  const marks = convertTextMarks(text);

  if (!textContent) {
    return [];
  }

  return [
    new TextRun({
      text: textContent,
      ...marks,
    }),
  ];
}

/**
 * Konvertiert verschachtelte Inline-Elemente (Links, Mentions, Citations)
 */
function convertInlineElements(
  children: (TText | TElement)[],
  context: ConverterContext
): (TextRun | ExternalHyperlink | SimpleField)[] {
  const runs: (TextRun | ExternalHyperlink | SimpleField)[] = [];

  for (const child of children) {
    if ('text' in child) {
      // Text-Knoten
      runs.push(...convertTextNode(child as TText, context));
    } else {
      const element = child as TElement;
      const type = element.type;

      // Link
      if (type === 'a' || type === 'link') {
        const linkElement = element as any;
        const url = linkElement.url || linkElement.href || '';
        const linkText = extractTextFromChildren(element.children || []);

        if (url) {
          runs.push(
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: linkText || url,
                }),
              ],
              link: url,
            })
          );
        } else {
          runs.push(
            new TextRun({
              text: linkText,
            })
          );
        }
      }
      // Citation
      else if (type === 'citation') {
        const citation = element as TCitationElement;
        runs.push(...createInlineCitation(citation, context));
      }
      // Mention
      else if (type === 'mention') {
        const mention = element as any;
        runs.push(
          new TextRun({
            text: mention.value || mention.name || '@mention',
            bold: true,
          })
        );
      }
      // Andere Inline-Elemente als Text behandeln
      else {
        const text = extractTextFromChildren(element.children || []);
        if (text) {
          runs.push(
            new TextRun({
              text,
            })
          );
        }
      }
    }
  }

  return runs;
}

/**
 * Extrahiert Text aus verschachtelten Kindern
 */
function extractTextFromChildren(children: (TText | TElement)[]): string {
  let text = '';

  for (const child of children) {
    if ('text' in child) {
      text += (child as TText).text || '';
    } else {
      text += extractTextFromChildren((child as TElement).children || []);
    }
  }

  return text;
}

/**
 * Konvertiert Alignment
 */
function convertAlignment(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    case 'left':
    default:
      return AlignmentType.LEFT;
  }
}

/**
 * Konvertiert einen Paragraph
 */
export function convertParagraph(
  element: TElement,
  context: ConverterContext
): Paragraph {
  const children = convertInlineElements(element.children || [], context);
  const align = (element as any).align || (element as any).textAlign;

  return new Paragraph({
    children: children.length > 0 ? children : [new TextRun({ text: '' })],
    alignment: convertAlignment(align),
    spacing: {
      after: 120, // 6pt
    },
  });
}

/**
 * Konvertiert eine Überschrift
 * Wichtig: Verwendet sowohl heading-Level als auch Style-Name für Word-Erkennung
 */
export function convertHeading(
  element: TElement,
  context: ConverterContext
): Paragraph {
  const type = element.type;
  const level = HEADING_LEVEL_MAP[type] || HeadingLevel.HEADING_1;
  const children = convertInlineElements(element.children || [], context);
  const align = (element as any).align || (element as any).textAlign;

  // Mappe Heading-Level zu Style-Namen
  const styleMap: Record<string, string> = {
    h1: 'Heading1',
    h2: 'Heading2',
    h3: 'Heading3',
    h4: 'Heading4',
    h5: 'Heading5',
    h6: 'Heading6',
  };

  const styleName = styleMap[type] || 'Heading1';

  // Verwende nur heading, da style automatisch durch heading gesetzt wird
  // Die Styles sind bereits im Dokument definiert
  return new Paragraph({
    children: children.length > 0 ? children : [new TextRun({ text: '' })],
    heading: level, // Heading-Level setzt automatisch den richtigen Style
    alignment: convertAlignment(align),
  });
}

/**
 * Konvertiert einen Blockquote
 */
export function convertBlockquote(
  element: TElement,
  context: ConverterContext
): Paragraph {
  const children = convertInlineElements(element.children || [], context);

  return new Paragraph({
    style: BLOCKQUOTE_STYLE.id,
    children: children.length > 0 ? children : [new TextRun({ text: '' })],
  });
}

/**
 * Konvertiert einen Code-Block
 */
export function convertCodeBlock(
  element: TElement,
  context: ConverterContext
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const codeLines = element.children || [];

  for (const line of codeLines) {
    if ('type' in line && (line as TElement).type === 'code_line') {
      const codeLine = line as TElement;
      const text = extractTextFromChildren(codeLine.children || []);

      paragraphs.push(
        new Paragraph({
          style: CODE_STYLE.id,
          children: [
            new TextRun({
              text,
              font: FONTS.code,
              size: FONT_SIZES.code,
            }),
          ],
        })
      );
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        style: CODE_STYLE.id,
        children: [new TextRun({ text: '' })],
      })
    );
  }

  return paragraphs;
}

/**
 * Konvertiert eine Liste
 */
export function convertList(
  element: TElement,
  context: ConverterContext,
  depth: number = 0
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const listType = (element as any).listType || 'ul';
  const isOrdered = listType === 'ol' || element.type === 'ol';
  const items = element.children || [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as TElement;
    if (item.type === 'li' || item.type === 'lic') {
      const itemChildren = convertInlineElements(item.children || [], context);
      const indent = depth * 720; // 0.5 inch per level

      paragraphs.push(
        new Paragraph({
          children: itemChildren.length > 0 ? itemChildren : [new TextRun({ text: '' })],
          bullet: isOrdered
            ? {
                level: depth,
              }
            : {
                level: depth,
              },
          numbering: isOrdered
            ? {
                reference: 'default-numbering',
                level: depth,
              }
            : undefined,
          indent: {
            left: indent,
          },
        })
      );

      // Verschachtelte Listen
      const nestedLists = (item.children || []).filter(
        (child) => 'type' in child && ((child as TElement).type === 'ul' || (child as TElement).type === 'ol')
      );

      for (const nestedList of nestedLists) {
        paragraphs.push(...convertList(nestedList as TElement, context, depth + 1));
      }
    }
  }

  return paragraphs;
}

/**
 * Konvertiert eine Tabelle
 */
export function convertTable(
  element: TElement,
  context: ConverterContext
): Table {
  const rows: TableRow[] = [];
  const tableRows = element.children || [];

  for (const rowElement of tableRows) {
    if ('type' in rowElement && (rowElement as TElement).type === 'tr') {
      const row = rowElement as TElement;
      const cells: TableCell[] = [];
      const tableCells = row.children || [];

      for (const cellElement of tableCells) {
        if ('type' in cellElement && ((cellElement as TElement).type === 'td' || (cellElement as TElement).type === 'th')) {
          const cell = cellElement as TElement;
          const cellParagraphs: Paragraph[] = [];

          // Konvertiere Zellen-Inhalt
          for (const child of cell.children || []) {
            if ('type' in child) {
              const childElement = child as TElement;
              const childType = childElement.type;

              if (childType === 'p') {
                cellParagraphs.push(convertParagraph(childElement, context));
              } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(childType)) {
                cellParagraphs.push(convertHeading(childElement, context));
              } else {
                // Fallback: als Paragraph behandeln
                const text = extractTextFromChildren(childElement.children || []);
                cellParagraphs.push(
                  new Paragraph({
                    children: [new TextRun({ text })],
                  })
                );
              }
            }
          }

          if (cellParagraphs.length === 0) {
            cellParagraphs.push(
              new Paragraph({
                children: [new TextRun({ text: '' })],
              })
            );
          }

          cells.push(
            new TableCell({
              children: cellParagraphs,
              shading: {
                fill: (cellElement as any).type === 'th' ? 'E0E0E0' : undefined,
              },
            })
          );
        }
      }

      if (cells.length > 0) {
        rows.push(
          new TableRow({
            children: cells,
          })
        );
      }
    }
  }

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
}

/**
 * Konvertiert ein Bild
 */
export function convertImage(
  element: TElement,
  context: ConverterContext
): Paragraph {
  const imageElement = element as any;
  const url = imageElement.url || imageElement.src || '';
  const caption = imageElement.caption || '';

  // Bilder können nicht direkt eingebettet werden ohne Base64-Konvertierung
  // Für jetzt fügen wir einen Platzhalter-Text hinzu
  return new Paragraph({
    children: [
      new TextRun({
        text: `[Bild: ${url || 'Unbenannt'}]`,
        italics: true,
      }),
    ],
  });
}

/**
 * Konvertiert eine horizontale Linie
 */
export function convertHorizontalRule(
  element: TElement,
  context: ConverterContext
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: '─────────────────────────────────────────────────────────',
        color: 'CCCCCC',
      }),
    ],
    spacing: {
      before: 120,
      after: 120,
    },
  });
}

/**
 * Konvertiert ein Toggle-Element
 */
export function convertToggle(
  element: TElement,
  context: ConverterContext
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const toggleElement = element as any;
  const title = toggleElement.title || 'Toggle';
  const isOpen = toggleElement.open || false;

  // Titel
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${isOpen ? '▼' : '▶'} ${title}`,
          bold: true,
        }),
      ],
    })
  );

  // Inhalt (nur wenn geöffnet)
  if (isOpen) {
    for (const child of element.children || []) {
      if ('type' in child) {
        const childElement = child as TElement;
        const converted = convertElement(childElement, context);
        if (Array.isArray(converted)) {
          paragraphs.push(...converted.filter((c): c is Paragraph => c instanceof Paragraph));
        } else if (converted instanceof Paragraph) {
          paragraphs.push(converted);
        }
        // Tabellen werden ignoriert in Toggle-Elementen
      }
    }
  }

  return paragraphs;
}

/**
 * Haupt-Konvertierungsfunktion für ein Element
 */
export function convertElement(
  element: TElement,
  context: ConverterContext
): Paragraph | Paragraph[] | Table {
  const type = element.type;

  // Überschriften
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(type)) {
    return convertHeading(element, context);
  }

  // Paragraph
  if (type === 'p') {
    return convertParagraph(element, context);
  }

  // Blockquote
  if (type === 'blockquote') {
    return convertBlockquote(element, context);
  }

  // Code-Block
  if (type === 'code_block') {
    return convertCodeBlock(element, context);
  }

  // Listen
  if (type === 'ul' || type === 'ol') {
    return convertList(element, context);
  }

  // Tabelle
  if (type === 'table') {
    return convertTable(element, context);
  }

  // Bild
  if (type === 'img' || type === 'image') {
    return convertImage(element, context);
  }

  // Horizontale Linie
  if (type === 'hr') {
    return convertHorizontalRule(element, context);
  }

  // Toggle
  if (type === 'toggle') {
    return convertToggle(element, context);
  }

  // Media Embed (Video, etc.)
  if (type === 'media_embed' || type === 'mediaEmbed') {
    const mediaElement = element as any;
    const url = mediaElement.url || '';
    return new Paragraph({
      children: [
        new TextRun({
          text: `[Media: ${url || 'Unbenannt'}]`,
          italics: true,
        }),
      ],
    });
  }

  // Fallback: als Paragraph behandeln
  const text = extractTextFromChildren(element.children || []);
  return new Paragraph({
    children: [
      new TextRun({
        text: text || '',
        italics: !text, // Leere Elemente kursiv
      }),
    ],
  });
}

