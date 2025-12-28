'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { SLASH_STORAGE_KEY, CHAT_HISTORY_STORAGE_KEY, SAVED_MESSAGES_STORAGE_KEY } from '@/lib/ask-ai-pane/constants'
import type { CitationLibrary } from '@/lib/stores/citation-store'
import type { StoredConversation, SlashCommand, SavedMessage } from '@/lib/ask-ai-pane/types'
import { useBachelorarbeitAgentStore } from '@/lib/stores/bachelorarbeit-agent-store'

interface MigrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MigrationDialog({ open, onOpenChange }: MigrationDialogProps) {
  const [isMigrating, setIsMigrating] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [status, setStatus] = React.useState<string>('')
  const [error, setError] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<any>(null)
  const agentStore = useBachelorarbeitAgentStore()

  const collectLocalStorageData = (): any => {
    const data: any = {}

    // Citation Libraries
    try {
      const citationSettings = localStorage.getItem('citation-settings')
      if (citationSettings) {
        const parsed = JSON.parse(citationSettings)
        if (parsed.libraries && Array.isArray(parsed.libraries)) {
          data.citationLibraries = parsed.libraries as CitationLibrary[]
        }
      }
    } catch (error) {
      console.error('Fehler beim Sammeln der Citation Libraries:', error)
    }

    // Chat Conversations
    try {
      const chatHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
      if (chatHistory) {
        data.chatConversations = JSON.parse(chatHistory) as StoredConversation[]
      }
    } catch (error) {
      console.error('Fehler beim Sammeln der Chat Conversations:', error)
    }

    // Saved Messages
    try {
      const savedMessages = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
      if (savedMessages) {
        data.savedMessages = JSON.parse(savedMessages) as SavedMessage[]
      }
    } catch (error) {
      console.error('Fehler beim Sammeln der Saved Messages:', error)
    }

    // Slash Commands
    try {
      const slashCommands = localStorage.getItem(SLASH_STORAGE_KEY)
      if (slashCommands) {
        data.slashCommands = JSON.parse(slashCommands) as SlashCommand[]
      }
    } catch (error) {
      console.error('Fehler beim Sammeln der Slash Commands:', error)
    }

    // Agent State
    try {
      const agentState = localStorage.getItem('bachelorarbeit-agent-state')
      if (agentState) {
        const parsed = JSON.parse(agentState)
        if (parsed.state) {
          data.agentState = parsed.state
        }
      }
    } catch (error) {
      console.error('Fehler beim Sammeln des Agent States:', error)
    }

    return data
  }

  const handleMigrate = async () => {
    setIsMigrating(true)
    setProgress(0)
    setError(null)
    setStatus('Sammle Daten aus localStorage...')

    try {
      const data = collectLocalStorageData()
      setProgress(20)
      setStatus('Sende Daten an Server...')

      const response = await fetch('/api/migrate/localstorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      setProgress(60)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Migration fehlgeschlagen')
      }

      const result = await response.json()
      setResults(result.results)
      setProgress(100)
      setStatus('Migration erfolgreich abgeschlossen!')

      // Lösche localStorage Daten nach erfolgreicher Migration
      setTimeout(() => {
        localStorage.removeItem('citation-settings')
        localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY)
        localStorage.removeItem(SAVED_MESSAGES_STORAGE_KEY)
        localStorage.removeItem(SLASH_STORAGE_KEY)
        localStorage.removeItem('bachelorarbeit-agent-state')
      }, 2000)
    } catch (error) {
      console.error('Migration Fehler:', error)
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler')
      setStatus('Migration fehlgeschlagen')
    } finally {
      setIsMigrating(false)
    }
  }

  const handleClose = () => {
    if (!isMigrating) {
      onOpenChange(false)
      setProgress(0)
      setStatus('')
      setError(null)
      setResults(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Daten von localStorage migrieren</DialogTitle>
          <DialogDescription>
            Möchten Sie Ihre gespeicherten Daten von localStorage zu Supabase migrieren?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isMigrating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{status}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Migration erfolgreich!</span>
              </div>
              <div className="pl-6 space-y-1 text-muted-foreground">
                {results.citationLibraries > 0 && (
                  <div>• {results.citationLibraries} Bibliothek(en) migriert</div>
                )}
                {results.citations > 0 && (
                  <div>• {results.citations} Citation(s) migriert</div>
                )}
                {results.chatConversations > 0 && (
                  <div>• {results.chatConversations} Conversation(s) migriert</div>
                )}
                {results.chatMessages > 0 && (
                  <div>• {results.chatMessages} Nachricht(en) migriert</div>
                )}
                {results.savedMessages > 0 && (
                  <div>• {results.savedMessages} gespeicherte Nachricht(en) migriert</div>
                )}
                {results.slashCommands > 0 && (
                  <div>• {results.slashCommands} Slash Command(s) migriert</div>
                )}
                {results.agentState && (
                  <div>• Agent State migriert</div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isMigrating}
            >
              {results ? 'Schließen' : 'Abbrechen'}
            </Button>
            {!results && (
              <Button onClick={handleMigrate} disabled={isMigrating}>
                {isMigrating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migriere...
                  </>
                ) : (
                  'Jetzt migrieren'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

