import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserUsageSummary } from '@/lib/monitoring/ai-usage-tracker'
import { getUserPeriodTotals, getUserCurrentStreak, getEndpointDistribution } from '@/lib/monitoring/daily-stats-aggregator'
import { calculateCost, parsePeriod } from '@/lib/monitoring/utils'
import { devError } from '@/lib/utils/logger'

export const runtime = 'nodejs'

/**
 * GET /api/monitoring/stats?period=7d|30d|90d
 *
 * Returns aggregated usage statistics for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse period parameter
    const searchParams = req.nextUrl.searchParams
    const periodParam = searchParams.get('period') || '30d'
    const days = parsePeriod(periodParam)

    // Fetch usage summary from RPC function
    const usageSummary = await getUserUsageSummary(user.id, days)

    // Fetch period totals
    const periodTotals = await getUserPeriodTotals(user.id, days)

    // Fetch current streak
    const currentStreak = await getUserCurrentStreak(user.id)

    // Fetch endpoint distribution
    const endpointBreakdown = await getEndpointDistribution(user.id, days)

    // Calculate estimated cost
    const estimatedCost = calculateCost(
      usageSummary?.totalInputTokens || 0,
      usageSummary?.totalOutputTokens || 0
    )

    // Get daily breakdown from RPC function
    const { data: dailyData, error: dailyError } = await supabase.rpc('get_user_stats_for_period', {
      p_user_id: user.id,
      p_days: days,
    })

    if (dailyError) {
      devError('[Monitoring Stats] Failed to fetch daily breakdown:', dailyError)
    }

    const dailyBreakdown = dailyData?.[0]?.daily_breakdown || []

    // Build response
    const response = {
      period: `${days}d`,
      totalRequests: usageSummary?.totalRequests || 0,
      totalTokens: usageSummary?.totalTokens || 0,
      totalInputTokens: usageSummary?.totalInputTokens || 0,
      totalOutputTokens: usageSummary?.totalOutputTokens || 0,

      // Averages
      avgTokensPerRequest: usageSummary?.avgTokensPerRequest || 0,
      avgRequestsPerDay: periodTotals?.avgRequestsPerDay || 0,

      // Activity metrics
      activeDaysCount: periodTotals?.activeDaysCount || 0,
      currentStreak,

      // Endpoint breakdown
      byEndpoint: endpointBreakdown,

      // Daily breakdown
      dailyBreakdown,

      // Cost estimation (billing-ready)
      estimatedCost,
    }

    return NextResponse.json(response)

  } catch (error) {
    devError('[Monitoring Stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    )
  }
}
