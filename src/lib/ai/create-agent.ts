import { ToolLoopAgent, stepCountIs, hasToolCall, type Tool } from 'ai'
import { tavilySearch, tavilyCrawl, tavilyExtract } from '@tavily/ai-sdk'
import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { devLog } from '@/lib/utils/logger'

import {
  insertTextInEditorTool,
  deleteTextFromEditorTool,
  addCitationTool,
  createGetEditorContentTool,
  updateNodeByIdTool,
  findNodesInEditorTool,
  createLibraryTool,
  createAddSourcesToLibraryTool,
  createListAllLibrariesTool,
  createGetLibrarySourcesTool,
  searchSourcesTool,
  analyzeSourcesTool,
  evaluateSourcesTool,
  addThemaTool,
  saveStepDataTool,
  getCurrentStepTool,
  finishTool,
} from './tools'

export type AgentType = 'bachelorarbeit' | 'general' | 'websearch'

export interface AgentConfig {
  userId: string
  projectId?: string
  editorContent?: string
  editorJson?: any[] // Vollständige Editor-Struktur als JSON
  systemPrompt: string
  maxSteps?: number
  maxOutputTokens?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = Tool<any, any>

export function createAgentTools(config: {
  userId: string
  projectId?: string
  editorContent?: string
  editorJson?: any[]
}): Record<string, AnyTool> {
  return {
    // Editor tools (erweitert mit Struktur-Zugriff)
    insertTextInEditor: insertTextInEditorTool,
    deleteTextFromEditor: deleteTextFromEditorTool,
    addCitation: addCitationTool,
    getEditorContent: createGetEditorContentTool(config.editorContent || '', config.editorJson),
    updateNodeById: updateNodeByIdTool,
    findNodesInEditor: findNodesInEditorTool,
    // Library tools
    createLibrary: createLibraryTool(config.userId, config.projectId),
    addSourcesToLibrary: createAddSourcesToLibraryTool(config.userId),
    listAllLibraries: createListAllLibrariesTool(config.userId, config.projectId),
    getLibrarySources: createGetLibrarySourcesTool(config.userId),
    // Search tools
    searchSources: searchSourcesTool,
    analyzeSources: analyzeSourcesTool,
    evaluateSources: evaluateSourcesTool,
    // Utility tools
    addThema: addThemaTool,
    saveStepData: saveStepDataTool,
    getCurrentStep: getCurrentStepTool,
    finish: finishTool,
    // Web tools
    webSearch: tavilySearch(),
    webCrawl: tavilyCrawl(),
    webExtract: tavilyExtract(),
  }
}

export function createWebSearchTools(): Record<string, AnyTool> {
  return {
    webSearch: tavilySearch(),
    webCrawl: tavilyCrawl(),
    webExtract: tavilyExtract(),
    finish: finishTool,
  }
}

export function createAgent(
  type: AgentType,
  config: AgentConfig
) {
  const model = deepseek(DEEPSEEK_CHAT_MODEL)
  const maxSteps = config.maxSteps || (type === 'websearch' ? 5 : 20)
  const maxOutputTokens = config.maxOutputTokens || (type === 'websearch' ? 4096 : 8192)

  const tools: Record<string, AnyTool> = type === 'websearch'
    ? createWebSearchTools()
    : createAgentTools({
        userId: config.userId,
        projectId: config.projectId,
        editorContent: config.editorContent,
        editorJson: config.editorJson,
      })

  const agent = new ToolLoopAgent({
    model,
    instructions: config.systemPrompt,
    tools,
    toolChoice: 'auto',
    stopWhen: [stepCountIs(maxSteps), hasToolCall('finish')],
    maxOutputTokens,
    onStepFinish: (result) => {
      if (result.text) {
        devLog(`[${type.toUpperCase()} AGENT] Text: ${result.text.length} chars`)
      }
      if (result.toolCalls && result.toolCalls.length > 0) {
        devLog(`[${type.toUpperCase()} AGENT] Tools: ${result.toolCalls.map((tc: { toolName: string }) => tc.toolName).join(', ')}`)
      }
    },
  })

  return agent
}

export async function runAgentStream(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agent: any,
  messages: Array<{ role: string; content: string }>
) {
  return await agent.stream({
    messages: messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })),
  })
}
