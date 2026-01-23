/**
 * Utility-Funktionen zum Einfügen von Markdown-Text im Editor
 */

import type { PlateEditor } from 'platejs/react'
import { MarkdownPlugin } from '@platejs/markdown'
import { devLog, devWarn, devError } from '@/lib/utils/logger'

// Path type from slate (array of numbers representing position in document tree)
type Path = number[]

// ============================================================================
// Types
// ============================================================================

export type InsertPosition =
  | 'start'
  | 'end'
  | 'current'
  | 'before-bibliography'
  | 'after-target'
  | 'before-target'
  | 'replace-target'
  // Neue ID-basierte Positionen
  | 'after-node'
  | 'before-node'
  | 'replace-node'
  | 'append-to-section'
  | 'after-heading'
  | 'before-heading'

export interface InsertTextOptions {
  markdown: string
  position?: InsertPosition
  targetText?: string
  targetHeading?: string
  focusOnHeadings?: boolean
  // Neue ID-basierte Optionen
  nodeId?: string
  sectionHeading?: string
  preventDuplicate?: boolean
}

export type DeleteMode = 'block' | 'text' | 'heading-section' | 'range'

export interface DeleteTextOptions {
  targetText?: string
  targetHeading?: string
  mode?: DeleteMode
  startText?: string
  endText?: string
}

// ============================================================================
// Helper Functions for Text Finding
// ============================================================================

/**
 * Extracts all text content from a node recursively
 */
const extractText = (node: any): string => {
  if (typeof node?.text === 'string') {
    return node.text
  }
  if (node?.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }
  return ''
}

/**
 * Finds text in the editor and returns the path and position information
 */
const findTextInEditor = (
  editor: PlateEditor,
  targetText: string
): { blockIndex: number; path: Path; offset: number } | null => {
  const searchText = targetText?.trim()
  if (!searchText) return null

  const blocks = editor.children || []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as any
    const blockPath: Path = [i]
    const blockText = extractText(block)

    if (!blockText?.includes(searchText)) continue

    const textIndex = blockText.indexOf(searchText)
    const targetOffset = textIndex + searchText.length

    let currentOffset = 0
    let targetPath: Path | null = null
    let finalOffset = 0

    const findInChildren = (children: any[], parentPath: Path): boolean => {
      for (let j = 0; j < children.length; j++) {
        const child = children[j]
        const childPath = [...parentPath, j]

        if (typeof child?.text === 'string') {
          const textLength = child.text.length
          const nodeStart = currentOffset
          const nodeEnd = currentOffset + textLength

          if (nodeStart <= textIndex && nodeEnd >= targetOffset) {
            targetPath = childPath
            finalOffset = targetOffset - nodeStart
            return true
          } else if (nodeEnd >= textIndex && nodeStart < targetOffset) {
            targetPath = childPath
            finalOffset = textLength
            return true
          }

          currentOffset += textLength
        } else if (child?.children && Array.isArray(child.children)) {
          if (findInChildren(child.children, childPath)) {
            return true
          }
        }
      }
      return false
    }

    if (block.children && Array.isArray(block.children)) {
      findInChildren(block.children, blockPath)
    }

    if (targetPath) {
      return { blockIndex: i, path: targetPath, offset: finalOffset }
    }
  }

  return null
}

/**
 * Finds a heading in the editor and returns the block index
 */
const findHeadingInEditor = (
  editor: PlateEditor,
  targetHeading: string
): { blockIndex: number } | null => {
  const searchHeading = targetHeading?.trim()
  if (!searchHeading) return null

  // Normalize heading (remove # symbols for matching)
  const normalizedSearch = searchHeading.replace(/^#+\s*/, '').toLowerCase()

  const blocks = editor.children || []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as any

    // Check if it's a heading element
    if (block.type && (block.type === 'h1' || block.type === 'h2' || block.type === 'h3' ||
        block.type === 'h4' || block.type === 'h5' || block.type === 'h6' ||
        block.type.startsWith('heading'))) {
      const blockText = extractText(block).toLowerCase()

      if (blockText.includes(normalizedSearch) || normalizedSearch.includes(blockText)) {
        return { blockIndex: i }
      }
    }

    // Also check text content for markdown-style headings
    const blockText = extractText(block)
    if (blockText.startsWith('#')) {
      const normalizedBlockText = blockText.replace(/^#+\s*/, '').toLowerCase()
      if (normalizedBlockText.includes(normalizedSearch) || normalizedSearch.includes(normalizedBlockText)) {
        return { blockIndex: i }
      }
    }
  }

  return null
}

/**
 * Finds a node in the editor by its ID
 */
const findNodeById = (
  editor: PlateEditor,
  nodeId: string
): { blockIndex: number } | null => {
  if (!nodeId) return null

  const blocks = editor.children || []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as any
    if (block.id === nodeId) {
      return { blockIndex: i }
    }
  }

  return null
}

