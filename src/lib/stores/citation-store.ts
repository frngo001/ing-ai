'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentUserId } from '@/lib/supabase/utils/auth'
import * as citationLibrariesUtils from '@/lib/supabase/utils/citation-libraries'
import * as citationsUtils from '@/lib/supabase/utils/citations'
import { logSupabaseError } from '@/lib/supabase/utils/error-handler'

/**
 * Prüft, ob die Anwendung im Development-Modus läuft
 */
const isDevelopment = () => process.env.NODE_ENV === 'development'

/**
 * Loggt nur im Development-Modus
 */
const devLog = (...args: unknown[]) => {
  if (isDevelopment()) {
    console.log(...args)
  }
}

/**
 * Warnt nur im Development-Modus
 */
const devWarn = (...args: unknown[]) => {
  if (isDevelopment()) {
    console.warn(...args)
  }
}

/**
 * Loggt Fehler nur im Development-Modus
 */
const devError = (...args: unknown[]) => {
  if (isDevelopment()) {
    console.error(...args)
  }
}

// Unterstützt die bisherigen Presets plus beliebige CSL-Dateinamen aus Bibify
export type CitationStyle =
  | 'apa'
  | 'mla'
  | 'chicago'
  | 'harvard'
  | 'ieee'
  | 'vancouver'
  | string

export type CitationFormat = 'author' | 'author-date' | 'label' | 'note' | 'numeric'
export type CitationNumberFormat = 'bracket' | 'parentheses' | 'superscript' | 'plain' | 'dot'
export type CitationAuthorDateVariant = 'comma' | 'no-comma'
export type CitationAuthorVariant = 'with-parens' | 'bare'
export type CitationLabelVariant = 'bracket' | 'parentheses' | 'plain'
export type CitationNoteVariant = 'superscript' | 'inline'
export type CitationNumericRangeVariant = 'collapse' | 'list'

export type SavedCitation = {
  id: string
  title: string
  source: string
  year?: number | string
  lastEdited: string
  href?: string
  externalUrl?: string
  doi?: string
  authors?: string[]
  abstract?: string
  imageUrl?: string
  type?: string
  isbn?: string
  publisher?: string
  edition?: string
  publisherPlace?: string
}

export type CitationLibrary = {
  id: string
  name: string
  citations: SavedCitation[]
}

interface Author {
  fullName?: string
  firstName?: string
  lastName?: string
}

export interface CitationData {
  sourceId: string
  authors: Author[]
  year?: number
  title: string
  doi?: string
  url?: string
}

// Format citation based on style
export function formatCitation(data: CitationData, style: CitationStyle): string {
  const { authors, year } = data
  const yearText = year || 'n.d.'

  const getLastName = (author: Author): string => {
    if (author.lastName) return author.lastName
    if (author.fullName) {
      const parts = author.fullName.split(' ')
      return parts[parts.length - 1]
    }
    return ''
  }

  const authorNames = authors?.slice(0, 3).map(getLastName).filter(Boolean) || []

  switch (style) {
    case 'apa': {
      // APA: (Author, Year) or (Author & Author, Year) or (Author et al., Year)
      if (authorNames.length === 0) return `(${yearText})`
      if (authorNames.length === 1) return `(${authorNames[0]}, ${yearText})`
      if (authorNames.length === 2) return `(${authorNames[0]} & ${authorNames[1]}, ${yearText})`
      return `(${authorNames[0]} et al., ${yearText})`
    }

    case 'mla': {
      // MLA: (Author Page) - we don't have page, so just (Author)
      if (authorNames.length === 0) return `("${data.title.slice(0, 20)}...")`
      if (authorNames.length === 1) return `(${authorNames[0]})`
      if (authorNames.length === 2) return `(${authorNames[0]} and ${authorNames[1]})`
      return `(${authorNames[0]} et al.)`
    }

    case 'chicago': {
      // Chicago: (Author Year)
      if (authorNames.length === 0) return `(${yearText})`
      if (authorNames.length === 1) return `(${authorNames[0]} ${yearText})`
      if (authorNames.length === 2) return `(${authorNames[0]} and ${authorNames[1]} ${yearText})`
      return `(${authorNames[0]} et al. ${yearText})`
    }

    case 'harvard': {
      // Harvard: (Author, Year)
      if (authorNames.length === 0) return `(${yearText})`
      if (authorNames.length === 1) return `(${authorNames[0]}, ${yearText})`
      if (authorNames.length === 2) return `(${authorNames[0]} & ${authorNames[1]}, ${yearText})`
      return `(${authorNames[0]} et al., ${yearText})`
    }

    case 'ieee':
    case 'vancouver': {
      // Nummern-Stile: Anzeige wird im Editor numerisch ersetzt; hier nur Fallback
      if (authorNames.length === 0) return `[${yearText}]`
      return `[${authorNames[0]}${yearText ? ', ' + yearText : ''}]`
    }

    default: {
      // Unbekannter Stil: Fallback auf Autor-Jahr
      if (authorNames.length === 0) return `(${yearText})`
      if (authorNames.length === 1) return `(${authorNames[0]}, ${yearText})`
      if (authorNames.length === 2) return `(${authorNames[0]} & ${authorNames[1]}, ${yearText})`
      return `(${authorNames[0]} et al., ${yearText})`
    }
  }
}

