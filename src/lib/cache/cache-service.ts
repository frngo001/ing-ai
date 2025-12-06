type CacheEntry<T> = {
    data: T
    timestamp: number
    expiresAt: number
}

export class CacheService {
    private static instance: CacheService
    private cache: Map<string, CacheEntry<any>>
    private defaultTTL: number = 1000 * 60 * 60 // 1 hour

    private constructor() {
        this.cache = new Map()
    }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService()
        }
        return CacheService.instance
    }

    public set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
        const now = Date.now()
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttl,
        })
    }

    public get<T>(key: string): T | null {
        const entry = this.cache.get(key)

        if (!entry) {
            return null
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key)
            return null
        }

        return entry.data as T
    }

    public clear(): void {
        this.cache.clear()
    }
}