/**
 * Finds the end of a section (next heading with same or higher level)
 */
const findSectionEnd = (
  editor: PlateEditor,
  startBlockIndex: number
): number => {
  const blocks = editor.children || []
  const startBlock = blocks[startBlockIndex] as any

  // Get the heading level of the start block
  let startLevel = 6
  if (startBlock?.type) {
    const match = startBlock.type.match(/h(\d)/)
    if (match) {
      startLevel = parseInt(match[1])
    }
  }

  // Find next heading with same or higher level
  for (let i = startBlockIndex + 1; i < blocks.length; i++) {
    const block = blocks[i] as any
    if (block?.type) {
      const match = block.type.match(/h(\d)/)
      if (match) {
        const level = parseInt(match[1])
        if (level <= startLevel) {
          return i - 1
        }
      }
    }
  }

  return blocks.length - 1
}

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
 * Fügt Markdown-Text im Editor ein
 * Teilt den Text in mehrere Blöcke auf und fügt sie sequenziell ein (wie bei Copy/Paste)
 * Unterstützt verschiedene Positionen und zielbasiertes Einfügen
 *
 * Neue Positionierungsoptionen:
 * - 'after-node', 'before-node', 'replace-node': ID-basierte Positionierung mit nodeId
 * - 'append-to-section': Am Ende einer Section mit sectionHeading
 * - 'after-heading', 'before-heading': Heading-basierte Positionierung mit targetHeading
 */
