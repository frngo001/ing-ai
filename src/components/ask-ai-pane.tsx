"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ChevronDown,
  FileText,
  History,
  MessageSquareQuote,
  PanelLeftClose,
  Plus,
  Globe,
  Search,
  Brain,
  X,
  Bookmark,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ui/conversation"
import { Message, MessageContent } from "@/components/ui/message"
import { Response } from "@/components/ui/response"
import { useToast } from "@/hooks/use-toast"
import { MessageInput } from "@/components/ui/message-input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCitationStore } from "@/lib/stores/citation-store"
import { useBachelorarbeitAgentStore, type SelectedSource } from "@/lib/stores/bachelorarbeit-agent-store"
import { cn } from "@/lib/utils"
import {
  type MessagePart,
  type ChatMessage,
  type StoredConversation,
  type AgentMode,
  type ContextSelection,
  type Mentionable,
  type SlashCommand,
  type SavedMessage,
  defaultContext,
  addSourcesToLibrary,
  saveSlashCommands,
  loadSlashCommands,
  persistConversation,
  loadChatHistory,
  saveMessage,
  removeSavedMessage,
  loadSavedMessages,
  filterMentionables,
  markdownComponents,
  markdownSanitizeSchema,
  StreamingShimmer,
  useMentionables,
  useMentionQuery,
  useSlashQuery,
  useFilteredHistory,
  createHandlers,
  createRenderers,
} from "@/lib/ask-ai-pane"

// Re-export MessagePart for external use
export type { MessagePart }

// All markdown utilities, components, and streaming shimmer are now imported from @/lib/ask-ai-pane

