/**
 * Extrahiert den Inhalt des Plate-Editor-Instanz als Markdown-String.
 * 
 * Diese Funktion verwendet ein Event-System, um mit der Editor-Instanz zu kommunizieren.
 * Sie sendet ein CustomEvent 'get-editor-instance' und wartet auf eine Callback-Antwort
 * mit der Editor-Instanz.
 * 
 * Extraktionsstrategie:
 * 1. Versucht zuerst, den Inhalt über die Markdown-API zu serialisieren (falls verfügbar)
 * 2. Falls Markdown-Serialisierung fehlschlägt oder nicht verfügbar ist, wird der Inhalt
 *    rekursiv als Plain Text extrahiert
 * 
 * @returns Promise<string> - Ein Promise, das mit dem extrahierten Markdown- oder Text-Inhalt
 *                             aufgelöst wird. Gibt einen leeren String zurück, wenn:
 *                             - Keine Editor-Instanz verfügbar ist
 *                             - Der Editor leer ist
 *                             - Ein Fehler beim Extrahieren auftritt
 *                             - Das Timeout (1000ms) erreicht wird
 * 
 * @example
 * ```typescript
 * const content = await getEditorContentAsMarkdown()
 * console.log(content) // "# Überschrift\n\nText..."
 * ```
 */
export function getEditorContentAsMarkdown(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('')
      return
    }
    
    let resolved = false
    
    const editorEvent = new CustomEvent('get-editor-instance', {
      detail: {
        callback: (editor: any) => {
          if (resolved) return
          
          if (!editor) {
            resolved = true
            resolve('')
            return
          }
          
          try {
            // Rekursive Funktion zum Extrahieren von Text aus Editor-Nodes
            // Unterstützt verschiedene Node-Strukturen (text, children, arrays)
            const extractText = (node: any): string => {
              if (!node) return ''
              if (typeof node.text === 'string') return node.text
              if (Array.isArray(node.children)) {
                return node.children.map(extractText).join(' ')
              }
              if (Array.isArray(node)) {
                return node.map(extractText).join('\n\n')
              }
              return ''
            }
            
            const content = editor.children || []
            const text = extractText(content).trim()
            
            // Versuche zuerst Markdown-Serialisierung über die Editor-API
            try {
              const markdownApi = editor.getApi?.({ key: 'markdown' })
              if (markdownApi?.markdown?.serialize) {
                const markdown = markdownApi.markdown.serialize({ value: content })
                if (markdown && markdown.trim().length > 0) {
                  resolved = true
                  resolve(markdown)
                  return
                }
              }
            } catch (error) {
              // Fallback zu Plain Text bei Fehler in Markdown-Serialisierung
            }
            
            // Fallback: Verwende rekursiv extrahierten Plain Text
            resolved = true
            resolve(text)
          } catch (error) {
            resolved = true
            resolve('')
          }
        }
      }
    })
    
    window.dispatchEvent(editorEvent)
    
    // Timeout-Fallback: Falls keine Antwort innerhalb von 1000ms kommt,
    // wird ein leerer String zurückgegeben, um hängende Promises zu vermeiden
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve('')
      }
    }, 1000)
  })
}
