import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { SavedCitation, CitationLibrary } from '@/lib/stores/citation-store'
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils'

// In-Memory Store für Bibliotheken (später kann das in Supabase/DB gespeichert werden)
// TODO: Migriere zu Supabase für persistente Speicherung
const librariesStore = new Map<string, CitationLibrary>()

// Helper: Konvertiere NormalizedSource zu SavedCitation
function convertSourceToCitation(source: any): SavedCitation {
  const authors = source.authors
    ? (typeof source.authors === 'string' 
        ? source.authors.split(',').map((a: string) => a.trim())
        : Array.isArray(source.authors)
        ? source.authors.map((a: any) => 
            typeof a === 'string' ? a : a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
          )
        : [])
    : []

  // Verwende die gemeinsame Utility-Funktion für Link-Generierung
  // Priorität: direkter URL-Link > PDF-URL > DOI-Link
  const externalUrl = getCitationLink({
    url: source.url,
    doi: source.doi,
    pdfUrl: source.pdfUrl,
  });
  const validDoi = getNormalizedDoi(source.doi);

  return {
    id: source.id || `cite_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    title: source.title || 'Ohne Titel',
    source: source.journal || source.publisher || source.venue || 'Quelle',
    year: source.publicationYear || source.year || undefined,
    lastEdited: new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
    href: '/editor',
    externalUrl,
    doi: validDoi || undefined,
    authors: authors.filter(Boolean),
    abstract: source.abstract || undefined,
  }
}

// GET: Bibliotheken abrufen
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const libraryId = searchParams.get('id')

    if (libraryId) {
      // Einzelne Bibliothek abrufen
      const library = librariesStore.get(libraryId)
      if (!library) {
        return NextResponse.json({ error: 'Bibliothek nicht gefunden' }, { status: 404 })
      }
      return NextResponse.json({ library })
    }

    // Alle Bibliotheken abrufen
    const libraries = Array.from(librariesStore.values())
    return NextResponse.json({ libraries })
  } catch (error) {
    console.error('❌ [LIBRARY API] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Bibliothek erstellen oder Quellen hinzufügen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, libraryId, libraryName, sources } = body

    console.log('📚 [LIBRARY API] POST request:', { action, libraryId, libraryName, sourcesCount: sources?.length })

    if (action === 'createLibrary') {
      // Neue Bibliothek erstellen
      if (!libraryName || typeof libraryName !== 'string') {
        return NextResponse.json({ error: 'Bibliotheksname erforderlich' }, { status: 400 })
      }

      const id = `library_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const newLibrary: CitationLibrary = {
        id,
        name: libraryName.trim(),
        citations: [],
      }

      librariesStore.set(id, newLibrary)
      console.log('✅ [LIBRARY API] Bibliothek erstellt:', { id, name: newLibrary.name })

      return NextResponse.json({
        success: true,
        library: newLibrary,
        message: `Bibliothek "${newLibrary.name}" erfolgreich erstellt`,
      })
    }

    if (action === 'addSources') {
      // Quellen zu Bibliothek hinzufügen
      if (!libraryId || !sources || !Array.isArray(sources)) {
        return NextResponse.json(
          { error: 'libraryId und sources (Array) erforderlich' },
          { status: 400 }
        )
      }

      const library = librariesStore.get(libraryId)
      if (!library) {
        return NextResponse.json({ error: 'Bibliothek nicht gefunden' }, { status: 404 })
      }

      // Konvertiere Quellen zu Citations
      const newCitations = sources.map(convertSourceToCitation)
      
      // Entferne Duplikate (basierend auf ID)
      const existingIds = new Set(library.citations.map((c) => c.id))
      const uniqueCitations = newCitations.filter((c) => !existingIds.has(c.id))

      // Füge neue Citations hinzu
      const updatedLibrary: CitationLibrary = {
        ...library,
        citations: [...uniqueCitations, ...library.citations],
      }

      librariesStore.set(libraryId, updatedLibrary)
      console.log('✅ [LIBRARY API] Quellen hinzugefügt:', {
        libraryId,
        libraryName: updatedLibrary.name,
        added: uniqueCitations.length,
        total: updatedLibrary.citations.length,
      })

      return NextResponse.json({
        success: true,
        library: updatedLibrary,
        added: uniqueCitations.length,
        total: updatedLibrary.citations.length,
        message: `${uniqueCitations.length} Quelle(n) zur Bibliothek "${updatedLibrary.name}" hinzugefügt`,
      })
    }

    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
  } catch (error) {
    console.error('❌ [LIBRARY API] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

