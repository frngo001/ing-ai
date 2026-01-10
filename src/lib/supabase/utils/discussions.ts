import { createClient } from '../client'
import type { Database } from '../types'

type Discussion = Database['public']['Tables']['discussions']['Row']
type DiscussionInsert = Database['public']['Tables']['discussions']['Insert']
type DiscussionUpdate = Database['public']['Tables']['discussions']['Update']

export async function getDiscussionsByDocument(documentId: string): Promise<Discussion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Prüft, ob eine ID eine gültige UUID ist (nicht Mock-Daten)
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function getDiscussionById(id: string): Promise<Discussion | null> {
  // Überspringe API-Aufruf für Mock-IDs
  if (!isValidUUID(id)) {
    console.warn(`[DISCUSSIONS] Überspringe API-Aufruf für Mock-ID: ${id}`)
    return null
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createDiscussion(discussion: DiscussionInsert): Promise<Discussion> {
  // Überspringe API-Aufruf für Mock-IDs
  if (discussion.id && !isValidUUID(discussion.id)) {
    console.warn(`[DISCUSSIONS] Überspringe Erstellung für Mock-ID: ${discussion.id}`)
    throw new Error(`Ungültige Discussion-ID: ${discussion.id}`)
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .insert(discussion)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDiscussion(
  id: string,
  updates: DiscussionUpdate,
  userId: string
): Promise<Discussion> {
  // Überspringe API-Aufruf für Mock-IDs
  if (!isValidUUID(id)) {
    console.warn(`[DISCUSSIONS] Überspringe Update für Mock-ID: ${id}`)
    throw new Error(`Ungültige Discussion-ID: ${id}`)
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDiscussion(id: string, userId: string): Promise<void> {
  // Überspringe API-Aufruf für Mock-IDs
  if (!isValidUUID(id)) {
    console.warn(`[DISCUSSIONS] Überspringe Löschen für Mock-ID: ${id}`)
    return
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('discussions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deleteDiscussionsByDocument(documentId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('discussions')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getDeepDiscussionsByDocument(documentId: string): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .select('*, comments(*)')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    isResolved: d.is_resolved,
    documentContent: d.document_content,
    createdAt: new Date(d.created_at),
    comments: (d.comments || []).map((c: any) => ({
      id: c.id,
      discussionId: c.discussion_id,
      userId: c.user_id,
      userName: c.user_name,
      avatarUrl: c.avatar_url,
      contentRich: c.content_rich,
      isEdited: c.is_edited,
      createdAt: new Date(c.created_at),
      updatedAt: c.updated_at ? new Date(c.updated_at) : undefined
    })).sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime())
  }))
}

export async function syncDiscussions(documentId: string, discussions: any[]) {
  const supabase = createClient()

  for (const discussion of discussions) {
    if (!isValidUUID(discussion.id)) continue

    // 1. Upsert discussion
    const { error: dError } = await supabase
      .from('discussions')
      .upsert({
        id: discussion.id,
        document_id: documentId,
        user_id: discussion.userId,
        is_resolved: discussion.isResolved,
        document_content: discussion.documentContent,
        updated_at: new Date().toISOString()
      })

    if (dError) {
      console.error(`[SYNC DISCUSSIONS] Error upserting discussion ${discussion.id}:`, dError)
      continue
    }

    // 2. Upsert comments
    for (const comment of discussion.comments) {
      if (!isValidUUID(comment.id)) continue

      await supabase
        .from('comments')
        .upsert({
          id: comment.id,
          discussion_id: discussion.id,
          user_id: comment.userId,
          user_name: comment.userName,
          avatar_url: comment.avatarUrl,
          content_rich: comment.contentRich,
          is_edited: comment.isEdited,
          updated_at: new Date().toISOString()
        })
    }
  }
}

