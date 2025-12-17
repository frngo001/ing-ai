"use client"

import { ExternalLink, RefreshCcw, ThumbsDown, ThumbsUp, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ChatMessage } from './types'
import { getWebSources } from './message-utils'

export interface RendererDependencies {
  // State
  lastAssistantId: string | null
  feedback: Record<string, "up" | "down">
  isSending: boolean
  sourcesDialogOpen: Record<string, boolean>
  savedMessages: Set<string>
  
  // Setters
  setSourcesDialogOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  
  // Handlers
  handleFeedback: (id: string, value: "up" | "down") => void
  handleRegenerate: () => void
  handleSaveMessage: (messageId: string) => void
}

export const createRenderers = (deps: RendererDependencies) => {
  const {
    lastAssistantId,
    feedback,
    isSending,
    sourcesDialogOpen,
    setSourcesDialogOpen,
    handleFeedback,
    handleRegenerate,
    handleSaveMessage,
    savedMessages,
  } = deps

  const renderAssistantActions = (message: ChatMessage) => {
    const isLastAssistant = lastAssistantId === message.id
    const webSources = getWebSources(message)
    
    return (
      <div className="mt-2 flex flex-wrap items-center justify-between text-muted-foreground w-full">
        <div className="flex items-center -space-x-2">
          <CopyButton className="h-8 w-8" content={message.content} copyMessage="Kopiert" />
          <div className="flex items-center -space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 transition-transform duration-300 hover:scale-105 active:scale-150",
                    feedback[message.id] === "up" && "bg-muted"
                  )}
                  onClick={() => handleFeedback(message.id, "up")}
                  aria-label="Antwort hilfreich"
                >
                  <ThumbsUp
                    className={cn(
                      "size-3.5 transition-colors duration-200",
                      feedback[message.id] === "up" ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Antwort hilfreich</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 transition-transform duration-300 hover:scale-105 active:scale-150",
                    feedback[message.id] === "down" && "bg-muted"
                  )}
                  onClick={() => handleFeedback(message.id, "down")}
                  aria-label="Antwort nicht hilfreich"
                >
                  <ThumbsDown
                    className={cn(
                      "size-3.5 transition-colors duration-200",
                      feedback[message.id] === "down" ? "text-destructive" : "text-muted-foreground"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Antwort nicht hilfreich</TooltipContent>
            </Tooltip>
            {isLastAssistant && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-muted"
                    onClick={handleRegenerate}
                    aria-label="Neu generieren"
                    disabled={isSending}
                  >
                    <RefreshCcw className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Letzte Antwort neu generieren
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 transition-colors",
                    savedMessages.has(message.id) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleSaveMessage(message.id)}
                  aria-label={savedMessages.has(message.id) ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                >
                  <Bookmark className={cn(
                    "size-3.5",
                    savedMessages.has(message.id) && "fill-current"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {savedMessages.has(message.id) ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        {webSources.length > 0 && (
          <>
            <div className="flex items-center -space-x-2">
                {webSources.slice(0, 10).map((source, idx) => {
                  const hostname = (() => {
                    try {
                      return new URL(source.url).hostname.replace('www.', '')
                    } catch {
                      return source.url
                    }
                  })()
                  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
                  const initials = hostname
                    .split('.')
                    .slice(0, -1)
                    .map(part => part[0]?.toUpperCase() || '')
                    .join('')
                    .slice(0, 2) || '??'
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      title={source.title}
                      className="cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => {
                        setSourcesDialogOpen((prev) => ({ ...prev, [message.id]: true }))
                      }}
                    >
                      <Avatar className="h-5 w-5 ring-1 ring-background">
                        <AvatarImage src={faviconUrl} alt={hostname} />
                        <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                      </Avatar>
                    </button>
                  )
                })}
                {webSources.length > 10 && (
                  <button
                    type="button"
                    title="Alle Quellen anzeigen"
                    className="cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => setSourcesDialogOpen((prev) => ({ ...prev, [message.id]: true }))}
                  >
                    <Avatar className="h-5 w-5 ring-1 ring-background">
                      <AvatarFallback className="text-[9px] bg-muted text-muted dark:text-foreground font-medium">
                        +{webSources.length - 10}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                )}
              </div>
              {sourcesDialogOpen[message.id] && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                  onClick={() => setSourcesDialogOpen((prev) => ({ ...prev, [message.id]: false }))}
                >
                  <div 
                    className="bg-background border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col m-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h2 className="text-lg font-semibold">Quellen ({webSources.length})</h2>
                      <button
                        type="button"
                        onClick={() => setSourcesDialogOpen((prev) => ({ ...prev, [message.id]: false }))}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Schließen"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-2">
                        {webSources.map((source, idx) => {
                          const hostname = (() => {
                            try {
                              return new URL(source.url).hostname.replace('www.', '')
                            } catch {
                              return source.url
                            }
                          })()
                          const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
                          const initials = hostname
                            .split('.')
                            .slice(0, -1)
                            .map(part => part[0]?.toUpperCase() || '')
                            .join('')
                            .slice(0, 2) || '??'
                          
                          return (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                window.open(source.url, '_blank', 'noopener,noreferrer')
                              }}
                            >
                              <Avatar className="h-5 w-5 mt-0.5 flex-shrink-0">
                                <AvatarImage src={faviconUrl} alt={hostname} />
                                <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                  {source.title}
                                </div>
                                <div className="text-xs text-muted-foreground truncate mt-0.5">
                                  {hostname}
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    )
  }

  const renderUserActions = (message: ChatMessage) => (
    <div className="mt-2 flex w-full flex-wrap items-center justify-end gap-0.5 text-muted-foreground">
      <CopyButton className="h-8 w-8" content={message.content} copyMessage="Kopiert" />
    </div>
  )

  return {
    renderAssistantActions,
    renderUserActions,
  }
}

