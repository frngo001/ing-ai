/**
 * Konvertiert MathML zu Word OMath-Komponenten (docx Math-Komponenten)
 *
 * Diese Datei konvertiert MathML (von KaTeX generiert) zu Word Office Math (OMath).
 * Word unterstützt eine Teilmenge von MathML und hat eigene Darstellungen für:
 * - Brüche (mfrac)
 * - Wurzeln (msqrt, mroot)
 * - Hoch- und Tiefstellungen (msup, msub, msubsup)
 * - Summen und Integrale (munderover mit speziellen Operatoren)
 * - Klammern (mfenced)
 * - Matrizen (mtable) - teilweise unterstützt
 */

import {
  Math,
  MathRun,
  MathFraction,
  MathSum,
  MathIntegral,
  MathSuperScript,
  MathSubScript,
  MathSubSuperScript,
  MathRadical,
  MathFunction,
  MathRoundBrackets,
  MathCurlyBrackets,
  MathSquareBrackets,
  MathAngledBrackets,
  MathLimitLower,
  MathLimitUpper,
  type MathComponent,
} from 'docx';

/** Map von Unicode-Symbolen zu Word-Darstellungen */
const UNICODE_SYMBOL_MAP: Record<string, string> = {
  '∑': '∑', // Summe
  '∏': '∏', // Produkt
  '∫': '∫', // Integral
  '∬': '∬', // Doppelintegral
  '∭': '∭', // Dreifachintegral
  '∮': '∮', // Ringintegral
  '√': '√', // Wurzel
  '∞': '∞', // Unendlich
  '±': '±', // Plus-Minus
  '∓': '∓', // Minus-Plus
  '×': '×', // Mal
  '÷': '÷', // Geteilt
  '≠': '≠', // Ungleich
  '≤': '≤', // Kleiner gleich
  '≥': '≥', // Größer gleich
  '≈': '≈', // Ungefähr
  '≡': '≡', // Identisch
  '∈': '∈', // Element von
  '∉': '∉', // Nicht Element von
  '⊂': '⊂', // Teilmenge
  '⊃': '⊃', // Obermenge
  '⊆': '⊆', // Teilmenge oder gleich
  '⊇': '⊇', // Obermenge oder gleich
  '∪': '∪', // Vereinigung
  '∩': '∩', // Schnitt
  '∅': '∅', // Leere Menge
  '∀': '∀', // Für alle
  '∃': '∃', // Es existiert
  '∂': '∂', // Partielle Ableitung
  '∇': '∇', // Nabla
  'α': 'α', 'β': 'β', 'γ': 'γ', 'δ': 'δ', 'ε': 'ε',
  'ζ': 'ζ', 'η': 'η', 'θ': 'θ', 'ι': 'ι', 'κ': 'κ',
  'λ': 'λ', 'μ': 'μ', 'ν': 'ν', 'ξ': 'ξ', 'π': 'π',
  'ρ': 'ρ', 'σ': 'σ', 'τ': 'τ', 'υ': 'υ', 'φ': 'φ',
  'χ': 'χ', 'ψ': 'ψ', 'ω': 'ω',
  'Α': 'Α', 'Β': 'Β', 'Γ': 'Γ', 'Δ': 'Δ', 'Ε': 'Ε',
  'Ζ': 'Ζ', 'Η': 'Η', 'Θ': 'Θ', 'Ι': 'Ι', 'Κ': 'Κ',
  'Λ': 'Λ', 'Μ': 'Μ', 'Ν': 'Ν', 'Ξ': 'Ξ', 'Π': 'Π',
  'Ρ': 'Ρ', 'Σ': 'Σ', 'Τ': 'Τ', 'Υ': 'Υ', 'Φ': 'Φ',
  'Χ': 'Χ', 'Ψ': 'Ψ', 'Ω': 'Ω',
};

/**
 * Parst MathML XML-String und konvertiert zu docx Math-Komponenten
 */
