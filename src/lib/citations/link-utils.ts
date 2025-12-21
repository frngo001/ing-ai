/**
 * Utility-Funktionen für Citation-Links
 * Behandelt Validierung von DOI-Werten und Generierung von Links
 */

/**
 * Validiert und normalisiert einen DOI-Wert
 * @param doi - Der DOI-Wert (kann URL-Format oder reiner DOI sein)
 * @returns Normalisierter DOI-Wert oder undefined wenn ungültig
 */
export function normalizeAndValidateDoi(doi: string | undefined): string | undefined {
  if (!doi) return undefined;
  
  const doiStr = String(doi).trim();
  
  // Prüfe auf ungültige Werte
  if (!doiStr || doiStr === 'undefined' || doiStr === 'null' || doiStr === '') {
    return undefined;
  }
  
  // Entferne URL-Präfixe
  const cleaned = doiStr.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
  
  // Prüfe ob nach dem Entfernen noch etwas übrig ist
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null') {
    return undefined;
  }
  
  // Prüfe auf gültiges DOI-Format (sollte mit 10. beginnen)
  if (!cleaned.match(/^10\./)) {
    return undefined;
  }
  
  return cleaned;
}

/**
 * Validiert eine URL
 * @param url - Die URL zum Validieren
 * @returns Die URL wenn gültig, sonst undefined
 */
export function validateUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  const urlStr = String(url).trim();
  
  // Prüfe auf ungültige Werte
  if (!urlStr || urlStr === 'undefined' || urlStr === 'null' || urlStr === '') {
    return undefined;
  }
  
  // Prüfe ob es eine gültige URL ist
  try {
    const urlObj = new URL(urlStr);
    return urlObj.toString();
  } catch {
    // Wenn keine gültige URL, aber mit http/https beginnt, versuche es trotzdem
    if (urlStr.match(/^https?:\/\//i)) {
      return urlStr;
    }
    return undefined;
  }
}

/**
 * Generiert den besten verfügbaren Link für eine Citation
 * Priorität: 1. Direkter URL-Link, 2. DOI-basierter Link
 * @param options - Optionen mit url, doi, pdfUrl
 * @returns Der beste verfügbare Link oder undefined
 */
export function getCitationLink(options: {
  url?: string;
  doi?: string;
  pdfUrl?: string;
}): string | undefined {
  // Priorität 1: Direkter URL-Link (aus der API)
  const validUrl = validateUrl(options.url);
  if (validUrl) {
    return validUrl;
  }
  
  // Priorität 2: PDF-URL (falls vorhanden)
  const validPdfUrl = validateUrl(options.pdfUrl);
  if (validPdfUrl) {
    return validPdfUrl;
  }
  
  // Priorität 3: DOI-basierter Link
  const validDoi = normalizeAndValidateDoi(options.doi);
  if (validDoi) {
    return `https://doi.org/${validDoi}`;
  }
  
  return undefined;
}

/**
 * Extrahiert nur den normalisierten DOI-Wert (ohne Link-Generierung)
 * @param doi - Der DOI-Wert
 * @returns Normalisierter DOI-Wert oder undefined
 */
export function getNormalizedDoi(doi: string | undefined): string | undefined {
  return normalizeAndValidateDoi(doi);
}

