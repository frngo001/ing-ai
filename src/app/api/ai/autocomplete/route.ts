import { deepseek, DEEPSEEK_CHAT_MODEL, DEFAULT_TEMPERATURE } from '@/lib/ai/deepseek'
import { AUTOCOMPLETE_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { streamText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { context, currentText, documentType, suffix = '' } = await req.json()

        const prefix = `Document Type: ${documentType || 'general'}

Context from document:
${context}

Current sentence/paragraph:
${currentText}

complete the paraph to the next paragraph.
Deliver one coherent paragraph (no new block breaks, no bullet lists) with at least 200 words and 8-12 sentences; keep elaborating with relevant detail until you reach 200 words.
Answer in the same language as the current text and do not repeat sentences or paragraphs. (Only french, english and german)
Write the response in markdown format.

Output limit: up to 800 tokens`

        // DeepSeek FIM: prefix + <|fim_hole|> + suffix. The model fills the hole.
        const fimPrompt = `<|fim_begin|>${prefix}<|fim_hole|>${suffix}<|fim_end|>`

        const result = streamText({
            model: deepseek(DEEPSEEK_CHAT_MODEL),
            system: AUTOCOMPLETE_SYSTEM_PROMPT,
            prompt: fimPrompt,
            temperature: DEFAULT_TEMPERATURE,
            maxOutputTokens: 800,
        })
        return result.toTextStreamResponse()
    } catch (error) {
        console.error('Autocomplete error:', error)
        return new Response('Error generating autocomplete', { status: 500 })
    }
}