export function convertMathMLToOMath(mathmlString: string): Math | null {
  try {
    // Stelle sicher, dass wir nur ein <math> Tag haben
    let cleaned = mathmlString.trim();
    
    // Wenn es mehrere <math> Tags gibt, verwende nur das erste
    const mathTagMatches = cleaned.matchAll(/<math[^>]*>[\s\S]*?<\/math>/gi);
    const matches = Array.from(mathTagMatches);
    if (matches.length > 1) {
      cleaned = matches[0][0];
    } else if (matches.length === 1) {
      cleaned = matches[0][0];
    }
    
    // Erstelle einen DOMParser (funktioniert in Node.js mit jsdom oder im Browser)
    let parser: DOMParser;
    let doc: Document;
    
    if (typeof window !== 'undefined' && window.DOMParser) {
      parser = new window.DOMParser();
      doc = parser.parseFromString(cleaned, 'text/xml');
    } else {
      // Für Node.js: Verwende einen einfachen Regex-basierten Parser
      return parseMathMLSimple(cleaned);
    }

    const mathElement = doc.querySelector('math');
    if (!mathElement) {
      return null;
    }

    const children = parseMathElement(mathElement);
    if (children.length === 0) {
      return null;
    }

    return new Math({ children });
  } catch (error) {
    console.warn('Fehler beim Parsen von MathML:', error);
    return null;
  }
}

/**
 * Vereinfachter MathML-Parser (Regex-basiert für Node.js)
 */
function parseMathMLSimple(mathmlString: string): Math | null {
  try {
    // Entferne Namespace-Präfixe und bereinige
    let cleaned = mathmlString
      .replace(/<m:/g, '<')
      .replace(/<\/m:/g, '</')
      .replace(/xmlns[^>]*>/g, '>')
      .replace(/xmlns[^=]*="[^"]*"/g, '')
      .trim();
    
    const mathTagMatch = cleaned.match(/^<math[^>]*>([\s\S]*)<\/math>$/);
    if (mathTagMatch) {
      cleaned = mathTagMatch[1].trim();
    } else {
      cleaned = cleaned.replace(/^<math[^>]*>/, '').replace(/<\/math>$/, '');
    }
    
    cleaned = cleaned.trim();
    const children = parseMathMLChildren(cleaned);
    if (children.length === 0) {
      return null;
    }

    return new Math({ children });
  } catch (error) {
    console.warn('Fehler beim Parsen von MathML:', error);
    return null;
  }
}

/**
 * Parst MathML-Kinder rekursiv
 */