export function insertMarkdownText(
  editor: PlateEditor,
  markdown: string,
  position: InsertPosition = 'end',
  targetText?: string,
  targetHeading?: string,
  nodeId?: string,
  sectionHeading?: string
): void {
  if (!markdown || typeof markdown !== 'string') {
    devWarn('⚠️ [EDITOR] Kein Markdown-Text zum Einfügen')
    return
  }

  devLog(`📝 [EDITOR] insertMarkdownText aufgerufen mit:`, {
    markdownLength: markdown.length,
    markdownPreview: markdown.substring(0, 200),
    position,
    targetText,
    targetHeading,
  })

  try {
    // Deserialisiere den gesamten Markdown-Text
    // Das MarkdownPlugin erstellt separate Nodes für jeden Block (Headings, Paragraphen, Listen, etc.)
    let allNodes: any[] = []

    try {
      const deserializedNodes = editor.getApi(MarkdownPlugin).markdown.deserialize(markdown)
      if (deserializedNodes && deserializedNodes.length > 0) {
        allNodes = deserializedNodes
        devLog(`✅ [EDITOR] Markdown deserialisiert: ${allNodes.length} Nodes`, {
          nodeTypes: allNodes.map(n => n.type || 'unknown'),
        })
      }
    } catch (deserializeError) {
      devError(`❌ [EDITOR] Deserialisierung fehlgeschlagen:`, deserializeError)
    }

    // Fallback: Wenn die Deserialisierung fehlschlägt, teile in Blöcke auf
    if (allNodes.length === 0) {
      devLog(`📝 [EDITOR] Fallback: Teile Markdown in Blöcke auf`)
      const blocks = splitMarkdownIntoBlocks(markdown)

      if (blocks.length === 0) {
        devWarn('⚠️ [EDITOR] Keine Blöcke aus Markdown generiert')
        return
      }

      devLog(`📝 [EDITOR] ${blocks.length} Blöcke zum Verarbeiten`)

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        try {
          const nodes = editor.getApi(MarkdownPlugin).markdown.deserialize(block)
          if (nodes && nodes.length > 0) {
            allNodes.push(...nodes)
          } else {
            // Fallback: Erstelle einen einfachen Paragraph
            allNodes.push({
              type: 'p',
              children: [{ text: block }],
            })
          }
        } catch (blockError) {
          devError(`❌ [EDITOR] Block ${i + 1} Deserialisierung fehlgeschlagen:`, blockError)
          allNodes.push({
            type: 'p',
            children: [{ text: block }],
          })
        }
      }
    }

    if (allNodes.length === 0) {
      devError('❌ [EDITOR] Keine Nodes zum Einfügen generiert')
      return
    }

    devLog(`📝 [EDITOR] ${allNodes.length} Nodes bereit zum Einfügen`)

    // Bestimme die Start-Block-Position (Index im editor.children Array)
    let startBlockIndex: number = editor.children.length // Default: Am Ende
    let shouldReplaceBlock = false

    // ID-basierte Positionierung (NEU)
    if ((position === 'after-node' || position === 'before-node' || position === 'replace-node') && nodeId) {
      const nodeResult = findNodeById(editor, nodeId)
      if (nodeResult) {
        if (position === 'before-node') {
          startBlockIndex = nodeResult.blockIndex
          devLog(`✅ [EDITOR] Node ${nodeId} gefunden, füge davor ein`)
        } else if (position === 'after-node') {
          startBlockIndex = nodeResult.blockIndex + 1
          devLog(`✅ [EDITOR] Node ${nodeId} gefunden, füge danach ein`)
        } else if (position === 'replace-node') {
          startBlockIndex = nodeResult.blockIndex
          shouldReplaceBlock = true
          devLog(`✅ [EDITOR] Node ${nodeId} gefunden, ersetze`)
        }
      } else {
        devWarn(`⚠️ [EDITOR] Node ${nodeId} nicht gefunden, füge am Ende ein`)
      }
    }
    // Section-basierte Positionierung (NEU)
    else if (position === 'append-to-section' && sectionHeading) {
      const headingResult = findHeadingInEditor(editor, sectionHeading)
      if (headingResult) {
        const sectionEnd = findSectionEnd(editor, headingResult.blockIndex)
        startBlockIndex = sectionEnd + 1
        devLog(`✅ [EDITOR] Section "${sectionHeading}" gefunden, füge am Ende ein (nach Block ${sectionEnd})`)
      } else {
        devWarn(`⚠️ [EDITOR] Section "${sectionHeading}" nicht gefunden, füge am Ende ein`)
      }
    }
    // Heading-basierte Positionierung (NEU)
    else if ((position === 'after-heading' || position === 'before-heading') && targetHeading) {
      const headingResult = findHeadingInEditor(editor, targetHeading)
      if (headingResult) {
        if (position === 'before-heading') {
          startBlockIndex = headingResult.blockIndex
        } else {
          startBlockIndex = headingResult.blockIndex + 1
        }
        devLog(`✅ [EDITOR] Heading "${targetHeading}" gefunden in Block ${headingResult.blockIndex}`)
      } else {
        devWarn(`⚠️ [EDITOR] Heading "${targetHeading}" nicht gefunden, füge am Ende ein`)
      }
    }
    // Legacy: Zielbasierte Positionen
    else if ((position === 'after-target' || position === 'before-target' || position === 'replace-target') && (targetText || targetHeading)) {
      let targetBlockIndex: number | null = null

      if (targetText) {
        const textResult = findTextInEditor(editor, targetText)
        if (textResult) {
          targetBlockIndex = textResult.blockIndex
          devLog(`✅ [EDITOR] targetText gefunden in Block ${targetBlockIndex}`)
        }
      }

      if (targetBlockIndex === null && targetHeading) {
        const headingResult = findHeadingInEditor(editor, targetHeading)
        if (headingResult) {
          targetBlockIndex = headingResult.blockIndex
          devLog(`✅ [EDITOR] targetHeading gefunden in Block ${targetBlockIndex}`)
        }
      }

      if (targetBlockIndex !== null) {
        if (position === 'before-target') {
          startBlockIndex = targetBlockIndex
        } else if (position === 'after-target') {
          startBlockIndex = targetBlockIndex + 1
        } else if (position === 'replace-target') {
          startBlockIndex = targetBlockIndex
          shouldReplaceBlock = true
        }
      }
    } else if (position === 'start') {
      startBlockIndex = 0
    } else if (position === 'current') {
      const selection = editor.selection
      if (selection) {
        startBlockIndex = selection.anchor.path[0]
      }
    } else if (position === 'before-bibliography') {
      for (let i = 0; i < editor.children.length; i++) {
        const child = editor.children[i] as any
        if (child && child.bibliography === true) {
          startBlockIndex = i
          break
        }
      }
    }
    // else: position === 'end' -> startBlockIndex bleibt editor.children.length

    devLog(`📝 [EDITOR] Start-Position: Block ${startBlockIndex}`)

    // Bei replace-target: Lösche zuerst den Zielblock
    if (shouldReplaceBlock) {
      try {
        editor.tf.removeNodes({ at: [startBlockIndex] })
        devLog(`🗑️ [EDITOR] Block ${startBlockIndex} entfernt für Ersetzung`)
      } catch (error) {
        devError('❌ [EDITOR] Fehler beim Entfernen des Zielblocks:', error)
      }
    }

    // Füge alle Nodes auf einmal ein (schneller, nur ein Re-Render)
    try {
      editor.tf.insertNodes(allNodes, { at: [startBlockIndex], select: false })
      devLog(`✅ [EDITOR] ${allNodes.length} Nodes eingefügt an Position ${startBlockIndex}`)
    } catch (insertError) {
      devError(`❌ [EDITOR] Batch-Einfügung fehlgeschlagen:`, insertError)
    }
  } catch (error) {
    devError('❌ [EDITOR] Fehler beim Einfügen von Text:', error)
  }
}

