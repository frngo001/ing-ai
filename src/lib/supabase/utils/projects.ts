import { createClient } from '../client'
import type { Database } from '../types'
import { devLog, devError } from '@/lib/utils/logger'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export interface ProjectWithShareInfo extends Project {
  isShared?: boolean
  shareMode?: 'view' | 'edit' | 'suggest'
  shareToken?: string
}

export async function getProjects(userId: string): Promise<Project[]> {
  const supabase = createClient()

  devLog('[PROJECTS] Fetching projects for user:', userId)

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    devError('[PROJECTS] Error fetching projects:', error)
    throw error
  }

  devLog('[PROJECTS] Found projects:', data?.length || 0)
  return data || []
}

export async function getProjectsWithShared(userId: string): Promise<ProjectWithShareInfo[]> {
  const supabase = createClient()

  devLog('[PROJECTS] Fetching projects with shared for user:', userId)

  // First, fetch own projects
  const ownProjectsResult = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (ownProjectsResult.error) {
    devError('[PROJECTS] Error fetching own projects:', {
      message: ownProjectsResult.error.message,
      code: ownProjectsResult.error.code,
      details: ownProjectsResult.error.details,
      hint: ownProjectsResult.error.hint,
    })
    throw ownProjectsResult.error
  }

  const ownProjects: ProjectWithShareInfo[] = (ownProjectsResult.data || []).map(p => ({
    ...p,
    isShared: false,
  }))

  // Then, fetch share memberships separately
  const sharedProjects: ProjectWithShareInfo[] = []

  try {
    const membershipResult = await supabase
      .from('project_share_members')
      .select('share_id')
      .eq('user_id', userId)

    if (membershipResult.data && membershipResult.data.length > 0) {
      const shareIds = membershipResult.data.map(m => m.share_id)

      // Fetch the shares with their projects
      const sharesResult = await supabase
        .from('project_shares')
        .select('*, projects(*)')
        .in('id', shareIds)
        .eq('is_active', true)

      if (sharesResult.data) {
        const now = new Date()
        for (const share of sharesResult.data) {
          // Skip expired shares
          if (share.expires_at && new Date(share.expires_at) < now) continue

          const project = share.projects as unknown as Project
          if (project && !ownProjects.some(p => p.id === project.id)) {
            sharedProjects.push({
              ...project,
              isShared: true,
              shareMode: share.mode as 'view' | 'edit' | 'suggest',
              shareToken: share.share_token,
            })
          }
        }
      }
    }
  } catch (error) {
    // If project_share_members table doesn't exist yet or has issues, just continue with own projects
    devError('[PROJECTS] Error fetching shared projects (continuing with own projects):', error)
  }

  devLog('[PROJECTS] Found projects:', {
    own: ownProjects.length,
    shared: sharedProjects.length,
  })

  return [...ownProjects, ...sharedProjects]
}

/**
 * Get a specific project by ID
 */
export async function getProjectById(id: string, userId: string): Promise<Project | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      devLog('[PROJECTS] Project not found:', id)
      return null
    }
    devError('[PROJECTS] Error fetching project:', error)
    throw error
  }

  return data
}

/**
 * Get the default project for a user
 */
export async function getDefaultProject(userId: string): Promise<Project | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .limit(1)

  if (error) {
    devError('[PROJECTS] Error fetching default project:', error)
    throw error
  }

  return data?.[0] || null
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectInsert): Promise<Project> {
  const supabase = createClient()

  devLog('[PROJECTS] Creating project:', project.name)

  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation for default project
    if (error.code === '23505' && project.is_default) {
      devLog('[PROJECTS] Default project already exists, fetching it')
      const existing = await getDefaultProject(project.user_id)
      if (existing) return existing
    }
    devError('[PROJECTS] Error creating project:', error)
    throw error
  }

  devLog('[PROJECTS] Project created:', data.id)
  return data
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: ProjectUpdate,
  userId: string
): Promise<Project> {
  const supabase = createClient()

  devLog('[PROJECTS] Updating project:', id, updates)

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    devError('[PROJECTS] Error updating project:', error)
    throw error
  }

  return data
}

/**
 * Delete a project
 */
export async function deleteProject(id: string, userId: string): Promise<void> {
  const supabase = createClient()

  devLog('[PROJECTS] Deleting project:', id)

  // Check if it's the default project
  const project = await getProjectById(id, userId)
  if (project?.is_default) {
    throw new Error('Cannot delete the default project')
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    devError('[PROJECTS] Error deleting project:', error)
    throw error
  }

  devLog('[PROJECTS] Project deleted:', id)
}

/**
 * Ensure a default project exists for a user
 * Creates one if it doesn't exist
 */
export async function ensureDefaultProject(userId: string): Promise<Project> {
  let defaultProject = await getDefaultProject(userId)

  if (!defaultProject) {
    devLog('[PROJECTS] No default project found, creating one')
    defaultProject = await createProject({
      user_id: userId,
      name: 'Mein erstes Projekt',
      description: 'Automatisch erstelltes Standardprojekt',
      is_default: true,
    })
  }

  return defaultProject
}

/**
 * Set a project as the default (unsets other defaults)
 */
export async function setDefaultProject(id: string, userId: string): Promise<Project> {
  const supabase = createClient()

  devLog('[PROJECTS] Setting default project:', id)

  // First, unset all other defaults
  await supabase
    .from('projects')
    .update({ is_default: false })
    .eq('user_id', userId)
    .neq('id', id)

  // Then set this one as default
  return updateProject(id, { is_default: true }, userId)
}
