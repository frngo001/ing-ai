import { createClient } from '@/lib/supabase/server'
import { devLog, devError } from '@/lib/utils/logger'

/**
 * Session Tracking Module
 *
 * Manages user activity sessions to track active usage patterns,
 * inactivity periods, and session-based metrics.
 */

export interface UserSession {
  id: string
  userId: string
  sessionStart: string
  sessionEnd: string | null
  sessionDurationMinutes: number | null
  totalRequests: number
  totalTokens: number
  endpointsUsed: string[]
  userAgent: string | null
  ipAddress: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SessionMetadata {
  userAgent?: string
  ipAddress?: string
}

const SESSION_TIMEOUT_MINUTES = 30

/**
 * Start a new user session
 * Returns the session ID
 */
export async function startUserSession(
  userId: string,
  metadata?: SessionMetadata
): Promise<string | null> {
  try {
    const supabase = await createClient()

    // Check if there's an active session
    const existingSession = await getActiveSession(userId)
    if (existingSession) {
      devLog(`[Session Tracker] User ${userId.substring(0, 8)} already has active session`)
      return existingSession.id
    }

    const { data, error } = await supabase
      .from('user_activity_sessions')
      .insert({
        user_id: userId,
        user_agent: metadata?.userAgent || null,
        ip_address: metadata?.ipAddress || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) {
      devError('[Session Tracker] Failed to start session:', error)
      return null
    }

    devLog(`[Session Tracker] Started session ${data.id.substring(0, 8)} for user ${userId.substring(0, 8)}`)

    return data.id
  } catch (error) {
    devError('[Session Tracker] Exception in startUserSession:', error)
    return null
  }
}

/**
 * Get the active session for a user
 * Returns null if no active session found
 */
export async function getActiveSession(userId: string): Promise<UserSession | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_activity_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not an error
        return null
      }
      devError('[Session Tracker] Failed to get active session:', error)
      return null
    }

    // Check if session has timed out (30 minutes of inactivity)
    if (data) {
      const updatedAt = new Date(data.updated_at)
      const now = new Date()
      const minutesSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60)

      if (minutesSinceUpdate > SESSION_TIMEOUT_MINUTES) {
        // Session has timed out - end it
        await endUserSession(data.id)
        return null
      }
    }

    return data ? mapSessionData(data) : null
  } catch (error) {
    devError('[Session Tracker] Exception in getActiveSession:', error)
    return null
  }
}

/**
 * Update an existing session
 * Increments request count and updates last activity timestamp
 */
export async function updateUserSession(
  sessionId: string,
  incrementRequests: boolean = false
): Promise<void> {
  try {
    const supabase = await createClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (incrementRequests) {
      // Increment total_requests counter
      const { data: session } = await supabase
        .from('user_activity_sessions')
        .select('total_requests')
        .eq('id', sessionId)
        .single()

      if (session) {
        updateData.total_requests = (session.total_requests || 0) + 1
      }
    }

    const { error } = await supabase
      .from('user_activity_sessions')
      .update(updateData)
      .eq('id', sessionId)

    if (error) {
      devError('[Session Tracker] Failed to update session:', error)
      return
    }

    devLog(`[Session Tracker] Updated session ${sessionId.substring(0, 8)}`)
  } catch (error) {
    devError('[Session Tracker] Exception in updateUserSession:', error)
  }
}

/**
 * Update session with endpoint usage
 * Adds endpoint to the endpoints_used array if not already present
 */
export async function trackEndpointUsage(
  sessionId: string,
  endpoint: string
): Promise<void> {
  try {
    const supabase = await createClient()

    // Get current endpoints_used
    const { data: session } = await supabase
      .from('user_activity_sessions')
      .select('endpoints_used')
      .eq('id', sessionId)
      .single()

    if (session) {
      const currentEndpoints = session.endpoints_used || []

      // Add endpoint if not already tracked
      if (!currentEndpoints.includes(endpoint)) {
        const { error } = await supabase
          .from('user_activity_sessions')
          .update({
            endpoints_used: [...currentEndpoints, endpoint],
          })
          .eq('id', sessionId)

        if (error) {
          devError('[Session Tracker] Failed to track endpoint usage:', error)
        }
      }
    }
  } catch (error) {
    devError('[Session Tracker] Exception in trackEndpointUsage:', error)
  }
}

/**
 * End a user session
 * Calculates session duration and marks as inactive
 */
