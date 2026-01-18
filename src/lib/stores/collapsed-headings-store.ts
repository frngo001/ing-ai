'use client'

import { create } from 'zustand'

type CollapsedHeadingsState = {
  // Map von documentId -> Set von element IDs die eingeklappt sind
  collapsedHeadings: Map<string, Set<string>>

  // Prüfen ob eine Überschrift eingeklappt ist
  isCollapsed: (documentId: string, elementId: string) => boolean

  // Überschrift ein-/ausklappen
  toggleCollapsed: (documentId: string, elementId: string) => void

  // Überschrift einklappen
  collapse: (documentId: string, elementId: string) => void

  // Überschrift ausklappen
  expand: (documentId: string, elementId: string) => void

  // Alle Überschriften für ein Dokument ausklappen
  expandAll: (documentId: string) => void

  // Alle Überschriften für ein Dokument einklappen
  collapseAll: (documentId: string, elementIds: string[]) => void
}

import { persist } from 'zustand/middleware'

export const useCollapsedHeadingsStore = create<CollapsedHeadingsState>()(
  persist(
    (set, get) => ({
      collapsedHeadings: new Map(),

      isCollapsed: (documentId, elementId) => {
        const docCollapsed = get().collapsedHeadings.get(documentId)
        return docCollapsed?.has(elementId) ?? false
      },

      toggleCollapsed: (documentId, elementId) => {
        set((state) => {
          const newMap = new Map(state.collapsedHeadings)
          const docCollapsed = new Set(newMap.get(documentId) ?? [])

          if (docCollapsed.has(elementId)) {
            docCollapsed.delete(elementId)
          } else {
            docCollapsed.add(elementId)
          }

          newMap.set(documentId, docCollapsed)
          return { collapsedHeadings: newMap }
        })
      },

      collapse: (documentId, elementId) => {
        set((state) => {
          const newMap = new Map(state.collapsedHeadings)
          const docCollapsed = new Set(newMap.get(documentId) ?? [])
          docCollapsed.add(elementId)
          newMap.set(documentId, docCollapsed)
          return { collapsedHeadings: newMap }
        })
      },

      expand: (documentId, elementId) => {
        set((state) => {
          const newMap = new Map(state.collapsedHeadings)
          const docCollapsed = new Set(newMap.get(documentId) ?? [])
          docCollapsed.delete(elementId)
          newMap.set(documentId, docCollapsed)
          return { collapsedHeadings: newMap }
        })
      },

      expandAll: (documentId) => {
        set((state) => {
          const newMap = new Map(state.collapsedHeadings)
          newMap.delete(documentId)
          return { collapsedHeadings: newMap }
        })
      },

      collapseAll: (documentId, elementIds) => {
        set((state) => {
          const newMap = new Map(state.collapsedHeadings)
          newMap.set(documentId, new Set(elementIds))
          return { collapsedHeadings: newMap }
        })
      },
    }),
    {
      name: 'collapsed-headings-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            const parsed = JSON.parse(str)
            // Convert plain object back to Map<string, Set<string>>
            const collapsedHeadings = new Map<string, Set<string>>()
            if (parsed.state && parsed.state.collapsedHeadings) {
              Object.entries(parsed.state.collapsedHeadings).forEach(([docId, ids]) => {
                collapsedHeadings.set(docId, new Set(ids as string[])) // Fix: ensure ids is treated as string[]
              })
              return { ...parsed, state: { ...parsed.state, collapsedHeadings } }
            }
            return parsed
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          // Convert Map<string, Set<string>> to plain object
          const collapsedHeadings: Record<string, string[]> = {}
          value.state.collapsedHeadings.forEach((ids: Set<string>, docId: string) => {
            collapsedHeadings[docId] = Array.from(ids)
          })

          const valueToSave = {
            ...value,
            state: {
              ...value.state,
              collapsedHeadings,
            },
          }
          localStorage.setItem(name, JSON.stringify(valueToSave))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
