import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '../client'
import type { Database } from '../types'
import { devLog, devError } from '@/lib/utils/logger'

type ProjectShare = Database['public']['Tables']['project_shares']['Row']
type ProjectShareInsert = Database['public']['Tables']['project_shares']['Insert']
type ProjectShareUpdate = Database['public']['Tables']['project_shares']['Update']
type ShareMode = 'view' | 'edit' | 'suggest'
type SupabaseClientType = SupabaseClient<Database>

function generateShareToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function createProjectShare(
  projectId: string,
  ownerId: string,
  mode: ShareMode,
  expiresAt?: Date,
  supabaseClient?: SupabaseClientType
): Promise<ProjectShare> {
  const supabase = supabaseClient || createClient()
  const shareToken = generateShareToken()

  devLog('[PROJECT_SHARES] Creating share for project:', projectId, 'mode:', mode)

  const shareData: ProjectShareInsert = {
    project_id: projectId,
    owner_id: ownerId,
    share_token: shareToken,
    mode,
    is_active: true,
    expires_at: expiresAt?.toISOString() || null,
  }

  const { data, error } = await supabase
    .from('project_shares')
    .insert(shareData)
    .select()
    .single()

  if (error) {
    devError('[PROJECT_SHARES] Error creating share:', error)
    throw error
  }

  devLog('[PROJECT_SHARES] Share created:', data.id)
  return data
}

export async function getProjectShareByToken(
  token: string,
  supabaseClient?: SupabaseClientType
): Promise<ProjectShare | null> {
  const supabase = supabaseClient || createClient()

  devLog('[PROJECT_SHARES] Getting share by token')

  const { data, error } = await supabase
    .from('project_shares')
    .select('*')
    .eq('share_token', token)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      devLog('[PROJECT_SHARES] Share not found or inactive')
      return null
    }
    devError('[PROJECT_SHARES] Error getting share by token:', error)
    throw error
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    devLog('[PROJECT_SHARES] Share has expired')
    return null
  }

  return data
}

export async function getProjectShares(
  projectId: string,
  ownerId: string,
  supabaseClient?: SupabaseClientType
): Promise<ProjectShare[]> {
  const supabase = supabaseClient || createClient()

  devLog('[PROJECT_SHARES] Getting shares for project:', projectId)

  const { data, error } = await supabase
    .from('project_shares')
    .select('*')
    .eq('project_id', projectId)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) {
    devError('[PROJECT_SHARES] Error getting project shares:', error)
    throw error
  }

  return data || []
}

export async function revokeProjectShare(
  shareId: string,
  ownerId: string,
  supabaseClient?: SupabaseClientType
): Promise<void> {
  const supabase = supabaseClient || createClient()

  devLog('[PROJECT_SHARES] Revoking share:', shareId)

  const { error } = await supabase
    .from('project_shares')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', shareId)
    .eq('owner_id', ownerId)

  if (error) {
    devError('[PROJECT_SHARES] Error revoking share:', error)
    throw error
  }

  devLog('[PROJECT_SHARES] Share revoked:', shareId)
}

export async function deleteProjectShare(
  shareId: string,
  ownerId: string,
  supabaseClient?: SupabaseClientType
): Promise<void> {
  const supabase = supabaseClient || createClient()

  devLog('[PROJECT_SHARES] Deleting share:', shareId)

  const { error } = await supabase
    .from('project_shares')
    .delete()
    .eq('id', shareId)
    .eq('owner_id', ownerId)

  if (error) {
    devError('[PROJECT_SHARES] Error deleting share:', error)
    throw error
  }

  devLog('[PROJECT_SHARES] Share deleted:', shareId)
}

export interface ShareAccessResult {
  isValid: boolean
  mode: ShareMode | null
  projectId: string | null
  ownerId: string | null
  expiresAt: Date | null
}

export async function validateShareAccess(
  token: string,
  supabaseClient?: SupabaseClientType
): Promise<ShareAccessResult> {
  const share = await getProjectShareByToken(token, supabaseClient)

  if (!share) {
    return {
      isValid: false,
      mode: null,
      projectId: null,
      ownerId: null,
      expiresAt: null,
    }
  }

  return {
    isValid: true,
    mode: share.mode,
    projectId: share.project_id,
    ownerId: share.owner_id,
    expiresAt: share.expires_at ? new Date(share.expires_at) : null,
  }
}

