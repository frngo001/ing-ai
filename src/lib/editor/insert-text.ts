/**
 * Utility-Funktionen zum Einfügen von Markdown-Text im Editor
 */

import type { PlateEditor } from 'platejs/react'
import { MarkdownPlugin } from '@platejs/markdown'
import { devLog, devWarn, devError } from '@/lib/utils/logger'

/**
 * Teilt Markdown-Text in logische Blöcke auf
 * Berücksichtigt Headings, Code-Blöcke und Listen, damit sie nicht mitten drin getrennt werden
 */
function splitMarkdownIntoBlocks(markdown: string): string[] {
  if (!markdown || markdown.trim().length === 0) {
    return []
  }

  const blocks: string[] = []
  const lines = markdown.split('\n')
  let currentBlock: string[] = []
  let inCodeBlock = false
  let codeBlockDelimiter = ''
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Code-Blöcke erkennen und zusammenhalten
    if (trimmedLine.startsWith('```')) {
      if (!inCodeBlock) {
        // Code-Block startet
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'))
          currentBlock = []
        }
        inCodeBlock = true
        codeBlockDelimiter = trimmedLine
        currentBlock.push(line)
      } else if (trimmedLine === codeBlockDelimiter) {
        // Code-Block endet
        currentBlock.push(line)
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
        inCodeBlock = false
        codeBlockDelimiter = ''
      } else {
        currentBlock.push(line)
      }
      continue
    }

    // Wenn wir in einem Code-Block sind, alles zusammenhalten
    if (inCodeBlock) {
      currentBlock.push(line)
      continue
    }

    // Headings als separate Blöcke behandeln
    if (trimmedLine.match(/^#{1,6}\s+/)) {
      // Vorherigen Block abschließen, falls vorhanden
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
      }
      // Heading als eigenen Block
      blocks.push(line)
      inList = false
      continue
    }

    // Listen erkennen (Bullet- oder Numbered Lists)
    const isListItem = trimmedLine.match(/^[\s]*[-*+]\s+/) || trimmedLine.match(/^[\s]*\d+\.\s+/)
    
    if (isListItem) {
      if (!inList && currentBlock.length > 0) {
        // Liste beginnt, vorherigen Block abschließen
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
      }
      inList = true
      currentBlock.push(line)
      continue
    } else if (inList && trimmedLine.length === 0) {
      // Leere Zeile nach Liste - Block abschließen
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
      }
      inList = false
      continue
    } else if (inList) {
      // Fortsetzung der Liste (z.B. mehrzeilige List-Items)
      currentBlock.push(line)
      continue
    }

    // Normale Absätze: Doppelte Zeilenumbrüche trennen Blöcke
    if (trimmedLine.length === 0) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
      }
      // Leere Zeilen ignorieren (werden nicht als separate Blöcke eingefügt)
      continue
    }

    currentBlock.push(line)
  }

  // Restlichen Block hinzufügen
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'))
  }

  // Leere Blöcke filtern
  return blocks.filter(block => block.trim().length > 0)
}

/**
 * Fügt Markdown-Text am Ende des Editors ein
 * Teilt den Text in mehrere Blöcke auf und fügt sie sequenziell ein
 */