function parseMathMLChildren(xml: string): MathComponent[] {
  const components: MathComponent[] = [];
  let i = 0;

  while (i < xml.length) {
    const tagMatch = xml.slice(i).match(/<(\w+)([^>]*)>([\s\S]*?)<\/\1>/);
    if (!tagMatch) {
      const textMatch = xml.slice(i).match(/^([^<]+)/);
      if (textMatch) {
        i += textMatch[0].length;
        continue;
      } else {
        break;
      }
    }

    const [fullMatch, tagName, attributes, content] = tagMatch;
    i += fullMatch.length;

    switch (tagName.toLowerCase()) {
      case 'mi':
      case 'mn':
      case 'mo':
      case 'mtext':
        // Text-Elemente
        const text = content.trim();
        if (text) {
          components.push(new MathRun(text));
        }
        break;

      case 'mfrac':
        // Bruch
        const fracParts = splitMathMLChildren(content);
        if (fracParts.length >= 2) {
          const numerator = parseMathMLChildren(fracParts[0]);
          const denominator = parseMathMLChildren(fracParts[1]);
          if (numerator.length > 0 && denominator.length > 0) {
            components.push(
              new MathFraction({
                numerator,
                denominator,
              })
            );
          }
        }
        break;

      case 'msup':
        // Superscript
        const supParts = splitMathMLChildren(content);
        if (supParts.length >= 2) {
          const base = parseMathMLChildren(supParts[0]);
          const superScript = parseMathMLChildren(supParts[1]);
          if (base.length > 0 && superScript.length > 0) {
            components.push(
              new MathSuperScript({
                children: base,
                superScript,
              })
            );
          }
        }
        break;

      case 'msub':
        // Subscript
        const subParts = splitMathMLChildren(content);
        if (subParts.length >= 2) {
          const base = parseMathMLChildren(subParts[0]);
          const subScript = parseMathMLChildren(subParts[1]);
          if (base.length > 0 && subScript.length > 0) {
            components.push(
              new MathSubScript({
                children: base,
                subScript,
              })
            );
          }
        }
        break;

      case 'msubsup':
        // Subscript und Superscript
        const subSupParts = splitMathMLChildren(content);
        if (subSupParts.length >= 3) {
          const base = parseMathMLChildren(subSupParts[0]);
          const subScript = parseMathMLChildren(subSupParts[1]);
          const superScript = parseMathMLChildren(subSupParts[2]);
          if (base.length > 0 && subScript.length > 0 && superScript.length > 0) {
            components.push(
              new MathSubSuperScript({
                children: base,
                subScript,
                superScript,
              })
            );
          }
        }
        break;

      case 'msqrt':
        // Quadratwurzel
        const sqrtContent = parseMathMLChildren(content);
        if (sqrtContent.length > 0) {
          components.push(
            new MathRadical({
              children: sqrtContent,
            })
          );
        }
        break;

      case 'mroot':
        // n-te Wurzel
        const rootParts = splitMathMLChildren(content);
        if (rootParts.length >= 2) {
          const radicand = parseMathMLChildren(rootParts[0]);
          const degree = parseMathMLChildren(rootParts[1]);
          if (radicand.length > 0) {
            components.push(
              new MathRadical({
                children: radicand,
                degree: degree.length > 0 ? degree : undefined,
              })
            );
          }
        }
        break;

      case 'munderover':
      case 'mover':
      case 'munder':
        // Summen, Integrale, Produkte, Limits, etc.
        const underOverParts = splitMathMLChildren(content);
        if (underOverParts.length >= 2) {
          const base = parseMathMLChildren(underOverParts[0]);
          if (base.length > 0) {
            const baseText = extractTextFromMathML(underOverParts[0]).trim();
            const subScript = underOverParts[1] ? parseMathMLChildren(underOverParts[1]) : undefined;
            const superScript = underOverParts[2] ? parseMathMLChildren(underOverParts[2]) : undefined;

            // Prüfe ob es ein Summenzeichen ist
            if (baseText.includes('∑') || baseText.toLowerCase().includes('sum')) {
              components.push(
                new MathSum({
                  children: base,
                  subScript,
                  superScript,
                })
              );
            }
            // Prüfe ob es ein Produktzeichen ist
            // Hinweis: docx hat keine MathProduct-Klasse, daher verwenden wir MathSum
            // mit dem Produktsymbol als Basis
            else if (baseText.includes('∏') || baseText.toLowerCase().includes('prod')) {
              // Verwende MathSum als Fallback, da die Struktur identisch ist
              // Word rendert das Produktsymbol korrekt
              components.push(
                new MathSum({
                  children: [new MathRun('∏')],
                  subScript,
                  superScript,
                })
              );
            }
            // Prüfe ob es ein Integral ist
            else if (baseText.includes('∫') || baseText.includes('∬') ||
                     baseText.includes('∭') || baseText.includes('∮') ||
                     baseText.toLowerCase().includes('int')) {
              components.push(
                new MathIntegral({
                  children: base,
                  subScript,
                  superScript,
                })
              );
            }
            // Prüfe ob es ein Limes ist
            else if (baseText.toLowerCase().includes('lim')) {
              if (tagName.toLowerCase() === 'munder' && subScript) {
                components.push(
                  new MathLimitLower({
                    children: base,
                    limit: subScript,
                  })
                );
              } else if (tagName.toLowerCase() === 'mover' && superScript) {
                components.push(
                  new MathLimitUpper({
                    children: base,
                    limit: superScript,
                  })
                );
              } else {
                // Fallback für munderover
                components.push(...base);
                if (subScript) {
                  components.push(new MathRun('_'));
                  components.push(...subScript);
                }
              }
            }
            // Fallback: als Superscript/Subscript behandeln
            else {
              if (tagName.toLowerCase() === 'munder' && subScript && subScript.length > 0) {
                components.push(
                  new MathSubScript({
                    children: base,
                    subScript,
                  })
                );
              } else if (tagName.toLowerCase() === 'mover' && superScript && superScript.length > 0) {
                components.push(
                  new MathSuperScript({
                    children: base,
                    superScript,
                  })
                );
              } else if (subScript && superScript && subScript.length > 0 && superScript.length > 0) {
                components.push(
                  new MathSubSuperScript({
                    children: base,
                    subScript,
                    superScript,
                  })
                );
              } else {
                components.push(...base);
              }
            }
          }
        }
        break;

      case 'mfenced':
        // Klammern
        const fencedContent = parseMathMLChildren(content);
        const open = attributes.match(/open=["']([^"']*)["']/)?.[1] || '(';
        const close = attributes.match(/close=["']([^"']*)["']/)?.[1] || ')';

        if (open === '(' && close === ')') {
          components.push(new MathRoundBrackets({ children: fencedContent }));
        } else if (open === '[' && close === ']') {
          components.push(new MathSquareBrackets({ children: fencedContent }));
        } else if (open === '{' && close === '}') {
          components.push(new MathCurlyBrackets({ children: fencedContent }));
        } else if ((open === '<' || open === '⟨') && (close === '>' || close === '⟩')) {
          components.push(new MathAngledBrackets({ children: fencedContent }));
        } else if (open === '|' && close === '|') {
          // Betrag: verwende runde Klammern mit | als Text
          components.push(new MathRun('|'));
          components.push(...fencedContent);
          components.push(new MathRun('|'));
        } else if (open === '‖' && close === '‖') {
          // Norm: verwende || als Text
          components.push(new MathRun('‖'));
          components.push(...fencedContent);
          components.push(new MathRun('‖'));
        } else {
          // Fallback: verwende die Zeichen als Text
          if (open) components.push(new MathRun(open));
          components.push(...fencedContent);
          if (close) components.push(new MathRun(close));
        }
        break;

      case 'mrow':
      case 'mtable':
      case 'mtr':
      case 'mtd':
        // Gruppierung - parse Kinder rekursiv
        const rowContent = parseMathMLChildren(content);
        components.push(...rowContent);
        break;

      default:
        // Unbekanntes Element - versuche Kinder zu parsen
        const unknownContent = parseMathMLChildren(content);
        components.push(...unknownContent);
        break;
    }
  }

  return components;
}

