import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as citationLibrariesUtils from '@/lib/supabase/utils/citation-libraries'
import * as citationsUtils from '@/lib/supabase/utils/citations'
import * as chatConversationsUtils from '@/lib/supabase/utils/chat-conversations'
import * as chatMessagesUtils from '@/lib/supabase/utils/chat-messages'
import * as savedMessagesUtils from '@/lib/supabase/utils/saved-messages'
import * as slashCommandsUtils from '@/lib/supabase/utils/slash-commands'
import * as agentStatesUtils from '@/lib/supabase/utils/agent-states'
import * as documentsUtils from '@/lib/supabase/utils/documents'
import * as discussionsUtils from '@/lib/supabase/utils/discussions'
import * as commentsUtils from '@/lib/supabase/utils/comments'
import type { SavedCitation, CitationLibrary } from '@/lib/stores/citation-store'
import type { ChatMessage, StoredConversation, SlashCommand, SavedMessage } from '@/lib/ask-ai-pane/types'

interface MigrationData {
  citationLibraries?: CitationLibrary[]
  chatConversations?: StoredConversation[]
  savedMessages?: SavedMessage[]
  slashCommands?: SlashCommand[]
  agentState?: any
  documents?: any[]
  discussions?: any[]
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const data: MigrationData = await req.json()
    const results = {
      citationLibraries: 0,
      citations: 0,
      chatConversations: 0,
      chatMessages: 0,
      savedMessages: 0,
      slashCommands: 0,
      agentState: false,
      documents: 0,
      discussions: 0,
      comments: 0,
      errors: [] as string[],
    }

    // Migriere Citation Libraries
    if (data.citationLibraries && data.citationLibraries.length > 0) {
      try {
        for (const library of data.citationLibraries) {
          if (library.id === 'library_default') {
            // Erstelle Standardbibliothek
            const defaultLib = await citationLibrariesUtils.getDefaultCitationLibrary(user.id)
            let libraryId = defaultLib?.id
            if (!libraryId) {
              const newLib = await citationLibrariesUtils.createCitationLibrary({
                user_id: user.id,
                name: library.name,
                is_default: true,
              })
              libraryId = newLib.id
            }

            // Migriere Citations
            for (const citation of library.citations) {
              try {
                await citationsUtils.createCitation({
                  id: citation.id,
                  user_id: user.id,
                  library_id: libraryId,
                  title: citation.title,
                  source: citation.source,
                  year: typeof citation.year === 'number' ? citation.year : citation.year ? parseInt(citation.year.toString()) : null,
                  last_edited: citation.lastEdited ? new Date(citation.lastEdited).toISOString() : new Date().toISOString(),
                  href: citation.href,
                  external_url: citation.externalUrl || null,
                  authors: citation.authors || null,
                  abstract: citation.abstract || null,
                  doi: citation.doi || null,
                  citation_style: 'vancouver',
                  in_text_citation: citation.title,
                  full_citation: citation.title,
                  metadata: {},
                })
                results.citations++
              } catch (error) {
                results.errors.push(`Fehler beim Migrieren der Citation ${citation.id}: ${error}`)
              }
            }
            results.citationLibraries++
          } else {
            // Erstelle normale Library
            const newLib = await citationLibrariesUtils.createCitationLibrary({
              user_id: user.id,
              name: library.name,
              is_default: false,
            })

            // Migriere Citations
            for (const citation of library.citations) {
              try {
                await citationsUtils.createCitation({
                  id: citation.id,
                  user_id: user.id,
                  library_id: newLib.id,
                  title: citation.title,
                  source: citation.source,
                  year: typeof citation.year === 'number' ? citation.year : citation.year ? parseInt(citation.year.toString()) : null,
                  last_edited: citation.lastEdited ? new Date(citation.lastEdited).toISOString() : new Date().toISOString(),
                  href: citation.href,
                  external_url: citation.externalUrl || null,
                  authors: citation.authors || null,
                  abstract: citation.abstract || null,
                  doi: citation.doi || null,
                  citation_style: 'vancouver',
                  in_text_citation: citation.title,
                  full_citation: citation.title,
                  metadata: {},
                })
                results.citations++
              } catch (error) {
                results.errors.push(`Fehler beim Migrieren der Citation ${citation.id}: ${error}`)
              }
            }
            results.citationLibraries++
          }
        }
      } catch (error) {
        results.errors.push(`Fehler beim Migrieren der Citation Libraries: ${error}`)
      }
    }

    // Migriere Chat Conversations
    if (data.chatConversations && data.chatConversations.length > 0) {
      try {
        for (const conv of data.chatConversations) {
          const newConv = await chatConversationsUtils.createChatConversation({
            id: conv.id,
            user_id: user.id,
            title: conv.title,
            updated_at: new Date(conv.updatedAt).toISOString(),
          })

          // Migriere Messages
          if (conv.messages && conv.messages.length > 0) {
            await chatMessagesUtils.createChatMessages(
              conv.messages.map((msg: ChatMessage) => ({
                conversation_id: conv.id,
                role: msg.role,
                content: msg.content,
                reasoning: msg.reasoning || null,
                parts: msg.parts || [],
                tool_invocations: msg.toolInvocations || [],
              }))
            )
            results.chatMessages += conv.messages.length
          }
          results.chatConversations++
        }
      } catch (error) {
        results.errors.push(`Fehler beim Migrieren der Chat Conversations: ${error}`)
      }
    }

    // Migriere Saved Messages
    if (data.savedMessages && data.savedMessages.length > 0) {
      try {
        for (const msg of data.savedMessages) {
          try {
            await savedMessagesUtils.createSavedMessage({
              user_id: user.id,
              message_id: msg.messageId,
              conversation_id: msg.conversationId,
              content: msg.content,
              role: msg.role,
              preview: msg.preview,
            })
            results.savedMessages++
          } catch (error) {
            results.errors.push(`Fehler beim Migrieren der Saved Message ${msg.id}: ${error}`)
          }
        }
      } catch (error) {
        results.errors.push(`Fehler beim Migrieren der Saved Messages: ${error}`)
      }
    }

    // Migriere Slash Commands
    if (data.slashCommands && data.slashCommands.length > 0) {
      try {
        await slashCommandsUtils.createSlashCommands(
          data.slashCommands.map((cmd) => ({
            user_id: user.id,
            label: cmd.label,
            content: cmd.content,
          }))
        )
        results.slashCommands = data.slashCommands.length
      } catch (error) {
        results.errors.push(`Fehler beim Migrieren der Slash Commands: ${error}`)
      }
    }

    // Migriere Agent State
    if (data.agentState) {
      try {
        await agentStatesUtils.createAgentState({
          user_id: user.id,
          is_active: data.agentState.isActive || false,
          arbeit_type: data.agentState.arbeitType,
          thema: data.agentState.thema || null,
          current_step: data.agentState.currentStep || null,
          step_data: data.agentState.stepData || {},
          progress: data.agentState.progress || 0,
          selected_sources: data.agentState.selectedSources || [],
          pending_sources: data.agentState.pendingSources || [],
          started_at: data.agentState.startedAt ? new Date(data.agentState.startedAt).toISOString() : null,
          last_updated: data.agentState.lastUpdated ? new Date(data.agentState.lastUpdated).toISOString() : new Date().toISOString(),
        })
        results.agentState = true
      } catch (error) {
        results.errors.push(`Fehler beim Migrieren des Agent States: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Migration erfolgreich abgeschlossen',
    })
  } catch (error) {
    console.error('❌ [MIGRATION API] Fehler:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