export function insertMarkdownText(
  editor: PlateEditor,
  markdown: string,
  position: 'start' | 'end' | 'current' | 'before-bibliography' = 'end'
): void {
  if (!markdown || typeof markdown !== 'string') {
    devWarn('⚠️ [EDITOR] Kein Markdown-Text zum Einfügen')
    return
  }

  try {
    // Teile Markdown in logische Blöcke auf
    const blocks = splitMarkdownIntoBlocks(markdown)

    if (blocks.length === 0) {
      devWarn('⚠️ [EDITOR] Keine Blöcke aus Markdown generiert')
      return
    }

    devLog(`📝 [EDITOR] Füge ${blocks.length} Blöcke ein`)

    // Bestimme die Startposition
    let insertPath: number[] | null = null

    if (position === 'start') {
      insertPath = [0]
    } else if (position === 'current') {
      const selection = editor.selection
      if (selection) {
        insertPath = selection.anchor.path
      } else {
        const endPath = editor.api.end([])
        insertPath = endPath ? endPath.path : [0]
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
      insertPath = bibliographyPath || (editor.api.end([])?.path || [0])
    } else {
      // position === 'end'
      const endPath = editor.api.end([])
      if (endPath) {
        const lastNodeEntry = editor.api.node(endPath.path)
        const lastNode = lastNodeEntry ? lastNodeEntry[0] : null
        if (lastNode && 'type' in lastNode && lastNode.type !== 'p') {
          // Füge leeren Absatz ein, wenn letzter Block kein Paragraph ist
          editor.tf.insertNodes(
            editor.api.create.block({ type: 'p', children: [{ text: '' }] }),
            { at: endPath.path, select: false }
          )
        }
        insertPath = endPath.path
      } else {
        insertPath = [0]
      }
    }

    if (!insertPath) {
      devError('❌ [EDITOR] Konnte keine Einfügeposition bestimmen')
      return
    }

    // Füge jeden Block sequenziell ein
    let currentPath = [...insertPath]

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      
      try {
        // Konvertiere Block zu Plate-Nodes
        const nodes = editor.getApi(MarkdownPlugin).markdown.deserialize(block)

        if (!nodes || nodes.length === 0) {
          devWarn(`⚠️ [EDITOR] Block ${i + 1}/${blocks.length} konnte nicht deserialisiert werden`)
          continue
        }

        // Füge Nodes ein
        editor.tf.insertNodes(nodes, { at: currentPath, select: false })

        // Aktualisiere die Position für den nächsten Block
        if (position === 'end' || position === 'before-bibliography') {
          // Bei 'end' oder 'before-bibliography' die Endposition neu berechnen
          const newEndPath = editor.api.end([])
          if (newEndPath) {
            currentPath = [...newEndPath.path]
          }
        } else {
          // Bei 'start' oder 'current' die Position inkrementell erhöhen
          const pathIndex = currentPath[currentPath.length - 1]
          const insertedNodeCount = nodes.length
          currentPath = [...currentPath]
          currentPath[currentPath.length - 1] = pathIndex + insertedNodeCount
        }
      } catch (error) {
        devError(`❌ [EDITOR] Fehler beim Einfügen von Block ${i + 1}/${blocks.length}:`, error)
        // Weiter mit dem nächsten Block
        continue
      }
    }

    devLog(`✅ [EDITOR] ${blocks.length} Blöcke erfolgreich eingefügt`)
  } catch (error) {
    devError('❌ [EDITOR] Fehler beim Einfügen von Text:', error)
  }
}

/**
 * Globaler Event-Handler für Editor-Text-Einfügung
 * Wird vom Agent über window.dispatchEvent aufgerufen
 */
export function setupEditorTextInsertion(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('insert-text-in-editor', async (event: any) => {
    devLog('📝 [EDITOR] insert-text-in-editor Event empfangen:', {
      hasMarkdown: !!event.detail?.markdown,
      markdownLength: event.detail?.markdown?.length,
      position: event.detail?.position,
    })

    const { markdown, position } = event.detail

    if (!markdown) {
      devError('❌ [EDITOR] Kein Markdown im Event-Detail')
      return
    }

    const editorEvent = new CustomEvent('get-editor-instance', {
      detail: { callback: (editor: PlateEditor) => {
        if (editor) {
          devLog('✅ [EDITOR] Editor-Instance erhalten, füge Text ein')
          insertMarkdownText(editor, markdown, position)
        } else {
          devWarn('⚠️ [EDITOR] Kein Editor-Instance verfügbar')
        }
      }},
    })
    window.dispatchEvent(editorEvent)
  })
}

