/**
 * Utility-Funktionen zum Einfügen von Markdown-Text im Editor
 */

import type { PlateEditor } from 'platejs/react'
import { MarkdownPlugin } from '@platejs/markdown'

/**
 * Fügt Markdown-Text am Ende des Editors ein
 * Berücksichtigt Headings und strukturiert den Text entsprechend
 */
export function insertMarkdownText(
  editor: PlateEditor,
  markdown: string,
  position: 'start' | 'end' | 'current' = 'end'
): void {
  if (!markdown || typeof markdown !== 'string') {
    console.warn('⚠️ [EDITOR] Kein Markdown-Text zum Einfügen')
    return
  }

  try {
    // Konvertiere Markdown zu Plate-Nodes
    const nodes = editor.getApi(MarkdownPlugin).markdown.deserialize(markdown)

    if (!nodes || nodes.length === 0) {
      console.warn('⚠️ [EDITOR] Keine Nodes aus Markdown generiert')
      return
    }

    console.log('📝 [EDITOR] Füge Text ein:', {
      markdownLength: markdown.length,
      nodesCount: nodes.length,
      position,
      headingCount: (markdown.match(/^#+\s/gm) || []).length,
    })

    // Füge Nodes basierend auf Position ein
    if (position === 'start') {
      // Am Anfang einfügen
      editor.tf.insertNodes(nodes, { at: [0], select: false })
    } else if (position === 'current') {
      // An aktueller Position einfügen
      const selection = editor.selection
      if (selection) {
        editor.tf.insertNodes(nodes, { at: selection.anchor.path, select: false })
      } else {
        // Fallback: Am Ende einfügen
        const endPath = editor.api.end([])
        if (endPath) {
          editor.tf.insertNodes(nodes, { at: endPath.path, select: false })
        }
      }
    } else {
      // Am Ende einfügen (Standard)
      const endPath = editor.api.end([])
      if (endPath) {
        // Füge einen leeren Paragraph vorher ein, wenn nötig
        const lastNodeEntry = editor.api.node(endPath.path)
        const lastNode = lastNodeEntry ? lastNodeEntry[0] : null
        if (lastNode && 'type' in lastNode && lastNode.type !== 'p') {
          editor.tf.insertNodes(
            editor.api.create.block({ type: 'p', children: [{ text: '' }] }),
            { at: endPath.path, select: false }
          )
        }
        // Füge die Nodes ein
        const insertPath = endPath.path
        editor.tf.insertNodes(nodes, { at: insertPath, select: false })
      } else {
        // Fallback: Am Anfang einfügen
        editor.tf.insertNodes(nodes, { at: [0], select: false })
      }
    }

    console.log('✅ [EDITOR] Text erfolgreich eingefügt')
  } catch (error) {
    console.error('❌ [EDITOR] Fehler beim Einfügen von Text:', error)
  }
}

/**
 * Globaler Event-Handler für Editor-Text-Einfügung
 * Wird vom Agent über window.dispatchEvent aufgerufen
 */
export function setupEditorTextInsertion(): void {
  if (typeof window === 'undefined') return

  // Event-Listener für Editor-Text-Einfügung
  window.addEventListener('insert-text-in-editor', async (event: any) => {
    const { markdown, position, focusOnHeadings } = event.detail

    console.log('📝 [EDITOR] Event empfangen:', {
      markdownLength: markdown?.length,
      position,
      focusOnHeadings,
    })

    // Warte auf Editor-Initialisierung
    // Der Editor wird über ein Custom Event verfügbar gemacht
    const editorEvent = new CustomEvent('get-editor-instance', {
      detail: { callback: (editor: PlateEditor) => {
        if (editor) {
          insertMarkdownText(editor, markdown, position)
        } else {
          console.warn('⚠️ [EDITOR] Kein Editor-Instance verfügbar')
        }
      }},
    })
    window.dispatchEvent(editorEvent)
  })
}

