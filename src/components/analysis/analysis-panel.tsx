'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { checkGrammar, type GrammarCheckResult } from '@/lib/analysis/grammar'
import { analyzeTone, type ToneAnalysis } from '@/lib/analysis/tone-analyzer'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface AnalysisPanelProps {
    content: string
}

export function AnalysisPanel({ content }: AnalysisPanelProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [grammarResult, setGrammarResult] = useState<GrammarCheckResult | null>(null)
    const [toneResult, setToneResult] = useState<ToneAnalysis | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const runAnalysis = async () => {
        setIsAnalyzing(true)
        const [grammar, tone] = await Promise.all([
            checkGrammar(content),
            Promise.resolve(analyzeTone(content)),
        ])
        setGrammarResult(grammar)
        setToneResult(tone)
        setIsAnalyzing(false)
    }

    const getToneBadgeColor = (level: string) => {
        switch (level) {
            case 'academic': return 'bg-green-500'
            case 'formal': return 'bg-blue-500'
            case 'neutral': return 'bg-yellow-500'
            case 'casual': return 'bg-orange-500'
            default: return 'bg-gray-500'
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={runAnalysis}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Analyze Writing
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Writing Analysis</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[600px] pr-4">
                    <div className="space-y-6">
                        {/* Grammar Check */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Grammar & Spelling
                                    {grammarResult && grammarResult.errors.length === 0 && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {isAnalyzing ? 'Analyzing...' : grammarResult ? `Found ${grammarResult.errors.length} issue(s)` : 'Click "Analyze Writing" to check'}
                                </CardDescription>
                            </CardHeader>
                            {grammarResult && (
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">Score</span>
                                            <span className="text-sm font-medium">{grammarResult.score}/100</span>
                                        </div>
                                        <Progress value={grammarResult.score} />
                                    </div>
                                    {grammarResult.errors.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Issues:</p>
                                            {grammarResult.errors.map((error, idx) => (
                                                <div key={idx} className="p-3 bg-muted rounded-md">
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{error.message}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Category: {error.category}
                                                            </p>
                                                            {error.suggestions.length > 0 && (
                                                                <p className="text-xs mt-1">
                                                                    Suggestions: {error.suggestions.join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>

                        {/* Tone Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Academic Tone
                                    {toneResult && (
                                        <Badge className={getToneBadgeColor(toneResult.level)}>
                                            {toneResult.level}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {isAnalyzing ? 'Analyzing...' : 'Evaluation of formality and academic style'}
                                </CardDescription>
                            </CardHeader>
                            {toneResult && (
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">Formality Score</span>
                                            <span className="text-sm font-medium">{toneResult.score}/100</span>
                                        </div>
                                        <Progress value={toneResult.score} />
                                    </div>
                                    {toneResult.suggestions.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Suggestions:</p>
                                            {toneResult.suggestions.map((suggestion, idx) => (
                                                <div key={idx} className="p-3 bg-muted rounded-md">
                                                    <p className="text-sm">{suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
