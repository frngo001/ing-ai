'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  href: string
  externalUrl?: string
  doi?: string
  authors?: string[]
  abstract?: string
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
  addCitation: (citation: SavedCitation) => void
  removeCitation: (id: string) => void
  addLibrary: (name: string) => string
  setActiveLibrary: (id: string) => void
  setPendingCitation: (citation?: SavedCitation) => void
  bumpCitationRenderVersion: () => void
  syncLibrariesFromBackend: () => Promise<void>
  setLibraries: (libraries: CitationLibrary[]) => void
}

const createDefaultLibrary = (): CitationLibrary => ({
  id: 'library_default',
  name: 'Standardbibliothek',
  citations: [],
})

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
      pendingCitation: undefined,
      citationRenderVersion: 0,
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
      addCitation: (citation) =>
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
        }),
      removeCitation: (id) =>
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === state.activeLibraryId
              ? { ...lib, citations: lib.citations.filter((c) => c.id !== id) }
              : lib
          ),
          savedCitations: state.savedCitations.filter((c) => c.id !== id),
        })),
      addLibrary: (name: string) => {
        const id = `library_${Date.now()}`
        const newLib: CitationLibrary = { id, name, citations: [] }
        set((state) => ({
          libraries: [...state.libraries, newLib],
          activeLibraryId: id,
          savedCitations: [],
        }))
        return id
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
      syncLibrariesFromBackend: async () => {
        try {
          console.log('🔄 [CITATION STORE] Synchronisiere Bibliotheken vom Backend...')
          
          const response = await fetch('/api/library', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })

          if (!response.ok) {
            console.warn('⚠️ [CITATION STORE] Backend-Synchronisation fehlgeschlagen:', response.status)
            return
          }

          const result = await response.json()
          const backendLibraries: CitationLibrary[] = result.libraries || []

          if (!backendLibraries.length) {
            console.log('ℹ️ [CITATION STORE] Keine Bibliotheken im Backend gefunden')
            return
          }

          console.log(`✅ [CITATION STORE] ${backendLibraries.length} Bibliothek(en) vom Backend geladen`)

          // Merge-Strategie: Backend-Bibliotheken haben Priorität
          // Lokale Bibliotheken werden nur beibehalten, wenn sie nicht im Backend existieren
          set((state) => {
            const localLibraries = state.libraries || []
            const backendLibraryIds = new Set(backendLibraries.map((lib) => lib.id))

            // Behalte lokale Bibliotheken, die nicht im Backend sind
            const localOnlyLibraries = localLibraries.filter(
              (lib) => !backendLibraryIds.has(lib.id) && lib.id !== 'library_default'
            )

            // Kombiniere Backend-Bibliotheken mit lokalen (Backend hat Priorität)
            const mergedLibraries = [...backendLibraries, ...localOnlyLibraries]

            // Wenn keine Bibliotheken vorhanden sind, erstelle Standardbibliothek
            const finalLibraries =
              mergedLibraries.length > 0 ? mergedLibraries : [createDefaultLibrary()]

            // Setze aktive Bibliothek (behalte aktuelle wenn vorhanden, sonst erste)
            const activeId =
              state.activeLibraryId &&
              finalLibraries.some((lib) => lib.id === state.activeLibraryId)
                ? state.activeLibraryId
                : finalLibraries[0]?.id

            const activeLib = finalLibraries.find((lib) => lib.id === activeId) ?? finalLibraries[0]

            console.log('✅ [CITATION STORE] Bibliotheken synchronisiert:', {
              backend: backendLibraries.length,
              localOnly: localOnlyLibraries.length,
              total: finalLibraries.length,
              activeId,
            })

            return {
              libraries: finalLibraries,
              activeLibraryId: activeId,
              savedCitations: activeLib?.citations || [],
            }
          })
        } catch (error) {
          console.error('❌ [CITATION STORE] Fehler bei Backend-Synchronisation:', error)
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