/**
 * Globaler Event-Handler für Editor-Text-Einfügung
 * Wird vom Agent über window.dispatchEvent aufgerufen
 */

// Deduplication: Track recently inserted content to prevent duplicates
const recentInsertions = new Map<string, number>()
const DEDUP_WINDOW_MS = 5000 // 5 Sekunden Fenster für Deduplizierung

function generateInsertionHash(markdown: string, position?: string, targetHeading?: string): string {
  // Erstelle einen einfachen Hash aus den ersten 200 Zeichen + Position + Heading
  const contentPreview = markdown.substring(0, 200)
  return `${contentPreview}|${position || 'end'}|${targetHeading || ''}`
}

function cleanupOldInsertions(): void {
  const now = Date.now()
  for (const [hash, timestamp] of recentInsertions.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      recentInsertions.delete(hash)
    }
  }
}

export function setupEditorTextInsertion(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('insert-text-in-editor', async (event: any) => {
    devLog('📝 [EDITOR] insert-text-in-editor Event empfangen:', {
      hasMarkdown: !!event.detail?.markdown,
      markdownLength: event.detail?.markdown?.length,
      position: event.detail?.position,
      targetText: event.detail?.targetText,
      targetHeading: event.detail?.targetHeading,
      nodeId: event.detail?.nodeId,
      sectionHeading: event.detail?.sectionHeading,
      preventDuplicate: event.detail?.preventDuplicate,
    })

    const { markdown, position, targetText, targetHeading, nodeId, sectionHeading, preventDuplicate = true } = event.detail

    if (!markdown) {
      devError('❌ [EDITOR] Kein Markdown im Event-Detail')
      return
    }

    // Deduplizierung: Prüfe ob dieser Text kürzlich eingefügt wurde
    if (preventDuplicate) {
      cleanupOldInsertions()
      const hash = generateInsertionHash(markdown, position, targetHeading)

      if (recentInsertions.has(hash)) {
        devWarn('⚠️ [EDITOR] Doppelte Einfügung erkannt und verhindert:', {
          hash: hash.substring(0, 50),
          lastInserted: Date.now() - (recentInsertions.get(hash) || 0),
        })
        return
      }

      // Markiere diese Einfügung
      recentInsertions.set(hash, Date.now())
    }

    const editorEvent = new CustomEvent('get-editor-instance', {
      detail: { callback: (editor: PlateEditor) => {
        if (editor) {
          devLog('✅ [EDITOR] Editor-Instance erhalten, füge Text ein')
          insertMarkdownText(editor, markdown, position, targetText, targetHeading, nodeId, sectionHeading)
        } else {
          devWarn('⚠️ [EDITOR] Kein Editor-Instance verfügbar')
        }
      }},
    })
    window.dispatchEvent(editorEvent)
  })
}

// ============================================================================
// Delete Text Functions
// ============================================================================

/**
 * Findet den End-Block-Index für eine Heading-Section
 * Eine Heading-Section endet beim nächsten Heading mit gleichem oder höherem Level
 */
