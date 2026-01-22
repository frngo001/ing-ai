import { createClient } from '@/lib/supabase/server'
import { devLog, devError } from '@/lib/utils/logger'

/**
 * Daily Stats Aggregation Module
 *
 * Aggregates AI usage and session data into daily statistics
 * for fast dashboard queries and trend analysis.
 */

export interface DailyStats {
  userId: string
  date: string
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  askRequests: number
  commandRequests: number
  outlineRequests: number
  transcribeRequests: number
  agentRequests: number
  activeMinutes: number
  sessionCount: number
}

/**
 * Aggregate daily stats for a specific user and date
 * This is typically run as a background job or scheduled task
 */
export async function aggregateDailyStats(
  userId: string,
  date: Date
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

    // Get usage logs for this day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: logs, error: logsError } = await supabase
      .from('ai_usage_logs')
      .select('endpoint, input_tokens, output_tokens, total_tokens')
      .eq('user_id', userId)
      .eq('response_status', 'success')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())

    if (logsError) {
      devError('[Daily Stats] Failed to fetch usage logs:', logsError)
      return false
    }

    // Get session data for this day
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_activity_sessions')
      .select('session_duration_minutes')
      .eq('user_id', userId)
      .gte('session_start', startOfDay.toISOString())
      .lte('session_start', endOfDay.toISOString())

    if (sessionsError) {
      devError('[Daily Stats] Failed to fetch sessions:', sessionsError)
      return false
    }

    // Calculate aggregates
    const totalRequests = logs?.length || 0
    const totalInputTokens = logs?.reduce((sum, log) => sum + (log.input_tokens || 0), 0) || 0
    const totalOutputTokens = logs?.reduce((sum, log) => sum + (log.output_tokens || 0), 0) || 0
    const totalTokens = logs?.reduce((sum, log) => sum + (log.total_tokens || 0), 0) || 0

    // Endpoint breakdown
    const askRequests = logs?.filter(log => log.endpoint === 'ask').length || 0
    const commandRequests = logs?.filter(log => log.endpoint === 'command').length || 0
    const outlineRequests = logs?.filter(log => log.endpoint === 'outline').length || 0
    const transcribeRequests = logs?.filter(log => log.endpoint === 'transcribe').length || 0
    const agentRequests = logs?.filter(log => log.endpoint.startsWith('agent/')).length || 0

    // Session metrics
    const sessionCount = sessions?.length || 0
    const activeMinutes = sessions?.reduce((sum, s) => sum + (s.session_duration_minutes || 0), 0) || 0

    // Upsert into user_daily_stats
    const { error: upsertError } = await supabase
      .from('user_daily_stats')
      .upsert({
        user_id: userId,
        date: dateStr,
        total_requests: totalRequests,
        total_input_tokens: totalInputTokens,
        total_output_tokens: totalOutputTokens,
        total_tokens: totalTokens,
        ask_requests: askRequests,
        command_requests: commandRequests,
        outline_requests: outlineRequests,
        transcribe_requests: transcribeRequests,
        agent_requests: agentRequests,
        active_minutes: activeMinutes,
        session_count: sessionCount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date',
      })

    if (upsertError) {
      devError('[Daily Stats] Failed to upsert stats:', upsertError)
      return false
    }

    devLog(`[Daily Stats] Aggregated stats for user ${userId.substring(0, 8)} on ${dateStr}`)

    return true
  } catch (error) {
    devError('[Daily Stats] Exception in aggregateDailyStats:', error)
    return false
  }
}

/**
 * Update today's stats for a user
 * Call this after each AI request to keep real-time stats updated
 */
export async function updateTodayStats(userId: string): Promise<void> {
  const today = new Date()
  await aggregateDailyStats(userId, today)
}

/**
 * Aggregate stats for multiple days (backfill)
 * Useful for initial data migration or catching up on missed days
 */
export async function aggregateStatsForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  let successCount = 0
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const success = await aggregateDailyStats(userId, new Date(currentDate))
    if (success) {
      successCount++
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  devLog(`[Daily Stats] Aggregated ${successCount} days for user ${userId.substring(0, 8)}`)

  return successCount
}

/**
 * Get daily stats for a user over a period
 * Returns array of daily stats ordered by date (descending)
 */
