import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { devLog, devError } from '@/lib/utils/logger'

// API-Route zum Hinzufügen von Markdown-Text im Editor
// Wird vom Agent-Tool aufgerufen, um Text direkt im Editor hinzuzufügen
// Das Frontend wird über ein Custom Event benachrichtigt
export async function POST(req: NextRequest) {
  try {
    const { markdown, position, focusOnHeadings } = await req.json()

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json({ error: 'Markdown-Text erforderlich' }, { status: 400 })
    }

    const headingCount = (markdown.match(/^#+\s/gm) || []).length

    devLog('📝 [EDITOR API] Text einfügen:', {
      markdownLength: markdown.length,
      position: position || 'end',
      focusOnHeadings: focusOnHeadings || false,
      headingCount,
    })

    // Die Markdown wird im Frontend in den Editor eingefügt
    // Diese API-Route gibt den Markdown-Text zurück
    // Das Frontend ist verantwortlich für die Einfügung über ein Custom Event
    return NextResponse.json({
      success: true,
      markdown,
      position: position || 'end',
      focusOnHeadings: focusOnHeadings || false,
      headingCount,
      message: 'Text erfolgreich vorbereitet für Einfügung im Editor',
      // Frontend-Hinweis: Dieses Response sollte ein Custom Event auslösen
      eventType: 'insert-text-in-editor',
    })
  } catch (error) {
    devError('❌ [EDITOR API] Fehler:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

