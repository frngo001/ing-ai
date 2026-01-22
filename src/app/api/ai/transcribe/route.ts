import { devError } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { logAIUsage } from '@/lib/monitoring/ai-usage-tracker'
import { ensureActiveSession, trackEndpointUsage } from '@/lib/monitoring/session-tracker'
import { updateTodayStats } from '@/lib/monitoring/daily-stats-aggregator'

export const runtime = 'nodejs'

const PROVIDER_BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '')
const TRANSCRIPTION_PATH = process.env.DEEPSEEK_TRANSCRIPTION_PATH || '/audio/transcriptions'
const TRANSCRIPTION_ENABLED = process.env.DEEPSEEK_TRANSCRIPTION_ENABLED === 'true'
const TRANSCRIPTION_MODEL = process.env.DEEPSEEK_TRANSCRIPTION_MODEL || 'whisper-1'

export async function POST(req: Request) {
  const startTime = Date.now()
  let usageLogId: string | null = null
  let userId: string | null = null

  try {
    if (!TRANSCRIPTION_ENABLED) {
      return new Response(
        'Transkription ist deaktiviert, da DeepSeek derzeit kein Speech-Modell anbietet. Setze DEEPSEEK_TRANSCRIPTION_ENABLED=true und konfiguriere Pfad/Modell für einen alternativen Provider.',
        { status: 503 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof Blob)) {
      return new Response('Audio file is required', { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return new Response('Missing DeepSeek API key', { status: 401 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id || null

    // Start usage logging
    usageLogId = await logAIUsage({
      userId: user?.id || null,
      endpoint: 'transcribe',
      model: TRANSCRIPTION_MODEL,
      status: 'success',
      metadata: {
        fileSize: file.size,
        fileType: file.type,
      },
    })

    // Track session activity
    if (user) {
      const sessionId = await ensureActiveSession(user.id)
      if (sessionId) {
        await trackEndpointUsage(sessionId, 'transcribe')
      }
    }

    const upload = new FormData()
    upload.append('file', file, 'audio.webm')
    upload.append('model', TRANSCRIPTION_MODEL)

    const providerResponse = await fetch(`${PROVIDER_BASE_URL}${TRANSCRIPTION_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upload,
    })

    if (!providerResponse.ok) {
      const message = await safeReadError(providerResponse)
      devError('Transcription provider error:', message)

      // Update log with error status
      if (usageLogId) {
        const duration = Date.now() - startTime
        await supabase
          .from('ai_usage_logs')
          .update({
            response_status: 'error',
            error_message: message,
            duration_ms: duration,
          })
          .eq('id', usageLogId)
      }

      return new Response('Transkription fehlgeschlagen', { status: 502 })
    }

    const result = (await providerResponse.json()) as { text?: string }
    if (!result?.text) {
      return new Response('Keine Transkription erhalten', { status: 502 })
    }

    const duration = Date.now() - startTime

    // Update duration in log
    if (usageLogId) {
      await supabase
        .from('ai_usage_logs')
        .update({ duration_ms: duration })
        .eq('id', usageLogId)
    }

    // Update daily stats (async, non-blocking)
    if (user?.id) {
      updateTodayStats(user.id).catch((err) => {
        devError('[Transcribe] Failed to update daily stats:', err)
      })
    }

    return Response.json({ text: result.text })
  } catch (error) {
    const duration = Date.now() - startTime
    devError('Transcription error:', error)

    // Log error
    if (userId) {
      await logAIUsage({
        userId,
        endpoint: 'transcribe',
        model: TRANSCRIPTION_MODEL,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        durationMs: duration,
      })
    }

    return new Response('Error processing transcription', { status: 500 })
  }
}

async function safeReadError(res: Response) {
  try {
    const text = await res.text()
    return text.slice(0, 500)
  } catch (error) {
    devError('Failed to read provider error', error)
    return 'unknown error'
  }
}
