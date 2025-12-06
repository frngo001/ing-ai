'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface AskJenniProps {
    documentContent?: string
}

export function AskJenni({ documentContent }: AskJenniProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: 'user', content: input }
        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: input,
                    documentContent,
                }),
            })

            if (!response.ok) throw new Error('Failed to get response')

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ''

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value)
                    const lines = chunk.split('\n')

                    for (const line of lines) {
                        if (line.startsWith('0:')) {
                            const content = line.slice(2).replace(/^"(.*)"$/, '$1')
                            assistantMessage += content

                            setMessages((prev) => {
                                const newMessages = [...prev]
                                const lastMessage = newMessages[newMessages.length - 1]
                                if (lastMessage?.role === 'assistant') {
                                    lastMessage.content = assistantMessage
                                } else {
                                    newMessages.push({ role: 'assistant', content: assistantMessage })
                                }
                                return newMessages
                            })
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error)
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-lg">AskJenni AI Assistant</h3>
                <p className="text-sm text-muted-foreground">
                    Ask questions about your research and writing
                </p>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <p>Ask me anything about your research or document!</p>
                            <div className="mt-4 space-y-2 text-sm">
                                <p className="text-left">Try asking:</p>
                                <ul className="text-left list-disc list-inside space-y-1">
                                    <li>How can I improve this paragraph?</li>
                                    <li>What are related research topics?</li>
                                    <li>Help me structure my argument</li>
                                    <li>Explain this concept</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`rounded-lg px-4 py-2 max-w-[85%] ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-4 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-4 border-t border-border">
                <div className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e)
                            }
                        }}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Card>
    )
}
