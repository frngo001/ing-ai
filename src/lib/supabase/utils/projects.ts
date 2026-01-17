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

  // Fetch own projects and share memberships (only projects user has explicitly joined)
  const [ownProjectsResult, membershipResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
    // Only fetch projects where user is a member (clicked on share link)
    supabase
      .from('project_share_members')
      .select(`
        share_id,
        joined_at,
        project_shares (
          id,
          project_id,
          mode,
          share_token,
          is_active,
          expires_at,
          owner_id,
          projects (*)
        )
      `)
      .eq('user_id', userId),
  ])

  if (ownProjectsResult.error) {
    devError('[PROJECTS] Error fetching own projects:', ownProjectsResult.error)
    throw ownProjectsResult.error
  }

  const ownProjects: ProjectWithShareInfo[] = (ownProjectsResult.data || []).map(p => ({
    ...p,
    isShared: false,
  }))

  const sharedProjects: ProjectWithShareInfo[] = []
  const now = new Date()

  if (membershipResult.data) {
    for (const membership of membershipResult.data) {
      const share = membership.project_shares as unknown as {
        id: string
        project_id: string
        mode: 'view' | 'edit' | 'suggest'
        share_token: string
        is_active: boolean
        expires_at: string | null
        owner_id: string
        projects: Project
      }

      // Skip if share is inactive or expired
      if (!share?.is_active) continue
      if (share.expires_at && new Date(share.expires_at) < now) continue

      const project = share.projects
      if (project && !ownProjects.some(p => p.id === project.id)) {
        sharedProjects.push({
          ...project,
          isShared: true,
          shareMode: share.mode,
          shareToken: share.share_token,
        })
      }
    }
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
