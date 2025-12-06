import { CacheService } from './cache-service'

export interface PDFProcessingResult {
    id: string
    text: string
    metadata: {
        pages: number
        size: number
        processedAt: number
    }
}

class PDFCache {
    private cache: CacheService

    constructor() {
        this.cache = CacheService.getInstance()
    }

    getCacheKey(fileId: string): string {
        return `pdf:${fileId}`
    }

    async get(fileId: string): Promise<PDFProcessingResult | null> {
        return this.cache.get<PDFProcessingResult>(this.getCacheKey(fileId))
    }

    async set(fileId: string, result: PDFProcessingResult, ttl?: number): Promise<void> {
        // Cache for 7 days by default
        const cacheTTL = ttl || 1000 * 60 * 60 * 24 * 7
        this.cache.set(this.getCacheKey(fileId), result, cacheTTL)
    }

    async invalidate(fileId: string): Promise<void> {
        // Simply don't re-cache, let it expire naturally
        // Or implement a delete method in CacheService if needed
    }
}

export const pdfCache = new PDFCache()
