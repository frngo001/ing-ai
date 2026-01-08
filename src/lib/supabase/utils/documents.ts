import { createClient } from '../client'
import type { Database } from '../types'
import { ensurePermanentUrls, hasBlobUrls } from '@/lib/editor/convert-blob-urls'
import { devLog, devWarn } from '@/lib/utils/logger'
import type { Value } from 'platejs'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

// Cache für Dokumente pro User
const documentsCache = new Map<string, { documents: Document[]; timestamp: number }>()
const CACHE_DURATION = 3 * 1000 // 3 Sekunden
// Promise-Cache um parallele Requests zu vermeiden
const pendingRequests = new Map<string, Promise<Document[]>>()

/**
 * Ruft alle Dokumente für einen User ab, nutzt Cache um mehrfache API-Calls zu vermeiden
 * Verhindert parallele Requests durch Promise-Sharing
 * @param userId - User ID
 * @param projectId - Optional: Filtert nach Projekt-ID
 */
export async function getDocuments(userId: string, projectId?: string): Promise<Document[]> {
  const cacheKey = projectId ? `${userId}:${projectId}` : userId
  const now = Date.now()
  const cached = documentsCache.get(cacheKey)

  // Prüfe Cache zuerst
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.documents
  }

  // Prüfe ob bereits ein Request für diesen User läuft
  const pendingRequest = pendingRequests.get(cacheKey)
  if (pendingRequest) {
    // Warte auf den laufenden Request statt einen neuen zu starten
    return pendingRequest
  }

  // Starte neuen Request
  const requestPromise = (async () => {
    try {
      const supabase = createClient()
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      // Filter nach project_id wenn angegeben
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error

      const documents = data || []

      // Cache aktualisieren
      documentsCache.set(cacheKey, { documents, timestamp: Date.now() })

      return documents
    } finally {
      // Entferne Promise aus pendingRequests nach Abschluss
      pendingRequests.delete(cacheKey)
    }
  })()

  // Speichere Promise für andere parallele Aufrufe
  pendingRequests.set(cacheKey, requestPromise)

  return requestPromise
}

export async function getDocumentById(id: string, userId: string): Promise<Document | null> {
  const supabase = createClient()
  
  // Stelle sicher, dass der Accept-Header korrekt gesetzt ist
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    // Logge 406 Fehler für besseres Debugging
    if (error.message?.includes('406')) {
      console.error('[DOCUMENTS] 406 Not Acceptable - Möglicherweise fehlerhafter Accept-Header:', error)
    }
    throw error
  }
  return data
}

export async function createDocument(document: DocumentInsert): Promise<Document> {
  const supabase = createClient()

  // Konvertiere blob-URLs zu permanenten Supabase URLs, wenn Content vorhanden ist
  let processedDocument = document
  if (document.content) {
    try {
      const content = document.content as Value
      if (hasBlobUrls(content)) {
        devLog('[DOCUMENTS] Converting blob URLs to permanent URLs before create...')
        const permanentContent = await ensurePermanentUrls(content)
        processedDocument = { ...document, content: permanentContent as any }
        devLog('[DOCUMENTS] Blob URLs converted successfully')
      }
    } catch (error) {
      devWarn('[DOCUMENTS] Failed to convert blob URLs, saving with original content:', error)
    }
  }

  const { data, error } = await supabase
    .from('documents')
    .insert(processedDocument)
    .select()
    .single()

  if (error) throw error

  // Cache invalidieren für diesen User
  if (document.user_id) {
    invalidateDocumentsCache(document.user_id)
  }

  return data
}