/**
 * Teilt MathML-Kinder auf (für mfrac, msup, etc.)
 */
function splitMathMLChildren(xml: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let i = 0;

  while (i < xml.length) {
    const char = xml[i];
    
    if (char === '<') {
      const tagMatch = xml.slice(i).match(/^<(\/?)(\w+)[^>]*>/);
      if (tagMatch) {
        const isClosing = tagMatch[1] === '/';
        const tagName = tagMatch[2];
        
        // Self-closing tags ignorieren wir für die Tiefe
        if (!xml.slice(i).match(/^<\w+[^>]*\/>/)) {
          if (isClosing) {
            depth--;
          } else {
            depth++;
          }
        }
        
        current += tagMatch[0];
        i += tagMatch[0].length;
        continue;
      }
    }

    if (depth === 0 && (char === ' ' || char === '\n' || char === '\t')) {
      // Auf oberster Ebene: Leerzeichen trennen Teile
      if (current.trim()) {
        parts.push(current.trim());
        current = '';
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  // Wenn keine Teile gefunden, versuche nach Tags zu splitten
  if (parts.length === 0) {
    const tagMatches = [...xml.matchAll(/<(\w+)[^>]*>([\s\S]*?)<\/\1>/g)];
    if (tagMatches.length > 0) {
      return tagMatches.map(m => m[0]);
    }
    return [xml];
  }

  return parts;
}

/**
 * Extrahiert Text aus MathML
 */
function extractTextFromMathML(xml: string): string {
  return xml.replace(/<[^>]+>/g, '').trim();
}

/**
 * Parst ein MathML-Element (für DOM-Parser)
 */
function parseMathElement(element: Element): MathComponent[] {
  const components: MathComponent[] = [];

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === 3) {
      continue;
    } else if (node.nodeType === 1) {
      // Element-Knoten
      const el = node as Element;
      const tagName = el.tagName.toLowerCase().replace(/^m:/, '');

      switch (tagName) {
        case 'mi':
        case 'mn':
        case 'mo':
        case 'mtext':
          const text = el.textContent?.trim();
          if (text) {
            components.push(new MathRun(text));
          }
          break;

        case 'mfrac':
          const numerator = parseMathElement(el.querySelector('mfrac > *:first-child') || el);
          const denominator = parseMathElement(el.querySelector('mfrac > *:last-child') || el);
          if (numerator.length > 0 && denominator.length > 0) {
            components.push(
              new MathFraction({
                numerator,
                denominator,
              })
            );
          }
          break;

        // Weitere Fälle ähnlich wie im Regex-Parser...
        default:
          // Rekursiv parsen
          const children = parseMathElement(el);
          components.push(...children);
          break;
      }
    }
  }

  return components;
}

