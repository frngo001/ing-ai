import { createClient } from '../client'
import type { Database } from '../types'

type SlashCommand = Database['public']['Tables']['slash_commands']['Row']
type SlashCommandInsert = Database['public']['Tables']['slash_commands']['Insert']
type SlashCommandUpdate = Database['public']['Tables']['slash_commands']['Update']

export async function getSlashCommands(userId: string): Promise<SlashCommand[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('slash_commands')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getSlashCommandById(id: string, userId: string): Promise<SlashCommand | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('slash_commands')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createSlashCommand(command: SlashCommandInsert): Promise<SlashCommand> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('slash_commands')
    .insert(command)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createSlashCommands(commands: SlashCommandInsert[]): Promise<SlashCommand[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('slash_commands')
    .insert(commands)
    .select()

  if (error) throw error
  return data || []
}

export async function updateSlashCommand(
  id: string,
  updates: SlashCommandUpdate,
  userId: string
): Promise<SlashCommand> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('slash_commands')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSlashCommand(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('slash_commands')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deleteAllSlashCommands(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('slash_commands')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}

