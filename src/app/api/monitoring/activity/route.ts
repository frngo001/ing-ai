import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserActivityMetrics, getUserSessionHistory } from '@/lib/monitoring/session-tracker'
import { getUserDailyStatsForPeriod } from '@/lib/monitoring/daily-stats-aggregator'
import { parsePeriod, formatMinutesToDuration } from '@/lib/monitoring/utils'
import { devError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

/**
 * GET /api/monitoring/activity?days=30
 *
 * Returns user activity and session metrics
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse days parameter
    const searchParams = req.nextUrl.searchParams
    const daysParam = searchParams.get('days') || '30'
    const days = parseInt(daysParam, 10)

    // Fetch activity metrics
    const activityMetrics = await getUserActivityMetrics(user.id, days)

    // Fetch daily stats for session breakdown
    const dailyStats = await getUserDailyStatsForPeriod(user.id, days)

    // Build sessions array from daily stats
    const sessions = dailyStats.map(stat => ({
      date: stat.date,
      sessionCount: stat.sessionCount,
      activeMinutes: stat.activeMinutes,
      requests: stat.totalRequests,
    }))

    // Build response
    const response = {
      period: `${days}d`,

      // Session metrics
      totalSessions: activityMetrics?.totalSessions || 0,
      totalActiveMinutes: activityMetrics?.totalActiveMinutes || 0,
      avgSessionDuration: activityMetrics?.avgSessionDuration || 0,

      // Activity status
      lastActivity: activityMetrics?.lastActivity,
      inactiveDays: activityMetrics?.inactiveDays || 0,

      // Session breakdown by day
      sessions,

      // Formatted helpers
      totalActiveTime: formatMinutesToDuration(activityMetrics?.totalActiveMinutes || 0),
      avgSessionDurationFormatted: formatMinutesToDuration(activityMetrics?.avgSessionDuration || 0),
    }

    return NextResponse.json(response)

  } catch (error) {
    devError('[Monitoring Activity] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity metrics' },
      { status: 500 }
    )
  }
}
