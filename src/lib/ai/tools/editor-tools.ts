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

export const insertTextInEditorTool = tool({
  description: 'Fügt Markdown-Text direkt im Editor hinzu. Unterstützt zielbasiertes Einfügen nach/vor bestimmtem Text oder Überschriften.',
  inputSchema: z.object({
    markdown: z.string().min(10).describe('Markdown-Text der eingefügt werden soll'),
    position: z.enum(['start', 'end', 'current', 'before-bibliography', 'after-target', 'before-target', 'replace-target'])
      .optional()
      .describe('Position im Editor (Standard: end). "after-target"/"before-target"/"replace-target" erfordern targetText.'),
    targetText: z.string().optional().describe('Optional: Text im Editor nach/vor dem der neue Text eingefügt werden soll'),
    targetHeading: z.string().optional().describe('Optional: Überschrift nach der der Text eingefügt werden soll (z.B. "## Einleitung")'),
    focusOnHeadings: z.boolean().optional(),
  }),
  execute: async ({ markdown, position = 'end', targetText, targetHeading, focusOnHeadings = true }) => {
    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'insertTextInEditor',
      markdown,
      position,
      targetText,
      targetHeading,
      focusOnHeadings
    })
    const base64Payload = Buffer.from(payload).toString('base64')
    return {
      success: true,
      markdownLength: markdown.length,
      position,
      targetText,
      targetHeading,
      markdown,
      eventType: 'insert-text-in-editor',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

export const deleteTextFromEditorTool = tool({
  description: 'Löscht Text aus dem Editor. Nutze dies, um Text zu entfernen, bevor du eine verbesserte Version einfügst. WICHTIG: Lies IMMER zuerst den Editor-Inhalt mit getEditorContent.',
  inputSchema: z.object({
    targetText: z.string().optional().describe('Text der gelöscht werden soll.'),
    targetHeading: z.string().optional().describe('Überschrift die gelöscht werden soll (z.B. "## Einleitung").'),
    mode: z.enum(['block', 'text', 'heading-section', 'range'])
      .optional()
      .describe('Lösch-Modus: "block" (Standard), "text", "heading-section", "range".'),
    startText: z.string().optional().describe('Bei mode "range": Text am Anfang.'),
    endText: z.string().optional().describe('Bei mode "range": Text am Ende.'),
  }),
  execute: async ({ targetText, targetHeading, mode = 'block', startText, endText }) => {
    const language = await queryLanguage()
    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'deleteTextFromEditor',
      targetText,
      targetHeading,
      mode,
      startText,
      endText
    })
    const base64Payload = Buffer.from(payload).toString('base64')
    return {
      success: true,
      targetText: targetText?.substring(0, 100),
      targetHeading,
      mode,
      message: translations[language as Language]?.askAi?.toolDeleteTextFromEditorMessage || 'Text bereit für Löschung im Editor',
      eventType: 'delete-text-from-editor',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

export const addCitationTool = tool({
  description: 'Fügt ein formales Zitat an der aktuellen Cursor-Position im Editor ein. WICHTIG: Vor dem Aufruf MUSS getLibrarySources aufgerufen werden, um die exakte sourceId zu erhalten!',
  inputSchema: z.object({
    sourceId: z.string().describe('EXAKTE ID der Quelle aus getLibrarySources (z.B. "src-1736523489123-456" oder "cite_1736523489123_abc"). NIEMALS DOIs, URLs oder OpenAlex-IDs verwenden!'),
    targetText: z.string().optional().describe('Optional: Text nach dem das Zitat eingefügt werden soll.'),
  }),
  execute: async ({ sourceId, targetText }) => {
    const payload = JSON.stringify({ type: 'tool-result', toolName: 'addCitation', sourceId, targetText })
    const base64Payload = Buffer.from(payload).toString('base64')
    return {
      success: true,
      eventType: 'insert-citation',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

export function createGetEditorContentTool(editorContent: string) {
  return tool({
    description: 'Ruft den aktuellen Inhalt des Editors ab.',
    inputSchema: z.object({
      includeFullText: z.boolean().optional().describe('Ob der vollständige Text zurückgegeben werden soll (Standard: true).'),
      maxLength: z.number().optional().describe('Maximale Länge des zurückgegebenen Textes.'),
    }),
    execute: async ({ includeFullText = true, maxLength }) => {
      const language = await queryLanguage()

      if (!editorContent || editorContent.trim().length === 0) {
        return {
          success: true,
          isEmpty: true,
          content: '',
          message: translations[language as Language]?.askAi?.toolGetEditorContentEmpty || 'Der Editor ist leer.',
          characterCount: 0,
          wordCount: 0,
        }
      }

      let content = editorContent.trim()
      if (maxLength && content.length > maxLength) {
        content = content.substring(0, maxLength) + '...'
      }

      const characterCount = editorContent.length
      const wordCount = editorContent.split(/\s+/).filter(w => w.length > 0).length
      const paragraphCount = editorContent.split(/\n\n+/).filter(p => p.trim().length > 0).length
      const headings = editorContent.match(/^#{1,6}\s.+$/gm) || []

      return {
        success: true,
        isEmpty: false,
        content: includeFullText ? content : undefined,
        summary: !includeFullText ? `${wordCount} Wörter, ${paragraphCount} Absätze, ${headings.length} Überschriften` : undefined,
        message: `Editor-Inhalt: ${wordCount} Wörter, ${characterCount} Zeichen.`,
        characterCount,
        wordCount,
        paragraphCount,
        headingCount: headings.length,
        headings: headings.slice(0, 10),
      }
    },
  })
}
