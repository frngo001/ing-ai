import { tool } from 'ai'
import { z } from 'zod'
import { Buffer } from 'node:buffer'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'

const queryLanguage = async () => {
  try {
    return await getLanguageForServer()
  } catch {
    return 'de'
  }
}

// ============================================================================
// Types für Editor-Struktur
// ============================================================================

interface EditorNode {
  id: string
  type: string
  text?: string
  level?: number  // Für Headings (h1=1, h2=2, etc.)
  children?: EditorNode[]
  path: number[]  // Position im Editor-Baum
}

interface EditorSection {
  id: string
  headingId: string
  headingText: string
  headingLevel: number
  startPath: number[]
  endPath: number[]
  childNodes: string[]  // IDs der Nodes in dieser Section
}

interface EditorStructure {
  nodes: EditorNode[]
  sections: EditorSection[]
  headings: Array<{
    id: string
    text: string
    level: number
    path: number[]
  }>
  totalBlocks: number
  totalWords: number
  totalCharacters: number
}

// ============================================================================
// Helper: Parse Editor-Struktur aus JSON
// ============================================================================

function parseEditorStructure(editorJson: any[]): EditorStructure {
  const nodes: EditorNode[] = []
  const headings: EditorStructure['headings'] = []
  let totalWords = 0
  let totalCharacters = 0

  const extractText = (node: any): string => {
    if (typeof node?.text === 'string') return node.text
    if (node?.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  const getHeadingLevel = (type: string): number | undefined => {
    const match = type.match(/^h(\d)$/)
    return match ? parseInt(match[1]) : undefined
  }

  // Parse alle Top-Level Nodes
  for (let i = 0; i < editorJson.length; i++) {
    const block = editorJson[i]
    const blockText = extractText(block)
    const wordCount = blockText.split(/\s+/).filter(w => w.length > 0).length
    totalWords += wordCount
    totalCharacters += blockText.length

    const nodeId = block.id || `block-${i}`
    const level = getHeadingLevel(block.type)

    const node: EditorNode = {
      id: nodeId,
      type: block.type || 'p',
      text: blockText.substring(0, 200), // Vorschau
      level,
      path: [i],
    }

    nodes.push(node)

    // Headings sammeln
    if (level) {
      headings.push({
        id: nodeId,
        text: blockText,
        level,
        path: [i],
      })
    }
  }

  // Sections basierend auf Headings erstellen
  const sections: EditorSection[] = []
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]
    const nextHeadingIndex = i + 1 < headings.length ? headings[i + 1].path[0] : editorJson.length

    const childNodeIds: string[] = []
    for (let j = heading.path[0]; j < nextHeadingIndex; j++) {
      childNodeIds.push(nodes[j]?.id || `block-${j}`)
    }

    sections.push({
      id: `section-${heading.id}`,
      headingId: heading.id,
      headingText: heading.text,
      headingLevel: heading.level,
      startPath: heading.path,
      endPath: [nextHeadingIndex - 1],
      childNodes: childNodeIds,
    })
  }

  return {
    nodes,
    sections,
    headings,
    totalBlocks: nodes.length,
    totalWords,
    totalCharacters,
  }
}

// ============================================================================
// Tool: getEditorContent (erweitert mit Struktur-Informationen)
// ============================================================================

