'use client';

import { DocxPlugin } from '@platejs/docx';
import { JuicePlugin } from '@platejs/juice';
import { createSlatePlugin, KEYS } from 'platejs';
import { useLanguage } from '@/lib/i18n/use-language';

/**
 * Prüft, ob eine Farbe dunkel ist (schwarz/dunkelgrau)
 */
function isDarkColor(color: string | undefined): boolean {
  if (!color) return false;
  const c = color.toLowerCase().trim();

  // Bekannte dunkle Farben
  if (c === 'black' || c === '#000' || c === '#000000' || c === 'windowtext') {
    return true;
  }

  // RGB-Format prüfen
  const rgbMatch = c.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    return r < 50 && g < 50 && b < 50;
  }

  // Hex-Format prüfen
  const hexMatch = c.match(/^#([0-9a-f]{6})$/);
  if (hexMatch) {
    const r = parseInt(hexMatch[1].slice(0, 2), 16);
    const g = parseInt(hexMatch[1].slice(2, 4), 16);
    const b = parseInt(hexMatch[1].slice(4, 6), 16);
    return r < 50 && g < 50 && b < 50;
  }

  return false;
}

/**
 * Prüft, ob eine Farbe hell ist (weiß/hellgrau)
 */
function isLightColor(color: string | undefined): boolean {
  if (!color) return false;
  const c = color.toLowerCase().trim();

  // Bekannte helle Farben
  if (c === 'white' || c === '#fff' || c === '#ffffff') {
    return true;
  }

  // RGB-Format prüfen
  const rgbMatch = c.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    return r > 220 && g > 220 && b > 220;
  }

  // Hex-Format prüfen
  const hexMatch = c.match(/^#([0-9a-f]{6})$/);
  if (hexMatch) {
    const r = parseInt(hexMatch[1].slice(0, 2), 16);
    const g = parseInt(hexMatch[1].slice(2, 4), 16);
    const b = parseInt(hexMatch[1].slice(4, 6), 16);
    return r > 220 && g > 220 && b > 220;
  }

  return false;
}

/**
 * Plugin zur Filterung von problematischen Farben aus Word/DOCX
 * Entfernt schwarze Textfarben und weiße Hintergrundfarben beim Paste
 */
const WordColorFilterPlugin = createSlatePlugin({
  key: 'wordColorFilter',
  parsers: {
    html: {
      deserializer: {
        isLeaf: true,
        parse: ({ element }) => {
          const style = element.style;
          const result: Record<string, string | undefined> = {};

          // Textfarbe filtern - dunkle Farben entfernen
          const color = style?.color;
          if (color && isDarkColor(color)) {
            result.color = undefined;
          }

          // Hintergrundfarbe filtern - helle Farben entfernen
          const bgColor = style?.backgroundColor;
          if (bgColor && isLightColor(bgColor)) {
            result.backgroundColor = undefined;
          }

          return Object.keys(result).length > 0 ? result : undefined;
        },
        rules: [
          {
            validStyle: { color: '*', backgroundColor: '*' },
          },
        ],
      },
    },
  },
});

/**
 * Extrahiert das Outline-Level aus Word-Styles
 * Word verwendet mso-outline-level:1 bis mso-outline-level:9 für Überschriften
 */
function getOutlineLevel(element: HTMLElement): number | null {
  // Prüfe style-Attribut direkt (Word fügt oft mso-* Styles hinzu)
  const styleAttr = element.getAttribute('style') || '';
  const outlineLevelMatch = styleAttr.match(/mso-outline-level\s*:\s*(\d+)/i);
  if (outlineLevelMatch) {
    return parseInt(outlineLevelMatch[1], 10);
  }
  return null;
}

/**
 * Prüft, ob ein Element eine Word-Überschrift ist basierend auf verschiedenen Kriterien
 */
