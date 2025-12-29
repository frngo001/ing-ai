'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Trash2, Plus, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import { useLanguage } from '@/lib/i18n/use-language'

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

type Library = {
    id: string
    name: string
    sources: Source[]
}

const STORAGE_KEY = 'library-panel.libraries'

export function LibraryPanel({ onSourcesChange, onInsertCitation }: LibraryPanelProps) {
    const { t, language } = useLanguage()
    const [libraries, setLibraries] = useState<Library[]>([])
    const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isCreateLibraryOpen, setIsCreateLibraryOpen] = useState(false)
    const [newLibraryName, setNewLibraryName] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Memoized translations that update on language change
    const translations = useMemo(() => ({
        title: t('library.title'),
        manageSources: t('library.manageSources'),
        selectLibrary: t('library.selectLibrary'),
        chooseLibrary: t('library.chooseLibrary'),
        newLibrary: t('library.newLibrary'),
        addSource: t('library.addSource'),
        uploadSource: t('library.uploadSource'),
        orImportCitations: t('library.orImportCitations'),
        importBibFile: t('library.importBibFile'),
        noSourcesYet: t('library.noSourcesYet'),
        defaultLibrary: t('library.defaultLibrary'),
        enterLibraryName: t('library.enterLibraryName'),
        libraryName: t('library.libraryName'),
        createLibrary: t('library.createLibrary'),
        insertCitation: t('library.insertCitation'),
        removeSource: t('library.removeSource'),
        cancel: t('documents.cancel'),
    }), [t, language])

    const currentLibrary = useMemo(
        () => libraries.find(lib => lib.id === selectedLibraryId) ?? null,
        [libraries, selectedLibraryId]
    )

    const updateCurrentLibrarySources = (updater: (prev: Source[]) => Source[]) => {
        if (!selectedLibraryId) return
        setLibraries(prev =>
            prev.map(lib =>
                lib.id === selectedLibraryId ? { ...lib, sources: updater(lib.sources) } : lib
            )
        )
    }

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as Library[]
                if (Array.isArray(parsed) && parsed.length) {
                    setLibraries(parsed)
                    setSelectedLibraryId(parsed[0]?.id ?? null)
                    return
                }
            } catch {
                // ignore invalid storage
            }
        }

        const initial: Library = { id: 'default-library', name: t('library.defaultLibrary'), sources: [] }
        setLibraries([initial])
        setSelectedLibraryId(initial.id)
    }, [t])

    useEffect(() => {
        if (!libraries.length) return
        localStorage.setItem(STORAGE_KEY, JSON.stringify(libraries))
    }, [libraries])

    useEffect(() => {
        if (!libraries.length) return
        if (!selectedLibraryId || !libraries.some(l => l.id === selectedLibraryId)) {
            setSelectedLibraryId(libraries[0].id)
        }
    }, [libraries, selectedLibraryId])

    useEffect(() => {
        onSourcesChange(currentLibrary?.sources ?? [])
    }, [currentLibrary, onSourcesChange])

    const handlePdfUpload = (id: string, text: string) => {
        updateCurrentLibrarySources(prev => {
            const nextIndex = prev.length + 1
        const newSource: Source = {
            id,
                title: `Uploaded PDF ${nextIndex}`,
            type: 'pdf',
            content: text,
        }
            return [...prev, newSource]
        })
        setIsUploadOpen(false)
    }

    const removeSource = (id: string) => {
        updateCurrentLibrarySources(prev => prev.filter(s => s.id !== id))
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

                updateCurrentLibrarySources(prev => [...prev, ...newSources])
                toast.success(t('library.importedCitations').replace('{count}', String(entries.length)))
            } catch (error) {
                toast.error(t('library.failedToParseBib'))
            }
        }
        reader.readAsText(file)
        e.target.value = '' // Reset input
    }

    const handleCreateLibrary = () => {
        const name = newLibraryName.trim()
        if (!name) {
            toast.error(t('library.enterLibraryName'))
            return
        }

        const newLib: Library = {
            id: `lib_${Date.now()}`,
            name,
            sources: [],
        }

        setLibraries(prev => [...prev, newLib])
        setSelectedLibraryId(newLib.id)
        setNewLibraryName('')
        setIsCreateLibraryOpen(false)
    }

    const displayedSources = currentLibrary?.sources ?? []

    return (
        <Card className="flex flex-col h-full border-0 shadow-none">
            <div className="p-4 border-b border-border flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg">{translations.title}</h3>
                    <p className="text-sm text-muted-foreground">
                        {translations.manageSources}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Select
                        value={selectedLibraryId ?? undefined}
                        onValueChange={(value) => {
                            if (value === '__new__') {
                                setIsCreateLibraryOpen(true)
                                return
                            }
                            setSelectedLibraryId(value)
                        }}
                    >
                        <SelectTrigger className="w-[190px]" aria-label={translations.selectLibrary}>
                            <SelectValue placeholder={translations.chooseLibrary} />
                        </SelectTrigger>
                        <SelectContent>
                            {libraries.map(lib => (
                                <SelectItem key={lib.id} value={lib.id}>
                                    {lib.name}
                                </SelectItem>
                            ))}
                            <SelectItem value="__new__">+ {translations.newLibrary}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateLibraryOpen(true)}
                        aria-label={translations.newLibrary}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {translations.newLibrary}
                    </Button>

                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            {translations.addSource}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{translations.uploadSource}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <PdfUpload onUploadComplete={handlePdfUpload} />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        {translations.orImportCitations}
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
                                    {translations.importBibFile}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {displayedSources.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>{translations.noSourcesYet}</p>
                        </div>
                    )}

                    {displayedSources.map((source) => (
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
                                                    title={translations.insertCitation}
                                                >
                                                    <Quote className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeSource(source.id)}
                                                    title={translations.removeSource}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>

            <Dialog open={isCreateLibraryOpen} onOpenChange={setIsCreateLibraryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translations.newLibrary}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            value={newLibraryName}
                            onChange={(e) => setNewLibraryName(e.target.value)}
                            placeholder={translations.libraryName}
                            aria-label={translations.libraryName}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCreateLibraryOpen(false)}>
                                {translations.cancel}
                            </Button>
                            <Button onClick={handleCreateLibrary}>{translations.createLibrary}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
