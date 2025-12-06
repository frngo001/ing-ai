'use client'

import { useState } from 'react'
import { ShieldAlert, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { checkPlagiarism, type PlagiarismResult } from '@/lib/analysis/plagiarism'
import { toast } from 'sonner'

interface PlagiarismCheckerProps {
    content: string
}

export function PlagiarismChecker({ content }: PlagiarismCheckerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<PlagiarismResult | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    const handleCheck = async () => {
        if (!content || content.length < 50) {
            toast.error('Content too short', {
                description: 'Please write at least 50 characters to check for plagiarism.',
            })
            return
        }

        setIsLoading(true)
        try {
            const data = await checkPlagiarism(content)
            setResult(data)
        } catch (error) {
            toast.error('Check failed', {
                description: 'Could not perform plagiarism check.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Check Plagiarism
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Plagiarism Checker</DialogTitle>
                    <DialogDescription>
                        Scan your document for potential plagiarism issues.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!result && !isLoading && (
                        <div className="text-center space-y-4">
                            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                <ShieldAlert className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">Ready to scan</p>
                                <p className="text-sm text-muted-foreground">
                                    This will check your text against billions of web pages and academic papers.
                                </p>
                            </div>
                            <Button onClick={handleCheck}>Start Scan</Button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="space-y-4 text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                            <p className="text-sm text-muted-foreground">Scanning document...</p>
                        </div>
                    )}

                    {result && !isLoading && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div className="space-y-1">
                                    <p className="font-medium">Plagiarism Score</p>
                                    <p className="text-sm text-muted-foreground">
                                        Lower is better
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-bold ${result.score > 20 ? 'text-destructive' : 'text-green-600'
                                        }`}>
                                        {result.score}%
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Originality</span>
                                    <span>{100 - result.score}%</span>
                                </div>
                                <Progress value={100 - result.score} className="h-2" />
                            </div>

                            <ScrollArea className="h-[200px] rounded-md border p-4">
                                {result.matches.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                                        <ShieldCheck className="h-8 w-8 text-green-600" />
                                        <p className="font-medium">No plagiarism detected</p>
                                        <p className="text-sm text-muted-foreground">
                                            Great job! Your content appears to be original.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-destructive flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Potential matches found:
                                        </p>
                                        {result.matches.map((match, i) => (
                                            <div key={i} className="space-y-2 p-3 bg-muted/50 rounded text-sm">
                                                <p className="italic">"{match.text}"</p>
                                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                    <span>Source: {match.source}</span>
                                                    <span>{match.similarity}% match</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => setResult(null)}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
