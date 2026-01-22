import { getUserDailyStatsForPeriod } from './daily-stats-aggregator'
import { devError } from '@/lib/utils/logger'

/**
 * Monitoring Utilities
 *
 * Helper functions for token estimation, cost calculation,
 * and activity metrics.
 */

// ============================================================================
// Cost Calculation (Billing-Ready)
// ============================================================================

export interface CostBreakdown {
  inputCost: number
  outputCost: number
  totalCost: number
  currency: 'USD'
}

// DeepSeek Pricing (as of 2026)
const DEEPSEEK_INPUT_PRICE_PER_1M = 0.14 // $0.14 per 1M input tokens
const DEEPSEEK_OUTPUT_PRICE_PER_1M = 0.28 // $0.28 per 1M output tokens

/**
 * Calculate cost for given token counts
 * Based on DeepSeek pricing model
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number
): CostBreakdown {
  const inputCost = (inputTokens / 1_000_000) * DEEPSEEK_INPUT_PRICE_PER_1M
  const outputCost = (outputTokens / 1_000_000) * DEEPSEEK_OUTPUT_PRICE_PER_1M

  return {
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    totalCost: parseFloat((inputCost + outputCost).toFixed(6)),
    currency: 'USD',
  }
}

/**
 * Get total estimated cost for a user over a period
 * Aggregates cost from daily stats
 */
export async function getUserTotalCost(
  userId: string,
  days: number = 30
): Promise<CostBreakdown | null> {
  try {
    const stats = await getUserDailyStatsForPeriod(userId, days)

    if (!stats || stats.length === 0) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        currency: 'USD',
      }
    }

    const totalInput = stats.reduce((sum, day) => sum + day.totalInputTokens, 0)
    const totalOutput = stats.reduce((sum, day) => sum + day.totalOutputTokens, 0)

    return calculateCost(totalInput, totalOutput)
  } catch (error) {
    devError('[Monitoring Utils] Exception in getUserTotalCost:', error)
    return null
  }
}

// ============================================================================
// Token Estimation
// ============================================================================

/**
 * Estimate token count from text
 * Rough estimation: ~4 characters per token for English/German
 * Use for estimation when actual token count is not available
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0

  // More accurate estimation based on language patterns
  // DeepSeek uses a similar tokenizer to GPT models
  const avgCharsPerToken = 4

  return Math.ceil(text.length / avgCharsPerToken)
}

/**
 * Estimate tokens for multiple text segments
 */
export function estimateTokensForSegments(segments: string[]): number {
  return segments.reduce((total, segment) => total + estimateTokens(segment), 0)
}

// ============================================================================
// Activity Metrics
// ============================================================================

/**
 * Get days since a given date
 */
export function daysSince(dateString: string | null): number {
  if (!dateString) return 0

  const date = new Date(dateString)
  const now = new Date()

  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Get user inactive days
 * Returns number of days since last activity
 */
export async function getUserInactiveDays(userId: string): Promise<number> {
  try {
    const lastActivity = await getLastActivityDate(userId)
    return daysSince(lastActivity)
  } catch (error) {
    devError('[Monitoring Utils] Exception in getUserInactiveDays:', error)
    return 0
  }
}

/**
 * Get last activity date for a user
 * Checks both usage logs and sessions
 */
export async function getLastActivityDate(userId: string): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get last activity from usage logs
    const { data: lastLog } = await supabase
      .from('ai_usage_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get last session
    const { data: lastSession } = await supabase
      .from('user_activity_sessions')
      .select('session_start')
      .eq('user_id', userId)
      .order('session_start', { ascending: false })
      .limit(1)
      .single()

    // Return the most recent activity
    const logDate = lastLog?.created_at ? new Date(lastLog.created_at) : null
    const sessionDate = lastSession?.session_start ? new Date(lastSession.session_start) : null

    if (!logDate && !sessionDate) return null
    if (!logDate) return sessionDate!.toISOString()
    if (!sessionDate) return logDate.toISOString()

    return logDate > sessionDate ? logDate.toISOString() : sessionDate.toISOString()
  } catch (error) {
    devError('[Monitoring Utils] Exception in getLastActivityDate:', error)
    return null
  }
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format minutes to human-readable duration
 * Examples: "2 hours 30 minutes", "45 minutes", "3 days 5 hours"
 */
export function formatMinutesToDuration(minutes: number): string {
  if (minutes < 1) return '< 1 minute'

  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)
  const mins = Math.floor(minutes % 60)

  const parts: string[] = []

  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`)
  if (mins > 0) parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`)

  return parts.join(' ')
}

/**
 * Format duration in milliseconds to seconds (2 decimal places)
 */
export function formatDurationMs(durationMs: number): string {
  const seconds = durationMs / 1000
  return `${seconds.toFixed(2)}s`
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format large numbers with K/M/B suffix
 * Examples: 1234 → "1.2K", 1234567 → "1.2M"
 */
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  return `${(num / 1_000_000_000).toFixed(1)}B`
}

/**
 * Format cost as USD currency
 * Examples: 0.000123 → "$0.000123", 1.5 → "$1.50"
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`
  }
  return `$${cost.toFixed(2)}`
}

// ============================================================================
// Period Helpers
// ============================================================================

/**
 * Parse period string to number of days
 * Examples: "7d" → 7, "30d" → 30, "90d" → 90
 */
export function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)d$/)
  if (!match) return 30 // default to 30 days

  const days = parseInt(match[1], 10)
  return Math.min(Math.max(days, 1), 365) // clamp between 1 and 365
}

/**
 * Get date range for a period
 * Returns { start: Date, end: Date }
 */
export function getDateRangeForPeriod(days: number): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  return { start, end }
}

// ============================================================================
// Data Validation
// ============================================================================

/**
 * Validate endpoint name
 * Returns true if endpoint is a valid AI endpoint
 */
export function isValidEndpoint(endpoint: string): boolean {
  const validEndpoints = [
    'ask',
    'command',
    'outline',
    'transcribe',
    'copilot',
    'agent/bachelorarbeit',
    'agent/general',
    'agent/websearch',
  ]

  return validEndpoints.includes(endpoint)
}

/**
 * Validate model name
 * Returns true if model is a valid DeepSeek model
 */
export function isValidModel(model: string): boolean {
  const validModels = ['deepseek-chat', 'deepseek-reasoner']
  return validModels.includes(model)
}

/**
 * Sanitize metadata object
 * Removes sensitive information and limits size
 */
export function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  // List of allowed metadata keys
  const allowedKeys = [
    'useWeb',
    'documentContextEnabled',
    'fileCount',
    'toolName',
    'isSelecting',
    'messagesCount',
    'thema',
    'arbeitType',
    'currentStep',
    'hasFiles',
    'selection',
  ]

  for (const key of allowedKeys) {
    if (key in metadata) {
      sanitized[key] = metadata[key]
    }
  }

  return sanitized
}

// ============================================================================
// Export all utilities
// ============================================================================

export const MonitoringUtils = {
  // Cost
  calculateCost,
  getUserTotalCost,

  // Tokens
  estimateTokens,
  estimateTokensForSegments,

  // Activity
  daysSince,
  getUserInactiveDays,
  getLastActivityDate,

  // Formatting
  formatMinutesToDuration,
  formatDurationMs,
  formatNumber,
  formatCost,

  // Period
  parsePeriod,
  getDateRangeForPeriod,

  // Validation
  isValidEndpoint,
  isValidModel,
  sanitizeMetadata,
}
