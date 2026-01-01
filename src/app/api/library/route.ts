import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { SavedCitation, CitationLibrary } from '@/lib/stores/citation-store'
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils'
import { createClient } from '@/lib/supabase/server'
import * as citationLibrariesUtils from '@/lib/supabase/utils/citation-libraries'
import * as citationsUtils from '@/lib/supabase/utils/citations'
import { devLog, devError } from '@/lib/utils/logger'

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
    href: externalUrl || '/editor',
    externalUrl,
    doi: validDoi || undefined,
    authors: authors.filter(Boolean),
    abstract: source.abstract || undefined,
  }
}

// GET: Bibliotheken abrufen
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const libraryId = searchParams.get('id')

    if (libraryId) {
      // Einzelne Bibliothek abrufen
      const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, user.id)
      if (!library) {
        return NextResponse.json({ error: 'Bibliothek nicht gefunden' }, { status: 404 })
      }

      // Lade Citations für diese Library
      const citations = await citationsUtils.getCitationsByLibrary(libraryId, user.id)
      const savedCitations: SavedCitation[] = citations.map((c) => ({
        id: c.id,
        title: c.title || '',
        source: c.source || '',
        year: c.year || undefined,
        lastEdited: c.last_edited ? new Date(c.last_edited).toLocaleDateString('de-DE', { dateStyle: 'short' }) : new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
        href: c.href || '/editor',
        externalUrl: c.external_url || undefined,
        doi: c.doi || undefined,
        authors: c.authors || undefined,
        abstract: c.abstract || undefined,
      }))

      const libraryWithCitations: CitationLibrary = {
        id: library.id,
        name: library.name,
        citations: savedCitations,
      }

      return NextResponse.json({ library: libraryWithCitations })
    }

    // Alle Bibliotheken abrufen
    const libraries = await citationLibrariesUtils.getCitationLibraries(user.id)
    
    // Lade Citations für jede Library
    const librariesWithCitations: CitationLibrary[] = await Promise.all(
      libraries.map(async (lib) => {
        const citations = await citationsUtils.getCitationsByLibrary(lib.id, user.id)
        const savedCitations: SavedCitation[] = citations.map((c) => ({
          id: c.id,
          title: c.title || '',
          source: c.source || '',
          year: c.year || undefined,
          lastEdited: c.last_edited ? new Date(c.last_edited).toLocaleDateString('de-DE', { dateStyle: 'short' }) : new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
          href: c.href || '/editor',
          externalUrl: c.external_url || undefined,
          doi: c.doi || undefined,
          authors: c.authors || undefined,
          abstract: c.abstract || undefined,
        }))
        return {
          id: lib.id,
          name: lib.name,
          citations: savedCitations,
        }
      })
    )

    return NextResponse.json({ libraries: librariesWithCitations })
  } catch (error) {
    devError('❌ [LIBRARY API] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Bibliothek erstellen oder Quellen hinzufügen
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const body = await req.json()
    const { action, libraryId, libraryName, sources } = body

    devLog('📚 [LIBRARY API] POST request:', { action, libraryId, libraryName, sourcesCount: sources?.length })

    if (action === 'createLibrary') {
      // Neue Bibliothek erstellen
      if (!libraryName || typeof libraryName !== 'string') {
        return NextResponse.json({ error: 'Bibliotheksname erforderlich' }, { status: 400 })
      }

      const newLibrary = await citationLibrariesUtils.createCitationLibrary({
        user_id: user.id,
        name: libraryName.trim(),
        is_default: false,
      })

      const libraryWithCitations: CitationLibrary = {
        id: newLibrary.id,
        name: newLibrary.name,
        citations: [],
      }

      devLog('✅ [LIBRARY API] Bibliothek erstellt:', { id: newLibrary.id, name: newLibrary.name })

      return NextResponse.json({
        success: true,
        library: libraryWithCitations,
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

      const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, user.id)
      if (!library) {
        return NextResponse.json({ error: 'Bibliothek nicht gefunden' }, { status: 404 })
      }

      // Konvertiere Quellen zu Citations
      const newCitations = sources.map(convertSourceToCitation)
      
      // Lade bestehende Citations
      const existingCitations = await citationsUtils.getCitationsByLibrary(libraryId, user.id)
      const existingIds = new Set(existingCitations.map((c) => c.id))
      const uniqueCitations = newCitations.filter((c) => !existingIds.has(c.id))

      // Erstelle neue Citations in Supabase
      for (const citation of uniqueCitations) {
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
          citation_style: 'vancouver', // Default
          in_text_citation: citation.title,
          full_citation: citation.title,
          metadata: {},
        })
      }

      // Lade aktualisierte Library mit Citations
      const updatedCitations = await citationsUtils.getCitationsByLibrary(libraryId, user.id)
      const savedCitations: SavedCitation[] = updatedCitations.map((c) => ({
        id: c.id,
        title: c.title || '',
        source: c.source || '',
        year: c.year || undefined,
        lastEdited: c.last_edited ? new Date(c.last_edited).toLocaleDateString('de-DE', { dateStyle: 'short' }) : new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
        href: c.href || '/editor',
        externalUrl: c.external_url || undefined,
        doi: c.doi || undefined,
        authors: c.authors || undefined,
        abstract: c.abstract || undefined,
      }))

      const updatedLibrary: CitationLibrary = {
        id: library.id,
        name: library.name,
        citations: savedCitations,
      }

      devLog('✅ [LIBRARY API] Quellen hinzugefügt:', {
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
    devError('❌ [LIBRARY API] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