export async function getSharedProjectData(
  token: string,
  supabaseClient?: SupabaseClientType
): Promise<{
  project: Database['public']['Tables']['projects']['Row'] | null
  share: ProjectShare | null
  documents: Database['public']['Tables']['documents']['Row'][]
  libraries: Database['public']['Tables']['citation_libraries']['Row'][]
} | null> {
  const supabase = supabaseClient || createClient()
  
  const share = await getProjectShareByToken(token, supabase)
  if (!share) {
    return null
  }

  devLog('[PROJECT_SHARES] Getting shared project data for:', share.project_id)

  const [projectResult, documentsResult, librariesResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('id', share.project_id)
      .single(),
    supabase
      .from('documents')
      .select('*')
      .eq('project_id', share.project_id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('citation_libraries')
      .select('*')
      .eq('project_id', share.project_id)
      .order('created_at', { ascending: false }),
  ])

  if (projectResult.error) {
    devError('[PROJECT_SHARES] Error getting project:', projectResult.error)
    return null
  }

  return {
    project: projectResult.data,
    share,
    documents: documentsResult.data || [],
    libraries: librariesResult.data || [],
  }
}

export async function updateProjectShare(
  shareId: string,
  ownerId: string,
  updates: Partial<Pick<ProjectShareUpdate, 'mode' | 'expires_at' | 'is_active'>>,
  supabaseClient?: SupabaseClientType
): Promise<ProjectShare> {
  const supabase = supabaseClient || createClient()

  devLog('[PROJECT_SHARES] Updating share:', shareId, updates)

  const { data, error } = await supabase
    .from('project_shares')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shareId)
    .eq('owner_id', ownerId)
    .select()
    .single()

  if (error) {
    devError('[PROJECT_SHARES] Error updating share:', error)
    throw error
  }

  return data
}

export interface JoinShareResult {
  success: boolean
  error?: string
  isOwner?: boolean
  projectId?: string
  shareId?: string
  mode?: ShareMode
}

/**
 * Join a shared project via share token.
 * This function calls a database function that:
 * 1. Validates the share token
 * 2. Creates a membership record for the current user
 * 3. Returns the project info
 */
export async function joinProjectShare(
  token: string,
  supabaseClient?: SupabaseClientType
): Promise<JoinShareResult> {
  const supabase = supabaseClient || createClient()

  devLog('[PROJECT_SHARES] Joining share via token')

  const { data, error } = await supabase.rpc('join_project_share', {
    share_token_param: token,
  })

  if (error) {
    devError('[PROJECT_SHARES] Error joining share:', error)
    return { success: false, error: error.message }
  }

  devLog('[PROJECT_SHARES] Join result:', data)
  return data as JoinShareResult
}

/**
 * Get all share memberships for a user (projects shared with them that they've joined)
 */
export async function getUserShareMemberships(
  userId: string,
  supabaseClient?: SupabaseClientType
): Promise<Array<{
  shareId: string
  projectId: string
  mode: ShareMode
  joinedAt: Date
}>> {
  const supabase = supabaseClient || createClient()

  devLog('[PROJECT_SHARES] Getting share memberships for user:', userId)

  const { data, error } = await supabase
    .from('project_share_members')
    .select(`
      id,
      share_id,
      joined_at,
      project_shares (
        id,
        project_id,
        mode,
        is_active,
        expires_at
      )
    `)
    .eq('user_id', userId)

  if (error) {
    devError('[PROJECT_SHARES] Error getting memberships:', error)
    throw error
  }

  // Filter out inactive or expired shares
  const now = new Date()
  const activeMemberships = (data || [])
    .filter((m) => {
      const share = m.project_shares as unknown as ProjectShare
      if (!share?.is_active) return false
      if (share.expires_at && new Date(share.expires_at) < now) return false
      return true
    })
    .map((m) => {
      const share = m.project_shares as unknown as ProjectShare
      return {
        shareId: m.share_id,
        projectId: share.project_id,
        mode: share.mode as ShareMode,
        joinedAt: new Date(m.joined_at),
      }
    })

  devLog('[PROJECT_SHARES] Found active memberships:', activeMemberships.length)
  return activeMemberships
}
