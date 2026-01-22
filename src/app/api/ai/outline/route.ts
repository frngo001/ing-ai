import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { OUTLINE_GENERATOR_PROMPT } from '@/lib/ai/prompts'
import { generateText } from 'ai'
import { devError } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { logAIUsage, updateAIUsageTokens } from '@/lib/monitoring/ai-usage-tracker'
import { ensureActiveSession, trackEndpointUsage } from '@/lib/monitoring/session-tracker'
import { updateTodayStats } from '@/lib/monitoring/daily-stats-aggregator'

export const runtime = 'nodejs'

export async function POST(req: Request) {
    const startTime = Date.now()
    let usageLogId: string | null = null
    let userId: string | null = null

    try {
        const { topic, documentType, additionalInfo } = await req.json()

        if (!topic) {
            return new Response('Topic is required', { status: 400 })
        }

        // Get authenticated user
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null

        // Start usage logging
        usageLogId = await logAIUsage({
            userId: user?.id || null,
            endpoint: 'outline',
            model: DEEPSEEK_CHAT_MODEL,
            status: 'success',
            metadata: {
                documentType: documentType || 'essay',
                hasAdditionalInfo: !!additionalInfo,
            },
        })

        // Track session activity
        if (user) {
            const sessionId = await ensureActiveSession(user.id)
            if (sessionId) {
                await trackEndpointUsage(sessionId, 'outline')
            }
        }

        const prompt = `Create a structured outline for the following:

Topic: ${topic}
Document Type: ${documentType || 'essay'}
${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}

Generate clear, hierarchical section headings that provide a logical structure for this document.`

        const { text, usage } = await generateText({
            model: deepseek(DEEPSEEK_CHAT_MODEL),
            system: OUTLINE_GENERATOR_PROMPT,
            prompt,
            temperature: 0.7,
        })

        const duration = Date.now() - startTime

        // Update token counts if available
        if (usageLogId && usage) {
            await updateAIUsageTokens(usageLogId, {
                inputTokens: usage.inputTokens ?? 0,
                outputTokens: usage.outputTokens ?? 0,
            })

            // Update duration
            await supabase
                .from('ai_usage_logs')
                .update({ duration_ms: duration })
                .eq('id', usageLogId)
        }

        // Update daily stats (async, non-blocking)
        if (user?.id) {
            updateTodayStats(user.id).catch((err) => {
                devError('[Outline] Failed to update daily stats:', err)
            })
        }

        return Response.json({ outline: text })
    } catch (error) {
        const duration = Date.now() - startTime
        devError('Outline generation error:', error)

        // Log error
        if (userId) {
            await logAIUsage({
                userId,
                endpoint: 'outline',
                model: DEEPSEEK_CHAT_MODEL,
                status: 'error',
                error: error instanceof Error ? error.message : String(error),
                durationMs: duration,
            })
        }

        return new Response('Error generating outline', { status: 500 })
    }
}
