/**
 * Request deduplicator for edge runtime
 * Prevents duplicate concurrent requests by sharing promises
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>>

  constructor() {
    this.pendingRequests = new Map()
  }

  /**
   * Deduplicate concurrent requests with the same key
   * If a request with the same key is already in progress, returns the existing promise
   * Otherwise, executes the function and caches the promise
   */
  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const pendingRequest = this.pendingRequests.get(key)
    if (pendingRequest) {
      return pendingRequest as Promise<T>
    }

    // Create new request promise
    const requestPromise = (async () => {
      try {
        return await fn()
      } finally {
        // Remove from pending requests after completion
        this.pendingRequests.delete(key)
      }
    })()

    // Store promise for deduplication
    this.pendingRequests.set(key, requestPromise)

    return requestPromise
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clear(): void {
    this.pendingRequests.clear()
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator()

