export interface PlagiarismResult {
    score: number // 0 to 100
    matches: {
        text: string
        source: string
        similarity: number
    }[]
}

export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock logic: Randomly flag some sentences if text is long enough
    const sentences = text.match(/[^.!?]+[.!?]+/g) || []
    const matches = []
    let totalSimilarity = 0

    if (sentences.length > 0) {
        // Randomly select 1-2 sentences to "flag" as plagiarized for demo purposes
        const numMatches = Math.random() > 0.5 ? 1 : 0

        for (let i = 0; i < numMatches; i++) {
            const randomIdx = Math.floor(Math.random() * sentences.length)
            const sentence = sentences[randomIdx].trim()

            if (sentence.length > 20) {
                matches.push({
                    text: sentence,
                    source: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
                    similarity: Math.floor(Math.random() * 30) + 70, // 70-99% similarity
                })
                totalSimilarity += 15 // Arbitrary score increase
            }
        }
    }

    return {
        score: Math.min(totalSimilarity, 100),
        matches,
    }
}
