export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; reasoning: string }
  | { type: 'tool-invocation'; toolInvocation: { toolName: string; toolCallId: string } }
  | { type: 'source'; source: { url: string; title?: string; id?: string } }
  | { type: 'tool-step'; toolStep: ToolStep }

export type ToolStep = {
  id: string
  toolName: string
  status: 'pending' | 'running' | 'completed' | 'error'
  startedAt: number
  completedAt?: number
  input?: Record<string, any>
  output?: Record<string, any>
  reasoning?: string
  error?: string
}

export type MessageContext = {
  text: string
  addedAt: number
  sourceMessageId?: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  reasoning?: string
  parts?: MessagePart[]
  toolSteps?: ToolStep[]
  toolInvocations?: Array<{
    toolCallId?: string
    toolName?: string
    state?: string
    result?: {
      results?: Array<{
        url?: string
        title?: string
      }>
    }
  }>
  files?: Array<{
    name: string
    size: number
    type: string
    /** Datei-ID in der Datenbank (für Wiederherstellung) */
    id?: string
    /** Öffentliche URL der Datei */
    url?: string
    /** Extrahierter Textinhalt */
    extractedContent?: string
  }>
  context?: MessageContext[]
  mentions?: Mentionable[]
  hidden?: boolean
}

export type StoredConversation = {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: number
  agentMode?: AgentMode // Zuletzt verwendeter Agent für diesen Chat
}

export type AgentMode = 'bachelor' | 'general' | 'standard'

export type ContextSelection = {
  document: boolean
  web: boolean
  agentMode: AgentMode
}

export type Mentionable = {
  id: string
  label: string
  value: string
  hint?: string
  icon?: any
  type?: "citation" | "prompt" | "document" | "file"
  // Actual content to send as context to the AI
  content?: string
  // Additional metadata for citations and files
  metadata?: {
    authors?: string[]
    year?: number | string
    source?: string
    doi?: string
    abstract?: string
    // File metadata
    fileId?: string
    fileUrl?: string
    fileType?: string
    fileSize?: number
  }
}

export type SlashCommand = {
  id: string
  label: string
  content: string
}

export type MarkdownCodeProps = {
  inline?: boolean
  node?: unknown
  ref?: React.Ref<HTMLElement>
  className?: string
  children?: React.ReactNode
}

export type TableRow = { cells: string[]; isHeader: boolean }

export type TableMdastNode = {
  type?: string
  align?: Array<"left" | "right" | "center" | null>
  children?: TableMdastNode[]
  value?: string
}

export type TableHastNode = {
  type?: string
  tagName?: string
  children?: TableHastNode[]
  value?: string
}

export type SavedMessage = {
  id: string
  messageId: string
  conversationId: string
  content: string
  role: 'assistant' | 'user'
  timestamp: number
  preview: string // Erste 100 Zeichen als Vorschau
}

