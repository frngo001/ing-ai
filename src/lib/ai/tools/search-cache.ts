/**
 * Search Result Cache
 *
 * Speichert Suchergebnisse temporär, damit das LLM nur searchIds statt
 * vollständiger Quellen-Objekte zwischen Tools übergeben muss.
 *
 * Performance-Gewinn: ~8000 Tokens → ~200 Tokens pro Tool-Call
 */

import type { NormalizedSource } from '@/lib/sources/types'

// Extended source type with quality/relevance scores
export interface CachedSource extends NormalizedSource {
  qualityScore?: number
  relevanceScore?: number
  evaluationReason?: string
  isRelevant?: boolean
  qualityTier?: 'high' | 'medium' | 'low'
  qualityMetrics?: {
    peerReviewScore: number
    journalQualityScore: number
    citationScore: number
    recencyScore: number
    completenessScore: number
    totalScore: number
  }
}

export interface SearchCacheEntry {
  results: CachedSource[]
  timestamp: number
  metadata: {
    thema: string
    query: string
    userId: string
    filters?: {
      minQualityScore?: number
      includePreprints?: boolean
      preferHighCitations?: boolean
    }
  }
}

export interface SearchCacheSummary {
  searchId: string
  count: number
  topSources: Array<{
    title: string
    year?: number
    qualityScore?: number
    authors?: string
  }>
  averageQualityScore: number
  thema: string
  query: string
  expiresIn: string
}

// In-Memory Cache (per process)
// In production, this could be replaced with Redis for multi-instance support
const searchCache = new Map<string, SearchCacheEntry>()

// Cache configuration
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const CACHE_MAX_ENTRIES = 100 // Prevent memory bloat
const SUMMARY_TOP_SOURCES = 5 // How many sources to show in summary

/**
 * Generate a unique search ID
 */
function generateSearchId(userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `search_${userId.substring(0, 8)}_${timestamp}_${random}`
}

/**
 * Clean up expired entries (called periodically)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  let cleaned = 0

  for (const [searchId, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      searchCache.delete(searchId)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[SearchCache] Cleaned up ${cleaned} expired entries`)
  }
}

/**
 * Enforce max cache size by removing oldest entries
 */
function enforceMaxSize(): void {
  if (searchCache.size <= CACHE_MAX_ENTRIES) return

  // Sort entries by timestamp (oldest first)
  const entries = Array.from(searchCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)

  // Remove oldest entries until we're under the limit
  const toRemove = entries.slice(0, entries.length - CACHE_MAX_ENTRIES)
  for (const [searchId] of toRemove) {
    searchCache.delete(searchId)
  }

  console.log(`[SearchCache] Evicted ${toRemove.length} entries to enforce max size`)
}

/**
 * Store search results and return a searchId
 */
export function storeSearchResults(
  userId: string,
  results: CachedSource[],
  metadata: {
    thema: string
    query: string
    filters?: SearchCacheEntry['metadata']['filters']
  }
): string {
  // Cleanup and enforce limits
  cleanupExpiredEntries()
  enforceMaxSize()

  const searchId = generateSearchId(userId)

  searchCache.set(searchId, {
    results,
    timestamp: Date.now(),
    metadata: {
      ...metadata,
      userId,
    },
  })

  console.log(`[SearchCache] Stored ${results.length} results with searchId: ${searchId}`)

  return searchId
}

/**
 * Get search results by searchId
 * Returns null if not found or expired
 */
export function getSearchResults(searchId: string): CachedSource[] | null {
  const entry = searchCache.get(searchId)

  if (!entry) {
    console.log(`[SearchCache] searchId not found: ${searchId}`)
    return null
  }

  // Check expiration
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    console.log(`[SearchCache] searchId expired: ${searchId}`)
    searchCache.delete(searchId)
    return null
  }

  return entry.results
}

/**
 * Get search metadata by searchId
 */
export function getSearchMetadata(searchId: string): SearchCacheEntry['metadata'] | null {
  const entry = searchCache.get(searchId)

  if (!entry) return null

  // Check expiration
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searchCache.delete(searchId)
    return null
  }

  return entry.metadata
}

/**
 * Get a compact summary of search results for LLM consumption
 * This is what the LLM sees instead of full source objects
 */
export function getSearchSummary(searchId: string): SearchCacheSummary | null {
  const entry = searchCache.get(searchId)

  if (!entry) return null

  // Check expiration
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searchCache.delete(searchId)
    return null
  }

  const { results, timestamp, metadata } = entry
  const expiresInMs = CACHE_TTL_MS - (Date.now() - timestamp)
  const expiresInMinutes = Math.round(expiresInMs / 60000)

  // Calculate average quality score
  const qualityScores = results.map(s => s.qualityScore || 0).filter(s => s > 0)
  const averageQualityScore = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
    : 0

  // Get top sources (sorted by quality)
  const topSources = results
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .slice(0, SUMMARY_TOP_SOURCES)
    .map(s => ({
      title: s.title,
      year: s.publicationYear,
      qualityScore: s.qualityScore,
      authors: s.authors?.slice(0, 2).map(a =>
        typeof a === 'string' ? a : a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
      ).join(', '),
    }))

  return {
    searchId,
    count: results.length,
    topSources,
    averageQualityScore,
    thema: metadata.thema,
    query: metadata.query,
    expiresIn: `${expiresInMinutes} Minuten`,
  }
}

/**
 * Update results in cache (e.g., after evaluation)
 */
export function updateSearchResults(
  searchId: string,
  updater: (results: CachedSource[]) => CachedSource[]
): boolean {
  const entry = searchCache.get(searchId)

  if (!entry) return false

  // Check expiration
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searchCache.delete(searchId)
    return false
  }

  entry.results = updater(entry.results)
  searchCache.set(searchId, entry)

  return true
}

/**
 * Delete a search result from cache
 */
export function deleteSearchResults(searchId: string): boolean {
  return searchCache.delete(searchId)
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  totalEntries: number
  totalSources: number
  oldestEntry: string | null
  newestEntry: string | null
} {
  const entries = Array.from(searchCache.entries())

  if (entries.length === 0) {
    return {
      totalEntries: 0,
      totalSources: 0,
      oldestEntry: null,
      newestEntry: null,
    }
  }

  const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
  const totalSources = entries.reduce((sum, [, entry]) => sum + entry.results.length, 0)

  return {
    totalEntries: entries.length,
    totalSources,
    oldestEntry: sorted[0][0],
    newestEntry: sorted[sorted.length - 1][0],
  }
}

/**
 * Clear all cache entries (for testing or manual cleanup)
 */
export function clearCache(): void {
  const size = searchCache.size
  searchCache.clear()
  console.log(`[SearchCache] Cleared ${size} entries`)
}
