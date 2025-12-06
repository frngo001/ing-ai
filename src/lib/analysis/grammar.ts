import { CacheService } from '@/lib/cache/cache-service'

export interface GrammarError {
    message: string
    offset: number
    length: number
    rule: string
    category: string
    suggestions: string[]
}

export interface GrammarCheckResult {
    errors: GrammarError[]
    score: number // 0-100
}

// Mock grammar checker - in production, integrate with LanguageTool API or similar
export async function checkGrammar(text: string): Promise<GrammarCheckResult> {
    const cache = CacheService.getInstance()
    const cacheKey = `grammar:${text.slice(0, 100)}`
    const cached = cache.get<GrammarCheckResult>(cacheKey)

    if (cached) {
        return cached
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock errors for demonstration
    const mockErrors: GrammarError[] = []

    // Check for basic issues
    if (text.includes('definately')) {
        const offset = text.indexOf('definately')
        mockErrors.push({
            message: 'Possible spelling mistake',
            offset,
            length: 10,
            rule: 'MORFOLOGIK_RULE_EN_US',
            category: 'TYPOS',
            suggestions: ['definitely'],
        })
    }

    if (text.includes('alot')) {
        const offset = text.indexOf('alot')
        mockErrors.push({
            message: 'Did you mean "a lot"?',
            offset,
            length: 4,
            rule: 'EN_A_VS_AN',
            category: 'GRAMMAR',
            suggestions: ['a lot'],
        })
    }

    const score = Math.max(0, 100 - (mockErrors.length * 10))

    const result = {
        errors: mockErrors,
        score,
    }

    cache.set(cacheKey, result, 1000 * 60 * 10) // Cache for 10 minutes

    return result
}
