/**
 * In-memory cache service for edge runtime
 * Singleton pattern for shared cache across requests
 */
interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class CacheService {
  private static instance: CacheService
  private cache: Map<string, CacheEntry<any>>

  private constructor() {
    this.cache = new Map()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value as T
  }

  /**
   * Set value in cache with optional TTL (time to live) in milliseconds
   */
  set(key: string, value: any, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : Number.MAX_SAFE_INTEGER
    
    this.cache.set(key, {
      value,
      expiresAt,
    })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean expired entries (can be called periodically)
   */
  cleanExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

