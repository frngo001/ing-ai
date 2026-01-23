import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend'
import { devLog, devError } from '@/lib/utils/logger'
import ActivitySummaryEmail from '@/components/emails/ActivitySummaryEmail'

// Use service role for cron job (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ActivityType = 'document_created' | 'document_edited' | 'project_created' | 'citation_added' | 'export_completed'

interface ActivityLogEntry {
  activity_type: ActivityType
  entity_title: string | null
  created_at: string
}

interface UserWithPreferences {
  id: string
  email: string
  full_name: string | null
  email_notifications_enabled: boolean
  notification_summary_frequency: 'realtime' | 'daily' | 'weekly'
}

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    devError('[CRON] CRON_SECRET not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

// Get time range based on frequency
function getTimeRange(frequency: 'daily' | 'weekly'): Date {
  const now = new Date()
  if (frequency === 'daily') {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
  }
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
}

// Calculate stats from activities
function calculateStats(activities: ActivityLogEntry[]) {
  return {
    documentsCreated: activities.filter(a => a.activity_type === 'document_created').length,
    documentsEdited: activities.filter(a => a.activity_type === 'document_edited').length,
    citationsAdded: activities.filter(a => a.activity_type === 'citation_added').length,
    wordsWritten: 0, // Would need to track this separately
  }
}

// Format activities for email
function formatActivities(activities: ActivityLogEntry[]) {
  return activities.slice(0, 10).map(a => ({
    type: a.activity_type,
    title: a.entity_title || 'Untitled',
    timestamp: new Date(a.created_at).toLocaleString(),
  }))
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get frequency from query param (daily or weekly)
  const searchParams = request.nextUrl.searchParams
  const frequency = searchParams.get('frequency') as 'daily' | 'weekly'

  if (!frequency || !['daily', 'weekly'].includes(frequency)) {
    return NextResponse.json({ error: 'Invalid frequency parameter' }, { status: 400 })
  }

  devLog(`[CRON] Starting ${frequency} activity summary job`)

  try {
    // Get all users with email notifications enabled and matching frequency
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        user_preferences!inner (
          email_notifications_enabled,
          notification_summary_frequency
        )
      `)
      .not('email', 'is', null)

    if (usersError) {
      devError('[CRON] Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Filter users who have email enabled and matching frequency
    const eligibleUsers: UserWithPreferences[] = (users || [])
      .filter((user: any) => {
        const prefs = user.user_preferences?.[0] || user.user_preferences
        return prefs?.email_notifications_enabled === true &&
               prefs?.notification_summary_frequency === frequency
      })
      .map((user: any) => {
        const prefs = user.user_preferences?.[0] || user.user_preferences
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          email_notifications_enabled: prefs?.email_notifications_enabled ?? true,
          notification_summary_frequency: prefs?.notification_summary_frequency ?? 'daily',
        }
      })

    devLog(`[CRON] Found ${eligibleUsers.length} users for ${frequency} summary`)

    const timeRange = getTimeRange(frequency)
    let sentCount = 0
    let errorCount = 0

    // Process each user
    for (const user of eligibleUsers) {
      try {
        // Get user's activities since timeRange
        const { data: activities, error: activitiesError } = await supabaseAdmin
          .from('user_activity_log')
          .select('activity_type, entity_title, created_at')
          .eq('user_id', user.id)
          .gte('created_at', timeRange.toISOString())
          .order('created_at', { ascending: false })

        if (activitiesError) {
          devError(`[CRON] Error fetching activities for user ${user.id}:`, activitiesError)
          errorCount++
          continue
        }

        const activityList = (activities || []) as ActivityLogEntry[]

        // Skip if no activity
        if (activityList.length === 0) {
          devLog(`[CRON] No activity for user ${user.id}, skipping`)
          continue
        }

        // Calculate stats and format activities
        const stats = calculateStats(activityList)
        const formattedActivities = formatActivities(activityList)

        // Send email
        const result = await sendEmail({
          to: user.email,
          subject: frequency === 'daily'
            ? 'Your Daily Activity Summary'
            : 'Your Weekly Activity Summary',
          react: ActivitySummaryEmail({
            userName: user.full_name || 'User',
            period: frequency,
            activities: formattedActivities,
            stats,
          }),
        })

        if (result.success) {
          sentCount++
          devLog(`[CRON] Sent ${frequency} summary to ${user.email}`)
        } else {
          errorCount++
          devError(`[CRON] Failed to send to ${user.email}:`, result.error)
        }
      } catch (error) {
        errorCount++
        devError(`[CRON] Error processing user ${user.id}:`, error)
      }
    }

    devLog(`[CRON] ${frequency} summary job completed: ${sentCount} sent, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      frequency,
      processed: eligibleUsers.length,
      sent: sentCount,
      errors: errorCount,
    })
  } catch (error) {
    devError('[CRON] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
