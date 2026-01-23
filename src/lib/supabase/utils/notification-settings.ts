import { createClient } from '@/lib/supabase/client'
import { devLog, devError } from '@/lib/utils/logger'

export type NotificationSummaryFrequency = 'realtime' | 'daily' | 'weekly'

export interface NotificationSettings {
  emailNotificationsEnabled: boolean
  pushNotificationsEnabled: boolean
  desktopNotificationsEnabled: boolean
  notificationSummaryFrequency: NotificationSummaryFrequency
}

export interface ActivityLogEntry {
  id: string
  userId: string
  activityType: 'document_created' | 'document_edited' | 'project_created' | 'citation_added' | 'export_completed'
  entityId?: string
  entityTitle?: string
  details?: Record<string, unknown>
  createdAt: string
}

/**
 * Get notification settings for a user (client-side)
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_preferences')
    .select('email_notifications_enabled, push_notifications_enabled, desktop_notifications_enabled, notification_summary_frequency')
    .eq('user_id', userId)
    .single()

  if (error) {
    devError('[NOTIFICATION_SETTINGS] Error fetching settings:', error)
    return null
  }

  if (!data) return null

  return {
    emailNotificationsEnabled: data.email_notifications_enabled ?? true,
    pushNotificationsEnabled: data.push_notifications_enabled ?? false,
    desktopNotificationsEnabled: data.desktop_notifications_enabled ?? false,
    notificationSummaryFrequency: data.notification_summary_frequency ?? 'daily',
  }
}

/**
 * Update notification settings for a user (client-side)
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<boolean> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}

  if (settings.emailNotificationsEnabled !== undefined) {
    updateData.email_notifications_enabled = settings.emailNotificationsEnabled
  }
  if (settings.pushNotificationsEnabled !== undefined) {
    updateData.push_notifications_enabled = settings.pushNotificationsEnabled
  }
  if (settings.desktopNotificationsEnabled !== undefined) {
    updateData.desktop_notifications_enabled = settings.desktopNotificationsEnabled
  }
  if (settings.notificationSummaryFrequency !== undefined) {
    updateData.notification_summary_frequency = settings.notificationSummaryFrequency
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...updateData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    devError('[NOTIFICATION_SETTINGS] Error updating settings:', error)
    return false
  }

  devLog('[NOTIFICATION_SETTINGS] Settings updated successfully')
  return true
}

/**
 * Log user activity (client-side)
 */
export async function logUserActivity(
  userId: string,
  activityType: ActivityLogEntry['activityType'],
  entityId?: string,
  entityTitle?: string,
  details?: Record<string, unknown>
): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_activity_log')
    .insert({
      user_id: userId,
      activity_type: activityType,
      entity_id: entityId,
      entity_title: entityTitle,
      details: details ?? {},
    })
    .select('id')
    .single()

  if (error) {
    devError('[ACTIVITY_LOG] Error logging activity:', error)
    return null
  }

  devLog(`[ACTIVITY_LOG] Logged activity: ${activityType}`)
  return data.id
}

/**
 * Get user activities for a time period (client-side)
 */
export async function getUserActivities(
  userId: string,
  since: Date
): Promise<ActivityLogEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    devError('[ACTIVITY_LOG] Error fetching activities:', error)
    return []
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    userId: item.user_id,
    activityType: item.activity_type,
    entityId: item.entity_id,
    entityTitle: item.entity_title,
    details: item.details,
    createdAt: item.created_at,
  }))
}
