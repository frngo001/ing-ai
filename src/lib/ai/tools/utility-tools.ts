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

export const addThemaTool = tool({
  description: 'Setzt das Thema der Arbeit.',
  inputSchema: z.object({
    thema: z.string().describe('Das Thema der Arbeit'),
  }),
  execute: async ({ thema }) => {
    const language = await queryLanguage()
    const toolResult = { type: 'tool-result', toolName: 'addThema', thema }
    const base64Payload = Buffer.from(JSON.stringify(toolResult)).toString('base64')

    const messageTemplate = translations[language as Language]?.askAi?.toolAddThemaMessage || 'Thema "{thema}" wurde gesetzt'
    const message = messageTemplate.replace('{thema}', thema)

    return {
      success: true,
      message,
      thema,
      encodedResult: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

export const saveStepDataTool = tool({
  description: 'Speichert Daten für den aktuellen Schritt',
  inputSchema: z.object({
    step: z.number(),
    data: z.object({}).passthrough()
  }),
  execute: async ({ step }) => {
    return { success: true, message: 'Daten sollten im Client-State gespeichert werden', step }
  },
})

export const getCurrentStepTool = tool({
  description: 'Ruft den aktuellen Schritt ab',
  inputSchema: z.object({ _placeholder: z.string().optional() }),
  execute: async () => {
    const language = await queryLanguage()
    const message = translations[language as Language]?.askAi?.toolGetCurrentStepMessage || 'Verwende den Agent State Store'
    return { message }
  },
})

export const finishTool = tool({
  description: 'Rufe dieses Tool auf, wenn die Aufgabe vollständig erledigt ist und du keine weiteren Aktionen mehr durchführen musst.',
  inputSchema: z.object({
    summary: z.string().describe('Zusammenfassung dessen, was erledigt wurde'),
    nextSteps: z.array(z.string()).optional().describe('Optionale nächste Schritte für den Nutzer'),
  }),
  execute: async ({ summary, nextSteps }) => {
    return {
      success: true,
      finished: true,
      summary,
      nextSteps: nextSteps || [],
      message: 'Aufgabe abgeschlossen.',
    }
  },
})
