'use client'

import { useState } from 'react'
import { FileText, Mail, BookOpen, Newspaper, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type DocumentType = 'essay' | 'blog' | 'email' | 'research' | 'article' | 'other'

interface ContentTypeSelectorProps {
    value: DocumentType
    onChange: (type: DocumentType) => void
}

const documentTypes = [
    { value: 'essay' as const, label: 'Essay', icon: FileText },
    { value: 'research' as const, label: 'Research Paper', icon: BookOpen },
    { value: 'article' as const, label: 'Article', icon: Newspaper },
    { value: 'blog' as const, label: 'Blog Post', icon: Newspaper },
    { value: 'email' as const, label: 'Email', icon: Mail },
    { value: 'other' as const, label: 'Other', icon: Code },
]

export function ContentTypeSelector({ value, onChange }: ContentTypeSelectorProps) {
    const currentType = documentTypes.find(t => t.value === value) || documentTypes[0]
    const Icon = currentType.icon

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Icon className="h-4 w-4" />
                    {currentType.label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {documentTypes.map((type) => {
                    const TypeIcon = type.icon
                    return (
                        <DropdownMenuItem
                            key={type.value}
                            onClick={() => onChange(type.value)}
                            className="gap-2"
                        >
                            <TypeIcon className="h-4 w-4" />
                            {type.label}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
