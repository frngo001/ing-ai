'use client'

import { useState } from 'react'
import { Search, Loader2, BookOpen, ExternalLink, Download } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface Source {
    id: string
    doi?: string
    title: string
    authors: Array<{ fullName?: string; firstName?: string; lastName?: string }>
    publicationYear?: number
    type: string
    journal?: string
    publisher?: string
    abstract?: string
    url?: string
    pdfUrl?: string
    isOpenAccess?: boolean
    completeness: number
    sourceApi: string
    volume?: string
    issue?: string
    pages?: string
}

interface SourceSearchDialogProps {
    onImport?: (source: Source) => void
}

export function SourceSearchDialog({ onImport }: SourceSearchDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState<'keyword' | 'title' | 'author' | 'doi'>('keyword')
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<Source[]>([])
    const [searchTime, setSearchTime] = useState<number>(0)

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error('Please enter a search query')
            return
        }

        setIsSearching(true)
        setResults([])

        try {
            const response = await fetch('/api/sources/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery,
                    type: searchType,
                    limit: 20,
                }),
            })

            if (!response.ok) {
                throw new Error('Search failed')
            }

            const data = await response.json()
            setResults(data.sources || [])
            setSearchTime(data.searchTime || 0)

            if (data.sources?.length === 0) {
                toast.info('No sources found')
            } else {
                toast.success(`Found ${data.sources.length} sources in ${(data.searchTime / 1000).toFixed(2)}s`)
            }
        } catch (error) {
            console.error('Search error:', error)
            toast.error('Failed to search sources')
        } finally {
            setIsSearching(false)
        }
    }

    const handleImport = (source: Source) => {
        onImport?.(source)
        toast.success('Source imported to citation manager')
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSearching) {
            handleSearch()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search Sources
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Search Scientific Sources</DialogTitle>
                    <DialogDescription>
                        Search across 14+ scientific databases for papers, preprints, and articles
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Controls */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="search-query" className="sr-only">Search Query</Label>
                            <Input
                                id="search-query"
                                placeholder="Enter title, author, DOI,or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isSearching}
                            />
                        </div>
                        <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="keyword">Keyword</SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                                <SelectItem value="author">Author</SelectItem>
                                <SelectItem value="doi">DOI</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Results */}
                    <ScrollArea className="h-[500px]">
                        {results.length === 0 && !isSearching && (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No results yet. Start searching to find scientific sources.</p>
                            </div>
                        )}

                        {isSearching && (
                            <div className="text-center py-12">
                                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                                <p className="text-muted-foreground">Searching across multiple databases...</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {results.map((source) => (
                                <Card key={source.id} className="hover:border-primary transition-colors">
                                    <CardContent className="pt-4">
                                        <div className="space-y-2">
                                            {/* Title */}
                                            <h4 className="font-semibold text-sm leading-tight">
                                                {source.title}
                                            </h4>

                                            {/* Authors and Year */}
                                            <p className="text-xs text-muted-foreground">
                                                {source.authors
                                                    ?.slice(0, 3)
                                                    .map(a => a.fullName || `${a.firstName} ${a.lastName}`.trim())
                                                    .join(', ')}
                                                {source.authors && source.authors.length > 3 && ' et al.'}
                                                {source.publicationYear && ` (${source.publicationYear})`}
                                            </p>

                                            {/* Metadata */}
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {source.type}
                                                </Badge>
                                                {source.journal && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {source.journal}
                                                    </Badge>
                                                )}
                                                {source.isOpenAccess && (
                                                    <Badge variant="default" className="text-xs bg-green-600">
                                                        Open Access
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-xs">
                                                    {source.sourceApi}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {Math.round(source.completeness * 100)}% complete
                                                </Badge>
                                            </div>

                                            {/* Abstract */}
                                            {source.abstract && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {source.abstract}
                                                </p>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleImport(source)}
                                                    className="flex-1"
                                                >
                                                    <Download className="h-3 w-3 mr-1" />
                                                    Import
                                                </Button>
                                                {source.url && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => window.open(source.url, '_blank')}
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                )}
                                                {source.pdfUrl && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => window.open(source.pdfUrl, '_blank')}
                                                    >
                                                        <Download className="h-3 w-3 mr-1" />
                                                        PDF
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
