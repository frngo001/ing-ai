'use client'

import { useState } from 'react'
import { Search, ExternalLink, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface SearchResult {
    title: string
    url: string
    description: string
}

export function SearchPanel() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            })

            if (!response.ok) throw new Error('Search failed')

            const data = await response.json()
            setResults(data.results)
        } catch (error) {
            toast.error('Search failed', {
                description: 'Could not perform web search. Please try again.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="flex flex-col h-full border-0 shadow-none">
            <div className="p-4 border-b border-border space-y-4">
                <div>
                    <h3 className="font-semibold text-lg">Research</h3>
                    <p className="text-sm text-muted-foreground">
                        Search the web for sources
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search topic..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {results.length === 0 && !isLoading && (
                        <div className="text-center text-muted-foreground py-8">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Enter a query to start researching</p>
                        </div>
                    )}

                    {results.map((result, index) => (
                        <Card key={index} className="p-4 space-y-2 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                                <a
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline line-clamp-2"
                                >
                                    {result.title}
                                </a>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {result.description}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ExternalLink className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{new URL(result.url).hostname}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    )
}
