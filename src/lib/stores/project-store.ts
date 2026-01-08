'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentUserId } from '@/lib/supabase/utils/auth'
import * as projectsUtils from '@/lib/supabase/utils/projects'
import { devLog, devError, devWarn } from '@/lib/utils/logger'

export interface Project {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

interface ProjectState {
  // State
  projects: Project[]
  currentProjectId: string | null
  isLoading: boolean
  isHydrated: boolean
  error: string | null

  // Actions
  loadProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project>
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (id: string) => void
  getCurrentProject: () => Project | null
  reset: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial State
      projects: [],
      currentProjectId: null,
      isLoading: false,
      isHydrated: false,
      error: null,

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated })
      },

      // Get current project (computed)
      getCurrentProject: () => {
        const state = get()
        return state.projects.find(p => p.id === state.currentProjectId) || null
      },

      // Actions
      loadProjects: async () => {
        const userId = await getCurrentUserId()
        if (!userId) {
          devWarn('[PROJECT STORE] User not authenticated')
          set({ error: 'User not authenticated', isLoading: false })
          return
        }

        set({ isLoading: true, error: null })

        try {
          devLog('[PROJECT STORE] Loading projects for user:', userId)
          const projectsData = await projectsUtils.getProjects(userId)

          // If no projects exist, create default
          if (projectsData.length === 0) {
            devLog('[PROJECT STORE] No projects found, creating default')
            const defaultProject = await projectsUtils.createProject({
              user_id: userId,
              name: 'Mein erstes Projekt',
              description: 'Automatisch erstelltes Standardprojekt',
              is_default: true,
            })
            projectsData.push(defaultProject)
          }

          const mappedProjects: Project[] = projectsData.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            isDefault: p.is_default,
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
          }))

          const currentId = get().currentProjectId
          // Validate currentProjectId or select default/first project
          const validCurrentId = mappedProjects.some(p => p.id === currentId)
            ? currentId
            : mappedProjects.find(p => p.isDefault)?.id || mappedProjects[0]?.id || null

          devLog('[PROJECT STORE] Loaded projects:', {
            count: mappedProjects.length,
            currentProjectId: validCurrentId,
          })

          set({
            projects: mappedProjects,
            currentProjectId: validCurrentId,
            isLoading: false,
            isHydrated: true,
          })
        } catch (error) {
          devError('[PROJECT STORE] Error loading projects:', error)
          set({ error: 'Failed to load projects', isLoading: false })
        }
      },

      createProject: async (name, description) => {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('User not authenticated')

        devLog('[PROJECT STORE] Creating project:', name)

        const newProject = await projectsUtils.createProject({
          user_id: userId,
          name,
          description: description || null,
          is_default: false,
        })

        const mapped: Project = {
          id: newProject.id,
          name: newProject.name,
          description: newProject.description,
          isDefault: newProject.is_default,
          createdAt: new Date(newProject.created_at),
          updatedAt: new Date(newProject.updated_at),
        }

        set(state => ({
          projects: [...state.projects, mapped],
          currentProjectId: mapped.id, // Switch to new project
        }))

        devLog('[PROJECT STORE] Project created and switched to:', mapped.id)
        return mapped
      },

      updateProject: async (id, updates) => {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('User not authenticated')

        devLog('[PROJECT STORE] Updating project:', id, updates)

        await projectsUtils.updateProject(id, {
          name: updates.name,
          description: updates.description,
        }, userId)

        set(state => ({
          projects: state.projects.map(p =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date() }
              : p
          ),
        }))
      },

      deleteProject: async (id) => {
        const userId = await getCurrentUserId()
        if (!userId) throw new Error('User not authenticated')

        const state = get()
        const project = state.projects.find(p => p.id === id)

        if (project?.isDefault) {
          throw new Error('Cannot delete default project')
        }

        if (state.projects.length <= 1) {
          throw new Error('Cannot delete the only project')
        }

        devLog('[PROJECT STORE] Deleting project:', id)
        await projectsUtils.deleteProject(id, userId)

        set(state => {
          const filtered = state.projects.filter(p => p.id !== id)
          // If deleting current project, switch to default or first
          const newCurrentId = state.currentProjectId === id
            ? filtered.find(p => p.isDefault)?.id || filtered[0]?.id || null
            : state.currentProjectId

          return {
            projects: filtered,
            currentProjectId: newCurrentId,
          }
        })
      },

      setCurrentProject: (id) => {
        devLog('[PROJECT STORE] Switching to project:', id)
        set({ currentProjectId: id })
      },

      reset: () => {
        devLog('[PROJECT STORE] Resetting store')
        set({
          projects: [],
          currentProjectId: null,
          isLoading: false,
          isHydrated: false,
          error: null,
        })
      },
    }),
    {
      name: 'project-store',
      // Only persist currentProjectId to localStorage
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          devLog('[PROJECT STORE] Rehydrated from localStorage:', {
            currentProjectId: state.currentProjectId,
          })
        }
      },
    }
  )
)
