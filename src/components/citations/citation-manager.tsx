'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { generateFullCitation, type CitationStyle } from '@/lib/citations/generator'
import { SourceSearchDialog } from './source-search-dialog'
import { toast } from 'sonner'

interface Citation {
    id: string
    type: 'book' | 'article' | 'website' | 'journal'
    title: string
    author: string
    year: string
    publisher?: string
    journal?: string
    url?: string
    pages?: string
    doi?: string
}

interface CitationManagerProps {
    onInsertCitation?: (citation: string) => void
}

export function CitationManager({ onInsertCitation }: CitationManagerProps) {
    const [citations, setCitations] = useState<Citation[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [citationStyle, setCitationStyle] = useState<CitationStyle>('apa')

    const [formData, setFormData] = useState<Partial<Citation>>({
        type: 'book',
        title: '',
        author: '',
        year: '',
    })

    const resetForm = () => {
        setFormData({
            type: 'book',
            title: '',
            author: '',
            year: '',
        })
        setEditingId(null)
    }

    const handleSave = () => {
        if (!formData.title || !formData.author || !formData.year) {
            toast.error('Please fill in required fields')
            return
        }

        if (editingId) {
            setCitations(citations.map(c => c.id === editingId ? { ...formData as Citation, id: editingId } : c))
            toast.success('Citation updated')
        } else {
            const newCitation: Citation = {
                ...formData as Citation,
                id: Date.now().toString(),
            }
            setCitations([...citations, newCitation])
            toast.success('Citation added')
        }

        setIsAddOpen(false)
        resetForm()
    }

    const handleEdit = (citation: Citation) => {
        setFormData(citation)
        setEditingId(citation.id)
        setIsAddOpen(true)
    }

    const handleDelete = (id: string) => {
        setCitations(citations.filter(c => c.id !== id))
        toast.success('Citation deleted')
    }

    const handleInsert = (citation: Citation) => {
        const formatted = generateFullCitation(citationStyle, {
            title: citation.title,
            authors: [citation.author],
            publicationYear: parseInt(citation.year),
            publisher: citation.publisher,
            journal: citation.journal,
            url: citation.url,
            pages: citation.pages,
            doi: citation.doi,
        })

        onInsertCitation?.(formatted)
        toast.success('Citation inserted')
    }

    const handleSourceImport = (source: any) => {
        // Convert source to citation format
        const newCitation: Citation = {
            id: Date.now().toString(),
            type: source.type === 'book' ? 'book'
                : source.type === 'journal' ? 'journal'
                    : source.type === 'webpage' || source.type === 'website' ? 'website'
                        : 'article',
            title: source.title,
            author: source.authors?.map((a: any) => a.fullName || `${a.firstName} ${a.lastName}`.trim()).join(', ') || '',
            year: source.publicationYear?.toString() || '',
            publisher: source.publisher,
            journal: source.journal,
            url: source.url,
            pages: source.pages,
            doi: source.doi,
        }

        setCitations([...citations, newCitation])
        toast.success('Source imported as citation')
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Citations ({citations.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Citation Manager</DialogTitle>
                    <DialogDescription>
                        Manage your sources and generate citations
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Style Selection */}
                    <div className="flex items-center gap-4">
                        <Label>Citation Style:</Label>
                        <Select value={citationStyle} onValueChange={(v) => setCitationStyle(v as CitationStyle)}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="apa">APA</SelectItem>
                                <SelectItem value="mla">MLA</SelectItem>
                                <SelectItem value="chicago">Chicago</SelectItem>
                                <SelectItem value="harvard">Harvard</SelectItem>
                                <SelectItem value="ieee">IEEE</SelectItem>
                                <SelectItem value="vancouver">Vancouver</SelectItem>
                            </SelectContent>
                        </Select>

                        <SourceSearchDialog onImport={handleSourceImport} />

                        <Dialog open={isAddOpen} onOpenChange={(open) => {
                            setIsAddOpen(open)
                            if (!open) resetForm()
                        }}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Citation
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingId ? 'Edit' : 'Add'} Citation</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Type</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(v) => setFormData({ ...formData, type: v as Citation['type'] })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="book">Book</SelectItem>
                                                <SelectItem value="article">Article</SelectItem>
                                                <SelectItem value="journal">Journal</SelectItem>
                                                <SelectItem value="website">Website</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Title *</Label>
                                        <Input
                                            value={formData.title || ''}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Enter title"
                                        />
                                    </div>

                                    <div>
                                        <Label>Author *</Label>
                                        <Input
                                            value={formData.author || ''}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            placeholder="Last, First"
                                        />
                                    </div>

                                    <div>
                                        <Label>Year *</Label>
                                        <Input
                                            value={formData.year || ''}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            placeholder="2024"
                                        />
                                    </div>

                                    {formData.type === 'book' && (
                                        <div>
                                            <Label>Publisher</Label>
                                            <Input
                                                value={formData.publisher || ''}
                                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {formData.type === 'journal' && (
                                        <>
                                            <div>
                                                <Label>Journal Name</Label>
                                                <Input
                                                    value={formData.journal || ''}
                                                    onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Pages</Label>
                                                <Input
                                                    value={formData.pages || ''}
                                                    onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                                                    placeholder="1-10"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {formData.type === 'website' && (
                                        <div>
                                            <Label>URL</Label>
                                            <Input
                                                value={formData.url || ''}
                                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <Label>DOI (optional)</Label>
                                        <Input
                                            value={formData.doi || ''}
                                            onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                                            placeholder="10.xxxx/xxxxx"
                                        />
                                    </div>

                                    <Button onClick={handleSave} className="w-full">
                                        {editingId ? 'Update' : 'Add'} Citation
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Citations List */}
                    <ScrollArea className="h-[400px] pr-4">
                        {citations.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No citations yet. Add your first citation to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {citations.map((citation) => (
                                    <Card key={citation.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <p className="text-sm font-mono">
                                                        {generateFullCitation(citationStyle, {
                                                            title: citation.title,
                                                            authors: [citation.author],
                                                            publicationYear: parseInt(citation.year),
                                                            publisher: citation.publisher,
                                                            journal: citation.journal,
                                                            url: citation.url,
                                                            pages: citation.pages,
                                                            doi: citation.doi,
                                                        })}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                            {citation.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleInsert(citation)}
                                                        title="Insert citation"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(citation)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(citation.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
