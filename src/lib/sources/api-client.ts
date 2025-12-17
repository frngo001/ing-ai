// Abstract base class for all API clients

import { ApiConfig, ApiMetrics, ApiResponse, RateLimitInfo } from './types'

export abstract class BaseApiClient {
    protected config: ApiConfig
    protected metrics: ApiMetrics
    protected rateLimitInfo: RateLimitInfo | null = null

    // Rate limiting queue
    private requestQueue: Array<() => Promise<void>> = []
    private isProcessingQueue = false
    private lastRequestTime = 0

    constructor(config: ApiConfig) {
        this.config = config
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
        }
    }

    /**
     * Execute a request with rate limiting, retries, and error handling
     */
    protected async executeRequest<T>(
        requestFn: () => Promise<Response>,
        options: {
            retries?: number
            timeout?: number
            parseAs?: 'json' | 'text'
        } = {}
    ): Promise<ApiResponse<T>> {
        const startTime = Date.now()
        const retries = options.retries ?? this.config.retries
        const timeout = options.timeout ?? this.config.timeout
        const parseAs = options.parseAs ?? 'json'

        try {
            // Wait for rate limit
            await this.waitForRateLimit()

            // Execute request with timeout
            const response = await Promise.race([
                requestFn(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), timeout)
                ),
            ])

            this.metrics.totalRequests++

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data =
                parseAs === 'text'
                    ? ((await response.text()) as unknown as T)
                    : await response.json()

            // Update metrics
            this.metrics.successfulRequests++
            this.updateAverageResponseTime(Date.now() - startTime)

            // Extract rate limit info if available
            this.extractRateLimitInfo(response)

            return {
                success: true,
                data: data as T,
                apiName: this.config.name,
                timestamp: new Date(),
            }
        } catch (error) {
            this.metrics.failedRequests++
            this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error'
            this.metrics.lastErrorAt = new Date()

            // Retry logic
            if (retries > 0 && this.shouldRetry(error)) {
                await this.delay(this.getRetryDelay(this.config.retries - retries))
                return this.executeRequest(requestFn, { retries: retries - 1, timeout })
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                apiName: this.config.name,
                timestamp: new Date(),
            }
        }
    }

    /**
     * Wait for rate limit to allow request
     */
    private async waitForRateLimit(): Promise<void> {
        const now = Date.now()
        const { rateLimit } = this.config

        if (rateLimit.requestsPerSecond) {
            const minDelay = 1000 / rateLimit.requestsPerSecond
            const timeSinceLastRequest = now - this.lastRequestTime

            if (timeSinceLastRequest < minDelay) {
                await this.delay(minDelay - timeSinceLastRequest)
            }
        }

        this.lastRequestTime = Date.now()
    }

    /**
     * Extract rate limit information from response headers
     */
    private extractRateLimitInfo(response: Response): void {
        const limit = response.headers.get('x-ratelimit-limit')
        const remaining = response.headers.get('x-ratelimit-remaining')
        const reset = response.headers.get('x-ratelimit-reset')

        if (limit && remaining && reset) {
            this.rateLimitInfo = {
                limit: parseInt(limit),
                remaining: parseInt(remaining),
                resetAt: new Date(parseInt(reset) * 1000),
            }
        }
    }

    /**
     * Determine if error should trigger retry
     */
    private shouldRetry(error: unknown): boolean {
        if (error instanceof Error) {
            // Retry on timeout or rate limit errors
            if (error.message.includes('timeout')) return true
            if (error.message.includes('429')) return true
            if (error.message.includes('503')) return true
        }
        return false
    }

    /**
     * Calculate exponential backoff delay
     */
    private getRetryDelay(attemptNumber: number): number {
        return Math.min(1000 * Math.pow(2, attemptNumber), 10000)
    }

    /**
     * Update average response time metric
     */
    private updateAverageResponseTime(responseTime: number): void {
        const total = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1)
        this.metrics.averageResponseTime = (total + responseTime) / this.metrics.successfulRequests
    }

    /**
     * Utility delay function
     */
    protected delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Get current metrics
     */
    public getMetrics(): ApiMetrics {
        return { ...this.metrics }
    }

    /**
     * Get rate limit information
     */
    public getRateLimitInfo(): RateLimitInfo | null {
        return this.rateLimitInfo
    }

    /**
     * Abstract methods to be implemented by specific API clients
     */
    abstract searchByTitle(title: string, limit?: number): Promise<ApiResponse<any>>
    abstract searchByAuthor(author: string, limit?: number): Promise<ApiResponse<any>>
    abstract searchByDoi(doi: string): Promise<ApiResponse<any>>
    abstract searchByKeyword(keyword: string, limit?: number): Promise<ApiResponse<any>>
}
