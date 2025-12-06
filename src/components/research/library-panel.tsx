'use client'

import { useState } from 'react'
import { FileText, Trash2, Plus, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PdfUpload } from './pdf-upload'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { parseBibTex } from '@/lib/citations/bib-parser'
import { toast } from 'sonner'
import { useRef } from 'react'

interface Source {
    id: string
    title: string
    type: 'pdf' | 'web'
    content: string
    author?: string
    year?: string
}

interface LibraryPanelProps {
    onSourcesChange: (sources: Source[]) => void
    onInsertCitation?: (citation: string) => void
}

export function LibraryPanel({ onSourcesChange, onInsertCitation }: LibraryPanelProps) {
    const [sources, setSources] = useState<Source[]>([])
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handlePdfUpload = (id: string, text: string) => {
        const newSource: Source = {
            id,
            title: `Uploaded PDF ${sources.length + 1}`, // In real app, get filename
            type: 'pdf',
            content: text,
        }

        const updatedSources = [...sources, newSource]
        setSources(updatedSources)
        onSourcesChange(updatedSources)
        setIsUploadOpen(false)
    }

    const removeSource = (id: string) => {
        const updatedSources = sources.filter(s => s.id !== id)
        setSources(updatedSources)
        onSourcesChange(updatedSources)
    }

    const handleBibUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            try {
                const entries = parseBibTex(content)
                const newSources: Source[] = entries.map(entry => ({
                    id: entry.id,
                    title: entry.title || entry.id,
                    type: 'web',
                    author: entry.author,
                    year: entry.year,
                    content: `
Title: ${entry.title}
Author: ${entry.author}
Year: ${entry.year}
Journal: ${entry.journal || entry.booktitle}
Publisher: ${entry.publisher}
DOI: ${entry.doi}
URL: ${entry.url}
          `.trim()
                }))

                const updatedSources = [...sources, ...newSources]
                setSources(updatedSources)
                onSourcesChange(updatedSources)
                toast.success(`Imported ${entries.length} citations`)
            } catch (error) {
                toast.error('Failed to parse BibTeX file')
            }
        }
        reader.readAsText(file)
        e.target.value = '' // Reset input
    }

    return (
        <Card className="flex flex-col h-full border-0 shadow-none">
            <div className="p-4 border-b border-border flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg">Library</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your sources
                    </p>
                </div>

                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Source
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Source</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <PdfUpload onUploadComplete={handlePdfUpload} />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or import citations
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <input
                                    type="file"
                                    accept=".bib"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleBibUpload}
                                />
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Import .bib File
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {sources.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No sources added yet</p>
                        </div>
                    )}

                    {sources.map((source) => (
                        <Card key={source.id} className="p-3 flex items-center justify-between group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-muted rounded">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="truncate">
                                    <p className="font-medium truncate">{source.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{source.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onInsertCitation?.(`(${source.author || 'Unknown'}, ${source.year || 'n.d.'})`)}
                                    title="Insert Citation"
                                >
                                    <Quote className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeSource(source.id)}
                                    title="Remove Source"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    )
}
