'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/supabase/types'
import { devLog, devError } from '@/lib/utils/logger'

type Project = Database['public']['Tables']['projects']['Row']
type Document = Database['public']['Tables']['documents']['Row']
type CitationLibrary = Database['public']['Tables']['citation_libraries']['Row']
type ShareMode = 'view' | 'edit' | 'suggest'

export interface SharedProjectData {
  project: Project
  documents: Document[]
  libraries: CitationLibrary[]
  mode: ShareMode
  isOwner: boolean
  token: string
  expiresAt: string | null
}

interface SharedProjectState {
  sharedProject: SharedProjectData | null
  isLoading: boolean
  error: string | null
  
  loadSharedProject: (token: string) => Promise<void>
  clearSharedProject: () => void
  getShareMode: () => ShareMode | null
  isSharedAccess: () => boolean
}

export const useSharedProjectStore = create<SharedProjectState>()(
  persist(
    (set, get) => ({
      sharedProject: null,
      isLoading: false,
      error: null,

      loadSharedProject: async (token: string) => {
        set({ isLoading: true, error: null })

        try {
          devLog('[SHARED_PROJECT] Loading shared project with token')

          const response = await fetch(`/api/projects/access/${token}`)
          
          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Failed to load shared project')
          }

          const data = await response.json()

          const sharedProjectData: SharedProjectData = {
            project: data.project,
            documents: data.documents,
            libraries: data.libraries,
            mode: data.mode,
            isOwner: data.isOwner,
            token,
            expiresAt: data.expiresAt,
          }

          devLog('[SHARED_PROJECT] Loaded shared project:', {
            projectId: data.project.id,
            mode: data.mode,
            documentsCount: data.documents.length,
            librariesCount: data.libraries.length,
          })

          set({ sharedProject: sharedProjectData, isLoading: false })
        } catch (error) {
          devError('[SHARED_PROJECT] Error loading shared project:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Unknown error', 
            isLoading: false 
          })
        }
      },

      clearSharedProject: () => {
        devLog('[SHARED_PROJECT] Clearing shared project')
        set({ sharedProject: null, error: null })
      },

      getShareMode: () => {
        return get().sharedProject?.mode || null
      },

      isSharedAccess: () => {
        return get().sharedProject !== null
      },
    }),
    {
      name: 'shared-project-store',
      partialize: (state) => ({
        sharedProject: state.sharedProject,
      }),
    }
  )
)