export async function endUserSession(sessionId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Get session start time
    const { data: session } = await supabase
      .from('user_activity_sessions')
      .select('session_start')
      .eq('id', sessionId)
      .single()

    if (!session) {
      devError('[Session Tracker] Session not found:', sessionId)
      return
    }

    const sessionStart = new Date(session.session_start)
    const sessionEnd = new Date()
    const durationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60))

    const { error } = await supabase
      .from('user_activity_sessions')
      .update({
        session_end: sessionEnd.toISOString(),
        session_duration_minutes: durationMinutes,
        is_active: false,
      })
      .eq('id', sessionId)

    if (error) {
      devError('[Session Tracker] Failed to end session:', error)
      return
    }

    devLog(`[Session Tracker] Ended session ${sessionId.substring(0, 8)} (${durationMinutes} minutes)`)
  } catch (error) {
    devError('[Session Tracker] Exception in endUserSession:', error)
  }
}

/**
 * End all inactive sessions
 * Should be called periodically (e.g., cron job)
 */
export async function endInactiveSessions(): Promise<number> {
  try {
    const supabase = await createClient()

    const timeoutThreshold = new Date()
    timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - SESSION_TIMEOUT_MINUTES)

    // Find all active sessions that haven't been updated in SESSION_TIMEOUT_MINUTES
    const { data: inactiveSessions, error: fetchError } = await supabase
      .from('user_activity_sessions')
      .select('id, session_start, updated_at')
      .eq('is_active', true)
      .lt('updated_at', timeoutThreshold.toISOString())

    if (fetchError) {
      devError('[Session Tracker] Failed to fetch inactive sessions:', fetchError)
      return 0
    }

    if (!inactiveSessions || inactiveSessions.length === 0) {
      return 0
    }

    // End each inactive session
    for (const session of inactiveSessions) {
      await endUserSession(session.id)
    }

    devLog(`[Session Tracker] Ended ${inactiveSessions.length} inactive sessions`)

    return inactiveSessions.length
  } catch (error) {
    devError('[Session Tracker] Exception in endInactiveSessions:', error)
    return 0
  }
}

/**
 * Get user's session history
 * Returns recent sessions with metrics
 */
export async function getUserSessionHistory(
  userId: string,
  limit: number = 20
): Promise<UserSession[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_activity_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_start', { ascending: false })
      .limit(limit)

    if (error) {
      devError('[Session Tracker] Failed to fetch session history:', error)
      return []
    }

    return data ? data.map(mapSessionData) : []
  } catch (error) {
    devError('[Session Tracker] Exception in getUserSessionHistory:', error)
    return []
  }
}

/**
 * Get user activity metrics
 * Returns total active time, session count, avg session duration, etc.
 */
export async function getUserActivityMetrics(
  userId: string,
  days: number = 30
): Promise<{
  totalSessions: number
  totalActiveMinutes: number
  avgSessionDuration: number
  lastActivity: string | null
  inactiveDays: number
} | null> {
  try {
    const supabase = await createClient()

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: sessions, error } = await supabase
      .from('user_activity_sessions')
      .select('session_duration_minutes, session_start')
      .eq('user_id', userId)
      .gte('session_start', since.toISOString())
      .order('session_start', { ascending: false })

    if (error) {
      devError('[Session Tracker] Failed to fetch activity metrics:', error)
      return null
    }

    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        totalActiveMinutes: 0,
        avgSessionDuration: 0,
        lastActivity: null,
        inactiveDays: 0,
      }
    }

    const totalActiveMinutes = sessions.reduce(
      (sum, s) => sum + (s.session_duration_minutes || 0),
      0
    )

    const lastActivity = sessions[0]?.session_start || null
    const inactiveDays = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      totalSessions: sessions.length,
      totalActiveMinutes,
      avgSessionDuration: Math.round(totalActiveMinutes / sessions.length),
      lastActivity,
      inactiveDays,
    }
  } catch (error) {
    devError('[Session Tracker] Exception in getUserActivityMetrics:', error)
    return null
  }
}

/**
 * Helper: Map database session data to UserSession type
 */
function mapSessionData(data: any): UserSession {
  return {
    id: data.id,
    userId: data.user_id,
    sessionStart: data.session_start,
    sessionEnd: data.session_end,
    sessionDurationMinutes: data.session_duration_minutes,
    totalRequests: data.total_requests,
    totalTokens: data.total_tokens,
    endpointsUsed: data.endpoints_used || [],
    userAgent: data.user_agent,
    ipAddress: data.ip_address,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Helper: Get or create active session for user
 * Convenience function for middleware
 */
export async function ensureActiveSession(
  userId: string,
  metadata?: SessionMetadata
): Promise<string | null> {
  let session = await getActiveSession(userId)

  if (!session) {
    const sessionId = await startUserSession(userId, metadata)
    return sessionId
  }

  // Update existing session
  await updateUserSession(session.id)

  return session.id
}
