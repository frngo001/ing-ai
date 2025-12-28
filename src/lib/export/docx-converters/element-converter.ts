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
  AbstractNumbering,
  Numbering,
  LevelFormat,
  AlignmentType as NumberingAlignmentType,
  ImageRun,
  Media,
  Math as MathOMath,
} from 'docx';
import type { TElement, TText } from 'platejs';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import type { TEquationElement } from 'platejs';
import { getEquationHtml } from '@platejs/math';
import { convertMathMLToOMath } from './mathml-converter';
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
 * Konvertiert verschachtelte Inline-Elemente (Links, Mentions, Citations, Inline-Equations)
 */
function convertInlineElements(
  children: (TText | TElement)[],
  context: ConverterContext
): (TextRun | ExternalHyperlink | SimpleField | MathOMath)[] {
  const runs: (TextRun | ExternalHyperlink | SimpleField | MathOMath)[] = [];

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
      // Inline Equation
      else if (type === 'inlineEquation' || type === 'inline_equation') {
        const inlineMath = convertInlineEquation(element, context);
        // MathOMath kann direkt als ParagraphChild verwendet werden
        runs.push(inlineMath);
      }
      // Date (kann auch inline sein)
      else if (type === 'date') {
        runs.push(convertDate(element, context));
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
        if (type === 'equation') {
          continue;
        }
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
      const childElement = child as TElement;
      if (childElement.type === 'equation' || childElement.type === 'inlineEquation' || childElement.type === 'inline_equation') {
        continue;
      }
      text += extractTextFromChildren(childElement.children || []);
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
 * Konvertiert einen Paragraph, der als List-Item fungiert (Plate speichert Listen als Paragraphs mit listStyleType)
 */
export function convertListParagraph(
  element: TElement,
  context: ConverterContext
): Paragraph {
  const listElement = element as any;
  const listStyleType = listElement.listStyleType || 'ul';
  const isOrdered = listStyleType === 'ol' || listStyleType === 'decimal';
  const indent = (listElement.indent || 0) - 1;

  const children = convertInlineElements(element.children || [], context);
  const align = listElement.align || listElement.textAlign;

  return new Paragraph({
    children: children.length > 0 ? children : [new TextRun({ text: '' })],
    alignment: convertAlignment(align),
    numbering: {
      reference: isOrdered ? 'default-numbering' : 'default-bullet',
      level: Math.max(0, indent),
    },
    spacing: {
      after: 120,
    },
  });
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
  const listElement = element as any;
  
  const listStyleType = listElement.listStyleType || listElement.listType || 'ul';
  const isOrdered = listStyleType === 'ol' || listStyleType === 'decimal' || element.type === 'ol';
  const items = element.children || [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as TElement;
    
    // Plate verwendet 'lic' (list item content) für List-Items
    if (item.type === 'li' || item.type === 'lic') {
      const itemChildren: (TextRun | ExternalHyperlink | SimpleField)[] = [];
      const nestedLists: TElement[] = [];
      
      // Trenne List-Items von verschachtelten Listen
      for (const child of item.children || []) {
        if ('type' in child) {
          const childElement = child as TElement;
          // Prüfe ob es eine verschachtelte Liste ist
          if (childElement.type === 'list' || childElement.type === 'ul' || childElement.type === 'ol') {
            nestedLists.push(childElement);
          } else {
            // Konvertiere Inline-Elemente
            itemChildren.push(...convertInlineElements([child], context));
          }
        } else {
          // Text-Knoten
          itemChildren.push(...convertTextNode(child as TText, context));
        }
      }

      const indent = depth * 720; // 0.5 inch per level

      paragraphs.push(
        new Paragraph({
          children: itemChildren.length > 0 ? itemChildren : [new TextRun({ text: '' })],
          numbering: {
            reference: isOrdered ? 'default-numbering' : 'default-bullet',
            level: depth,
          },
          indent: {
            left: indent,
          },
        })
      );

      // Verschachtelte Listen verarbeiten
      for (const nestedList of nestedLists) {
        paragraphs.push(...convertList(nestedList, context, depth + 1));
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
 * Extrahiert MathML aus dem HTML-Output von getEquationHtml
 */
function extractMathML(html: string): string | null {
  // Suche nach MathML-Tag im HTML (nur das erste, vollständige Match)
  // Verwende einen robusten Ansatz, der verschachtelte Tags korrekt behandelt
  let depth = 0;
  let startIndex = -1;
  let tagStart = -1;
  
  for (let i = 0; i < html.length; i++) {
    if (html.slice(i).startsWith('<math')) {
      // Finde das Ende des öffnenden Tags
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) break;
      
      if (startIndex === -1) {
        startIndex = i;
        tagStart = tagEnd + 1;
      }
      depth++;
      i = tagEnd;
    } else if (html.slice(i).startsWith('</math>')) {
      depth--;
      if (depth === 0 && startIndex !== -1) {
        // Gefunden: vollständiges MathML-Tag
        return html.slice(startIndex, i + 7); // +7 für '</math>'
      }
      i += 6; // Skip '</math>'
    }
  }
  
  // Fallback: Regex-basiert (wenn keine verschachtelten Tags)
  const mathmlMatch = html.match(/<math[^>]*>[\s\S]*?<\/math>/i);
  if (mathmlMatch) {
    return mathmlMatch[0];
  }
  
  return null;
}

/**
 * Konvertiert eine LaTeX-Formel (Block) zu einem gerenderten Bild
 */
async function convertEquationToImage(
  element: TElement,
  context: ConverterContext
): Promise<Paragraph> {
  const equationElement = element as TEquationElement;
  const texExpression = equationElement.texExpression || '';
  
  if (!texExpression) {
    return new Paragraph({
      children: [
        new TextRun({
          text: '[Formel]',
          font: FONTS.code,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 120,
        after: 120,
      },
    });
  }

  try {
    // Generiere HTML mit MathML
    const html = getEquationHtml({
      element: equationElement,
      options: {
        displayMode: true,
        errorColor: '#cc0000',
        fleqn: false,
        leqno: false,
        macros: { 
          '\\f': '#1f(#2)',
          '\\binom': '\\genfrac{(}{)}{0pt}{}{#1}{#2}',
        },
        output: 'htmlAndMathml',
        strict: 'warn',
        throwOnError: false,
        trust: false,
      },
    });

    // Extrahiere MathML
    const mathml = extractMathML(html);
    
    if (mathml) {
      // Für jetzt: Rendere als Text mit besserer Formatierung
      // Später: Konvertiere MathML zu OMath oder rendere als Bild
      return new Paragraph({
        children: [
          new TextRun({
            text: texExpression,
            font: FONTS.code,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 120,
          after: 120,
        },
      });
    }
  } catch (error) {
    console.warn('Fehler beim Rendern der Formel:', error);
  }

  // Fallback: LaTeX als Text
  return new Paragraph({
    children: [
      new TextRun({
        text: texExpression,
        font: FONTS.code,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: {
      before: 120,
      after: 120,
    },
  });
}

/**
 * Konvertiert eine LaTeX-Formel (Block)
 */
export function convertEquation(
  element: TElement,
  context: ConverterContext
): Paragraph {
  const equationElement = element as TEquationElement;
  const texExpression = equationElement.texExpression || '';
  
  if (!texExpression) {
    return new Paragraph({
      children: [
        new TextRun({
          text: '[Formel]',
          font: FONTS.code,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 120,
        after: 120,
      },
    });
  }

  try {
    // Generiere HTML mit MathML
    const html = getEquationHtml({
      element: equationElement,
      options: {
        displayMode: true,
        errorColor: '#cc0000',
        fleqn: false,
        leqno: false,
        macros: { 
          '\\f': '#1f(#2)',
          '\\binom': '\\genfrac{(}{)}{0pt}{}{#1}{#2}',
        },
        output: 'htmlAndMathml',
        strict: 'warn',
        throwOnError: false,
        trust: false,
      },
    });

    // Extrahiere MathML (nur das erste vollständige Tag)
    const mathml = extractMathML(html);
    
    if (mathml) {
      // Konvertiere MathML zu OMath
      const omath = convertMathMLToOMath(mathml);
      if (omath) {
        // Verwende OMath in Paragraph - nur OMath, kein Fallback-Text
        return new Paragraph({
          children: [omath],
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 120,
            after: 120,
          },
        });
      }
    }
    
    // Nur wenn MathML-Konvertierung komplett fehlschlägt: Fallback zu Text
    
    // Fallback: LaTeX als Text (wenn MathML-Konvertierung fehlschlägt)
    return new Paragraph({
      children: [
        new TextRun({
          text: texExpression,
          font: FONTS.code,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 120,
        after: 120,
      },
    });
  } catch (error) {
    console.warn('Fehler beim Rendern der Formel:', error);
    // Fallback: LaTeX als Text
    return new Paragraph({
      children: [
        new TextRun({
          text: texExpression,
          font: FONTS.code,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 120,
        after: 120,
      },
    });
  }
}

/**
 * Konvertiert eine Inline-LaTeX-Formel zu Word OMath
 */
export function convertInlineEquation(
  element: TElement,
  context: ConverterContext
): TextRun | MathOMath {
  const equationElement = element as TEquationElement;
  const texExpression = equationElement.texExpression || '';
  
  if (!texExpression) {
    return new TextRun({
      text: '[Formel]',
      font: FONTS.code,
      italics: true,
    });
  }

  try {
    // Generiere HTML mit MathML
    const html = getEquationHtml({
      element: equationElement,
      options: {
        displayMode: false, // Inline-Modus
        errorColor: '#cc0000',
        fleqn: false,
        leqno: false,
        macros: { 
          '\\f': '#1f(#2)',
          '\\binom': '\\genfrac{(}{)}{0pt}{}{#1}{#2}',
        },
        output: 'htmlAndMathml',
        strict: 'warn',
        throwOnError: false,
        trust: false,
      },
    });

    // Extrahiere MathML
    const mathml = extractMathML(html);
    
    if (mathml) {
      // Konvertiere MathML zu OMath
      const omath = convertMathMLToOMath(mathml);
      if (omath) {
        return omath;
      }
    }
    
    // Fallback: LaTeX als Text
    return new TextRun({
      text: texExpression,
      font: FONTS.code,
    });
  } catch (error) {
    console.warn('Fehler beim Rendern der Inline-Formel:', error);
    // Fallback: LaTeX als Text
    return new TextRun({
      text: texExpression,
      font: FONTS.code,
    });
  }
}

/**
 * Konvertiert ein Callout-Element
 */
export function convertCallout(
  element: TElement,
  context: ConverterContext
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const calloutElement = element as any;
  const emoji = calloutElement.emoji || '💡';
  
  // Konvertiere den Inhalt
  for (const child of element.children || []) {
    if ('type' in child) {
      const childElement = child as TElement;
      if (childElement.type === 'equation' || childElement.type === 'inlineEquation' || childElement.type === 'inline_equation') {
        continue;
      }
      const converted = convertElement(childElement, context);
      if (Array.isArray(converted)) {
        paragraphs.push(...converted.filter((c): c is Paragraph => c instanceof Paragraph));
      } else if (converted instanceof Paragraph) {
        paragraphs.push(converted);
      }
    }
  }
  
  // Wenn kein Inhalt vorhanden, füge leeren Paragraph hinzu
  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${emoji} `,
            bold: true,
          }),
          new TextRun({
            text: '[Callout]',
            italics: true,
          }),
        ],
      })
    );
  } else {
    // Füge Emoji als Präfix zum ersten Paragraph hinzu
    // Erstelle einen neuen Paragraph mit Emoji + bestehenden Children
    const firstParagraph = paragraphs[0];
    if (firstParagraph instanceof Paragraph) {
      // Extrahiere Children aus dem ersten Child-Element
      const firstChild = element.children?.[0];
      const firstChildren = firstChild && 'children' in firstChild && Array.isArray(firstChild.children)
        ? convertInlineElements(firstChild.children, context)
        : [];
      paragraphs[0] = new Paragraph({
        children: [
          new TextRun({
            text: `${emoji} `,
            bold: true,
          }),
          ...firstChildren,
        ],
      });
    }
  }
  
  return paragraphs;
}

/**
 * Konvertiert ein Column-Element (Spalten-Layout)
 */
export function convertColumn(
  element: TElement,
  context: ConverterContext
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Konvertiere alle Spalten-Inhalte sequenziell
  for (const child of element.children || []) {
    if ('type' in child) {
      const childElement = child as TElement;
      const converted = convertElement(childElement, context);
      if (Array.isArray(converted)) {
        paragraphs.push(...converted.filter((c): c is Paragraph => c instanceof Paragraph));
      } else if (converted instanceof Paragraph) {
        paragraphs.push(converted);
      }
    }
  }
  
  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '[Spalten-Layout]',
            italics: true,
          }),
        ],
      })
    );
  }
  
  return paragraphs;
}

/**
 * Konvertiert ein ColumnItem-Element (einzelne Spalte)
 */
export function convertColumnItem(
  element: TElement,
  context: ConverterContext
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Konvertiere den Inhalt der Spalte
  for (const child of element.children || []) {
    if ('type' in child) {
      const childElement = child as TElement;
      if (childElement.type === 'equation' || childElement.type === 'inlineEquation' || childElement.type === 'inline_equation') {
        continue;
      }
      const converted = convertElement(childElement, context);
      if (Array.isArray(converted)) {
        paragraphs.push(...converted.filter((c): c is Paragraph => c instanceof Paragraph));
      } else if (converted instanceof Paragraph) {
        paragraphs.push(converted);
      }
    }
  }
  
  return paragraphs;
}

/**
 * Konvertiert ein Date-Element
 */
export function convertDate(
  element: TElement,
  context: ConverterContext
): TextRun {
  const dateElement = element as any;
  const date = dateElement.date;
  
  if (date) {
    try {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return new TextRun({
        text: formattedDate,
        bold: true,
      });
    } catch (e) {
      return new TextRun({
        text: date,
        bold: true,
      });
    }
  }
  
  return new TextRun({
    text: '[Datum]',
    italics: true,
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
        if (childElement.type === 'equation' || childElement.type === 'inlineEquation' || childElement.type === 'inline_equation') {
          continue;
        }
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
    // Prüfe, ob dieser Paragraph eine Liste ist (Plate speichert Listen als Paragraphs mit listStyleType)
    const listStyleType = (element as any).listStyleType;
    if (listStyleType) {
      return convertListParagraph(element, context);
    }
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

  // Listen (Plate verwendet 'list' als Typ)
  if (type === 'list' || type === 'ul' || type === 'ol') {
    return convertList(element, context);
  }

  // LaTeX-Formel (Block)
  if (type === 'equation') {
    return convertEquation(element, context);
  }

  // Callout
  if (type === 'callout') {
    return convertCallout(element, context);
  }

  // Column (Spalten-Layout)
  if (type === 'column') {
    return convertColumn(element, context);
  }

  // ColumnItem (einzelne Spalte)
  if (type === 'columnItem') {
    return convertColumnItem(element, context);
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
  if (type === 'equation' || type === 'inlineEquation' || type === 'inline_equation') {
    return new Paragraph({
      children: [new TextRun({ text: '' })],
    });
  }
  
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

