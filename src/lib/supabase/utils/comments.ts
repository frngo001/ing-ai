import { createClient } from '../client'
import type { Database } from '../types'

type Comment = Database['public']['Tables']['comments']['Row']
type CommentInsert = Database['public']['Tables']['comments']['Insert']
type CommentUpdate = Database['public']['Tables']['comments']['Update']

export async function getCommentsByDiscussion(discussionId: string): Promise<Comment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getCommentById(id: string): Promise<Comment | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createComment(comment: CommentInsert): Promise<Comment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateComment(
  id: string,
  updates: CommentUpdate,
  userId: string
): Promise<Comment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deleteCommentsByDiscussion(discussionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('discussion_id', discussionId)

  if (error) throw error
}