export function createGetEditorContentTool(editorContent: string, editorJson?: any[]) {
  return tool({
    description: `Ruft den aktuellen Inhalt des Editors ab. Gibt Markdown-Text UND die Dokument-Struktur mit allen Node-IDs zurück.

WICHTIG: Die zurückgegebenen Node-IDs können für insertTextInEditor verwendet werden:
- nodeId: Eindeutige ID jedes Blocks (z.B. "abc123", "block-0")
- sections: Strukturierte Kapitel mit Start/End-Positionen
- headings: Alle Überschriften mit Level und Position`,
    inputSchema: z.object({
      includeFullText: z.boolean().optional().describe('Vollständigen Markdown-Text zurückgeben (Standard: true)'),
      includeStructure: z.boolean().optional().describe('Dokument-Struktur mit Node-IDs zurückgeben (Standard: true)'),
      maxTextLength: z.number().optional().describe('Maximale Länge des Markdown-Texts'),
    }),
    execute: async ({ includeFullText = true, includeStructure = true, maxTextLength }) => {
      const language = await queryLanguage()

      // Leerer Editor
      if (!editorContent || editorContent.trim().length === 0) {
        return {
          success: true,
          isEmpty: true,
          content: '',
          structure: null,
          message: translations[language as Language]?.askAi?.toolGetEditorContentEmpty || 'Der Editor ist leer.',
          characterCount: 0,
          wordCount: 0,
        }
      }

      // Text-Statistiken
      let content = editorContent.trim()
      if (maxTextLength && content.length > maxTextLength) {
        content = content.substring(0, maxTextLength) + '...'
      }

      const characterCount = editorContent.length
      const wordCount = editorContent.split(/\s+/).filter(w => w.length > 0).length
      const paragraphCount = editorContent.split(/\n\n+/).filter(p => p.trim().length > 0).length
      const headingsFromText = editorContent.match(/^#{1,6}\s.+$/gm) || []

      // Struktur parsen (wenn JSON verfügbar)
      let structure: EditorStructure | null = null
      if (includeStructure && editorJson && Array.isArray(editorJson)) {
        structure = parseEditorStructure(editorJson)
      }

      return {
        success: true,
        isEmpty: false,
        // Markdown-Text
        content: includeFullText ? content : undefined,
        // Struktur-Informationen
        structure: includeStructure ? structure : undefined,
        // Statistiken
        message: `Editor-Inhalt: ${wordCount} Wörter, ${characterCount} Zeichen.`,
        characterCount,
        wordCount,
        paragraphCount,
        headingCount: structure?.headings.length || headingsFromText.length,
        // Quick-Reference für häufige Operationen
        quickRef: structure ? {
          firstHeadingId: structure.headings[0]?.id,
          lastBlockId: structure.nodes[structure.nodes.length - 1]?.id,
          sectionCount: structure.sections.length,
          headingIds: structure.headings.map(h => ({ id: h.id, text: h.text.substring(0, 50) })),
        } : undefined,
      }
    },
  })
}

// ============================================================================
// Tool: insertTextInEditor (komplett neu mit ID-basierter Positionierung)
// ============================================================================

export const insertTextInEditorTool = tool({
  description: `Fügt Markdown-Text im Editor ein. Unterstützt verschiedene Positionierungsmethoden:

POSITIONS-OPTIONEN:
- "end": Am Ende des Dokuments (Standard)
- "start": Am Anfang des Dokuments
- "after-node": Nach einem bestimmten Node (erfordert nodeId)
- "before-node": Vor einem bestimmten Node (erfordert nodeId)
- "replace-node": Ersetzt einen bestimmten Node (erfordert nodeId)
- "append-to-section": Am Ende einer Section/Kapitel (erfordert sectionHeading)
- "after-heading": Nach einer bestimmten Überschrift (erfordert targetHeading)
- "before-heading": Vor einer bestimmten Überschrift (erfordert targetHeading)

WICHTIG:
- Rufe ZUERST getEditorContent auf, um Node-IDs zu erhalten
- Verwende nodeId für präzise Positionierung
- targetText/targetHeading als Fallback wenn keine IDs verfügbar`,
  inputSchema: z.object({
    markdown: z.string().min(1).describe('Markdown-Text der eingefügt werden soll'),
    position: z.enum([
      'start',
      'end',
      'current',
      'after-node',
      'before-node',
      'replace-node',
      'append-to-section',
      'after-heading',
      'before-heading',
      'after-target',
      'before-target',
      'replace-target',
      'before-bibliography',
    ]).optional().describe('Position im Editor'),
    // Neue ID-basierte Positionierung
    nodeId: z.string().optional().describe('ID des Ziel-Nodes (von getEditorContent). Für after-node, before-node, replace-node.'),
    sectionHeading: z.string().optional().describe('Überschrift der Section für append-to-section. Text muss nicht exakt matchen.'),
    // Legacy-Unterstützung
    targetText: z.string().optional().describe('(Legacy) Text im Editor für Positionierung'),
    targetHeading: z.string().optional().describe('Überschrift für after-heading/before-heading'),
    // Optionen
    focusOnHeadings: z.boolean().optional().describe('Nach dem Einfügen zur Überschrift scrollen'),
    preventDuplicate: z.boolean().optional().describe('Verhindert doppeltes Einfügen des gleichen Texts'),
  }),
  execute: async ({
    markdown,
    position = 'end',
    nodeId,
    sectionHeading,
    targetText,
    targetHeading,
    focusOnHeadings = true,
    preventDuplicate = true,
  }) => {
    // Validierung
    if (!markdown || markdown.trim().length === 0) {
      return {
        success: false,
        error: 'Markdown-Text ist leer',
      }
    }

    // Payload für Frontend
    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'insertTextInEditor',
      markdown: markdown.trim(),
      position,
      nodeId,
      sectionHeading,
      targetText,
      targetHeading,
      focusOnHeadings,
      preventDuplicate,
    })

    const base64Payload = Buffer.from(payload).toString('base64')

    return {
      success: true,
      markdownLength: markdown.length,
      wordCount: markdown.split(/\s+/).filter(w => w.length > 0).length,
      position,
      nodeId,
      sectionHeading,
      targetHeading,
      eventType: 'insert-text-in-editor',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
      // Feedback für den Agent
      hint: nodeId
        ? `Text wird ${position === 'replace-node' ? 'anstelle von' : position === 'before-node' ? 'vor' : 'nach'} Node ${nodeId} eingefügt.`
        : sectionHeading
          ? `Text wird am Ende der Section "${sectionHeading}" angefügt.`
          : `Text wird an Position "${position}" eingefügt.`,
    }
  },
})

