/**
 * PDF cache service for storing extracted PDF content
 * Edge-runtime compatible in-memory cache
 */
interface PdfCacheEntry {
  id: string
  text: string
  metadata?: {
    pages?: number
    size?: number
    processedAt?: number
  }
}

class PdfCacheService {
  private cache: Map<string, PdfCacheEntry>
  private readonly DEFAULT_TTL = 1000 * 60 * 60 * 24 // 24 hours

  constructor() {
    this.cache = new Map()
  }

  /**
   * Get cached PDF content by file ID
   */
  async get(fileId: string): Promise<PdfCacheEntry | undefined> {
    return this.cache.get(fileId)
  }

  /**
   * Set PDF content in cache
   */
  async set(fileId: string, entry: PdfCacheEntry): Promise<void> {
    this.cache.set(fileId, entry)
  }

  /**
   * Delete cached PDF content
   */
  async delete(fileId: string): Promise<void> {
    this.cache.delete(fileId)
  }

  /**
   * Clear all cached PDFs
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }
}

// Export singleton instance
export const pdfCache = new PdfCacheService()