interface CitationState {
  isSearchOpen: boolean
  citationStyle: CitationStyle
  citationFormat: CitationFormat
  citationNumberFormat: CitationNumberFormat
  citationAuthorDateVariant: CitationAuthorDateVariant
  citationAuthorVariant: CitationAuthorVariant
  citationLabelVariant: CitationLabelVariant
  citationNoteVariant: CitationNoteVariant
  citationNumericRangeVariant: CitationNumericRangeVariant
  savedCitations: SavedCitation[]
  libraries: CitationLibrary[]
  activeLibraryId?: string
  currentProjectId?: string | null
  pendingCitation?: SavedCitation
  citationRenderVersion: number
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  setCitationStyle: (style: CitationStyle) => void
  setCitationFormat: (format: CitationFormat) => void
  setCitationNumberFormat: (format: CitationNumberFormat) => void
  setCitationAuthorDateVariant: (variant: CitationAuthorDateVariant) => void
  setCitationAuthorVariant: (variant: CitationAuthorVariant) => void
  setCitationLabelVariant: (variant: CitationLabelVariant) => void
  setCitationNoteVariant: (variant: CitationNoteVariant) => void
  setCitationNumericRangeVariant: (variant: CitationNumericRangeVariant) => void
  addCitation: (citation: SavedCitation) => Promise<void>
  removeCitation: (id: string) => Promise<void>
  addLibrary: (name: string) => Promise<string>
  deleteLibrary: (id: string) => Promise<void>
  setActiveLibrary: (id: string) => void
  setPendingCitation: (citation?: SavedCitation) => void
  bumpCitationRenderVersion: () => void
  setCurrentProjectId: (projectId: string | null) => void
  syncLibrariesFromBackend: (projectId?: string | null, isSharedProject?: boolean) => Promise<void>
  setLibraries: (libraries: CitationLibrary[]) => void
  loadLibrariesFromSupabase: (projectId?: string | null, isSharedProject?: boolean) => Promise<void>
  addCitationsToLibrary: (libraryId: string, citations: SavedCitation[]) => void
  importCitationsFromLibrary: (sourceLibraryId: string, citationIds: string[]) => Promise<void>
  getAllLibrariesWithCitations: () => Promise<CitationLibrary[]>
  importBulkCitations: (citations: SavedCitation[]) => Promise<{ inserted: number; skipped: number }>
}

const createDefaultLibrary = (): CitationLibrary => ({
  id: 'library_default',
  name: 'Standardbibliothek',
  citations: [],
})

/**
 * Konvertiert einen Datumsstring sicher in ein ISO-String-Format
 * Falls der String nicht geparst werden kann, wird das aktuelle Datum verwendet
 */
function safeDateToISO(dateString: string | undefined | null): string {
  if (!dateString) {
    return new Date().toISOString()
  }

  try {
    const date = new Date(dateString)
    // Prüfe, ob das Datum gültig ist
    if (isNaN(date.getTime())) {
      return new Date().toISOString()
    }
    return date.toISOString()
  } catch (error) {
    // Falls die Konvertierung fehlschlägt, verwende das aktuelle Datum
    return new Date().toISOString()
  }
}

/**
 * Prüft, ob ein String eine gültige UUID ist
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Generiert eine sichere UUID für Citations
 * Falls die übergebene ID keine gültige UUID ist, wird eine neue generiert
 */
function ensureValidCitationId(id: string | undefined): string {
  if (id && isValidUUID(id)) {
    return id
  }
  // Generiere eine neue UUID
  return crypto.randomUUID()
}

