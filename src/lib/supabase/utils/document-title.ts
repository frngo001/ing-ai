import type { Value } from 'platejs'

/**
 * Extrahiert Text aus einem Node rekursiv.
 * Berücksichtigt alle Node-Typen (Paragraphs, Überschriften, Listen, etc.)
 * und ignoriert nur leere Nodes oder Nodes ohne Text-Inhalt.
 */
export function extractTextFromNode(node: any): string {
  if (!node) return ""
  
  // Wenn es ein Array ist, extrahiere Text aus allen Elementen
  if (Array.isArray(node)) {
    return node.map((child: any) => extractTextFromNode(child)).join(" ")
  }
  
  // Wenn es ein Text-Node ist, gib den Text zurück
  if (typeof node.text === "string") {
    return node.text
  }
  
  // Wenn es ein Element mit children ist, extrahiere Text aus den children
  if (Array.isArray(node.children)) {
    return node.children.map((child: any) => extractTextFromNode(child)).join(" ")
  }
  
  return ""
}

/**
 * Extrahiert den Dokumenttitel aus dem ersten Text, der im Dokument eingegeben wurde.
 * Berücksichtigt alle Node-Typen (nicht nur Überschriften), um die ersten Zeichen zu finden.
 */
export function extractTitleFromContent(
  content: Value | any[] | null | undefined,
  defaultTitle: string = "Unbenanntes Dokument"
): string {
  if (!content) return defaultTitle
  
  const contentArray = Array.isArray(content) ? content : (content as any)?.content
  
  if (!Array.isArray(contentArray)) return defaultTitle

  // Durchlaufe alle Blöcke und finde den ersten mit Text-Inhalt
  // Dies kann eine Überschrift, ein Paragraph, eine Liste oder jeder andere Block-Typ sein
  for (const block of contentArray) {
    // Überspringe leere Nodes oder Nodes ohne Text
    if (!block) continue
    
    // Extrahiere Text aus diesem Block (unabhängig vom Typ)
    const text = extractTextFromNode(block).trim()
    
    // Wenn Text gefunden wurde, verwende ihn als Titel (max. 120 Zeichen)
    if (text && text.length > 0) {
      return text.slice(0, 120)
    }
  }

  return defaultTitle
}