const findHeadingSectionEnd = (
  editor: PlateEditor,
  startBlockIndex: number
): number => {
  const blocks = editor.children || []
  const startBlock = blocks[startBlockIndex] as any

  // Bestimme das Level des Start-Headings (h1=1, h2=2, etc.)
  let startLevel = 6 // Default to lowest heading level
  if (startBlock?.type) {
    const match = startBlock.type.match(/h(\d)/)
    if (match) {
      startLevel = parseInt(match[1])
    }
  }

  // Suche nach dem nächsten Heading mit gleichem oder höherem Level
  for (let i = startBlockIndex + 1; i < blocks.length; i++) {
    const block = blocks[i] as any
    if (block?.type) {
      const match = block.type.match(/h(\d)/)
      if (match) {
        const level = parseInt(match[1])
        if (level <= startLevel) {
          return i - 1 // Stoppe vor diesem Heading
        }
      }
    }
  }

  // Wenn kein passendes Heading gefunden wurde, bis zum Ende des Dokuments
  return blocks.length - 1
}

/**
 * Findet einen Textbereich (von startText bis endText) und gibt die Block-Indizes zurück
 */
const findTextRange = (
  editor: PlateEditor,
  startText: string,
  endText: string
): { startBlockIndex: number; endBlockIndex: number } | null => {
  const blocks = editor.children || []
  let startBlockIndex: number | null = null
  let endBlockIndex: number | null = null

  const startSearchText = startText?.trim()
  const endSearchText = endText?.trim()

  if (!startSearchText || !endSearchText) return null

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as any
    const blockText = extractText(block)

    if (startBlockIndex === null && blockText.includes(startSearchText)) {
      startBlockIndex = i
    }

    if (startBlockIndex !== null && blockText.includes(endSearchText)) {
      endBlockIndex = i
      break
    }
  }

  if (startBlockIndex !== null && endBlockIndex !== null) {
    return { startBlockIndex, endBlockIndex }
  }

  return null
}

/**
 * Löscht Text aus dem Editor
 * Unterstützt verschiedene Modi:
 * - 'block': Löscht den gesamten Block, der den targetText enthält
 * - 'text': Löscht nur den exakten targetText innerhalb eines Blocks
 * - 'heading-section': Löscht eine Überschrift und alle folgenden Inhalte bis zur nächsten gleichwertigen Überschrift
 * - 'range': Löscht alle Blöcke von startText bis endText
 */
