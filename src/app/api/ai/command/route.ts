import type { ChatMessage, ToolName } from '@/components/editor/use-chat';
import type { NextRequest } from 'next/server';

import {
  type LanguageModel,
  type UIMessageStreamWriter,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  streamObject,
  streamText,
  tool,
} from 'ai';
import { NextResponse } from 'next/server';
import { type SlateEditor, createSlateEditor, nanoid } from 'platejs';
import { z } from 'zod';

import { BaseEditorKit } from '@/components/editor/editor-base-kit';
import { DEEPSEEK_CHAT_MODEL, deepseek } from '@/lib/ai/deepseek';
import { markdownJoinerTransform } from '@/lib/markdown-joiner-transform';
import { devInfo, devError } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { logAIUsage, updateAIUsageTokens } from '@/lib/monitoring/ai-usage-tracker';
import { ensureActiveSession, trackEndpointUsage } from '@/lib/monitoring/session-tracker';
import { updateTodayStats } from '@/lib/monitoring/daily-stats-aggregator';

import {
  getChooseToolPrompt,
  getCommentPrompt,
  getEditPrompt,
  getGeneratePrompt,
} from './prompts';

const RATE_LIMIT_WINDOW_MS =
  Number(process.env.AI_COMMAND_RATE_LIMIT_WINDOW_MS) || 60_000;
const RATE_LIMIT_MAX =
  Number(process.env.AI_COMMAND_RATE_LIMIT_MAX) || 60;

// Simple in-memory rate limit bucket; per-process only.
const rateBuckets = new Map<string, number[]>();

const isRateLimited = (key: string) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const entries = (rateBuckets.get(key) || []).filter((ts) => ts > windowStart);
  if (entries.length >= RATE_LIMIT_MAX) return true;
  entries.push(now);
  rateBuckets.set(key, entries);
  return false;
};

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let usageLogId: string | null = null
  let userId: string | null = null

  const {
    apiKey: key,
    ctx,
    messages: messagesRaw = [],
    model,
  } = await req.json();

  const { children, selection, toolName: toolNameParam } = ctx;

  const requester =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

  if (isRateLimited(requester)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte kurz warten.' },
      { status: 429 }
    );
  }

  // Get authenticated user
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id || null
  } catch (error) {
    // Auth optional for command endpoint
    devError('[Command] Auth check failed:', error)
  }

  const editor = createSlateEditor({
    plugins: BaseEditorKit,
    selection,
    value: children,
  });

  const modelName = model || DEEPSEEK_CHAT_MODEL;
  const apiKey =
    (typeof key === 'string' && key) || process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing DeepSeek API key.' },
      { status: 401 }
    );
  }

  const getModel = () => deepseek(modelName);

  const isSelecting = editor.api.isExpanded();

  devInfo('ai/command request', {
    ip: requester,
    model: modelName,
    toolName: toolNameParam ?? 'auto',
    selecting: isSelecting,
    messages: messagesRaw.length,
  });

  try {
    // Start usage logging
    usageLogId = await logAIUsage({
      userId,
      endpoint: 'command',
      model: modelName,
      status: 'success',
      metadata: {
        toolName: toolNameParam,
        isSelecting,
        messagesCount: messagesRaw.length,
      },
    })

    // Track session activity
    if (userId) {
      const sessionId = await ensureActiveSession(userId)
      if (sessionId) {
        await trackEndpointUsage(sessionId, 'command')
      }
    }

    const stream = createUIMessageStream<ChatMessage>({
      execute: async ({ writer }) => {
        let toolName = toolNameParam;

        // Default: wenn kein Tool gewählt wurde, wähle basierend auf Auswahl
        if (!toolName) {
          const hasSelection = editor.api.isExpanded();
          toolName = hasSelection ? 'edit' : 'generate';
          writer.write({
            data: toolName as ToolName,
            type: 'data-toolName',
          });
        }

        const stream = streamText({
          experimental_transform: markdownJoinerTransform(),
          model: getModel(),
          prompt: '',
          tools: {
            comment: getCommentTool(editor, {
              messagesRaw,
              model: getModel(),
              writer,
            }),
          },
          onFinish: async (completion) => {
            const duration = Date.now() - startTime

            // Update token counts if available
            if (usageLogId && completion.usage) {
              await updateAIUsageTokens(usageLogId, {
                inputTokens: completion.usage.inputTokens ?? 0,
                outputTokens: completion.usage.outputTokens ?? 0,
              })

              // Update duration
              const supabase = await createClient()
              await supabase
                .from('ai_usage_logs')
                .update({ duration_ms: duration })
                .eq('id', usageLogId)
            }

            // Update daily stats (async, non-blocking)
            if (userId) {
              updateTodayStats(userId).catch((err) => {
                devError('[Command] Failed to update daily stats:', err)
              })
            }
          },
          prepareStep: async (step) => {
            if (toolName === 'comment') {
              return {
                ...step,
                toolChoice: { toolName: 'comment', type: 'tool' },
              };
            }

            if (toolName === 'edit') {
              const editPrompt = getEditPrompt(editor, {
                isSelecting,
                messages: messagesRaw,
              });

              return {
                ...step,
                activeTools: [],
                messages: [
                  {
                    content: editPrompt,
                    role: 'user',
                  },
                ],
              };
            }

            if (toolName === 'generate') {
              const generatePrompt = getGeneratePrompt(editor, {
                messages: messagesRaw,
              });

              return {
                ...step,
                activeTools: [],
                messages: [
                  {
                    content: generatePrompt,
                    role: 'user',
                  },
                ],
                model: getModel(),
              };
            }
          },
        });

        writer.merge(stream.toUIMessageStream({ sendFinish: false }));
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    const duration = Date.now() - startTime
    devError('[Command] Error:', error)

    // Log error
    if (userId) {
      await logAIUsage({
        userId,
        endpoint: 'command',
        model: modelName,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        durationMs: duration,
      })
    }

    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

const getCommentTool = (
  editor: SlateEditor,
  {
    messagesRaw,
    model,
    writer,
  }: {
    messagesRaw: ChatMessage[];
    model: LanguageModel;
    writer: UIMessageStreamWriter<ChatMessage>;
  }
) =>
  tool({
    description: 'Comment on the content',
    inputSchema: z.object({}),
    execute: async () => {
      const { elementStream } = streamObject({
        model,
        output: 'array',
        prompt: getCommentPrompt(editor, {
          messages: messagesRaw,
        }),
        schema: z
          .object({
            blockId: z
              .string()
              .describe(
                'The id of the starting block. If the comment spans multiple blocks, use the id of the first block.'
              ),
            comment: z
              .string()
              .describe('A brief comment or explanation for this fragment.'),
            content: z
              .string()
              .describe(
                String.raw`The original document fragment to be commented on.It can be the entire block, a small part within a block, or span multiple blocks. If spanning multiple blocks, separate them with two \n\n.`
              ),
          })
          .describe('A single comment'),
      });

      for await (const comment of elementStream) {
        const commentDataId = nanoid();

        writer.write({
          id: commentDataId,
          data: {
            comment,
            status: 'streaming',
          },
          type: 'data-comment',
        });
      }

      writer.write({
        id: nanoid(),
        data: {
          comment: null,
          status: 'finished',
        },
        type: 'data-comment',
      });
    },
  });