// ============================================================================
// Tool: deleteTextFromEditor
// ============================================================================

export const deleteTextFromEditorTool = tool({
  description: `Löscht Text aus dem Editor.

MODI:
- "block": Löscht den gesamten Block (Standard)
- "node": Löscht einen Node per ID (erfordert nodeId)
- "text": Löscht nur den exakten Text
- "heading-section": Löscht Überschrift und alle folgenden Inhalte
- "range": Löscht alle Blöcke zwischen startText und endText

WICHTIG: Lies IMMER zuerst den Editor-Inhalt mit getEditorContent.`,
  inputSchema: z.object({
    // Neue ID-basierte Löschung
    nodeId: z.string().optional().describe('ID des zu löschenden Nodes (von getEditorContent)'),
    nodeIds: z.array(z.string()).optional().describe('IDs mehrerer zu löschender Nodes'),
    // Legacy-Unterstützung
    targetText: z.string().optional().describe('Text der gelöscht werden soll'),
    targetHeading: z.string().optional().describe('Überschrift die gelöscht werden soll'),
    mode: z.enum(['block', 'node', 'text', 'heading-section', 'range'])
      .optional()
      .describe('Lösch-Modus'),
    startText: z.string().optional().describe('Bei mode "range": Text am Anfang'),
    endText: z.string().optional().describe('Bei mode "range": Text am Ende'),
  }),
  execute: async ({ nodeId, nodeIds, targetText, targetHeading, mode = 'block', startText, endText }) => {
    const language = await queryLanguage()

    // Bestimme den effektiven Modus basierend auf den Parametern
    let effectiveMode = mode
    if (nodeId || nodeIds) {
      effectiveMode = 'node'
    }

    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'deleteTextFromEditor',
      nodeId,
      nodeIds,
      targetText,
      targetHeading,
      mode: effectiveMode,
      startText,
      endText,
    })

    const base64Payload = Buffer.from(payload).toString('base64')

    return {
      success: true,
      nodeId,
      nodeIds,
      targetText: targetText?.substring(0, 100),
      targetHeading,
      mode: effectiveMode,
      message: translations[language as Language]?.askAi?.toolDeleteTextFromEditorMessage || 'Text bereit für Löschung im Editor',
      eventType: 'delete-text-from-editor',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

// ============================================================================
// Tool: addCitation
// ============================================================================

export const addCitationTool = tool({
  description: `Fügt ein formales Zitat im Editor ein.

WICHTIG:
1. Rufe ZUERST getLibrarySources auf, um die exakte sourceId zu erhalten
2. Die sourceId muss das Format "src-..." oder eine UUID haben
3. NIEMALS DOIs, URLs oder OpenAlex-IDs als sourceId verwenden

POSITIONIERUNG:
- Ohne targetText/nodeId: Am aktuellen Cursor
- Mit targetText: Nach dem angegebenen Text
- Mit nodeId: Am Ende des angegebenen Nodes`,
  inputSchema: z.object({
    sourceId: z.string().describe('EXAKTE ID der Quelle aus getLibrarySources (z.B. "src-1736523489123-456")'),
    targetText: z.string().optional().describe('Text nach dem das Zitat eingefügt werden soll'),
    nodeId: z.string().optional().describe('ID des Nodes an dessen Ende das Zitat eingefügt werden soll'),
  }),
  execute: async ({ sourceId, targetText, nodeId }) => {
    // Validierung der sourceId
    const isValidFormat = sourceId.startsWith('src-') ||
      sourceId.startsWith('cite_') ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sourceId)

    if (!isValidFormat) {
      return {
        success: false,
        error: `Ungültige sourceId "${sourceId}". Verwende die exakte ID aus getLibrarySources.`,
        hint: 'sourceId muss das Format "src-...", "cite_..." oder eine UUID haben.',
      }
    }

    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'addCitation',
      sourceId,
      targetText,
      nodeId,
    })

    const base64Payload = Buffer.from(payload).toString('base64')

    return {
      success: true,
      sourceId,
      targetText,
      nodeId,
      eventType: 'insert-citation',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

// ============================================================================
// Tool: updateNodeById (NEU)
// ============================================================================

export const updateNodeByIdTool = tool({
  description: `Aktualisiert einen bestimmten Node im Editor per ID.

Verwendung:
1. Rufe getEditorContent auf, um die Node-IDs zu erhalten
2. Verwende die nodeId um den zu aktualisierenden Node zu identifizieren
3. Gib den neuen Markdown-Inhalt an

Dies ist präziser als deleteTextFromEditor + insertTextInEditor.`,
  inputSchema: z.object({
    nodeId: z.string().describe('ID des zu aktualisierenden Nodes'),
    newContent: z.string().describe('Neuer Markdown-Inhalt für den Node'),
    preserveId: z.boolean().optional().describe('Node-ID beibehalten (Standard: true)'),
  }),
  execute: async ({ nodeId, newContent, preserveId = true }) => {
    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'updateNodeById',
      nodeId,
      newContent,
      preserveId,
    })

    const base64Payload = Buffer.from(payload).toString('base64')

    return {
      success: true,
      nodeId,
      contentLength: newContent.length,
      eventType: 'update-node',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

// ============================================================================
// Tool: findNodesInEditor (NEU)
// ============================================================================

export const findNodesInEditorTool = tool({
  description: `Sucht nach Nodes im Editor basierend auf Text-Inhalt oder Typ.

Verwendung:
- Suche nach bestimmtem Text (auch Fuzzy-Matching)
- Filtere nach Node-Typ (p, h1, h2, table, etc.)
- Finde alle Nodes einer bestimmten Section

Gibt Node-IDs zurück, die für andere Tools verwendet werden können.`,
  inputSchema: z.object({
    searchText: z.string().optional().describe('Text nach dem gesucht werden soll'),
    nodeType: z.string().optional().describe('Node-Typ (p, h1, h2, h3, table, code_block, etc.)'),
    inSection: z.string().optional().describe('Nur in dieser Section suchen (Überschriften-Text)'),
    fuzzyMatch: z.boolean().optional().describe('Fuzzy-Matching aktivieren (Standard: false)'),
    limit: z.number().optional().describe('Maximale Anzahl Ergebnisse (Standard: 10)'),
  }),
  execute: async ({ searchText, nodeType, inSection, fuzzyMatch = false, limit = 10 }) => {
    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'findNodesInEditor',
      searchText,
      nodeType,
      inSection,
      fuzzyMatch,
      limit,
    })

    const base64Payload = Buffer.from(payload).toString('base64')

    return {
      success: true,
      searchText,
      nodeType,
      inSection,
      eventType: 'find-nodes',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
      hint: 'Ergebnisse werden im Frontend verarbeitet und als Node-IDs zurückgegeben.',
    }
  },
})
