/**
 * Utility-Funktionen zum Einfügen von Markdown-Text im Editor
 */

import type { PlateEditor } from 'platejs/react'
import { MarkdownPlugin } from '@platejs/markdown'
import { toast } from 'sonner'

/**
 * Fügt Markdown-Text am Ende des Editors ein
 * Berücksichtigt Headings und strukturiert den Text entsprechend
 */
export function insertMarkdownText(
  editor: PlateEditor,
  markdown: string,
  position: 'start' | 'end' | 'current' | 'before-bibliography' = 'end'
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

    if (position === 'start') {
      editor.tf.insertNodes(nodes, { at: [0], select: false })
    } else if (position === 'current') {
      const selection = editor.selection
      if (selection) {
        editor.tf.insertNodes(nodes, { at: selection.anchor.path, select: false })
      } else {
        const endPath = editor.api.end([])
        if (endPath) {
          editor.tf.insertNodes(nodes, { at: endPath.path, select: false })
        }
      }
    } else if (position === 'before-bibliography') {
      let bibliographyPath: number[] | null = null
      for (let i = 0; i < editor.children.length; i++) {
        const child = editor.children[i] as any
        if (child && child.bibliography === true) {
          bibliographyPath = [i]
          break
        }
      }

      if (bibliographyPath) {
        editor.tf.insertNodes(nodes, { at: bibliographyPath, select: false })
      } else {
        const endPath = editor.api.end([])
        if (endPath) {
          editor.tf.insertNodes(nodes, { at: endPath.path, select: false })
        } else {
          editor.tf.insertNodes(nodes, { at: [0], select: false })
        }
      }
    } else {
      const endPath = editor.api.end([])
      if (endPath) {
        const lastNodeEntry = editor.api.node(endPath.path)
        const lastNode = lastNodeEntry ? lastNodeEntry[0] : null
        if (lastNode && 'type' in lastNode && lastNode.type !== 'p') {
          editor.tf.insertNodes(
            editor.api.create.block({ type: 'p', children: [{ text: '' }] }),
            { at: endPath.path, select: false }
          )
        }
        const insertPath = endPath.path
        editor.tf.insertNodes(nodes, { at: insertPath, select: false })
      } else {
        editor.tf.insertNodes(nodes, { at: [0], select: false })
      }
    }
  toast.success('Text erfolgreich eingefügt')
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

  window.addEventListener('insert-text-in-editor', async (event: any) => {
    const { markdown, position } = event.detail

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

