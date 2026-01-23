import { createClient } from '@/lib/supabase/server'
import { devLog, devError } from '@/lib/utils/logger'
import type { NotificationSettings } from './notification-settings'

/**
 * Get notification settings for a user (server-side)
 */
export async function getNotificationSettingsServer(userId: string): Promise<NotificationSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_preferences')
    .select('email_notifications_enabled, push_notifications_enabled, desktop_notifications_enabled, notification_summary_frequency')
    .eq('user_id', userId)
    .single()

  if (error) {
    devError('[NOTIFICATION_SETTINGS] Error fetching settings (server):', error)
    return null
  }

  if (!data) return null

  return {
    emailNotificationsEnabled: data.email_notifications_enabled ?? false,
    pushNotificationsEnabled: data.push_notifications_enabled ?? false,
    desktopNotificationsEnabled: data.desktop_notifications_enabled ?? false,
    notificationSummaryFrequency: data.notification_summary_frequency ?? 'weekly',
  }
}

/**
 * Queue an email notification (server-side)
 */
export async function queueEmailNotification(
  userId: string,
  emailType: 'project_created' | 'daily_summary' | 'weekly_summary' | 'realtime_activity',
  payload: Record<string, unknown>
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_notifications_queue')
    .insert({
      user_id: userId,
      email_type: emailType,
      payload,
    })

  if (error) {
    devError('[EMAIL_QUEUE] Error queueing email:', error)
    return false
  }

  devLog(`[EMAIL_QUEUE] Email queued: ${emailType}`)
  return true
}

/**
 * Check if user has email notifications enabled (server-side)
 */
export async function isEmailNotificationEnabled(userId: string): Promise<boolean> {
  const settings = await getNotificationSettingsServer(userId)
  return settings?.emailNotificationsEnabled ?? true
}
