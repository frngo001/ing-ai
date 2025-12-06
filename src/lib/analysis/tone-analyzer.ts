export interface ToneAnalysis {
    score: number // 0-100
    level: 'casual' | 'neutral' | 'formal' | 'academic'
    suggestions: string[]
}

const academicKeywords = [
    'furthermore', 'moreover', 'however', 'therefore', 'consequently',
    'thus', 'hence', 'accordingly', 'nevertheless', 'nonetheless',
    'subsequently', 'additionally', 'alternatively', 'conversely',
]

const casualIndicators = [
    'gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'yep', 'nope',
    'ok', 'lol', 'omg', 'btw', 'fyi',
]

const contractionPattern = /(won't|can't|don't|shouldn't|wouldn't|couldn't|isn't|aren't|hasn't|haven't|hadn't)/gi

export function analyzeTone(text: string): ToneAnalysis {
    const lowerText = text.toLowerCase()
    let score = 50 // Start neutral
    const suggestions: string[] = []

    // Check for academic markers
    let academicCount = 0
    academicKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            academicCount++
        }
    })

    // Check for casual markers
    let casualCount = 0
    casualIndicators.forEach(indicator => {
        if (lowerText.includes(indicator)) {
            casualCount++
            suggestions.push(`Consider replacing "${indicator}" with more formal language`)
        }
    })

    // Check for contractions
    const contractions = text.match(contractionPattern)
    if (contractions && contractions.length > 0) {
        casualCount += contractions.length
        suggestions.push('Avoid contractions in academic writing')
    }

    // Check for first person
    if (/(^|\s)(I|me|my|mine)(\s|$|[,.])/i.test(text)) {
        suggestions.push('Consider using third person for more formal tone')
    }

    // Calculate score
    score += academicCount * 5
    score -= casualCount * 10

    // Clamp score
    score = Math.max(0, Math.min(100, score))

    // Determine level
    let level: ToneAnalysis['level']
    if (score < 30) {
        level = 'casual'
    } else if (score < 60) {
        level = 'neutral'
    } else if (score < 80) {
        level = 'formal'
    } else {
        level = 'academic'
    }

    // Add positive feedback for high scores
    if (score >= 80) {
        suggestions.unshift('Excellent academic tone!')
    } else if (level === 'casual') {
        suggestions.unshift('This text appears quite casual for academic writing')
    }

    return {
        score,
        level,
        suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
    }
}