function detectWordHeadingLevel(element: HTMLElement): number | null {
  const className = element.className || '';
  const styleAttr = element.getAttribute('style') || '';
  const style = element.style;

  // 1. Prüfe mso-outline-level (zuverlässigste Methode)
  const outlineLevel = getOutlineLevel(element);
  if (outlineLevel && outlineLevel >= 1 && outlineLevel <= 6) {
    return outlineLevel;
  }

  // 2. Word-spezifische Überschriften-Klassen
  if (className.includes('MsoTitle') || className.includes('mso-title')) {
    return 1;
  }

  // MsoHeading1, MsoHeading2, etc.
  const headingClassMatch = className.match(/MsoHeading(\d)/i);
  if (headingClassMatch) {
    const level = parseInt(headingClassMatch[1], 10);
    if (level >= 1 && level <= 6) return level;
  }

  // Heading1, Heading2, etc. (ohne Mso-Prefix)
  const simpleHeadingMatch = className.match(/\bHeading(\d)\b/i);
  if (simpleHeadingMatch) {
    const level = parseInt(simpleHeadingMatch[1], 10);
    if (level >= 1 && level <= 6) return level;
  }

  // 3. Prüfe auf MsoListParagraph mit Überschriften-Eigenschaften
  if (className.includes('MsoListParagraph')) {
    if (outlineLevel) return outlineLevel;

    const fontSize = style?.fontSize;
    const fontWeight = style?.fontWeight;
    const isBold = fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight || '0') >= 600;

    if (fontSize && isBold) {
      const sizeValue = parseFloat(fontSize);
      const unit = fontSize.replace(/[\d.]/g, '');
      let ptSize = sizeValue;
      if (unit === 'px') ptSize = sizeValue * 0.75;
      if (unit === 'em' || unit === 'rem') ptSize = sizeValue * 12;

      if (ptSize >= 16) return 1;
      if (ptSize >= 14) return 2;
      if (ptSize >= 12) return 3;
    }
  }

  const germanHeadingMatch = className.match(/(?:Ü|ü|U|u)berschrift\s*(\d)/i);
  if (germanHeadingMatch) {
    const level = parseInt(germanHeadingMatch[1], 10);
    if (level >= 1 && level <= 6) return level;
  }

  const tagName = element.tagName?.toLowerCase();
  if ((tagName === 'p' || tagName === 'div') && style) {
    const fontSize = style.fontSize;
    const fontWeight = style.fontWeight;
    const isBold = fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight || '0') >= 600;

    const hasListStyle = styleAttr.includes('mso-list') && !outlineLevel;
    if (hasListStyle) return null;

    if (fontSize && isBold) {
      const sizeValue = parseFloat(fontSize);
      const unit = fontSize.replace(/[\d.]/g, '');
      let ptSize = sizeValue;
      if (unit === 'px') ptSize = sizeValue * 0.75;
      if (unit === 'em' || unit === 'rem') ptSize = sizeValue * 12;

      if (ptSize >= 24) return 1;
      if (ptSize >= 18) return 2;
      if (ptSize >= 14) return 3;
      if (ptSize >= 12 && isBold) return 4;
    }
  }

  return null;
}

const WordHeadingDeserializerPlugin = createSlatePlugin({
  key: 'wordHeadingDeserializer',
  priority: 200,
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        parse: ({ element }) => {
          const level = detectWordHeadingLevel(element as HTMLElement);

          if (level === 1) return { type: KEYS.h1 };
          if (level === 2) return { type: KEYS.h2 };
          if (level === 3) return { type: KEYS.h3 };
          if (level === 4) return { type: KEYS.h4 };
          if (level === 5) return { type: KEYS.h5 };
          if (level === 6) return { type: KEYS.h6 };

          return undefined;
        },
        rules: [
          {
            validNodeName: ['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
          },
        ],
      },
    },
  },
});

