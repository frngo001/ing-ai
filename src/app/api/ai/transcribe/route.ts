export const runtime = "edge"

import { devError } from '@/lib/utils/logger'

const PROVIDER_BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1").replace(/\/$/, "")
const TRANSCRIPTION_PATH = process.env.DEEPSEEK_TRANSCRIPTION_PATH || "/audio/transcriptions"
const TRANSCRIPTION_ENABLED = process.env.DEEPSEEK_TRANSCRIPTION_ENABLED === "true"
const TRANSCRIPTION_MODEL = process.env.DEEPSEEK_TRANSCRIPTION_MODEL || "whisper-1"

export async function POST(req: Request) {
  try {
    if (!TRANSCRIPTION_ENABLED) {
      return new Response(
        "Transkription ist deaktiviert, da DeepSeek derzeit kein Speech-Modell anbietet. Setze DEEPSEEK_TRANSCRIPTION_ENABLED=true und konfiguriere Pfad/Modell für einen alternativen Provider.",
        { status: 503 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof Blob)) {
      return new Response("Audio file is required", { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return new Response("Missing DeepSeek API key", { status: 401 })
    }

    const upload = new FormData()
    upload.append("file", file, "audio.webm")
    upload.append("model", TRANSCRIPTION_MODEL)

    const providerResponse = await fetch(`${PROVIDER_BASE_URL}${TRANSCRIPTION_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upload,
    })

    if (!providerResponse.ok) {
      const message = await safeReadError(providerResponse)
      devError("Transcription provider error:", message)
      return new Response("Transkription fehlgeschlagen", { status: 502 })
    }

    const result = (await providerResponse.json()) as { text?: string }
    if (!result?.text) {
      return new Response("Keine Transkription erhalten", { status: 502 })
    }

    return Response.json({ text: result.text })
  } catch (error) {
    devError("Transcription error:", error)
    return new Response("Error processing transcription", { status: 500 })
  }
}

async function safeReadError(res: Response) {
  try {
    const text = await res.text()
    return text.slice(0, 500)
  } catch (error) {
    devError("Failed to read provider error", error)
    return "unknown error"
  }
}

