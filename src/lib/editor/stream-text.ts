/**
 * Utility-Funktionen zum Streamen von Text direkt in den Editor
 */

import { withAIBatch } from '@platejs/ai'
import { streamInsertChunk } from '@platejs/ai/react'
import { getPluginType, KEYS } from 'platejs'
import type { PlateEditor } from 'platejs/react'
import { insertCitationWithMerge } from '@/components/editor/utils/insert-citation-with-merge'

/**
 * Globaler Event-Handler für Editor-Text-Streaming
 * Wird vom AskAiPane über window.dispatchEvent aufgerufen
 */
export function setupEditorStreaming(): void {
    if (typeof window === 'undefined') return

    // Listener für Streaming-Start (optional, z.B. für Fokus oder Initialisierung)
    window.addEventListener('init-editor-stream', () => {
        // Hole Editor-Instanz
        const editorEvent = new CustomEvent('get-editor-instance', {
            detail: {
                callback: (editor: PlateEditor) => {
                    if (editor) {
                        // Stelle sicher, dass der Editor fokussiert ist
                        if (!editor.selection) {
                            const endPath = editor.api.end([])
                            if (endPath) {
                                editor.tf.select(endPath)
                            }
                        }
                    }
                }
            },
        })
        window.dispatchEvent(editorEvent)
    })

    // Listener für Text-Chunks
    window.addEventListener('stream-editor-chunk', (event: any) => {
        const { chunk } = event.detail
        if (!chunk) return

        const editorEvent = new CustomEvent('get-editor-instance', {
            detail: {
                callback: (editor: PlateEditor) => {
                    if (editor) {
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
                    }
                }
            },
        })
        window.dispatchEvent(editorEvent)
    })

    // Listener für Zitat-Einfügen (vom AI-Agent)
    window.addEventListener('insert-citation', (event: any) => {
        const citationData = event.detail
        if (!citationData || !citationData.sourceId) return

        const editorEvent = new CustomEvent('get-editor-instance', {
            detail: {
                callback: (editor: PlateEditor) => {
                    // Importieren wir dynamisch, um Circular Deps zu vermeiden, falls möglich
                    // Aber hier im File ist static import besser. Wir fügen den Import oben hinzu.
                    // Da wir replace_file_content nutzen, müssen wir den Import im Header hinzufügen.
                    // Aber insertCitationWithMerge ist ein Utility.
                    if (editor) {
                        // Wir rufen die Utility Funktion auf
                        // Beachten: insertCitationWithMerge muss importiert sein.
                        // Wir gehen davon aus, dass wir den Import gleich hinzufügen. 
                        insertCitationWithMerge(editor, citationData)
                    }
                }
            },
        })
        window.dispatchEvent(editorEvent)
    })
}