export function deleteTextFromEditor(
  editor: PlateEditor,
  options: DeleteTextOptions
): { success: boolean; deletedCount: number; message: string } {
  const { targetText, targetHeading, mode = 'block', startText, endText } = options

  if (!targetText && !targetHeading && !startText) {
    devWarn('⚠️ [EDITOR] Kein Ziel für Löschung angegeben')
    return { success: false, deletedCount: 0, message: 'Kein Ziel für Löschung angegeben' }
  }

  try {
    let deletedCount = 0

    if (mode === 'range' && startText && endText) {
      // Range-Modus: Lösche alle Blöcke von startText bis endText
      const range = findTextRange(editor, startText, endText)
      if (range) {
        const { startBlockIndex, endBlockIndex } = range
        const blocksToDelete = endBlockIndex - startBlockIndex + 1

        devLog(`🗑️ [EDITOR] Lösche Range von Block ${startBlockIndex} bis ${endBlockIndex} (${blocksToDelete} Blöcke)`)

        // Lösche von hinten nach vorne, um Index-Verschiebung zu vermeiden
        for (let i = endBlockIndex; i >= startBlockIndex; i--) {
          try {
            editor.tf.removeNodes({ at: [i] })
            deletedCount++
          } catch (error) {
            devError(`❌ [EDITOR] Fehler beim Löschen von Block ${i}:`, error)
          }
        }

        return {
          success: deletedCount > 0,
          deletedCount,
          message: `${deletedCount} Block(s) im Bereich gelöscht`,
        }
      } else {
        return { success: false, deletedCount: 0, message: 'Textbereich nicht gefunden' }
      }
    }

    if (mode === 'heading-section' && targetHeading) {
      // Heading-Section-Modus: Lösche Überschrift und alle folgenden Inhalte
      const headingResult = findHeadingInEditor(editor, targetHeading)
      if (headingResult) {
        const { blockIndex } = headingResult
        const endIndex = findHeadingSectionEnd(editor, blockIndex)
        const blocksToDelete = endIndex - blockIndex + 1

        devLog(`🗑️ [EDITOR] Lösche Heading-Section von Block ${blockIndex} bis ${endIndex} (${blocksToDelete} Blöcke)`)

        // Lösche von hinten nach vorne
        for (let i = endIndex; i >= blockIndex; i--) {
          try {
            editor.tf.removeNodes({ at: [i] })
            deletedCount++
          } catch (error) {
            devError(`❌ [EDITOR] Fehler beim Löschen von Block ${i}:`, error)
          }
        }

        return {
          success: deletedCount > 0,
          deletedCount,
          message: `Überschrift "${targetHeading}" und ${deletedCount - 1} folgende(r) Block(s) gelöscht`,
        }
      } else {
        return { success: false, deletedCount: 0, message: `Überschrift "${targetHeading}" nicht gefunden` }
      }
    }

    if (mode === 'block') {
      // Block-Modus: Lösche den gesamten Block
      let blockIndex: number | null = null

      if (targetHeading) {
        const headingResult = findHeadingInEditor(editor, targetHeading)
        if (headingResult) {
          blockIndex = headingResult.blockIndex
        }
      } else if (targetText) {
        const textResult = findTextInEditor(editor, targetText)
        if (textResult) {
          blockIndex = textResult.blockIndex
        }
      }

      if (blockIndex !== null) {
        devLog(`🗑️ [EDITOR] Lösche Block ${blockIndex}`)
        try {
          editor.tf.removeNodes({ at: [blockIndex] })
          deletedCount = 1
          return {
            success: true,
            deletedCount: 1,
            message: 'Block erfolgreich gelöscht',
          }
        } catch (error) {
          devError('❌ [EDITOR] Fehler beim Löschen des Blocks:', error)
          return { success: false, deletedCount: 0, message: 'Fehler beim Löschen des Blocks' }
        }
      } else {
        return { success: false, deletedCount: 0, message: 'Zieltext nicht gefunden' }
      }
    }

    if (mode === 'text' && targetText) {
      // Text-Modus: Lösche nur den exakten Text innerhalb eines Blocks
      const textResult = findTextInEditor(editor, targetText)
      if (textResult) {
        const { blockIndex, path, offset } = textResult
        const searchText = targetText.trim()

        devLog(`🗑️ [EDITOR] Lösche Text "${searchText.substring(0, 50)}..." in Block ${blockIndex}`)

        // Berechne Start-Offset (offset ist das Ende des gefundenen Texts)
        const startOffset = offset - searchText.length

        try {
          // Setze die Auswahl auf den zu löschenden Text
          const startPath = [...path]
          const endPath = [...path]

          editor.tf.select({
            anchor: { path: startPath, offset: startOffset },
            focus: { path: endPath, offset: offset },
          })

          // Lösche die Auswahl
          editor.tf.delete()
          deletedCount = 1

          return {
            success: true,
            deletedCount: 1,
            message: 'Text erfolgreich gelöscht',
          }
        } catch (error) {
          devError('❌ [EDITOR] Fehler beim Löschen des Texts:', error)
          return { success: false, deletedCount: 0, message: 'Fehler beim Löschen des Texts' }
        }
      } else {
        return { success: false, deletedCount: 0, message: `Text "${targetText}" nicht gefunden` }
      }
    }

    return { success: false, deletedCount: 0, message: 'Ungültiger Modus oder fehlende Parameter' }
  } catch (error) {
    devError('❌ [EDITOR] Fehler beim Löschen von Text:', error)
    return { success: false, deletedCount: 0, message: error instanceof Error ? error.message : 'Unbekannter Fehler' }
  }
}

/**
 * Globaler Event-Handler für Editor-Text-Löschung
 * Wird vom Agent über window.dispatchEvent aufgerufen
 */
export function setupEditorTextDeletion(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('delete-text-from-editor', async (event: any) => {
    devLog('🗑️ [EDITOR] delete-text-from-editor Event empfangen:', {
      targetText: event.detail?.targetText,
      targetHeading: event.detail?.targetHeading,
      mode: event.detail?.mode,
      startText: event.detail?.startText,
      endText: event.detail?.endText,
    })

    const { targetText, targetHeading, mode, startText, endText } = event.detail

    if (!targetText && !targetHeading && !startText) {
      devError('❌ [EDITOR] Kein Ziel für Löschung im Event-Detail')
      return
    }

    const editorEvent = new CustomEvent('get-editor-instance', {
      detail: { callback: (editor: PlateEditor) => {
        if (editor) {
          devLog('✅ [EDITOR] Editor-Instance erhalten, lösche Text')
          const result = deleteTextFromEditor(editor, {
            targetText,
            targetHeading,
            mode,
            startText,
            endText,
          })
          devLog('🗑️ [EDITOR] Lösch-Ergebnis:', result)
        } else {
          devWarn('⚠️ [EDITOR] Kein Editor-Instance verfügbar')
        }
      }},
    })
    window.dispatchEvent(editorEvent)
  })
}

