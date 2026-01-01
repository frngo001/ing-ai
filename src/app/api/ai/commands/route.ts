import { deepseek, DEEPSEEK_CHAT_MODEL, DEFAULT_TEMPERATURE } from '@/lib/ai/deepseek'
import {
    REWRITE_SYSTEM_PROMPT,
    PARAPHRASE_SYSTEM_PROMPT,
    SIMPLIFY_SYSTEM_PROMPT,
    EXPAND_SYSTEM_PROMPT,
    TONE_ADJUSTMENT_PROMPTS,
} from '@/lib/ai/prompts'
import { generateText } from 'ai'
import { devError } from '@/lib/utils/logger'

export const runtime = 'edge'

type CommandType = 'rewrite' | 'paraphrase' | 'simplify' | 'expand' | 'tone'

interface CommandRequest {
    command: CommandType
    text: string
    tone?: keyof typeof TONE_ADJUSTMENT_PROMPTS
}

const SYSTEM_PROMPTS = {
    rewrite: REWRITE_SYSTEM_PROMPT,
    paraphrase: PARAPHRASE_SYSTEM_PROMPT,
    simplify: SIMPLIFY_SYSTEM_PROMPT,
    expand: EXPAND_SYSTEM_PROMPT,
}

export async function POST(req: Request) {
    try {
        const { command, text, tone }: CommandRequest = await req.json()

        if (!text) {
            return new Response('Text is required', { status: 400 })
        }

        let systemPrompt: string
        let userPrompt: string

        if (command === 'tone' && tone) {
            systemPrompt = TONE_ADJUSTMENT_PROMPTS[tone]
            userPrompt = `Adjust the following text:\n\n${text}`
        } else if (command in SYSTEM_PROMPTS) {
            systemPrompt = SYSTEM_PROMPTS[command as keyof typeof SYSTEM_PROMPTS]
            userPrompt = `Process the following text:\n\n${text}`
        } else {
            return new Response('Invalid command', { status: 400 })
        }

        const { text: result } = await generateText({
            model: deepseek(DEEPSEEK_CHAT_MODEL),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: DEFAULT_TEMPERATURE,
        })

        return Response.json({ result })
    } catch (error) {
        devError('Command error:', error)
        return new Response('Error processing command', { status: 500 })
    }
}