const WordFormattingDeserializerPlugin = createSlatePlugin({
  key: 'wordFormattingDeserializer',
  priority: 150,
  parsers: {
    html: {
      deserializer: [
        {
          isElement: true,
          parse: ({ element }: { element: any }) => {
            const el = element as HTMLElement;
            const result: any = {};

            const align = el.getAttribute('data-align') || el.style.textAlign;
            if (align) result.align = align;

            const indent = el.getAttribute('data-indent');
            if (indent) result.indent = parseInt(indent, 10);

            const marginLeft = el.style.marginLeft;
            if (marginLeft && !result.indent) {
              const px = parseInt(marginLeft, 10);
              if (px > 0) result.indent = Math.round(px / 24);
            }

            const textIndent = el.getAttribute('data-text-indent');
            if (textIndent) result.textIndent = parseInt(textIndent, 10);

            const lineHeight = el.getAttribute('data-line-height') || el.style.lineHeight;
            if (lineHeight) result.lineHeight = parseFloat(lineHeight);

            const marginTop = el.style.marginTop;
            if (marginTop) {
              const px = parseInt(marginTop, 10);
              if (px > 0) result.marginTop = px;
            }

            const marginBottom = el.style.marginBottom;
            if (marginBottom) {
              const px = parseInt(marginBottom, 10);
              if (px > 0) result.marginBottom = px;
            }

            return Object.keys(result).length > 0 ? result : undefined;
          },
          rules: [{ validNodeName: ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV'] }],
        },
        {
          isLeaf: true,
          parse: ({ element }: { element: any }) => {
            const el = element as HTMLElement;
            const result: any = {};

            const fontSize = el.getAttribute('data-font-size') || el.style.fontSize;
            if (fontSize) result.fontSize = fontSize;

            const fontFamily = el.getAttribute('data-font-family') || el.style.fontFamily;
            if (fontFamily) result.fontFamily = fontFamily;

            const color = el.getAttribute('data-color') || el.style.color;
            if (color) result.color = color;

            return Object.keys(result).length > 0 ? result : undefined;
          },
          rules: [{ validNodeName: ['SPAN', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV'] }],
        },
      ],
    },
  },
});

/**
 * Plugin zur Erkennung und Konvertierung von Word-Inhaltsverzeichnissen
 * Word TOC verwendet MsoToc Klassen oder spezielle Texte
 */
const WordTocDeserializerPlugin = createSlatePlugin({
  key: 'wordTocDeserializer',
  priority: 250, // Höchste Priorität - vor anderen Plugins
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        parse: ({ element }) => {
          const el = element as HTMLElement;
          const className = el.className || '';

          // Detect the specific placeholder injected during import
          if (className.includes('plate-toc-placeholder')) {
            return { type: KEYS.toc };
          }

          return undefined;
        },
        rules: [
          {
            validNodeName: ['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
          },
        ],
      },
    },
  },
});

/**
 * Extrahiert die Listen-Ebene aus Word mso-list Styles
 * Word verwendet Formate wie "mso-list:l0 level1 lfo1" oder "mso-list:Ignore"
 */
function extractListLevel(styleAttr: string): number {
  // Suche nach "level" gefolgt von einer Zahl
  const levelMatch = styleAttr.match(/level(\d+)/i);
  if (levelMatch) {
    return parseInt(levelMatch[1], 10);
  }
  return 1; // Default zu Level 1
}

/**
 * Entfernt Word-Listennummern/Bullets vom Textanfang
 * Word fügt oft Nummern wie "1.", "a)", "•" als Text ein
 */
function cleanListItemText(text: string): string {
  // Entferne führende Nummerierung: 1., 2), a., A), i., I., etc.
  let cleaned = text.replace(/^[\s]*(\d+[.):]|\([a-zA-Z0-9]+\)|[a-zA-Z][.):]|[ivxIVX]+[.)]|\u2022|\u2023|\u25E6|\u2043|\u2219|[-–—*•◦▪▫●○■□])\s*/u, '');

  // Entferne führende und nachfolgende Leerzeichen
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Erkennt, ob ein Element eine nummerierte Liste ist basierend auf verschiedenen Indikatoren
 */
function detectNumberedList(text: string, styleAttr: string): boolean {
  // 1. Prüfe auf nummerierte Muster im Text
  if (/^[\s]*(\d+[.):]|[a-zA-Z][.):]|[ivxIVX]+[.)]|\([a-zA-Z0-9]+\))/.test(text)) {
    return true;
  }

  // 2. Prüfe auf Word-spezifische Nummerierungs-Styles
  // Word verwendet verschiedene Nummerierungsformate in mso-list
  if (styleAttr.includes('decimal') ||
      styleAttr.includes('alpha') ||
      styleAttr.includes('roman') ||
      styleAttr.includes('lfo')) {
    // lfo = list format override, oft für nummerierte Listen verwendet
    // Aber wir müssen auch prüfen, ob es kein Bullet ist
    if (!styleAttr.includes('bullet')) {
      // Prüfe auf typische Bullet-Zeichen am Textanfang
      const hasBullet = /^[\s]*[\u2022\u2023\u25E6\u2043\u2219\-–—*•◦▪▫●○■□]/.test(text);
      if (!hasBullet) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Entfernt führende Listen-Marker aus HTML-Knoten
 * Word fügt oft Nummern/Bullets als Span-Elemente oder Text ein
 */
function removeLeadingListMarkers(element: HTMLElement): void {
  // Entferne führende Span-Elemente, die nur Marker enthalten
  const firstChild = element.firstChild;
  if (firstChild && firstChild.nodeType === Node.ELEMENT_NODE) {
    const span = firstChild as HTMLElement;
    if (span.tagName === 'SPAN') {
      const spanText = span.textContent?.trim() || '';
      // Prüfe, ob das Span nur einen Marker enthält
      if (/^(\d+[.):]|[a-zA-Z][.):]|[ivxIVX]+[.)]|\u2022|\u2023|\u25E6|\u2043|\u2219|[-–—*•◦▪▫●○■□])$/.test(spanText)) {
        span.remove();
      }
    }
  }

  // Entferne führende Textknoten mit Markern
  const firstTextNode = element.firstChild;
  if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
    const text = firstTextNode.textContent || '';
    const cleaned = text.replace(/^[\s]*(\d+[.):]|\([a-zA-Z0-9]+\)|[a-zA-Z][.):]|[ivxIVX]+[.)]|\u2022|\u2023|\u25E6|\u2043|\u2219|[-–—*•◦▪▫●○■□])\s*/u, '');
    firstTextNode.textContent = cleaned;
  }
}

