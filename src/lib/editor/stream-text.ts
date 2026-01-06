/**
 * Utility-Funktionen zum Streamen von Text direkt in den Editor
 */

import { withAIBatch } from '@platejs/ai'
import { streamInsertChunk } from '@platejs/ai/react'
import { getPluginType, KEYS } from 'platejs'
import type { PlateEditor } from 'platejs/react'
import { insertCitationWithMerge } from '@/components/editor/utils/insert-citation-with-merge'
import { devLog, devWarn, devError } from '@/lib/utils/logger'

/**
 * Globaler Event-Handler für Editor-Text-Streaming
 * Wird vom AskAiPane über window.dispatchEvent aufgerufen
 */
export function setupEditorStreaming(): void {
    if (typeof window === 'undefined') return

    // Listener für Streaming-Start (optional, z.B. für Fokus oder Initialisierung)
    window.addEventListener('init-editor-stream', () => {
        devLog('📝 [EDITOR STREAM] init-editor-stream Event empfangen')
        // Hole Editor-Instanz
        const editorEvent = new CustomEvent('get-editor-instance', {
            detail: {
                callback: (editor: PlateEditor) => {
                    if (editor) {
                        devLog('✅ [EDITOR STREAM] Editor-Instance erhalten, setze Fokus')
                        // Stelle sicher, dass der Editor fokussiert ist
                        if (!editor.selection) {
                            const endPath = editor.api.end([])
                            if (endPath) {
                                editor.tf.select(endPath)
                            }
                        }
                    } else {
                        devWarn('⚠️ [EDITOR STREAM] Kein Editor-Instance verfügbar beim Init')
                    }
                }
            },
        })
        window.dispatchEvent(editorEvent)
    })

    // Listener für Text-Chunks
    window.addEventListener('stream-editor-chunk', (event: any) => {
        const { chunk } = event.detail
        devLog('📝 [EDITOR STREAM] stream-editor-chunk Event empfangen, Chunk-Länge:', chunk?.length)
        
        if (!chunk) {
            devWarn('⚠️ [EDITOR STREAM] Kein Chunk im Event')
            return
        }

        const editorEvent = new CustomEvent('get-editor-instance', {
            detail: {
                callback: (editor: PlateEditor) => {
                    if (editor) {
                        devLog('✅ [EDITOR STREAM] Editor-Instance erhalten, füge Chunk ein')
                        // Verwende PlateJS High-Level Streaming Funktionen
                        // Dies entspricht der Logic in Command AI (ai-kit.tsx)

                        // Nutze withAIBatch für optimierte History/Undo-Steps
                        // split: false, da wir mitten im Stream sind
                        withAIBatch(editor, () => {
                            // Scrolle automatisch mit
                            editor.tf.withScrolling(() => {
                                // Füge Chunk ein mit Markdown-Support und AI-Styling
                                streamInsertChunk(editor, chunk, {
                                    textProps: {
                                        // Markiere Text als AI-generiert (für Styling)
                                        [getPluginType(editor, KEYS.ai)]: true,
                                    },
                                })
                            })
                        }, { split: false })
                    } else {
                        devWarn('⚠️ [EDITOR STREAM] Kein Editor-Instance verfügbar')
                    }
                }
            },
        })
        window.dispatchEvent(editorEvent)
    })

    // Listener für Streaming-Ende
    window.addEventListener('end-editor-stream', () => {
        devLog('📝 [EDITOR STREAM] Streaming beendet')
        // Optional: Hier könnte man z.B. den Cursor ans Ende setzen oder andere Finalisierungen durchführen
        const editorEvent = new CustomEvent('get-editor-instance', {
            detail: {
                callback: (editor: PlateEditor) => {
                    if (editor) {
                        // Setze Cursor ans Ende des Dokuments
                        const endPath = editor.api.end([])
                        if (endPath) {
                            editor.tf.select(endPath)
                        }
                    }
                }
            },
        })
        window.dispatchEvent(editorEvent)
    })

    // Listener für Zitat-Einfügen (vom AI-Agent)
    window.addEventListener('insert-citation', (event: any) => {
        devLog('📝 [EDITOR STREAM] insert-citation Event empfangen:', event.detail)
        
        const citationData = event.detail
        if (!citationData || !citationData.sourceId) {
            devError('❌ [EDITOR STREAM] insert-citation Event ohne gültige citationData:', citationData)
            return
        }

        devLog('✅ [EDITOR STREAM] Citation-Daten validiert:', {
            sourceId: citationData.sourceId,
            title: citationData.title,
            year: citationData.year,
            authors: citationData.authors,
            targetText: citationData.targetText,
        })

        const editorEvent = new CustomEvent('get-editor-instance', {
            detail: {
                callback: (editor: PlateEditor) => {
                    if (editor) {
                        devLog('✅ [EDITOR STREAM] Editor-Instance erhalten, füge Citation ein')
                        try {
                            insertCitationWithMerge(editor, citationData)
                            devLog('✅ [EDITOR STREAM] Citation erfolgreich eingefügt')
                        } catch (error) {
                            devError('❌ [EDITOR STREAM] Fehler beim Einfügen der Citation:', error)
                        }
                    } else {
                        devWarn('⚠️ [EDITOR STREAM] Kein Editor-Instance verfügbar für Citation-Einfügung')
                    }
                }
            },
        })
        window.dispatchEvent(editorEvent)
    })
}
