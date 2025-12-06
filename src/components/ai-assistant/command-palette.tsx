'use client'

import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
    Wand2,
    RefreshCw,
    AlignLeft,
    Lightbulb,
    Maximize2,
    Gauge,
} from 'lucide-react'
import { toast } from 'sonner'

interface CommandPaletteProps {
    selectedText: string
    onCommandResult: (result: string) => void
}

type ToneType = 'academic' | 'professional' | 'persuasive' | 'friendly' | 'casual'

export function CommandPalette({ selectedText, onCommandResult }: CommandPaletteProps) {
    const [isLoading, setIsLoading] = useState(false)

    const executeCommand = async (command: string, tone?: ToneType) => {
        if (!selectedText) {
            toast.error('No text selected', {
                description: 'Please select some text to use AI commands',
            })
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/ai/commands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command,
                    text: selectedText,
                    tone,
                }),
            })

            if (!response.ok) throw new Error('Command failed')

            const { result } = await response.json()
            onCommandResult(result)

            toast.success('Command completed', {
                description: `Successfully ${command}ed your text`,
            })
        } catch (error) {
            toast.error('Error', {
                description: 'Failed to execute command',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!selectedText || isLoading}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Commands
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => executeCommand('rewrite')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rewrite
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => executeCommand('paraphrase')}>
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Paraphrase
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => executeCommand('simplify')}>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Simplify
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => executeCommand('expand')}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Expand
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Gauge className="h-4 w-4 mr-2" />
                        Change Tone
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => executeCommand('tone', 'academic')}>
                            Academic
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => executeCommand('tone', 'professional')}>
                            Professional
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => executeCommand('tone', 'persuasive')}>
                            Persuasive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => executeCommand('tone', 'friendly')}>
                            Friendly
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => executeCommand('tone', 'casual')}>
                            Casual
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
