type PendingRequest = {
    promise: Promise<any>
    timestamp: number
}

class RequestDeduplicator {
    private static instance: RequestDeduplicator
    private pending: Map<string, PendingRequest>
    private cleanupInterval: NodeJS.Timeout | null = null

    private constructor() {
        this.pending = new Map()
        this.startCleanup()
    }

    public static getInstance(): RequestDeduplicator {
        if (!RequestDeduplicator.instance) {
            RequestDeduplicator.instance = new RequestDeduplicator()
        }
        return RequestDeduplicator.instance
    }

    private startCleanup() {
        // Clean up stale requests every minute
        this.cleanupInterval = setInterval(() => {
            const now = Date.now()
            const timeout = 60000 // 1 minute

            for (const [key, request] of this.pending.entries()) {
                if (now - request.timestamp > timeout) {
                    this.pending.delete(key)
                }
            }
        }, 60000)
    }

    public async deduplicate<T>(
        key: string,
        fn: () => Promise<T>
    ): Promise<T> {
        // Check if request is already pending
        const existing = this.pending.get(key)
        if (existing) {
            return existing.promise as Promise<T>
        }

        // Execute the request
        const promise = fn()
        this.pending.set(key, {
            promise,
            timestamp: Date.now(),
        })

        try {
            const result = await promise
            return result
        } finally {
            // Remove from pending after completion
            this.pending.delete(key)
        }
    }

    public clear() {
        this.pending.clear()
    }
}

export const requestDeduplicator = RequestDeduplicator.getInstance()
