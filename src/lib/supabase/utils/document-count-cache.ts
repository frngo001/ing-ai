/**
 * Cache für die Anzahl der Dokumente pro Projekt
 * Wird aktualisiert beim Laden, Erstellen, Löschen von Dokumenten
 */

type DocumentCountCacheKey = string

const documentCountCache = new Map<DocumentCountCacheKey, number>()

/**
 * Gibt den Cache-Key für ein Projekt zurück
 */
function getCacheKey(userId: string, projectId?: string | null): DocumentCountCacheKey {
  return projectId ? `${userId}:${projectId}` : `${userId}:all`
}

/**
 * Setzt die Anzahl der Dokumente im Cache
 */
export function setDocumentCount(userId: string, count: number, projectId?: string | null): void {
  const key = getCacheKey(userId, projectId)
  documentCountCache.set(key, count)
}

/**
 * Gibt die Anzahl der Dokumente aus dem Cache zurück
 */
export function getDocumentCount(userId: string, projectId?: string | null): number | undefined {
  const key = getCacheKey(userId, projectId)
  return documentCountCache.get(key)
}

/**
 * Erhöht die Anzahl der Dokumente um 1
 */
export function incrementDocumentCount(userId: string, projectId?: string | null): void {
  const key = getCacheKey(userId, projectId)
  const current = documentCountCache.get(key) ?? 0
  documentCountCache.set(key, current + 1)
}

/**
 * Verringert die Anzahl der Dokumente um 1
 */
export function decrementDocumentCount(userId: string, projectId?: string | null): void {
  const key = getCacheKey(userId, projectId)
  const current = documentCountCache.get(key) ?? 0
  documentCountCache.set(key, Math.max(0, current - 1))
}

/**
 * Setzt die Anzahl der Dokumente auf 0
 */
export function resetDocumentCount(userId: string, projectId?: string | null): void {
  const key = getCacheKey(userId, projectId)
  documentCountCache.set(key, 0)
}

/**
 * Invalidiert den Cache für ein Projekt
 */
export function invalidateDocumentCount(userId: string, projectId?: string | null): void {
  const key = getCacheKey(userId, projectId)
  documentCountCache.delete(key)
}

/**
 * Prüft ob Dokumente existieren (basierend auf Cache)
 */
export function hasDocuments(userId: string, projectId?: string | null): boolean | null {
  const count = getDocumentCount(userId, projectId)
  if (count === undefined) return null
  return count > 0
}

