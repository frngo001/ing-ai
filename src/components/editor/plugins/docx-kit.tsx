'use client';

import { DocxPlugin } from '@platejs/docx';
import { JuicePlugin } from '@platejs/juice';
import { createSlatePlugin, KEYS } from 'platejs';

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
  // Word-Überschriften mit Nummerierung haben oft MsoListParagraph ABER auch outline-level
  if (className.includes('MsoListParagraph')) {
    // Wenn es ein outline-level hat, ist es eine Überschrift, keine Liste
    if (outlineLevel) return outlineLevel;

    // Prüfe auf Überschriften-typische Styles
    const fontSize = style?.fontSize;
    const fontWeight = style?.fontWeight;
    const isBold = fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight || '0') >= 600;

    if (fontSize && isBold) {
      const sizeValue = parseFloat(fontSize);
      const unit = fontSize.replace(/[\d.]/g, '');
      let ptSize = sizeValue;
      if (unit === 'px') ptSize = sizeValue * 0.75;
      if (unit === 'em' || unit === 'rem') ptSize = sizeValue * 12;

      // Große, fette Schrift in MsoListParagraph = wahrscheinlich Überschrift
      if (ptSize >= 16) return 1;
      if (ptSize >= 14) return 2;
      if (ptSize >= 12) return 3;
    }
  }

  // 4. Prüfe auf Überschriften-Klassen aus Word-Vorlagen
  // z.B. "berschrift1", "Überschrift1", "Heading 1", etc.
  const germanHeadingMatch = className.match(/(?:Ü|ü|U|u)berschrift\s*(\d)/i);
  if (germanHeadingMatch) {
    const level = parseInt(germanHeadingMatch[1], 10);
    if (level >= 1 && level <= 6) return level;
  }

  // 5. Heuristik basierend auf Schriftgröße und Fettdruck (für <p> ohne spezielle Klassen)
  const tagName = element.tagName?.toLowerCase();
  if ((tagName === 'p' || tagName === 'div') && style) {
    const fontSize = style.fontSize;
    const fontWeight = style.fontWeight;
    const isBold = fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight || '0') >= 600;

    // Nur wenn es NICHT wie eine normale Liste aussieht
    const hasListStyle = styleAttr.includes('mso-list') && !outlineLevel;
    if (hasListStyle) return null; // Echte Liste, keine Überschrift

    if (fontSize && isBold) {
      const sizeValue = parseFloat(fontSize);
      const unit = fontSize.replace(/[\d.]/g, '');
      let ptSize = sizeValue;
      if (unit === 'px') ptSize = sizeValue * 0.75;
      if (unit === 'em' || unit === 'rem') ptSize = sizeValue * 12;

      // Word-Überschriften-Größen (ungefähr)
      if (ptSize >= 24) return 1;
      if (ptSize >= 18) return 2;
      if (ptSize >= 14) return 3;
      if (ptSize >= 12 && isBold) return 4;
    }
  }

  return null;
}

/**
 * Plugin zur Erkennung von Word-Überschriften beim Paste
 * Word verwendet verschiedene Methoden für Überschriften:
 * - MsoTitle, MsoHeading1-6 Klassen
 * - mso-outline-level Style
 * - Überschrift1-6 Klassen (deutsche Word-Version)
 * - Schriftgröße + Fettdruck Heuristik
 */
const WordHeadingDeserializerPlugin = createSlatePlugin({
  key: 'wordHeadingDeserializer',
  priority: 200, // Höhere Priorität als Standard-Plugins (100)
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

export const DocxKit = [
  WordColorFilterPlugin,
  WordHeadingDeserializerPlugin,
  DocxPlugin,
  JuicePlugin,
];
