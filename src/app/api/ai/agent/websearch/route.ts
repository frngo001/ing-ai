import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { devLog, devError } from '@/lib/utils/logger'
import { createAgent, runAgentStream } from '@/lib/ai/create-agent'
import { createAgentStreamHandler, createStreamResponse } from '@/lib/ai/agent-stream-handler'
import { WEBSEARCH_AGENT_PROMPT } from './prompts'
import { logAIUsage, updateAIUsageTokens, logAgentExecution } from '@/lib/monitoring/ai-usage-tracker'
import { ensureActiveSession, trackEndpointUsage } from '@/lib/monitoring/session-tracker'
import { updateTodayStats } from '@/lib/monitoring/daily-stats-aggregator'
import { DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const requestStartTime = Date.now()
  let usageLogId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      devError('[WEBSEARCH AGENT] Nicht authentifiziert:', authError?.message)
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { messages, fileContents } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages erforderlich' }, { status: 400 })
    }

    // System Prompt vorbereiten
    let systemPrompt = WEBSEARCH_AGENT_PROMPT
      .replace('{{CURRENT_DATE}}', new Date().toLocaleDateString('de-DE', { dateStyle: 'full' }))

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
        devLog('[WEBSEARCH AGENT] Dateien hinzugefügt:', { count: fileContents.length })
      }
    }

    // Start usage logging
    usageLogId = await logAIUsage({
      userId: user.id,
      endpoint: 'agent/websearch',
      model: DEEPSEEK_CHAT_MODEL,
      status: 'success',
      metadata: {
        hasFiles: fileContents?.length > 0,
        messagesCount: messages.length,
      },
    })

    // Track session activity
    const sessionId = await ensureActiveSession(user.id)
    if (sessionId) {
      await trackEndpointUsage(sessionId, 'agent/websearch')
    }

    // Agent erstellen
    const agent = createAgent('websearch', {
      userId: user.id,
      systemPrompt,
      maxSteps: 5,
    })

    // Agent Stream starten
    const agentStream = await runAgentStream(agent, messages)

    // Track tool calls and token usage
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const toolCallsLog: Array<{ toolName: string; timestamp: number }> = []

    // Stream Response erstellen
    const customStream = createAgentStreamHandler(agentStream, {
      onToolCall: (toolName) => {
        devLog(`[WEBSEARCH AGENT] Tool called: ${toolName}`)
        toolCallsLog.push({ toolName, timestamp: Date.now() })
      },
      onStepFinish: (step: unknown) => {
        // Accumulate token usage from each step
        const stepData = step as { usage?: { inputTokens?: number; outputTokens?: number } }
        if (stepData.usage) {
          totalInputTokens += stepData.usage.inputTokens || 0
          totalOutputTokens += stepData.usage.outputTokens || 0
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
            agentType: 'websearch',
            toolCalls: toolCallsLog,
            stepDurationMs: duration,
          })
        }

        // Update daily stats (async, non-blocking)
        updateTodayStats(user.id).catch((err) => {
          devError('[Websearch Agent] Failed to update daily stats:', err)
        })
      },
      onError: (error) => {
        devError('[WEBSEARCH AGENT] Error:', error.message)
      },
    })

    return createStreamResponse(customStream)
  } catch (error) {
    const requestTime = Date.now() - requestStartTime
    devError('❌ [WEBSEARCH AGENT] Error nach', requestTime + 'ms:', error)

    // Log error (try to get user.id if available)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await logAIUsage({
          userId: user.id,
          endpoint: 'agent/websearch',
          model: DEEPSEEK_CHAT_MODEL,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          durationMs: requestTime,
        })
      }
    } catch (logError) {
      devError('[WEBSEARCH AGENT] Failed to log error:', logError)
    }

    return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 })
  }
}
