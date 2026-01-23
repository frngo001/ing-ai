import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { devLog, devError } from '@/lib/utils/logger'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { createAgent, runAgentStream } from '@/lib/ai/create-agent'
import { createAgentStreamHandler, createStreamResponse } from '@/lib/ai/agent-stream-handler'
import { BACHELORARBEIT_AGENT_PROMPT } from './prompts'
import { logAIUsage, updateAIUsageTokens, logAgentExecution } from '@/lib/monitoring/ai-usage-tracker'
import { ensureActiveSession, trackEndpointUsage } from '@/lib/monitoring/session-tracker'
import { updateTodayStats } from '@/lib/monitoring/daily-stats-aggregator'
import { DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'

export const runtime = 'nodejs'

const queryLanguage = async () => {
  try {
    return await getLanguageForServer()
  } catch {
    return 'en'
  }
}

const LANGUAGE_INSTRUCTION = `

---

## CRITICAL: RESPONSE LANGUAGE (ABSOLUTE PRIORITY!)

**You MUST detect and match the language of the user's input or the editor content.**

1. **Language Detection Priority:**
   - FIRST: Analyze the language of the user's latest message
   - SECOND: If the editor content is provided, analyze its language
   - If both are present and differ, prioritize the user's message language

2. **Matching Rule:**
   - If user writes in German → respond in German
   - If user writes in English → respond in English
   - If user writes in Spanish → respond in Spanish
   - If user writes in French → respond in French

3. **When Uncertain:**
   - If you cannot clearly determine the language, ASK the user: "In welcher Sprache soll ich antworten? / In which language should I respond?"

4. **Text Generation:**
   - When writing text for the editor, use the SAME language as the existing editor content
   - If the editor is empty, use the language of the user's request

5. **Exception:**
   - Technical terms, citations, and source titles may remain in their original language

**This language rule overrides ALL other language instructions in this prompt.**`

export async function POST(req: NextRequest) {
  const requestStartTime = Date.now()
  let usageLogId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      devError('[BACHELORARBEIT AGENT] Nicht authentifiziert:', authError?.message)
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { messages, agentState, editorContent, documentContextEnabled, fileContents, projectId } = await req.json()

    if (!agentState) {
      return NextResponse.json({ error: 'Agent State erforderlich' }, { status: 400 })
    }

    const language = await queryLanguage()
    const currentEditorContent: string = editorContent || ''
    const currentProjectId: string | undefined = projectId

    // Thema aus agentState oder Messages extrahieren
    let thema = agentState.thema
    if (!thema && messages && messages.length > 0) {
      const firstUserMessage = messages.find((m: { role: string }) => m.role === 'user')
      if (firstUserMessage?.content) {
        thema = firstUserMessage.content.substring(0, 200)
      }
    }
    thema = thema || 'Wissenschaftliche Arbeit'

    // System Prompt vorbereiten
    const dateLocale = language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US'
    let systemPrompt = BACHELORARBEIT_AGENT_PROMPT
      .replace('{{THEMA}}', thema)
      .replace('{{ARBEIT_TYPE}}', agentState.arbeitType || 'bachelor')
      .replace('{{CURRENT_STEP}}', String(agentState.currentStep || 4))
      .replace('{{CURRENT_DATE}}', new Date().toLocaleDateString(dateLocale, { dateStyle: 'full' }))

    // Add language instruction at the end of the system prompt
    systemPrompt += LANGUAGE_INSTRUCTION

    // Datei-Inhalte hinzufügen
    if (fileContents && Array.isArray(fileContents) && fileContents.length > 0) {
      const fileSections = fileContents
        .filter((file: { content?: string }) => file.content && file.content.trim().length > 0)
        .map((file: { name: string; content: string }) => {
          const wordCount = file.content.split(/\s+/).filter((w: string) => w.length > 0).length
          return `### Datei: ${file.name}\n\nInhalt (${wordCount} Wörter):\n\n\`\`\`\n${file.content}\n\`\`\``
        })

      if (fileSections.length > 0) {
        systemPrompt += `\n\n## Hochgeladene Dateien\n\n${fileSections.join('\n\n---\n\n')}`
        devLog('[BACHELORARBEIT AGENT] Dateien hinzugefügt:', { count: fileContents.length })
      }
    }

    // Editor-Kontext hinzufügen
    if (documentContextEnabled && currentEditorContent.trim().length > 0) {
      const wordCount = currentEditorContent.split(/\s+/).filter((w: string) => w.length > 0).length
      const headings = currentEditorContent.match(/^#{1,6}\s.+$/gm) || []
      const truncatedContent = currentEditorContent.length > 8000
        ? currentEditorContent.substring(0, 8000) + '\n\n' + (translations[language as Language]?.askAi?.toolTextTruncated || '[... Text gekürzt ...]')
        : currentEditorContent

      systemPrompt += `\n\n## Aktueller Editor-Inhalt\n\n**Statistiken:** ${wordCount} Wörter, ${headings.length} Überschriften\n\n\`\`\`\n${truncatedContent}\n\`\`\``
      devLog('[BACHELORARBEIT AGENT] Editor-Kontext hinzugefügt:', { wordCount })
    }

    // Start usage logging
    usageLogId = await logAIUsage({
      userId: user.id,
      endpoint: 'agent/bachelorarbeit',
      model: DEEPSEEK_CHAT_MODEL,
      status: 'success',
      metadata: {
        thema,
        arbeitType: agentState.arbeitType,
        currentStep: agentState.currentStep,
        hasFiles: fileContents?.length > 0,
        documentContextEnabled,
      },
    })

    // Track session activity
    const sessionId = await ensureActiveSession(user.id)
    if (sessionId) {
      await trackEndpointUsage(sessionId, 'agent/bachelorarbeit')
    }

    // Agent erstellen
    const agent = createAgent('bachelorarbeit', {
      userId: user.id,
      projectId: currentProjectId,
      editorContent: currentEditorContent,
      systemPrompt,
      maxSteps: 20,
      maxOutputTokens: 8192,
    })

    // Agent Stream starten
    const agentStream = await runAgentStream(agent, messages)

    // Track tool calls and token usage
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const toolCallsLog: Array<{ toolName: string; timestamp: number }> = []

    // Stream Response erstellen
    const customStream = createAgentStreamHandler(agentStream, {
      onToolCall: (toolName, input) => {
        devLog(`[BACHELORARBEIT AGENT] Tool called: ${toolName}`)
        toolCallsLog.push({ toolName, timestamp: Date.now() })
      },
      onStepFinish: (step: any) => {
        // Accumulate token usage from each step
        if (step.usage) {
          totalInputTokens += step.usage.inputTokens || 0
          totalOutputTokens += step.usage.outputTokens || 0
        }
      },
      onFinish: async () => {
        const duration = Date.now() - requestStartTime

        // Update token counts
        if (usageLogId && (totalInputTokens > 0 || totalOutputTokens > 0)) {
          await updateAIUsageTokens(usageLogId, {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
          })

          // Update duration
          const supabase = await createClient()
          await supabase
            .from('ai_usage_logs')
            .update({ duration_ms: duration })
            .eq('id', usageLogId)
        }

        // Log agent execution details
        if (usageLogId && toolCallsLog.length > 0) {
          await logAgentExecution({
            usageLogId,
            userId: user.id,
            agentType: 'bachelorarbeit',
            toolCalls: toolCallsLog,
            stepDurationMs: duration,
          })
        }

        // Update daily stats (async, non-blocking)
        updateTodayStats(user.id).catch((err) => {
          devError('[Bachelorarbeit Agent] Failed to update daily stats:', err)
        })
      },
      onError: (error) => {
        devError('[BACHELORARBEIT AGENT] Error:', error.message)
      },
    })

    return createStreamResponse(customStream)
  } catch (error) {
    const requestTime = Date.now() - requestStartTime
    devError('❌ [BACHELORARBEIT AGENT] Error nach', requestTime + 'ms:', error)

    // Log error (try to get user.id if available)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await logAIUsage({
          userId: user.id,
          endpoint: 'agent/bachelorarbeit',
          model: DEEPSEEK_CHAT_MODEL,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          durationMs: requestTime,
        })
      }
    } catch (logError) {
      devError('[BACHELORARBEIT AGENT] Failed to log error:', logError)
    }

    return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 })
  }
}
