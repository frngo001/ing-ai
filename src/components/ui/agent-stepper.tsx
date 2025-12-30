'use client'

import * as React from 'react'
import { 
  Check, 
  Loader2, 
  X, 
  ChevronRight,
  Search,
  BookOpen,
  FileText,
  Library,
  Plus,
  Quote,
  Settings,
  Sparkles,
  Clock,
  AlertCircle,
  Terminal,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { ToolStep } from '@/lib/ask-ai-pane/types'
import { useLanguage } from '@/lib/i18n/use-language'
import { motion, AnimatePresence } from 'motion/react'

interface AgentStepperViewProps {
  steps: ToolStep[]
  className?: string
  minimal?: boolean
}

function getToolConfig(toolName: string, t: (key: string) => string) {
  const configs: Record<string, { label: string; icon: React.ElementType }> = {
    searchSources: { label: t('askAi.toolSearchSources'), icon: Search },
    analyzeSources: { label: t('askAi.toolAnalyzeSources'), icon: Sparkles },
    evaluateSources: { label: t('askAi.toolEvaluateSources'), icon: BookOpen },
    createLibrary: { label: t('askAi.toolCreateLibrary'), icon: Library },
    addSourcesToLibrary: { label: t('askAi.toolAddSourcesToLibrary'), icon: Plus },
    getLibrarySources: { label: t('askAi.toolGetLibrarySources'), icon: Library },
    getEditorContent: { label: t('askAi.toolGetEditorContent'), icon: FileText },
    insertTextInEditor: { label: t('askAi.toolInsertTextInEditor'), icon: FileText },
    addCitation: { label: t('askAi.toolAddCitation'), icon: Quote },
    addThema: { label: t('askAi.toolAddThema'), icon: Settings },
    saveStepData: { label: t('askAi.toolSaveStepData'), icon: Check },
    getCurrentStep: { label: t('askAi.toolGetCurrentStep'), icon: Clock },
  }

  return configs[toolName] || { label: toolName, icon: Terminal }
}

function formatDuration(startedAt: number, completedAt?: number): string {
  if (!completedAt) return ''
  const durationMs = completedAt - startedAt
  return durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`
}

export function AgentStepperView({ steps, className, minimal = false }: AgentStepperViewProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = React.useState(true)
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null)

  if (!steps || steps.length === 0) return null

  // Wenn minimaler Modus (für Inline-Darstellung einzelner Schritte)
  if (minimal && steps.length === 1) {
    const step = steps[0]
    const config = getToolConfig(step.toolName, t)
    const isExpanded = expandedStep === step.id
    const Icon = config.icon

    return (
      <div className={cn("my-2 w-full", className)}>
        <div 
          className={cn(
            "flex flex-col rounded-lg border border-border/50 dark:border-border/30 bg-muted/20 dark:bg-muted/10 transition-all duration-200",
            step.status === 'running' && "border-blue-500/40 dark:border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.05)]",
            (step.output || step.error) && "cursor-pointer hover:bg-muted/30 dark:hover:bg-muted/20"
          )}
          onClick={() => (step.output || step.error) && setExpandedStep(isExpanded ? null : step.id)}
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 truncate">
                <div className="relative flex items-center justify-center shrink-0">
                  <Icon className={cn("h-3 w-3", step.status === 'completed' ? "text-emerald-600 dark:text-emerald-500/70" : "text-muted-foreground/40")} />
                  {step.status === 'running' && (
                    <motion.div 
                      className="absolute -inset-1 rounded-full border border-blue-500/40 dark:border-blue-500/30"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-semibold tracking-tight",
                  step.status === 'completed' && "text-foreground/90 dark:text-foreground/80",
                  step.status === 'running' && "text-blue-600 dark:text-blue-500"
                )}>
                  {config.label}
                </span>
                
                {step.status === 'completed' && step.output?.message && !isExpanded && (
                  <span className="text-[10px] text-muted-foreground/60 truncate font-normal border-l border-border/40 pl-2">
                    {step.output.message}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {step.completedAt && (
                  <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">
                    {formatDuration(step.startedAt, step.completedAt)}
                  </span>
                )}
                {(step.output || step.error) && (
                  <ChevronRight className={cn("h-3 w-3 text-muted-foreground/30 transition-transform", isExpanded && "rotate-90")} />
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-0">
                  <div className="rounded-md bg-zinc-100/80 dark:bg-zinc-800/40 p-2.5 font-sans text-[11px] leading-relaxed border border-zinc-200 dark:border-zinc-700/40 shadow-sm">
                    {step.error ? (
                      <div className="text-red-500 dark:text-red-400 flex items-start gap-1.5 font-medium">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{step.error}</span>
                      </div>
                    ) : step.output && (
                      <div className="grid gap-1.5">
                        {/* Input Data Section */}
                        {step.input && Object.keys(step.input).length > 0 && (
                          <div className="space-y-1 mb-2">
                            {Object.entries(step.input)
                              .filter(([key]) => !key.startsWith('_'))
                              .map(([key, value]) => (
                                <div key={`in-${key}`} className="flex justify-between gap-4">
                                  <span className="text-zinc-500 dark:text-zinc-500 uppercase text-[9px] font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate text-right">
                                    {typeof value === 'object' ? 'JSON' : String(value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Output Data Section */}
                        <div className="space-y-1">
                          {Object.entries(step.output)
                            .filter(([key]) => !key.startsWith('_') && key !== 'success' && key !== 'message')
                            .map(([key, value]) => (
                              <div key={`out-${key}`} className="flex justify-between gap-4 pb-0.5">
                                <span className="text-zinc-500 dark:text-zinc-500 uppercase text-[9px] font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate text-right">
                                  {Array.isArray(value) ? `${value.length} items` : typeof value === 'object' ? 'JSON' : String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  const hasRunning = steps.some(s => s.status === 'running')
  const hasError = steps.some(s => s.status === 'error')
  const currentStep = steps.find(s => s.status === 'running') || steps[steps.length - 1]

  return (
    <div className={cn('mb-4 w-full select-none', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="overflow-hidden rounded-xl border border-border/50 bg-background/60 backdrop-blur-md shadow-sm">
        {/* Minimalist Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="relative flex h-6 w-6 items-center justify-center">
                {hasRunning ? (
                  <>
                    <Activity className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-primary/20" 
                      style={{ borderTopColor: 'currentColor', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                  </>
                ) : hasError ? (
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  {t('askAi.agentActivity')}
                </span>
                <span className="text-xs font-semibold text-foreground/90">
                  {currentStep ? getToolConfig(currentStep.toolName, t).label : '...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                {steps.slice(-3).map((s, i) => (
                  <div key={s.id} className={cn(
                    "h-1.5 w-1.5 rounded-full border border-background",
                    s.status === 'completed' ? "bg-emerald-500" : s.status === 'running' ? "bg-blue-500" : "bg-muted"
                  )} />
                ))}
              </div>
              <ChevronRight className={cn("h-3 w-3 text-muted-foreground/60 transition-transform duration-300", isOpen && "rotate-90")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar bg-muted/10">
            {steps.map((step, index) => {
              const config = getToolConfig(step.toolName, t)
              const isExpanded = expandedStep === step.id
              const Icon = config.icon

              return (
                <div key={step.id} className="relative group">
                  <div 
                    className={cn(
                      "flex items-start gap-3 px-3 py-1.5 rounded-lg transition-all duration-200",
                      step.status === 'running' ? "bg-blue-500/10 dark:bg-blue-500/5 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]" : "hover:bg-muted/40",
                      (step.output || step.error) && "cursor-pointer"
                    )}
                    onClick={() => (step.output || step.error) && setExpandedStep(isExpanded ? null : step.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-3 w-3", step.status === 'completed' ? "text-emerald-500/60 dark:text-muted-foreground/80" : "text-muted-foreground/40")} />
                          <span className={cn(
                            "text-xs font-medium tracking-tight",
                            step.status === 'completed' ? "text-foreground/90 dark:text-foreground/80" : "text-muted-foreground/60",
                            step.status === 'running' && "text-blue-600 dark:text-blue-500 font-bold"
                          )}>
                            {config.label}
                          </span>
                        </div>
                        
                        {step.completedAt && (
                          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                            {formatDuration(step.startedAt, step.completedAt)}
                          </span>
                        )}
                      </div>

                      {/* Brief Summary / Message */}
                      <AnimatePresence mode="wait">
                        {step.status === 'completed' && step.output?.message && !isExpanded && (
                          <motion.p 
                            initial={{ opacity: 0, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] text-muted-foreground/60 mt-0.5 truncate leading-tight"
                          >
                            {step.output.message}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 rounded-md bg-zinc-100/80 dark:bg-zinc-800/40 p-2.5 font-sans text-[11px] leading-relaxed border border-zinc-200 dark:border-zinc-700/40 shadow-sm">
                              {step.error ? (
                                <div className="text-red-500 dark:text-red-400 flex items-start gap-1.5 font-medium">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span>{step.error}</span>
                                </div>
                              ) : step.output && (
                                <div className="grid gap-1.5">
                                  {/* Input Data Section */}
                                  {step.input && Object.keys(step.input).length > 0 && (
                                    <div className="space-y-1 mb-2">
                                      {Object.entries(step.input)
                                        .filter(([key]) => !key.startsWith('_'))
                                        .map(([key, value]) => (
                                          <div key={`in-${key}`} className="flex justify-between gap-4">
                                            <span className="text-zinc-500 dark:text-zinc-500 uppercase text-[9px] font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate text-right">
                                              {typeof value === 'object' ? 'JSON' : String(value)}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  )}

                                  {/* Output Data Section */}
                                  <div className="space-y-1">
                                    {Object.entries(step.output)
                                      .filter(([key]) => !key.startsWith('_') && key !== 'success' && key !== 'message')
                                      .map(([key, value]) => (
                                        <div key={`out-${key}`} className="flex justify-between gap-4 pb-0.5">
                                          <span className="text-zinc-500 dark:text-zinc-500 uppercase text-[9px] font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                          <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate text-right">
                                            {Array.isArray(value) ? `${value.length} items` : typeof value === 'object' ? 'JSON' : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
