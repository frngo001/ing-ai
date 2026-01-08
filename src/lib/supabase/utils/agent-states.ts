import { createClient } from '../client'
import type { Database } from '../types'

type AgentState = Database['public']['Tables']['agent_states']['Row']
type AgentStateInsert = Database['public']['Tables']['agent_states']['Insert']
type AgentStateUpdate = Database['public']['Tables']['agent_states']['Update']

export async function getAgentState(userId: string, projectId?: string): Promise<AgentState | null> {
  const supabase = createClient()
  let query = supabase
    .from('agent_states')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  // Filter nach project_id wenn angegeben
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getAllAgentStates(userId: string, projectId?: string): Promise<AgentState[]> {
  const supabase = createClient()
  let query = supabase
    .from('agent_states')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Filter nach project_id wenn angegeben
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function createAgentState(state: AgentStateInsert): Promise<AgentState> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('agent_states')
    .insert(state)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAgentState(
  id: string,
  updates: AgentStateUpdate,
  userId: string
): Promise<AgentState> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('agent_states')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function upsertAgentState(state: AgentStateInsert & { id?: string }): Promise<AgentState> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('agent_states')
    .upsert(state, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAgentState(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('agent_states')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deactivateAllAgentStates(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('agent_states')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) throw error
}