export async function updateDocument(
  id: string,
  updates: DocumentUpdate,
  userId: string
): Promise<Document> {
  const supabase = createClient()

  // Konvertiere blob-URLs zu permanenten Supabase URLs, wenn Content vorhanden ist
  if (updates.content) {
    try {
      const content = updates.content as Value
      if (hasBlobUrls(content)) {
        devLog('[DOCUMENTS] Converting blob URLs to permanent URLs before saving...')
        const permanentContent = await ensurePermanentUrls(content, id)
        updates = { ...updates, content: permanentContent as any }
        devLog('[DOCUMENTS] Blob URLs converted successfully')
      }
    } catch (error) {
      devWarn('[DOCUMENTS] Failed to convert blob URLs, saving with original content:', error)
      // Fahre trotzdem mit dem Speichern fort - blob URLs funktionieren zumindest temporär
    }
  }

  // Prüfe zuerst, ob das Dokument existiert
  const existingDoc = await getDocumentById(id, userId)
  if (!existingDoc) {
    // Dokument existiert nicht - verwende upsert statt insert, um Race Conditions zu vermeiden
    // Falls das Dokument doch existiert (z.B. wegen RLS-Problemen bei getDocumentById),
    // wird es aktualisiert statt einen Unique Constraint Fehler zu werfen
    const newDocument: DocumentInsert = {
      id,
      user_id: userId,
      title: (updates.title as string) || 'Unbenanntes Dokument',
      content: (updates.content as any) || {},
      document_type: (updates.document_type as string) || 'essay',
      word_count: (updates.word_count as number) || 0,
      ...updates, // Füge weitere Updates hinzu (z.B. updated_at)
    }
    
    const { data, error } = await supabase
      .from('documents')
      .upsert(newDocument, { onConflict: 'id' })
      .select()
      .single()
    
    if (error) {
      // Falls upsert fehlschlägt, versuche ein normales Update (Dokument existiert möglicherweise)
      if (error.code === '23505') {
        // Unique Constraint Violation - Dokument existiert bereits, versuche Update
        const { data: updateData, error: updateError } = await supabase
          .from('documents')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (updateError) throw updateError
        
        invalidateDocumentsCache(userId)
        return updateData
      }
      throw error
    }
    
    // Cache invalidieren für diesen User
    invalidateDocumentsCache(userId)
    
    return data
  }
  
  // Dokument existiert - Update durchführen
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    // Spezielle Behandlung für PGRST116 (Dokument nicht gefunden nach Update)
    if (error.code === 'PGRST116') {
      console.warn(`[DOCUMENTS] Dokument ${id} wurde während des Updates nicht gefunden. Möglicherweise wurde es gelöscht oder RLS verhindert den Zugriff.`)
      throw new Error(`Dokument konnte nicht aktualisiert werden: ${error.message}`)
    }
    throw error
  }
  
  // Cache invalidieren für diesen User
  invalidateDocumentsCache(userId)
  
  return data
}

export async function deleteDocument(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
  
  // Cache invalidieren für diesen User
  invalidateDocumentsCache(userId)
}

export async function upsertDocument(document: DocumentInsert & { id?: string }): Promise<Document> {
  const supabase = createClient()

  // Konvertiere blob-URLs zu permanenten Supabase URLs, wenn Content vorhanden ist
  let processedDocument = document
  if (document.content) {
    try {
      const content = document.content as Value
      if (hasBlobUrls(content)) {
        devLog('[DOCUMENTS] Converting blob URLs to permanent URLs before upsert...')
        const permanentContent = await ensurePermanentUrls(content, document.id)
        processedDocument = { ...document, content: permanentContent as any }
        devLog('[DOCUMENTS] Blob URLs converted successfully')
      }
    } catch (error) {
      devWarn('[DOCUMENTS] Failed to convert blob URLs, saving with original content:', error)
    }
  }

  const { data, error } = await supabase
    .from('documents')
    .upsert(processedDocument, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error

  // Cache invalidieren für diesen User
  if (document.user_id) {
    invalidateDocumentsCache(document.user_id)
  }

  return data
}

/**
 * Invalidiert den Dokumente-Cache für einen User (inkl. aller Projekt-spezifischen Caches)
 */
export function invalidateDocumentsCache(userId: string): void {
  // Lösche alle Cache-Einträge die mit diesem userId beginnen
  for (const key of documentsCache.keys()) {
    if (key === userId || key.startsWith(`${userId}:`)) {
      documentsCache.delete(key)
    }
  }
}

/**
 * Invalidiert den Dokumente-Cache für alle User
 */
export function invalidateAllDocumentsCache(): void {
  documentsCache.clear()
}

