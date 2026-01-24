import { deepseek, DEEPSEEK_CHAT_MODEL, DEFAULT_TEMPERATURE } from '@/lib/ai/deepseek'
import { AUTOCOMPLETE_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { streamText } from 'ai'
import { devError } from '@/lib/utils/logger'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { context, currentText, documentType, suffix = '', title = '' } = await req.json()

        // 1. Enhanced System Prompt
        // We move the meta-instructions here to keep the FIM prompt clean.
        const systemPrompt = `${AUTOCOMPLETE_SYSTEM_PROMPT}

DOCUMENT PROPERTIES:
- Title: ${title || 'Untitled Document'}
- Type: ${documentType || 'academic/professional'}

BACKGROUND CONTEXT (previous sections):
${context || 'No additional context.'}

TECHNICAL INSTRUCTIONS:
- Continue the writing naturally from the exact end of 'Current Text'.
- CRITICAL: Never repeat words, phrases, or sentences that are already present at the end of 'Current Text'.
- Output length: Aim for a high-quality continuation of approx. 150-200 words.
- Structure: Deliver a single, coherent paragraph. No bullet points or markdown headers.
- Language: Maintain the same language as 'Current Text'.`

        // 2. Focused FIM Prompt
        // The FIM model predicts based on what's in 'begin' and 'end'.
        // By putting ONLY the text here, we avoid confusing the model with instructions.
        const fimPrompt = `<|fim_begin|>${currentText}<|fim_hole|>${suffix}<|fim_end|>`

        const result = streamText({
            model: deepseek(DEEPSEEK_CHAT_MODEL),
            system: systemPrompt,
            prompt: fimPrompt,
            temperature: 0.5, // Reduced for higher consistency
            maxOutputTokens: 800,
            frequencyPenalty: 0.3, // Subtle penalty to avoid repeating phrases
            presencePenalty: 0.2, // Encourages new topics
        })
        return result.toTextStreamResponse()
    } catch (error) {
        devError('Autocomplete error:', error)
        return new Response('Error generating autocomplete', { status: 500 })
    }
}