export function AskAiPane({
  className,
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID())
  const [history, setHistory] = useState<StoredConversation[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [context, setContext] = useState<ContextSelection>(defaultContext)
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({})
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [selectedMentions, setSelectedMentions] = useState<Mentionable[]>([])
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [files, setFiles] = useState<File[] | null>(null)
  const { toast } = useToast()
  const citations = useCitationStore((state) => state.savedCitations)
  const addCitation = useCitationStore((state) => state.addCitation)
  const agentStore = useBachelorarbeitAgentStore()
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([])
  const [slashDialogOpen, setSlashDialogOpen] = useState(false)
  const [newSlashLabel, setNewSlashLabel] = useState("")
  const [newSlashContent, setNewSlashContent] = useState("")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState("")
  const [sourcesDialogOpen, setSourcesDialogOpen] = useState<Record<string, boolean>>({})
  const [reasoningOpen, setReasoningOpen] = useState<Record<string, boolean>>({})
  const [savedMessages, setSavedMessages] = useState<Set<string>>(new Set())
  const [savedMessagesList, setSavedMessagesList] = useState<SavedMessage[]>([])
  const [favoritesDialogOpen, setFavoritesDialogOpen] = useState(false)
  const autoClosedReasoning = useRef<Set<string>>(new Set())
  const lastAssistantId = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.id ?? null,
    [messages]
  )

  const mentionables = useMentionables(citations || [])
  const mentionQuery = useMentionQuery(input)
  const slashQuery = useSlashQuery(input)
  const filteredHistory = useFilteredHistory(history, historyQuery)

  useEffect(() => {
    const commands = loadSlashCommands()
    setSlashCommands(commands)
  }, [])

  useEffect(() => {
    const loadedHistory = loadChatHistory()
    setHistory(loadedHistory)
    if (loadedHistory[0]) {
      setConversationId(loadedHistory[0].id)
      setMessages(loadedHistory[0].messages)
    }
    
    // Lade gespeicherte Nachrichten
    const saved = loadSavedMessages()
    setSavedMessages(new Set(saved.map((m: { messageId: string }) => m.messageId)))
    setSavedMessagesList(saved)
    
    setIsHydrated(true)
  }, [])

  const filteredMentionables = useMemo(() => {
    return filterMentionables(mentionables, mentionQuery)
  }, [mentionQuery, mentionables])

  // Schließe Reasoning automatisch, sobald finale Antwort beginnt (nur einmal pro Nachricht)
  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        const reasoningPart = message.parts.find((p) => p.type === 'reasoning')
        const textPart = message.parts.find((p) => p.type === 'text')
        
        // Wenn finale Antwort vorhanden ist und Reasoning noch nicht automatisch geschlossen wurde
        if (reasoningPart && textPart && textPart.text && textPart.text.length > 0) {
          if (!autoClosedReasoning.current.has(message.id)) {
            const isCurrentlyOpen = reasoningOpen[message.id] ?? true
            if (isCurrentlyOpen) {
              setReasoningOpen((prev) => ({ ...prev, [message.id]: false }))
              autoClosedReasoning.current.add(message.id)
            }
          }
        }
      }
    })
  }, [messages, reasoningOpen])

  useEffect(() => {
    if (!isHydrated) return
    if (!messages.length) return
    persistConversation(messages, conversationId, setHistory)
  }, [conversationId, isHydrated, messages, persistConversation])

  // Stoppe Agent wenn Modus auf 'standard' geändert wird
  useEffect(() => {
    if (context.agentMode === 'standard' && agentStore.isActive) {
      agentStore.stopAgent()
    }
  }, [context.agentMode, agentStore])

  // Event-Listener für set-agent-thema
  useEffect(() => {
    const handleSetThema = (event: CustomEvent<{ thema: string }>) => {
      const { thema } = event.detail
      if (thema && agentStore.setThema) {
        agentStore.setThema(thema)
        console.log('📝 [ASK-AI-PANE] Thema gesetzt:', thema)
      }
    }

    window.addEventListener('set-agent-thema', handleSetThema as EventListener)
    return () => {
      window.removeEventListener('set-agent-thema', handleSetThema as EventListener)
    }
  }, [agentStore])

  // Create handlers
  const handlers = createHandlers({
    input,
    messages,
    context,
    files,
    selectedMentions,
    isSending,
    abortController,
    history,
    conversationId,
    slashQuery,
    agentStore,
    setInput,
    setMessages,
    setSending: setIsSending,
    setStreamingId,
    setAbortController,
    setConversationId,
    setFeedback,
    setSelectedMentions,
    setFiles,
    setHistoryOpen,
    setNewSlashLabel,
    setNewSlashContent,
    setSlashDialogOpen,
    messageInputRef,
    toast,
    onClose,
    setContext,
  })

  const {
    resetChat,
    handleSend,
    handleRegenerate,
    handleStop,
    handleMentionSelect,
    handleSlashInsert,
    focusMessageInput,
    handleLoadConversation,
    handleStartNewChatFromHistory,
    handleSlashCreate,
    handleRemoveMention,
    handleClose,
    handleFeedback,
    toggleContext,
  } = handlers

  // Handler für gespeicherte Nachrichten
  const handleSaveMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return
    
    if (savedMessages.has(messageId)) {
      // Entferne aus Favoriten
      removeSavedMessage(messageId)
      setSavedMessages(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
      setSavedMessagesList(prev => prev.filter(m => m.messageId !== messageId))
    } else {
      // Füge zu Favoriten hinzu
      const saved = saveMessage(message, conversationId)
      setSavedMessages(prev => new Set(prev).add(messageId))
      setSavedMessagesList(prev => [saved, ...prev.filter(m => m.messageId !== message.id)])
    }
  }

  // Handler für Navigation zu einer Nachricht
  const handleNavigateToMessage = (savedMessage: { messageId: string; conversationId: string }) => {
    // Lade die Konversation
    const conversation = history.find(c => c.id === savedMessage.conversationId)
    if (conversation) {
      setConversationId(savedMessage.conversationId)
      setMessages(conversation.messages)
      setFavoritesDialogOpen(false)
      
      // Scroll zur Nachricht nach kurzer Verzögerung
      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${savedMessage.messageId}"]`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Highlight kurz
          messageElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
          setTimeout(() => {
            messageElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
          }, 2000)
        }
      }, 100)
    }
  }

  // Create renderers
  const renderers = createRenderers({
    lastAssistantId,
    feedback,
    isSending,
    sourcesDialogOpen,
    setSourcesDialogOpen,
    handleFeedback,
    handleRegenerate,
    handleSaveMessage,
    savedMessages,
  })

  const { renderAssistantActions, renderUserActions } = renderers

  // Fokussiere Input-Feld nach dem Mount, wenn keine Nachrichten vorhanden sind
  useEffect(() => {
    if (isHydrated && messages.length === 0) {
    focusMessageInput()
  }
  }, [isHydrated, messages.length, focusMessageInput])

  const hasMessages = messages.some((m) => m.role === "assistant" || m.role === "user")

  return (
    <div className={cn(
      "bg-background text-foreground flex h-full min-h-0 w-full flex-col px-3 pb-3 pt-0 border-r border-border/70",
      className
    )}>
      <div className="mt-1.5 flex items-center justify-between gap-1.5 sm:gap-2 pb-2 sm:pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold">
            <span>AI chat</span>
            <MessageSquareQuote className="size-4" />
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 h-5 px-1.5 text-[10px] font-medium border-transparent",
                  context.agentMode === 'bachelor'
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : context.agentMode === 'general'
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              )}
            >
              {context.agentMode === 'bachelor' 
                ? "Bachelor/Master Agent" 
                : context.agentMode === 'general'
                ? "Hausarbeit / Essay Agent"
                : "Standard Chat"}
              </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-md border border-border/60 bg-background hover:bg-muted transition-colors"
                aria-label="Favoriten"
                onClick={() => setFavoritesDialogOpen(true)}
              >
                <Bookmark className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Favoriten</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-md border border-border/60 bg-background hover:bg-muted transition-colors"
                aria-label="Chatverlauf"
                onClick={() => setHistoryOpen((v) => !v)}
              >
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Chatverlauf</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs text-foreground hover:text-foreground/80"
                onClick={resetChat}
                aria-label="New chat"
              >
                <Plus className="size-3.5 sm:size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Neuer Chat</TooltipContent>
          </Tooltip>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 sm:h-7 sm:w-7 bg-transparent"
            onClick={handleClose}
            aria-label="Panel schließen"
          >
            <PanelLeftClose className="size-3.5 sm:size-4" />
          </Button>
        </div>
      </div>

      <Card className="relative flex h-full min-h-0 flex-1 flex-col overflow-visible py-0 border-0 shadow-none bg-transparent">
        <div className="flex-1 min-h-0 overflow-hidden pb-2 sm:pb-0">
          <Conversation className="h-full">
            <ConversationContent className="pb-4">
              {hasMessages &&
                messages.map((message) => (
                   <Message from={message.role} key={message.id} data-message-id={message.id}>
                    <MessageContent className={message.role === "assistant" ? "w-full" : undefined}>
                      <Response
                        className={
                          message.role === "assistant"
                            ? "w-full border-0 bg-transparent shadow-none px-0 py-0"
                            : "max-h-[15vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        }
                      >
                        {message.role === "assistant" ? (
                          <>
                            {/* Render Parts nach Typ (wie im Beispiel) */}
                            {message.parts && message.parts.length > 0 ? (
                              (() => {
                                const reasoningPart = message.parts.find((p) => p.type === 'reasoning')
                                const textPart = message.parts.find((p) => p.type === 'text')
                                const sourceParts = message.parts.filter((p) => p.type === 'source')

                                      return (
                                  <div className="space-y-4">
                                    {reasoningPart && (
                                      <Collapsible 
                                        open={reasoningOpen[message.id] ?? true}
                                        onOpenChange={(open) => setReasoningOpen((prev) => ({ ...prev, [message.id]: open }))}
                                      >
                                          <CollapsibleTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-auto py-2 text-xs text-muted-foreground hover:text-foreground w-full justify-start -ml-3 pl-3 [&[data-state=open]>svg]:rotate-180">
                                              Reasoning anzeigen
                                              <ChevronDown className="h-3 w-3 ml-1.5 transition-transform duration-200" />
                                            </Button>
                                          </CollapsibleTrigger>
                                          <CollapsibleContent className="max-h-[50vh] overflow-y-auto transition-all duration-200 ease-in-out [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                          <div className="text-xs mt-2 p-3 bg-none border-none max-w-none text-muted-foreground prose-pre:bg-muted/70 prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
                                              <ReactMarkdown
                                                remarkPlugins={[remarkMath, remarkGfm]}
                                                rehypePlugins={[rehypeHighlight, rehypeKatex, [rehypeSanitize, markdownSanitizeSchema]]}
                                                components={markdownComponents}
                                              >
                                              {reasoningPart.reasoning}
                                              </ReactMarkdown>
                                            </div>
                                          </CollapsibleContent>
                                        </Collapsible>
                                    )}

                                    {textPart && (
                                      <div className="space-y-1">
                                        <div className="text-[11px] font-semibold uppercase text-muted-foreground">Antwort</div>
                                        <div className="prose prose-sm max-w-none prose-pre:bg-muted/70 prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
                                          <ReactMarkdown
                                            remarkPlugins={[remarkMath, remarkGfm]}
                                            rehypePlugins={[rehypeHighlight, rehypeKatex, [rehypeSanitize, markdownSanitizeSchema]]}
                                            components={markdownComponents}
                                          >
                                            {textPart.text}
                                          </ReactMarkdown>
                                        </div>
                              </div>
                                    )}
                                  </div>
                                )
                              })()
                            ) : (
                              <>
                                {/* Fallback: Alte Logik wenn keine Parts vorhanden */}
                                {message.reasoning && (
                                  <Collapsible defaultOpen={false}>
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-auto py-2 text-xs text-muted-foreground hover:text-foreground w-full justify-start -ml-3 pl-3">
                                        <Brain className="h-3 w-3 mr-1.5" />
                                        Reasoning anzeigen
                                        <ChevronDown className="h-3 w-3 ml-1.5" />
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="px-3 bg-none border-none max-w-none text-muted-foreground prose-pre:bg-muted/70 prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkMath, remarkGfm]}
                                          rehypePlugins={[rehypeHighlight, rehypeKatex, [rehypeSanitize, markdownSanitizeSchema]]}
                                          components={markdownComponents}
                                        >
                                          {message.reasoning}
                                        </ReactMarkdown>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                                {message.content ? (
                                  <div className="prose prose-sm max-w-none prose-pre:bg-muted/70 prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkMath, remarkGfm]}
                                      rehypePlugins={[rehypeHighlight, rehypeKatex, [rehypeSanitize, markdownSanitizeSchema]]}
                                      components={markdownComponents}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  </div>
                                ) : streamingId === message.id ? (
                                  <StreamingShimmer />
                                ) : (
                                  "Keine Antwort vorhanden."
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          message.content ||
                          (streamingId === message.id ? <StreamingShimmer /> : "Keine Antwort vorhanden.")
                        )}
                      </Response>
                      {message.role === "assistant"
                        ? renderAssistantActions(message)
                        : renderUserActions(message)}
                    </MessageContent>
                  </Message>
                ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        <div className="bg-background px-2.5 sm:px-3 py-2 sm:py-2.5 sticky bottom-0 z-10 border border-r border-primary/60 rounded-md">
          <form onSubmit={handleSend} className="relative space-y-2 w-full max-w-full">
            <div className="relative w-full flex flex-col items-center">
              {selectedMentions.length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5 w-full">
                  {selectedMentions.map((mention) => (
                    <Badge
                      key={mention.id}
                      variant="secondary"
                      className="flex items-center gap-1.5 px-2 py-1 text-xs"
                    >
                      <span className="truncate max-w-[150px]">{mention.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMention(mention.id)}
                        className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                        aria-label={`${mention.label} entfernen`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mb-2 flex items-center gap-1 w-full">
              </div>
              {mentionQuery !== null && filteredMentionables.length > 0 && (
                <div className="absolute bottom-[100%] left-0 z-20 mb-1.5 sm:mb-2 w-full rounded-md border border-border/60 bg-popover shadow-lg">
                  <div className="max-h-40 sm:max-h-48 overflow-auto py-1.5 sm:py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredMentionables.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm hover:bg-muted"
                        onClick={() => handleMentionSelect(item)}
                      >
                        <div className="font-medium truncate">{item.label}</div>
                        {item.hint && (
                          <div className="text-muted-foreground text-[10px] sm:text-xs truncate">{item.hint}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mentionQuery === null && slashQuery !== null && (
                <div className="absolute bottom-[100%] left-0 z-20 mb-1.5 sm:mb-2 w-full rounded-md border border-border/60 bg-popover shadow-lg">
                  <div className="max-h-64 overflow-auto py-2 sm:py-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {slashCommands
                      .filter((cmd) =>
                        slashQuery
                          ? cmd.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
                          cmd.content.toLowerCase().includes(slashQuery.toLowerCase())
                          : true
                      )
                      .map((cmd) => (
                        <button
                          type="button"
                          key={cmd.id}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm sm:text-sm hover:bg-muted rounded-md"
                          onClick={() => handleSlashInsert(cmd)}
                        >
                          <div className="font-medium truncate">{cmd.label}</div>
                          <div className="text-muted-foreground text-[12px] sm:text-xs truncate">
                            {cmd.content}
                          </div>
                        </button>
                      ))}
                    <div className="border-t border-border/60 pt-2 px-3 sm:px-4 pb-1 sticky bottom-0 bg-popover">
                      <button
                        type="button"
                        className="w-full rounded-md border border-primary/50 bg-primary text-primary-foreground px-3 py-2 text-sm sm:text-sm font-medium hover:bg-primary/90 transition-colors"
                        onClick={handleSlashCreate}
                      >
                        Neuen Command speichern
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="w-full">
                <MessageInput
                  textAreaRef={messageInputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Wie kann ich dir helfen? Nutze @ für Mentions oder / für gespeicherte Prompts"
                  isGenerating={isSending}
                  allowAttachments
                  files={files}
                  setFiles={setFiles}
                  onAudioError={(err) => {
                    toast.error(
                      "Bitte Mikrofon-Zugriff erlauben oder prüfe die Browser-Einstellungen.",)
                  }}
                  stop={handleStop}
                  contextActions={
                    <>
                      <Select
                        value={context.agentMode}
                        onValueChange={(value: AgentMode) => {
                          setContext((prev) => ({ ...prev, agentMode: value }))
                        }}
                      >
                        <SelectTrigger className="h-8 max-w-32 text-xs border-0 bg-transparent shadow-none focus:ring-0 focus:outline-none [&>span]:pr-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="bachelor">Bachelor/Master Agent</SelectItem>
                          <SelectItem value="general" className="text-xs">
                            Hausarbeit / Essay Agent
                          </SelectItem>
                          <SelectItem value="standard">Standard Chat</SelectItem>
                        </SelectContent>
                      </Select>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant={context.document ? "secondary" : "ghost"}
                            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 flex items-center justify-center"
                            onClick={() => toggleContext("document")}
                            aria-label="Kontext aktivieren"
                          >
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 m-auto" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Kontext aktivieren</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant={context.web ? "secondary" : "ghost"}
                            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 flex items-center justify-center"
                            onClick={() => toggleContext("web")}
                            aria-label="Websuche aktivieren"
                          >
                            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 m-auto" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Websuche aktivieren</TooltipContent>
                      </Tooltip>
                    </>
                  }
                />
              </div>
            </div>
          </form>
        </div>

        <Dialog 
          open={historyOpen} 
          onOpenChange={(open) => {
            setHistoryOpen(open)
            if (!open) {
              focusMessageInput()
            }
          }}
        >
          <DialogContent className="max-w-sm sm:max-w-sm md:max-w-sm overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>Chatverlauf</DialogTitle>
            </DialogHeader>
            <div className="mb-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-2 flex items-center text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <input
                  className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm focus-visible:outline-none"
                  placeholder="Chats durchsuchen..."
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground max-h-64 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {filteredHistory.length ? (
                filteredHistory.map((item) => {
                  const lastRelevantMessage =
                    [...item.messages]
                      .reverse()
                      .find((m) => m.role === "assistant" || m.role === "user")
                      ?.content ?? "Keine Nachrichten vorhanden"

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full rounded-md border border-border/70 bg-muted/40 px-3 py-3 text-left text-foreground hover:bg-muted/70 transition-colors"
                      onClick={() => handleLoadConversation(item.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-medium truncate">
                            {item.title || "Neuer Chat"}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {lastRelevantMessage}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(item.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-md border border-dashed border-border/70 bg-muted/50 px-3 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Search className="size-4 text-muted-foreground" />
                    {historyQuery.trim()
                      ? `Keine Treffer für „${historyQuery.trim()}“`
                      : "Kein Chatverlauf verfügbar"}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {historyQuery.trim()
                      ? "Passe deine Suche an oder setze sie zurück."
                      : "Starte einen neuen Chat, um den Verlauf aufzubauen."}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {historyQuery.trim() && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  onClick={() => setHistoryQuery("")}
                >
                  Suche zurücksetzen
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs bg-muted-foreground/10 dark:bg-muted-foreground/10 text-foreground border-border hover:bg-muted-foreground/30 dark:hover:bg-muted-foreground/20"
                onClick={handleStartNewChatFromHistory}
              >
                Neuen Chat starten
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Favoriten Dialog */}
        <Dialog 
          open={favoritesDialogOpen} 
          onOpenChange={(open) => {
            setFavoritesDialogOpen(open)
            if (!open) {
              focusMessageInput()
            }
          }}
        >
          <DialogContent className="max-w-sm sm:max-w-sm md:max-w-sm overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>Favoriten</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm text-muted-foreground max-h-64 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {savedMessagesList.length > 0 ? (
                savedMessagesList.map((saved) => {
                  const conversation = history.find(c => c.id === saved.conversationId)
                  const conversationTitle = conversation?.title || "Unbekannter Chat"
                  
                  return (
                    <button
                      key={saved.id}
                      type="button"
                      className="w-full rounded-md border border-border/70 bg-muted/40 px-3 py-3 text-left text-foreground hover:bg-muted/70 transition-colors"
                      onClick={() => handleNavigateToMessage(saved)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-medium text-xs text-muted-foreground truncate">
                            {conversationTitle}
                          </div>
                          <div className="text-xs text-foreground line-clamp-3">
                            {saved.preview}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(saved.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-md border border-dashed border-border/70 bg-muted/50 px-3 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Bookmark className="size-4 text-muted-foreground" />
                    Keine Favoriten vorhanden
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Speichere Nachrichten, um sie hier wiederzufinden.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog 
          open={slashDialogOpen} 
          onOpenChange={(open) => {
            setSlashDialogOpen(open)
            if (!open) {
              focusMessageInput()
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neuen Command speichern</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Titel</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                  value={newSlashLabel}
                  onChange={(e) => setNewSlashLabel(e.target.value)}
                  placeholder="z.B. Outline"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Command</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-1 py-1 text-sm focus-visible:outline-none"
                  rows={4}
                  value={newSlashContent}
                  onChange={(e) => setNewSlashContent(e.target.value)}
                  placeholder="/outline Gliedere den Text in Abschnitte."
                />
              </div>
            </div>
            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button variant="ghost">Abbrechen</Button>
              </DialogClose>
              <Button
                disabled={!newSlashLabel.trim() || !newSlashContent.trim()}
                onClick={() => {
                  const content = newSlashContent.trim()
                  if (!content) return
                  const label = newSlashLabel.trim()
                  if (!label) return
                  const newCommand: SlashCommand = {
                    id: crypto.randomUUID(),
                    label,
                    content,
                  }
                  const next = [...slashCommands, newCommand]
                  setSlashCommands(next)
                  saveSlashCommands(next)
                  setSlashDialogOpen(false)
                  setNewSlashContent("")
                  setNewSlashLabel("")
                  focusMessageInput()
                }}
              >
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

    </div >
  )
}