/**
 * Plugin zur Erkennung und Konvertierung von Word-Listen (MsoListParagraph)
 * Konvertiert Word-Listen zu Plate.js Indent-List Format:
 * Paragraphen mit listStyleType und indent Properties.
 */
const WordListDeserializerPlugin = createSlatePlugin({
  key: 'wordListDeserializer',
  priority: 300, // Höhere Priorität, um vor anderen Deserializern zu greifen
  parsers: {
    html: {
      deserializer: {
        isElement: true,
        parse: ({ element }) => {
          const el = element as HTMLElement;
          const className = el.className || '';
          const styleAttr = el.getAttribute('style') || '';
          const tagName = el.tagName.toLowerCase();

          // Debug: Log all elements being processed
          if (typeof window !== 'undefined' && ['ol', 'ul', 'li', 'p'].includes(tagName)) {
            console.log('[WordListDeserializer] Processing element:', {
              tagName,
              className: className.substring(0, 50),
              textPreview: el.textContent?.substring(0, 30),
              hasListStyleAttr: styleAttr.includes('mso-list'),
              hasDataListType: el.hasAttribute('data-list-type')
            });
          }

          // Behandle native HTML-Listen (ol, ul) - ignorieren, nur children verarbeiten
          if (tagName === 'ol' || tagName === 'ul') {
            if (typeof window !== 'undefined') {
              console.log('[WordListDeserializer] Found list container, letting children be processed:', {
                tagName,
                childCount: el.children.length
              });
            }
            return undefined;
          }

          // Behandle LI-Elemente aus HTML-Listen
          if (tagName === 'li') {
            const parentTag = el.parentElement?.tagName.toLowerCase();
            const isNumbered = parentTag === 'ol';

            // Debug logging (nur in Browser)
            if (typeof window !== 'undefined') {
              console.log('[WordListDeserializer] *** Converting LI to paragraph ***:', {
                text: el.textContent?.substring(0, 40),
                isNumbered,
                parentTag,
                innerHTML: el.innerHTML?.substring(0, 100)
              });
            }

            // Entferne führende Marker, aber behalte die innere Struktur
            removeLeadingListMarkers(el);

            // Plate.js Indent-List Format: Paragraph mit listStyleType
            return {
              type: KEYS.p,
              listStyleType: isNumbered ? 'decimal' : 'disc',
              indent: 1,
            };
          }

          // Behandle Word MsoListParagraph mit data-Attributen (von unserem Import)
          const dataListType = el.getAttribute('data-list-type');
          const dataListLevel = el.getAttribute('data-list-level');

          if (dataListType) {
            const isNumbered = dataListType === 'ordered';
            const listLevel = dataListLevel ? parseInt(dataListLevel, 10) : 1;

            // Debug logging
            if (typeof window !== 'undefined') {
              console.log('[WordListDeserializer] *** Converting MsoListParagraph with data-attributes ***:', {
                text: el.textContent?.substring(0, 40),
                dataListType,
                dataListLevel,
                isNumbered,
                listLevel,
                resultingListStyleType: isNumbered ? 'decimal' : 'disc'
              });
            }

            // Entferne führende Marker, aber behalte die innere Struktur
            removeLeadingListMarkers(el);

            return {
              type: KEYS.p,
              listStyleType: isNumbered ? 'decimal' : 'disc',
              indent: listLevel,
            };
          }

          // Behandle Word MsoListParagraph (Fallback für Klasse/Style)
          if (className.includes('MsoListParagraph') || styleAttr.includes('mso-list')) {
            const rawText = el.textContent?.trim() || '';
            const isNumbered = detectNumberedList(rawText, styleAttr);
            const listLevel = extractListLevel(styleAttr);

            // Entferne führende Marker, aber behalte die innere Struktur
            removeLeadingListMarkers(el);

            // Plate.js Indent-List Format: Paragraph mit listStyleType und indent
            // Rückgabe ohne children - lässt Standard-Deserializer die Kinder verarbeiten
            return {
              type: KEYS.p,
              listStyleType: isNumbered ? 'decimal' : 'disc',
              indent: listLevel,
            };
          }

          return undefined;
        },
        rules: [
          {
            validNodeName: ['P', 'DIV', 'LI', 'OL', 'UL'],
          },
        ],
      },
    },
  },
});

export const DocxKit = [
  WordColorFilterPlugin,
  WordTocDeserializerPlugin,
  WordListDeserializerPlugin,
  WordHeadingDeserializerPlugin,
  WordFormattingDeserializerPlugin,
  DocxPlugin,
  JuicePlugin,
];