export const useCitationStore = create<CitationState>()(
  persist(
    (set, get) => ({
      isSearchOpen: false,
      citationStyle: 'vancouver',
      citationFormat: 'numeric',
      citationNumberFormat: 'bracket',
      citationAuthorDateVariant: 'comma',
      citationAuthorVariant: 'with-parens',
      citationLabelVariant: 'bracket',
      citationNoteVariant: 'superscript',
      citationNumericRangeVariant: 'collapse',
      savedCitations: [],
      libraries: [createDefaultLibrary()],
      activeLibraryId: 'library_default',
      currentProjectId: undefined,
      pendingCitation: undefined,
      citationRenderVersion: 0,
      setCurrentProjectId: (projectId: string | null) => {
        set({ currentProjectId: projectId })
      },
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),
      toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
      setCitationStyle: (style) => set({ citationStyle: style }),
      setCitationFormat: (format) => set({ citationFormat: format }),
      setCitationNumberFormat: (format) => set({ citationNumberFormat: format }),
      setCitationAuthorDateVariant: (variant) => set({ citationAuthorDateVariant: variant }),
      setCitationAuthorVariant: (variant) => set({ citationAuthorVariant: variant }),
      setCitationLabelVariant: (variant) => set({ citationLabelVariant: variant }),
      setCitationNoteVariant: (variant) => set({ citationNoteVariant: variant }),
      setCitationNumericRangeVariant: (variant) => set({ citationNumericRangeVariant: variant }),
      addCitation: async (citation) => {
        const userId = await getCurrentUserId()

        // Prüfe auf Duplikate basierend auf DOI oder Titel+Jahr
        const currentState = get()
        const activeLib = currentState.libraries.find((l) => l.id === currentState.activeLibraryId)
        if (activeLib) {
          const isDuplicate = activeLib.citations.some((c) => {
            // Prüfe auf gleiche ID
            if (c.id === citation.id) return true
            // Prüfe auf gleiche DOI
            if (citation.doi && c.doi === citation.doi) return true
            // Prüfe auf gleichen Titel und Jahr
            if (c.title === citation.title && c.year === citation.year) return true
            return false
          })

          if (isDuplicate) {
            devLog('⏭️ [CITATION STORE] Zitation bereits vorhanden, wird übersprungen:', citation.title)
            return
          }
        }

        if (!userId) {
          devWarn('⚠️ [CITATION STORE] Kein User eingeloggt, Citation wird nur lokal gespeichert')
          set((state) => {
            const libs = state.libraries.length ? [...state.libraries] : [createDefaultLibrary()]
            const activeId = state.activeLibraryId || libs[0].id
            const idx = libs.findIndex((l) => l.id === activeId)
            const activeLib = idx >= 0 ? libs[idx] : createDefaultLibrary()
            if (idx === -1) {
              libs.push(activeLib)
            }
            const filtered = activeLib.citations.filter((c) => c.id !== citation.id)
            const updatedCitations = [citation, ...filtered]
            const nextLib = { ...activeLib, citations: updatedCitations }
            if (idx >= 0) {
              libs[idx] = nextLib
            } else {
              libs.push(nextLib)
            }
            return { libraries: libs, savedCitations: updatedCitations, activeLibraryId: activeId }
          })
          return
        }

        const state = get()
        let activeId: string | undefined = state.activeLibraryId || state.libraries[0]?.id

        // Stelle sicher, dass eine gültige Library-ID vorhanden ist
        if (!activeId || activeId === 'library_default') {
          // Erstelle Standardbibliothek in Supabase falls nötig
          const defaultLib = await citationLibrariesUtils.getDefaultCitationLibrary(userId)
          let libraryId = defaultLib?.id
          if (!libraryId) {
            try {
              const newLib = await citationLibrariesUtils.createCitationLibrary({
                user_id: userId,
                name: 'Standardbibliothek',
                is_default: true,
              })
              libraryId = newLib.id
              // Aktualisiere Store mit neuer Library und setze activeId
              activeId = libraryId
              set((s) => ({
                libraries: [...s.libraries.filter((l) => l.id !== 'library_default'), { id: libraryId!, name: 'Standardbibliothek', citations: [] }],
                activeLibraryId: libraryId,
              }))
            } catch (error) {
              devError('❌ [CITATION STORE] Fehler beim Erstellen der Standardbibliothek:', error)
              // Falls das Erstellen fehlschlägt, verwende null für library_id
              activeId = undefined
            }
          } else {
            // Verwende die existierende Standardbibliothek
            activeId = libraryId
            // Aktualisiere den Store, falls die Library noch nicht im State ist
            set((s) => {
              const libExists = s.libraries.some((l) => l.id === libraryId)
              if (!libExists) {
                return {
                  libraries: [...s.libraries.filter((l) => l.id !== 'library_default'), { id: libraryId!, name: 'Standardbibliothek', citations: [] }],
                  activeLibraryId: libraryId,
                }
              }
              return { activeLibraryId: libraryId }
            })
          }
        }

        try {
          // Stelle sicher, dass activeId korrekt gesetzt ist
          const finalActiveId = activeId !== 'library_default' ? activeId : undefined

          // Konvertiere SavedCitation zu Supabase Citation Format
          // Stelle sicher, dass die ID eine gültige UUID ist
          const citationId = ensureValidCitationId(citation.id)

          const citationData = {
            id: citationId,
            user_id: userId,
            library_id: finalActiveId || null, // Verwende null statt undefined für Supabase
            title: citation.title || null,
            source: citation.source || null,
            year: typeof citation.year === 'number' ? citation.year : citation.year ? parseInt(citation.year.toString()) : null,
            last_edited: safeDateToISO(citation.lastEdited),
            href: citation.href || null,
            external_url: citation.externalUrl || null,
            authors: citation.authors?.map((a: any) => {
              if (typeof a === 'string') return a === '[object Object]' ? '' : a;
              return a?.fullName || a?.name || '';
            }).filter(Boolean) || null,
            abstract: citation.abstract || null,
            doi: citation.doi || null,
            citation_style: 'vancouver', // Default, kann später angepasst werden
            in_text_citation: citation.title || '',
            full_citation: citation.title || '',
            metadata: {
              type: citation.type,
              imageUrl: citation.imageUrl || (citation as any).thumbnail || (citation as any).image,
              isbn: (citation as any).isbn,
              publisher: (citation as any).publisher,
              edition: (citation as any).edition,
              publisherPlace: (citation as any).publisherPlace,
            },
          }

          await citationsUtils.createCitation(citationData)

          // Aktualisiere lokalen State mit der neuen UUID
          // Der persist Middleware aktualisiert automatisch den localStorage
          set((s) => {
            const libs = s.libraries.length ? [...s.libraries] : [createDefaultLibrary()]
            const idx = libs.findIndex((l) => l.id === activeId)
            const activeLib = idx >= 0 ? libs[idx] : createDefaultLibrary()
            if (idx === -1) {
              libs.push(activeLib)
            }
            // Entferne alte Citation mit der ursprünglichen ID und füge neue mit UUID hinzu
            const filtered = activeLib.citations.filter((c) => c.id !== citation.id && c.id !== citationId)
            const updatedCitation = { ...citation, id: citationId }
            const updatedCitations = [updatedCitation, ...filtered]
            const nextLib = { ...activeLib, citations: updatedCitations }
            if (idx >= 0) {
              libs[idx] = nextLib
            } else {
              libs.push(nextLib)
            }
            return { libraries: libs, savedCitations: updatedCitations, activeLibraryId: activeId }
          })
        } catch (error) {
          // Detaillierte Fehlerbehandlung für besseres Debugging
          const errorDetails = error instanceof Error
            ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
            : error

          devError('❌ [CITATION STORE] Fehler beim Speichern der Citation:', {
            error: errorDetails,
            citationId: citation.id,
            citationTitle: citation.title,
            activeId,
            userId,
            citationData: {
              id: citation.id,
              title: citation.title,
              library_id: activeId !== 'library_default' ? activeId : undefined,
            },
          })

          // Fallback: nur lokal speichern
          set((s) => {
            const libs = s.libraries.length ? [...s.libraries] : [createDefaultLibrary()]
            const activeId = s.activeLibraryId || libs[0].id
            const idx = libs.findIndex((l) => l.id === activeId)
            const activeLib = idx >= 0 ? libs[idx] : createDefaultLibrary()
            if (idx === -1) {
              libs.push(activeLib)
            }
            const filtered = activeLib.citations.filter((c) => c.id !== citation.id)
            const updatedCitations = [citation, ...filtered]
            const nextLib = { ...activeLib, citations: updatedCitations }
            if (idx >= 0) {
              libs[idx] = nextLib
            } else {
              libs.push(nextLib)
            }
            return { libraries: libs, savedCitations: updatedCitations, activeLibraryId: activeId }
          })
        }
      },
      removeCitation: async (id) => {
        const userId = await getCurrentUserId()

        // Optimistisch aus allen Libraries im State löschen (nicht nur der aktiven)
        // Der persist Middleware aktualisiert automatisch den localStorage
        set((state) => {
          const updatedLibraries = state.libraries.map((lib) => ({
            ...lib,
            citations: lib.citations.filter((c) => c.id !== id),
          }))

          // Aktualisiere savedCitations basierend auf der aktiven Library
          const activeLib = updatedLibraries.find((lib) => lib.id === state.activeLibraryId) ?? updatedLibraries[0]

          return {
            libraries: updatedLibraries,
            savedCitations: activeLib?.citations || [],
          }
        })

        // Lösche aus Supabase, wenn User eingeloggt ist
        if (userId) {
          try {
            await citationsUtils.deleteCitation(id, userId)
          } catch (error) {
            devError('❌ [CITATION STORE] Fehler beim Löschen der Citation aus Supabase:', error)
            // Synchronisiere den State neu, falls das Löschen in der DB fehlgeschlagen ist
            const currentProjectId = get().currentProjectId
            await get().syncLibrariesFromBackend(currentProjectId)
          }
        }
      },
      addLibrary: async (name: string) => {
        const userId = await getCurrentUserId()
        const currentProjectId = get().currentProjectId
        if (!userId) {
          // Fallback: nur lokal
          const id = `library_${Date.now()}`
          const newLib: CitationLibrary = { id, name, citations: [] }
          set((state) => ({
            libraries: [...state.libraries, newLib],
            activeLibraryId: id,
            savedCitations: [],
          }))
          return id
        }

        try {
          const newLib = await citationLibrariesUtils.createCitationLibrary({
            user_id: userId,
            name,
            is_default: false,
            project_id: currentProjectId ?? undefined,
          })
          const library: CitationLibrary = { id: newLib.id, name: newLib.name, citations: [] }
          set((state) => ({
            libraries: [...state.libraries, library],
            activeLibraryId: newLib.id,
            savedCitations: [],
          }))
          return newLib.id
        } catch (error: any) {
          // Behandle 409 Conflict (Bibliothek existiert bereits)
          if (error?.code === '23505' || error?.status === 409) {
            devWarn('⚠️ [CITATION STORE] Bibliothek existiert bereits, versuche zu laden:', name)
            // Versuche die existierende Bibliothek zu finden
            const existingLibs = await citationLibrariesUtils.getCitationLibraries(userId)
            const existingLib = existingLibs.find((lib) => lib.name === name)
            if (existingLib) {
              const library: CitationLibrary = { id: existingLib.id, name: existingLib.name, citations: [] }
              set((state) => ({
                libraries: [...state.libraries, library],
                activeLibraryId: existingLib.id,
                savedCitations: [],
              }))
              return existingLib.id
            }
          }
          devError('❌ [CITATION STORE] Fehler beim Erstellen der Library:', error)
          // Fallback: nur lokal
          const id = `library_${Date.now()}`
          const newLib: CitationLibrary = { id, name, citations: [] }
          set((state) => ({
            libraries: [...state.libraries, newLib],
            activeLibraryId: id,
            savedCitations: [],
          }))
          return id
        }
      },
      deleteLibrary: async (id: string) => {
        const userId = await getCurrentUserId()

        // Verhindere das Löschen der Standardbibliothek
        if (id === 'library_default') {
          devWarn('⚠️ [CITATION STORE] Standardbibliothek kann nicht gelöscht werden')
          return
        }

        // Optimistisch aus lokalem State und localStorage löschen
        const previousState = get()

        // Verhindere das Löschen, wenn es die letzte Bibliothek ist
        if (previousState.libraries.length <= 1) {
          devWarn('⚠️ [CITATION STORE] Mindestens eine Bibliothek muss erhalten bleiben')
          return
        }

        set((state) => {
          const filteredLibraries = state.libraries.filter((lib) => lib.id !== id)

          // Wenn die gelöschte Bibliothek aktiv war, wechsle zur ersten verfügbaren
          let newActiveId = state.activeLibraryId
          if (state.activeLibraryId === id) {
            // Bevorzuge die Standardbibliothek, falls vorhanden, sonst die erste verfügbare
            newActiveId = filteredLibraries.find((lib) => lib.id === 'library_default')?.id || filteredLibraries[0]?.id
          }

          const activeLib = filteredLibraries.find((lib) => lib.id === newActiveId) ?? filteredLibraries[0]

          return {
            libraries: filteredLibraries,
            activeLibraryId: newActiveId,
            savedCitations: activeLib?.citations || [],
          }
        })

        // Lösche aus Supabase, wenn User eingeloggt und es eine UUID ist
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        if (isUUID && userId) {
          try {
            await citationLibrariesUtils.deleteCitationLibrary(id, userId)
          } catch (error) {
            devError('❌ [CITATION STORE] Fehler beim Löschen der Bibliothek aus Supabase:', error)
            // Rollback bei Fehler oder Neu-Synchronisation
            set({
              libraries: previousState.libraries,
              activeLibraryId: previousState.activeLibraryId,
              savedCitations: previousState.savedCitations
            })
            const currentProjectId = get().currentProjectId
            await get().syncLibrariesFromBackend(currentProjectId)
          }
        }
      },
      setActiveLibrary: (id: string) =>
        set((state) => {
          const lib = state.libraries.find((l) => l.id === id)
          if (!lib) return state
          return { activeLibraryId: id, savedCitations: lib.citations }
        }),
      setPendingCitation: (citation) => set({ pendingCitation: citation }),
      bumpCitationRenderVersion: () =>
        set((state) => ({ citationRenderVersion: state.citationRenderVersion + 1 })),
      setLibraries: (libraries) => {
        set((state) => {
          const activeId = state.activeLibraryId || libraries[0]?.id
          const activeLib = libraries.find((lib) => lib.id === activeId) ?? libraries[0]
          return {
            libraries,
            activeLibraryId: activeId,
            savedCitations: activeLib?.citations || [],
          }
        })
      },
      loadLibrariesFromSupabase: async (projectId?: string | null, isSharedProject?: boolean) => {
        const userId = await getCurrentUserId()
        if (!userId) {
          devWarn('⚠️ [CITATION STORE] Kein User eingeloggt, kann keine Libraries laden')
          return
        }

        const effectiveProjectId = projectId ?? get().currentProjectId

        try {
          devLog('🔄 [CITATION STORE] Lade Bibliotheken aus Supabase...', { projectId: effectiveProjectId, isSharedProject })

          const libraries = effectiveProjectId
            ? await citationLibrariesUtils.getCitationLibrariesByProject(effectiveProjectId)
            : await citationLibrariesUtils.getCitationLibraries(userId, undefined, effectiveProjectId ?? undefined)

          if (!libraries.length) {
            // Prüfe zuerst, ob bereits eine Standardbibliothek existiert
            // Verwende getDefaultCitationLibrary, das jetzt .limit(1) statt .single() verwendet
            let defaultLib = await citationLibrariesUtils.getDefaultCitationLibrary(userId)

            if (!defaultLib) {
              // Erstelle Standardbibliothek nur wenn keine existiert
              try {
                defaultLib = await citationLibrariesUtils.createCitationLibrary({
                  user_id: userId,
                  name: 'Standardbibliothek',
                  is_default: true,
                  project_id: effectiveProjectId ?? undefined,
                })
              } catch (error: any) {
                // 23503 = Foreign Key Constraint (Profile existiert nicht)
                // Das sollte jetzt nicht mehr passieren, da ensureProfileExists aufgerufen wird
                if (error?.code === '23503') {
                  devWarn('⚠️ [CITATION STORE] Profile existiert nicht, sollte automatisch erstellt werden')
                  // Die createCitationLibrary Funktion sollte das bereits behandeln,
                  // aber falls nicht, versuche nochmal
                  try {
                    defaultLib = await citationLibrariesUtils.createCitationLibrary({
                      user_id: userId,
                      name: 'Standardbibliothek',
                      is_default: true,
                    })
                  } catch (retryError: any) {
                    devWarn('⚠️ [CITATION STORE] Retry fehlgeschlagen:', retryError)
                  }
                }
                // 409 Conflict (bereits existiert durch Unique Constraint)
                else if (error?.code === '23505' || error?.status === 409) {
                  // Die Bibliothek wurde zwischenzeitlich erstellt (Race Condition)
                  // Lade sie
                  defaultLib = await citationLibrariesUtils.getDefaultCitationLibrary(userId)

                  // Falls immer noch null, versuche alle Bibliotheken zu laden
                  if (!defaultLib) {
                    const allLibs = await citationLibrariesUtils.getCitationLibraries(userId)
                    defaultLib = allLibs.find((lib) => lib.is_default === true) || null
                  }
                } else {
                  // Für andere Fehler, logge sie aber wirf sie nicht (Fallback auf lokale Bibliothek)
                  devWarn('⚠️ [CITATION STORE] Fehler beim Erstellen der Standardbibliothek:', error)
                }
              }
            }

            if (defaultLib) {
              libraries.push(defaultLib)
            }
          }

          const librariesWithCitations: CitationLibrary[] = await Promise.all(
            libraries.map(async (lib) => {
              const citations = await citationsUtils.getCitationsByLibrary(lib.id, effectiveProjectId ? undefined : userId)
              // Konvertiere Supabase Citations zu SavedCitation Format
              const savedCitations: SavedCitation[] = citations.map((c) => ({
                id: c.id,
                title: c.title || '',
                source: c.source || '',
                year: c.year || undefined,
                lastEdited: c.last_edited ? new Date(c.last_edited).toLocaleDateString('de-DE', { dateStyle: 'short' }) : new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
                href: c.href || undefined,
                externalUrl: c.external_url || undefined,
                doi: c.doi || undefined,
                authors: c.authors || undefined,
                abstract: c.abstract || undefined,
                type: (c.metadata as any)?.type || undefined,
                imageUrl: (c.metadata as any)?.imageUrl || undefined,
                isbn: (c.metadata as any)?.isbn || undefined,
                publisher: (c.metadata as any)?.publisher || undefined,
                edition: (c.metadata as any)?.edition || undefined,
                publisherPlace: (c.metadata as any)?.publisherPlace || undefined,
              }))
              return {
                id: lib.id,
                name: lib.name,
                citations: savedCitations,
              }
            })
          )

          set((state) => {
            const activeId = state.activeLibraryId && librariesWithCitations.some((l) => l.id === state.activeLibraryId)
              ? state.activeLibraryId
              : librariesWithCitations[0]?.id

            const activeLib = librariesWithCitations.find((lib) => lib.id === activeId) ?? librariesWithCitations[0]

            return {
              libraries: librariesWithCitations,
              activeLibraryId: activeId,
              savedCitations: activeLib?.citations || [],
            }
          })

          devLog(`✅ [CITATION STORE] ${librariesWithCitations.length} Bibliothek(en) geladen`)
        } catch (error) {
          logSupabaseError('CITATION STORE', error, { userId })
          // Fallback: Verwende leere Libraries wenn Supabase fehlschlägt
          set((state) => ({
            libraries: state.libraries || [createDefaultLibrary()],
            activeLibraryId: state.activeLibraryId || createDefaultLibrary().id,
            savedCitations: state.savedCitations || [],
          }))
        }
      },
      syncLibrariesFromBackend: async (projectId?: string | null, isSharedProject?: boolean) => {
        await get().loadLibrariesFromSupabase(projectId, isSharedProject)
      },
      addCitationsToLibrary: (libraryId: string, newCitations: SavedCitation[]) => {
        set((state) => {
          const libraries = state.libraries.map((lib) => {
            if (lib.id === libraryId) {
              const existingIds = new Set(lib.citations.map((c) => c.id))
              const uniqueNew = newCitations.filter((c) => !existingIds.has(c.id))
              return {
                ...lib,
                citations: [...lib.citations, ...uniqueNew],
              }
            }
            return lib
          })

          const activeLib = libraries.find((lib) => lib.id === state.activeLibraryId)
          return {
            libraries,
            savedCitations: activeLib?.citations || state.savedCitations,
          }
        })
      },
      importCitationsFromLibrary: async (sourceLibraryId: string, citationIds: string[]) => {
        const userId = await getCurrentUserId()
        if (!userId) {
          devWarn('⚠️ [CITATION STORE] Kein User eingeloggt, Import nicht möglich')
          return
        }

        const state = get()
        const activeLibraryId = state.activeLibraryId

        if (!activeLibraryId || activeLibraryId === sourceLibraryId) {
          devWarn('⚠️ [CITATION STORE] Kann nicht in dieselbe Bibliothek importieren')
          return
        }

        // Finde die Quell-Bibliothek
        const sourceLibrary = state.libraries.find((lib) => lib.id === sourceLibraryId)
        if (!sourceLibrary) {
          devWarn('⚠️ [CITATION STORE] Quell-Bibliothek nicht gefunden')
          return
        }

        // Filtere die zu importierenden Zitate
        const citationsToImport = sourceLibrary.citations.filter((c) => citationIds.includes(c.id))
        if (citationsToImport.length === 0) {
          devWarn('⚠️ [CITATION STORE] Keine Zitate zum Importieren gefunden')
          return
        }

        // Importiere jede Zitation mit neuer UUID in die aktive Bibliothek
        for (const citation of citationsToImport) {
          // Generiere eine neue UUID für die importierte Zitation
          const newCitationId = crypto.randomUUID()
          const now = new Date()
          const lastEdited = `Importiert am ${now.toLocaleDateString('de-DE', { dateStyle: 'short' })}`

          const newCitation: SavedCitation = {
            ...citation,
            id: newCitationId,
            lastEdited,
          }

          try {
            // Speichere in Supabase
            const citationData = {
              id: newCitationId,
              user_id: userId,
              library_id: activeLibraryId,
              title: citation.title || null,
              source: citation.source || null,
              year: typeof citation.year === 'number' ? citation.year : citation.year ? parseInt(citation.year.toString()) : null,
              last_edited: now.toISOString(),
              href: citation.href || null,
              external_url: citation.externalUrl || null,
              authors: citation.authors?.map((a: any) => {
                if (typeof a === 'string') return a === '[object Object]' ? '' : a;
                return a?.fullName || a?.name || '';
              }).filter(Boolean) || null,
              abstract: citation.abstract || null,
              doi: citation.doi || null,
              citation_style: 'vancouver',
              in_text_citation: citation.title || '',
              full_citation: citation.title || '',
              metadata: {},
            }

            await citationsUtils.createCitation(citationData)

            // Aktualisiere lokalen State
            set((s) => {
              const libraries = s.libraries.map((lib) => {
                if (lib.id === activeLibraryId) {
                  // Prüfe, ob Zitation bereits existiert (nach DOI oder Titel+Jahr)
                  const exists = lib.citations.some(
                    (c) =>
                      (citation.doi && c.doi === citation.doi) ||
                      (c.title === citation.title && c.year === citation.year)
                  )
                  if (exists) return lib

                  return {
                    ...lib,
                    citations: [newCitation, ...lib.citations],
                  }
                }
                return lib
              })

              const activeLib = libraries.find((lib) => lib.id === activeLibraryId)
              return {
                libraries,
                savedCitations: activeLib?.citations || s.savedCitations,
              }
            })

            devLog(`✅ [CITATION STORE] Zitat importiert: ${citation.title}`)
          } catch (error) {
            devError('❌ [CITATION STORE] Fehler beim Importieren der Zitation:', error)
          }
        }
      },
      getAllLibrariesWithCitations: async () => {
        const userId = await getCurrentUserId()
        if (!userId) {
          devWarn('⚠️ [CITATION STORE] Kein User eingeloggt')
          return []
        }

        try {
          // Lade ALLE Bibliotheken des Users (nicht projekt-gefiltert)
          const allLibraries = await citationLibrariesUtils.getCitationLibraries(userId)

          const librariesWithCitations: CitationLibrary[] = await Promise.all(
            allLibraries.map(async (lib) => {
              const citations = await citationsUtils.getCitationsByLibrary(lib.id, userId)
              const savedCitations: SavedCitation[] = citations.map((c) => ({
                id: c.id,
                title: c.title || '',
                source: c.source || '',
                year: c.year || undefined,
                lastEdited: c.last_edited
                  ? new Date(c.last_edited).toLocaleDateString('de-DE', { dateStyle: 'short' })
                  : new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
                href: c.href || undefined,
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

          return librariesWithCitations
        } catch (error) {
          devError('❌ [CITATION STORE] Fehler beim Laden aller Bibliotheken:', error)
          return []
        }
      },
      importBulkCitations: async (citations: SavedCitation[]) => {
        devLog('📥 [CITATION STORE] Starting bulk import of', citations.length, 'citations')

        const userId = await getCurrentUserId()
        if (!userId) {
          devWarn('⚠️ [CITATION STORE] Kein User eingeloggt, Bulk-Import nicht möglich')
          return { inserted: 0, skipped: citations.length }
        }

        const state = get()
        let activeId: string | undefined = state.activeLibraryId || state.libraries[0]?.id

        devLog('📥 [CITATION STORE] Active library ID:', activeId)

        // Stelle sicher, dass eine gültige Library-ID vorhanden ist
        if (!activeId || activeId === 'library_default') {
          const defaultLib = await citationLibrariesUtils.getDefaultCitationLibrary(userId)
          let libraryId = defaultLib?.id
          if (!libraryId) {
            try {
              const newLib = await citationLibrariesUtils.createCitationLibrary({
                user_id: userId,
                name: 'Standardbibliothek',
                is_default: true,
              })
              libraryId = newLib.id
              activeId = libraryId
              set((s) => ({
                libraries: [...s.libraries.filter((l) => l.id !== 'library_default'), { id: libraryId!, name: 'Standardbibliothek', citations: [] }],
                activeLibraryId: libraryId,
              }))
            } catch (error) {
              devError('❌ [CITATION STORE] Fehler beim Erstellen der Standardbibliothek:', error)
              return { inserted: 0, skipped: citations.length }
            }
          } else {
            activeId = libraryId
          }
        }

        const finalActiveId = activeId !== 'library_default' ? activeId : undefined

        devLog('📥 [CITATION STORE] Final library ID:', finalActiveId, 'User ID:', userId)

        // Konvertiere alle SavedCitations zu Supabase Citation Format
        const citationDataList = citations.map((citation) => {
          const citationId = crypto.randomUUID()
          return {
            id: citationId,
            user_id: userId,
            library_id: finalActiveId || null,
            title: citation.title || null,
            source: citation.source || null,
            year: typeof citation.year === 'number' ? citation.year : citation.year ? parseInt(citation.year.toString()) : null,
            last_edited: safeDateToISO(citation.lastEdited),
            href: citation.href || null,
            external_url: citation.externalUrl || null,
            authors: citation.authors?.map((a: any) => {
              if (typeof a === 'string') return a === '[object Object]' ? '' : a
              return a?.fullName || a?.name || ''
            }).filter(Boolean) || null,
            abstract: citation.abstract || null,
            doi: citation.doi || null,
            citation_style: 'vancouver' as const,
            in_text_citation: citation.title || '',
            full_citation: citation.title || '',
            metadata: {},
          }
        })

        devLog('📥 [CITATION STORE] Prepared', citationDataList.length, 'citations for insert')

        try {
          const result = await citationsUtils.bulkCreateCitations(citationDataList)
          devLog(`✅ [CITATION STORE] Bulk-Import: ${result.inserted} eingefügt, ${result.skipped} übersprungen`)

          // Lade die Bibliothek neu um den State zu aktualisieren
          await get().loadLibrariesFromSupabase(state.currentProjectId)

          return result
        } catch (error) {
          devError('❌ [CITATION STORE] Fehler beim Bulk-Import:', error)
          return { inserted: 0, skipped: citations.length }
        }
      },
    }),
    {
      name: 'citation-settings',
      partialize: (state) => ({
        citationStyle: state.citationStyle,
        citationFormat: state.citationFormat,
        citationNumberFormat: state.citationNumberFormat,
        citationAuthorDateVariant: state.citationAuthorDateVariant,
        citationAuthorVariant: state.citationAuthorVariant,
        citationLabelVariant: state.citationLabelVariant,
        citationNoteVariant: state.citationNoteVariant,
        citationNumericRangeVariant: state.citationNumericRangeVariant,
        savedCitations: state.savedCitations,
        libraries: state.libraries,
        activeLibraryId: state.activeLibraryId,
        // pendingCitation wird nicht persistiert
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        useCitationStore.setState((current: CitationState) => {
          const hasLibraries = current.libraries?.length > 0
          const libraries = hasLibraries ? current.libraries : [createDefaultLibrary()]
          // Migration: falls alte savedCitations ohne Libraries existieren, hänge sie an die Standardbibliothek an
          if (!hasLibraries && current.savedCitations?.length) {
            libraries[0].citations = current.savedCitations
          }
          const activeId =
            current.activeLibraryId && libraries.some((lib) => lib.id === current.activeLibraryId)
              ? current.activeLibraryId
              : libraries[0].id
          const activeLib = libraries.find((lib) => lib.id === activeId) ?? libraries[0]
          return {
            libraries,
            activeLibraryId: activeId,
            savedCitations: activeLib.citations,
          }
        })
      },
    }
  )
)