export async function getUserDailyStatsForPeriod(
  userId: string,
  days: number = 30
): Promise<DailyStats[]> {
  try {
    const supabase = await createClient()

    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('user_daily_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sinceStr)
      .order('date', { ascending: false })

    if (error) {
      devError('[Daily Stats] Failed to fetch daily stats:', error)
      return []
    }

    return data ? data.map(mapDailyStats) : []
  } catch (error) {
    devError('[Daily Stats] Exception in getUserDailyStatsForPeriod:', error)
    return []
  }
}

/**
 * Get aggregated totals for a user over a period
 * Returns summed-up stats across all days
 */
export async function getUserPeriodTotals(
  userId: string,
  days: number = 30
): Promise<{
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalSessions: number
  totalActiveMinutes: number
  avgRequestsPerDay: number
  avgTokensPerRequest: number
  activeDaysCount: number
} | null> {
  try {
    const stats = await getUserDailyStatsForPeriod(userId, days)

    if (stats.length === 0) {
      return {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalSessions: 0,
        totalActiveMinutes: 0,
        avgRequestsPerDay: 0,
        avgTokensPerRequest: 0,
        activeDaysCount: 0,
      }
    }

    const totalRequests = stats.reduce((sum, s) => sum + s.totalRequests, 0)
    const totalInputTokens = stats.reduce((sum, s) => sum + s.totalInputTokens, 0)
    const totalOutputTokens = stats.reduce((sum, s) => sum + s.totalOutputTokens, 0)
    const totalTokens = stats.reduce((sum, s) => sum + s.totalTokens, 0)
    const totalSessions = stats.reduce((sum, s) => sum + s.sessionCount, 0)
    const totalActiveMinutes = stats.reduce((sum, s) => sum + s.activeMinutes, 0)

    const activeDaysCount = stats.filter(s => s.totalRequests > 0).length

    return {
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      totalSessions,
      totalActiveMinutes,
      avgRequestsPerDay: activeDaysCount > 0 ? Math.round(totalRequests / activeDaysCount) : 0,
      avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
      activeDaysCount,
    }
  } catch (error) {
    devError('[Daily Stats] Exception in getUserPeriodTotals:', error)
    return null
  }
}

/**
 * Calculate current streak (consecutive days with activity)
 * Returns number of consecutive days with at least 1 request
 */
export async function getUserCurrentStreak(userId: string): Promise<number> {
  try {
    const supabase = await createClient()

    // Get all daily stats ordered by date (descending)
    const { data, error } = await supabase
      .from('user_daily_stats')
      .select('date, total_requests')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(365) // Check up to 1 year

    if (error) {
      devError('[Daily Stats] Failed to fetch stats for streak:', error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0
    }

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const day of data) {
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - streak)

      // Check if this day matches expected date in streak
      if (dayDate.getTime() === expectedDate.getTime()) {
        if (day.total_requests > 0) {
          streak++
        } else {
          break // Streak broken
        }
      } else if (dayDate.getTime() < expectedDate.getTime()) {
        break // Gap in dates, streak broken
      }
    }

    return streak
  } catch (error) {
    devError('[Daily Stats] Exception in getUserCurrentStreak:', error)
    return 0
  }
}

/**
 * Get endpoint usage breakdown for a period
 * Returns percentage distribution of requests by endpoint
 */
export async function getEndpointDistribution(
  userId: string,
  days: number = 30
): Promise<Record<string, number>> {
  try {
    const stats = await getUserDailyStatsForPeriod(userId, days)

    if (stats.length === 0) {
      return {}
    }

    const totals = {
      ask: stats.reduce((sum, s) => sum + s.askRequests, 0),
      command: stats.reduce((sum, s) => sum + s.commandRequests, 0),
      outline: stats.reduce((sum, s) => sum + s.outlineRequests, 0),
      transcribe: stats.reduce((sum, s) => sum + s.transcribeRequests, 0),
      agent: stats.reduce((sum, s) => sum + s.agentRequests, 0),
    }

    return totals
  } catch (error) {
    devError('[Daily Stats] Exception in getEndpointDistribution:', error)
    return {}
  }
}

/**
 * Helper: Map database data to DailyStats type
 */
function mapDailyStats(data: any): DailyStats {
  return {
    userId: data.user_id,
    date: data.date,
    totalRequests: data.total_requests || 0,
    totalInputTokens: data.total_input_tokens || 0,
    totalOutputTokens: data.total_output_tokens || 0,
    totalTokens: data.total_tokens || 0,
    askRequests: data.ask_requests || 0,
    commandRequests: data.command_requests || 0,
    outlineRequests: data.outline_requests || 0,
    transcribeRequests: data.transcribe_requests || 0,
    agentRequests: data.agent_requests || 0,
    activeMinutes: data.active_minutes || 0,
    sessionCount: data.session_count || 0,
  }
}

/**
 * Background job: Aggregate yesterday's stats for all active users
 * Should be run as a daily cron job
 */
export async function aggregateAllUsersYesterday(): Promise<number> {
  try {
    const supabase = await createClient()

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    // Get all users who had activity yesterday
    const { data: activeUsers, error } = await supabase
      .from('ai_usage_logs')
      .select('user_id')
      .gte('created_at', yesterday.toISOString())
      .lte('created_at', yesterdayEnd.toISOString())

    if (error) {
      devError('[Daily Stats] Failed to fetch active users:', error)
      return 0
    }

    if (!activeUsers || activeUsers.length === 0) {
      devLog('[Daily Stats] No active users yesterday')
      return 0
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))]

    devLog(`[Daily Stats] Aggregating yesterday's stats for ${uniqueUserIds.length} users`)

    let successCount = 0
    for (const userId of uniqueUserIds) {
      const success = await aggregateDailyStats(userId, yesterday)
      if (success) {
        successCount++
      }
    }

    devLog(`[Daily Stats] Successfully aggregated ${successCount}/${uniqueUserIds.length} users`)

    return successCount
  } catch (error) {
    devError('[Daily Stats] Exception in aggregateAllUsersYesterday:', error)
    return 0
  }
}
