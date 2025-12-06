export interface BibEntry {
    id: string
    type: string
    title?: string
    author?: string
    year?: string
    journal?: string
    booktitle?: string
    publisher?: string
    pages?: string
    volume?: string
    number?: string
    doi?: string
    url?: string
}

export function parseBibTex(content: string): BibEntry[] {
    const entries: BibEntry[] = []
    const entryRegex = /@(\w+)\s*{\s*([^,]*),([^@]*)}/g

    let match
    while ((match = entryRegex.exec(content)) !== null) {
        const type = match[1].toLowerCase()
        const id = match[2].trim()
        const body = match[3]

        const entry: BibEntry = { id, type }

        // Parse fields
        const fieldRegex = /(\w+)\s*=\s*{([^}]*)}/g
        let fieldMatch
        while ((fieldMatch = fieldRegex.exec(body)) !== null) {
            const key = fieldMatch[1].toLowerCase() as keyof BibEntry
            const value = fieldMatch[2].trim()

            if (key !== 'id' && key !== 'type') {
                entry[key] = value
            }
        }

        entries.push(entry)
    }

    return entries
}
