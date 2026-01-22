import { createClient } from '@/lib/supabase/server'
import { devLog, devError, devWarn } from '@/lib/utils/logger'

/**
 * AI Usage Tracking Module
 *
 * Tracks all AI requests with token usage, metadata, and performance metrics.
 * Integrates with Supabase for persistent logging.
 */

export interface LogAIUsageParams {
  userId: string | null
  endpoint: string
  model: string
  inputTokens?: number
  outputTokens?: number
  metadata?: Record<string, unknown>
  status: 'success' | 'error' | 'rate_limited'
  error?: string
  durationMs?: number
}

export interface UpdateTokensParams {
  inputTokens: number
  outputTokens: number
}

export interface LogAgentExecutionParams {
  usageLogId: string
  userId: string
  agentType: 'bachelorarbeit' | 'general' | 'websearch'
  stepNumber?: number
  toolCalls?: Array<{
    toolName: string
    duration?: number
    timestamp: number
  }>
  textOutput?: string
  reasoning?: string
  stepDurationMs?: number
}

/**
 * Log an AI usage event
 * Returns the log ID for subsequent updates (e.g., token tracking)
 */
export async function logAIUsage(params: LogAIUsageParams): Promise<string | null> {
  try {
    const supabase = await createClient()

    const totalTokens = (params.inputTokens || 0) + (params.outputTokens || 0)

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: params.userId,
        endpoint: params.endpoint,
        model: params.model,
        input_tokens: params.inputTokens || 0,
        output_tokens: params.outputTokens || 0,
        total_tokens: totalTokens,
        request_metadata: params.metadata || {},
        response_status: params.status,
        error_message: params.error,
        duration_ms: params.durationMs,
      })
      .select('id')
      .single()

    if (error) {
      devError('[AI Usage Tracker] Failed to log usage:', error)
      return null
    }

    devLog(`[AI Usage Tracker] Logged ${params.endpoint} (${params.status}) for user ${params.userId?.substring(0, 8)}`)

    return data?.id || null
  } catch (error) {
    devError('[AI Usage Tracker] Exception in logAIUsage:', error)
    return null
  }
}

/**
 * Update token counts for an existing log entry
 * Called after streaming completion when actual token counts are available
 */
export async function updateAIUsageTokens(
  logId: string,
  usage: UpdateTokensParams
): Promise<void> {
  try {
    const supabase = await createClient()

    const totalTokens = usage.inputTokens + usage.outputTokens

    const { error } = await supabase
      .from('ai_usage_logs')
      .update({
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        total_tokens: totalTokens,
      })
      .eq('id', logId)

    if (error) {
      devError('[AI Usage Tracker] Failed to update tokens:', error)
      return
    }

    devLog(`[AI Usage Tracker] Updated tokens for log ${logId.substring(0, 8)}: ${totalTokens} total`)
  } catch (error) {
    devError('[AI Usage Tracker] Exception in updateAIUsageTokens:', error)
  }
}

/**
 * Log agent execution details (steps, tool calls)
 */
export async function logAgentExecution(params: LogAgentExecutionParams): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('agent_execution_logs')
      .insert({
        usage_log_id: params.usageLogId,
        user_id: params.userId,
        agent_type: params.agentType,
        step_number: params.stepNumber,
        tool_calls: params.toolCalls || [],
        tool_count: params.toolCalls?.length || 0,
        text_output: params.textOutput,
        reasoning: params.reasoning,
        step_duration_ms: params.stepDurationMs,
      })

    if (error) {
      devError('[AI Usage Tracker] Failed to log agent execution:', error)
      return
    }

    devLog(`[AI Usage Tracker] Logged agent execution: ${params.agentType} step ${params.stepNumber}`)
  } catch (error) {
    devError('[AI Usage Tracker] Exception in logAgentExecution:', error)
  }
}

/**
 * Batch log multiple agent steps
 * Useful for agents that execute multiple steps in sequence
 */
export async function logAgentExecutionBatch(
  executions: LogAgentExecutionParams[]
): Promise<void> {
  try {
    const supabase = await createClient()

    const records = executions.map(params => ({
      usage_log_id: params.usageLogId,
      user_id: params.userId,
      agent_type: params.agentType,
      step_number: params.stepNumber,
      tool_calls: params.toolCalls || [],
      tool_count: params.toolCalls?.length || 0,
      text_output: params.textOutput,
      reasoning: params.reasoning,
      step_duration_ms: params.stepDurationMs,
    }))

    const { error } = await supabase
      .from('agent_execution_logs')
      .insert(records)

    if (error) {
      devError('[AI Usage Tracker] Failed to batch log agent executions:', error)
      return
    }

    devLog(`[AI Usage Tracker] Batch logged ${executions.length} agent executions`)
  } catch (error) {
    devError('[AI Usage Tracker] Exception in logAgentExecutionBatch:', error)
  }
}

/**
 * Get recent usage logs for a user
 * Useful for debugging and user dashboard
 */
export async function getUserRecentUsage(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      devError('[AI Usage Tracker] Failed to fetch recent usage:', error)
      return []
    }

    return data || []
  } catch (error) {
    devError('[AI Usage Tracker] Exception in getUserRecentUsage:', error)
    return []
  }
}

/**
 * Get usage summary for a user over a period
 * Returns aggregated stats (total requests, tokens, etc.)
 */
export async function getUserUsageSummary(
  userId: string,
  days: number = 30
): Promise<{
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  avgTokensPerRequest: number
  endpointBreakdown: Record<string, number>
} | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_user_stats_for_period', {
      p_user_id: userId,
      p_days: days,
    })

    if (error) {
      devError('[AI Usage Tracker] Failed to fetch usage summary:', error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        avgTokensPerRequest: 0,
        endpointBreakdown: {},
      }
    }

    const row = data[0]

    return {
      totalRequests: Number(row.total_requests || 0),
      totalInputTokens: Number(row.total_input_tokens || 0),
      totalOutputTokens: Number(row.total_output_tokens || 0),
      totalTokens: Number(row.total_tokens || 0),
      avgTokensPerRequest: Number(row.avg_tokens_per_request || 0),
      endpointBreakdown: row.endpoint_breakdown || {},
    }
  } catch (error) {
    devError('[AI Usage Tracker] Exception in getUserUsageSummary:', error)
    return null
  }
}

/**
 * Helper: Create a tracking wrapper for async operations
 * Automatically tracks success/failure and duration
 */
export function createTrackedOperation<T>(
  params: Omit<LogAIUsageParams, 'status' | 'durationMs' | 'error'>,
  operation: (logId: string | null) => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  return logAIUsage({ ...params, status: 'success' })
    .then(async (logId) => {
      try {
        const result = await operation(logId)
        const duration = Date.now() - startTime

        // Update duration on success
        if (logId) {
          const supabase = await createClient()
          await supabase
            .from('ai_usage_logs')
            .update({ duration_ms: duration })
            .eq('id', logId)
        }

        return result
      } catch (error) {
        const duration = Date.now() - startTime

        // Log error
        await logAIUsage({
          ...params,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          durationMs: duration,
        })

        throw error
      }
    })
}
