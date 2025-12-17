export type MessagePart = 
  | { type: 'text'; text: string }
  | { type: 'reasoning'; reasoning: string }
  | { type: 'tool-invocation'; toolInvocation: { toolName: string; toolCallId: string } }
  | { type: 'source'; source: { url: string; title?: string; id?: string } }

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  reasoning?: string
  parts?: MessagePart[]
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
}

export type StoredConversation = {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: number
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
  type?: "citation" | "prompt" | "document"
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

