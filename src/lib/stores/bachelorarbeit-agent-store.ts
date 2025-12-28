'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCurrentUserId } from '@/lib/supabase/utils/auth'
import * as agentStatesUtils from '@/lib/supabase/utils/agent-states'
import type { Json } from '@/lib/supabase/types'

export type ArbeitType = 'bachelor' | 'master' | 'general' | null

export type AgentStep =
  | 4  // Literaturrecherche
  | 5  // Forschungsstand analysieren
  | 6  // Methodik entwickeln

export type StepData = {
  [key: number]: any
}

export interface SelectedSource {
  id: string
  title: string
  authors?: string[]
  year?: number
  doi?: string
  url?: string
  citationCount?: number
  impactFactor?: number
  relevanceScore?: number
  reason?: string // Warum wurde diese Quelle ausgewählt
}

interface BachelorarbeitAgentState {
  // Agent Status
  isActive: boolean
  arbeitType: ArbeitType
  thema?: string

  // Schritt-Management
  currentStep: AgentStep | null
  stepData: StepData
  progress: number

  // Quellen-Management
  selectedSources: SelectedSource[]
  pendingSources: SelectedSource[] // Quellen die noch nicht bestätigt wurden

  // Timestamps
  startedAt: Date | null
  lastUpdated: Date | null

  // Actions
  startAgent: (arbeitType: ArbeitType, thema?: string) => Promise<void>
  stopAgent: () => Promise<void>
  setThema: (thema: string) => Promise<void>
  setCurrentStep: (step: AgentStep) => Promise<void>
  updateStepData: (step: number, data: any) => Promise<void>
  getStepData: (step: number) => any

  // Quellen-Actions
  addSelectedSource: (source: SelectedSource) => Promise<void>
  removeSelectedSource: (id: string) => Promise<void>
  setPendingSources: (sources: SelectedSource[]) => Promise<void>
  confirmSources: () => Promise<void>
  rejectSources: () => Promise<void>

  // Progress
  calculateProgress: () => number
  reset: () => Promise<void>
  loadAgentStateFromSupabase: () => Promise<void>
  agentStateId: string | null
}

const TOTAL_STEPS = 3 // Phase 2 hat 3 Schritte

export const useBachelorarbeitAgentStore = create<BachelorarbeitAgentState>()(
  persist(
    (set, get) => ({
      // Initial State
      isActive: false,
      arbeitType: null,
      thema: undefined,
      currentStep: null,
      stepData: {},
      progress: 0,
      selectedSources: [],
      pendingSources: [],
      startedAt: null,
      lastUpdated: null,
      agentStateId: null,

      // Actions
      startAgent: async (arbeitType, thema) => {
        const userId = await getCurrentUserId()
        const now = new Date()
        
        const newState = {
          isActive: true,
          arbeitType,
          thema,
          currentStep: 4 as AgentStep, // Start mit Literaturrecherche
          startedAt: now,
          lastUpdated: now,
          progress: 0,
        }

        set(newState)

        if (userId) {
          try {
            // Deaktiviere alle anderen Agent States
            await agentStatesUtils.deactivateAllAgentStates(userId)
            
            // Erstelle neuen Agent State
            const agentState = await agentStatesUtils.createAgentState({
              user_id: userId,
              is_active: true,
              arbeit_type: arbeitType,
              thema: thema || null,
              current_step: 4,
              step_data: {} as unknown as Json,
              progress: 0,
              selected_sources: [] as unknown as Json,
              pending_sources: [] as unknown as Json,
              started_at: now.toISOString(),
              last_updated: now.toISOString(),
            })
            
            set({ agentStateId: agentState.id })
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Speichern des Agent States:', error)
          }
        }
      },

      stopAgent: async () => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId

        set({
          isActive: false,
          currentStep: null,
        })

        if (userId && stateId) {
          try {
            await agentStatesUtils.updateAgentState(stateId, {
              is_active: false,
              current_step: null,
              last_updated: new Date().toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Stoppen des Agent States:', error)
          }
        }
      },

      setThema: async (thema) => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId
        const now = new Date()

        set({ thema, lastUpdated: now })

        if (userId && stateId) {
          try {
            await agentStatesUtils.updateAgentState(stateId, {
              thema,
              last_updated: now.toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Aktualisieren des Themas:', error)
          }
        }
      },

      setCurrentStep: async (step) => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId
        const now = new Date()
        const progress = get().calculateProgress()

        set({
          currentStep: step,
          lastUpdated: now,
          progress,
        })

        if (userId && stateId) {
          try {
            await agentStatesUtils.updateAgentState(stateId, {
              current_step: step,
              progress,
              last_updated: now.toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Aktualisieren des Schritts:', error)
          }
        }
      },

      updateStepData: async (step, data) => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId
        const now = new Date()
        
        set((state) => {
          const newStepData = { ...state.stepData, [step]: data }
          return {
            stepData: newStepData,
            lastUpdated: now,
            progress: get().calculateProgress(),
          }
        })

        if (userId && stateId) {
          try {
            const state = get()
            await agentStatesUtils.updateAgentState(stateId, {
              step_data: state.stepData as unknown as Json,
              progress: state.progress,
              last_updated: now.toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Aktualisieren der Schritt-Daten:', error)
          }
        }
      },

      getStepData: (step) => {
        return get().stepData[step] || null
      },

      // Quellen-Actions
      addSelectedSource: async (source) => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId
        const now = new Date()

        set((state) => ({
          selectedSources: [...state.selectedSources, source],
          lastUpdated: now,
        }))

        if (userId && stateId) {
          try {
            const state = get()
            await agentStatesUtils.updateAgentState(stateId, {
              selected_sources: state.selectedSources as unknown as Json,
              last_updated: now.toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Hinzufügen der Quelle:', error)
          }
        }
      },

      removeSelectedSource: async (id) => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId
        const now = new Date()

        set((state) => ({
          selectedSources: state.selectedSources.filter((s) => s.id !== id),
          lastUpdated: now,
        }))

        if (userId && stateId) {
          try {
            const state = get()
            await agentStatesUtils.updateAgentState(stateId, {
              selected_sources: state.selectedSources as unknown as Json,
              last_updated: now.toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Entfernen der Quelle:', error)
          }
        }
      },

      setPendingSources: async (sources) => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId
        const now = new Date()

        set({
          pendingSources: sources,
          lastUpdated: now,
        })

        if (userId && stateId) {
          try {
            await agentStatesUtils.updateAgentState(stateId, {
              pending_sources: sources as unknown as Json,
              last_updated: now.toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Setzen der pending Sources:', error)
          }
        }
      },

      confirmSources: async () => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId
        const now = new Date()

        set((state) => ({
          selectedSources: [...state.selectedSources, ...state.pendingSources],
          pendingSources: [],
          lastUpdated: now,
        }))

        if (userId && stateId) {
          try {
            const state = get()
            await agentStatesUtils.updateAgentState(stateId, {
              selected_sources: state.selectedSources as unknown as Json,
              pending_sources: [] as unknown as Json,
              last_updated: now.toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Bestätigen der Quellen:', error)
          }
        }
      },

      rejectSources: async () => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId
        const now = new Date()

        set({
          pendingSources: [],
          lastUpdated: now,
        })

        if (userId && stateId) {
          try {
            await agentStatesUtils.updateAgentState(stateId, {
              pending_sources: [] as unknown as Json,
              last_updated: now.toISOString(),
            }, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Ablehnen der Quellen:', error)
          }
        }
      },

      calculateProgress: () => {
        const state = get()
        if (!state.currentStep) return 0

        // Phase 2: Schritt 4-6
        const stepProgress = ((state.currentStep - 4) / TOTAL_STEPS) * 100
        const dataProgress = Object.keys(state.stepData).length > 0 ? 10 : 0

        return Math.min(stepProgress + dataProgress, 100)
      },

      reset: async () => {
        const userId = await getCurrentUserId()
        const stateId = get().agentStateId

        set({
          isActive: false,
          arbeitType: null,
          thema: undefined,
          currentStep: null,
          stepData: {},
          progress: 0,
          selectedSources: [],
          pendingSources: [],
          startedAt: null,
          lastUpdated: null,
          agentStateId: null,
        })

        if (userId && stateId) {
          try {
            await agentStatesUtils.deleteAgentState(stateId, userId)
          } catch (error) {
            console.error('❌ [AGENT STORE] Fehler beim Zurücksetzen des Agent States:', error)
          }
        }
      },
      loadAgentStateFromSupabase: async () => {
        const userId = await getCurrentUserId()
        if (!userId) {
          console.warn('⚠️ [AGENT STORE] Kein User eingeloggt, kann keinen Agent State laden')
          return
        }

        try {
          const agentState = await agentStatesUtils.getAgentState(userId)
          if (agentState && agentState.is_active) {
            set({
              isActive: agentState.is_active,
              arbeitType: agentState.arbeit_type,
              thema: agentState.thema || undefined,
              currentStep: agentState.current_step as AgentStep | null,
              stepData: (agentState.step_data as unknown as StepData) || {},
              progress: agentState.progress,
              selectedSources: (agentState.selected_sources as unknown as SelectedSource[]) || [],
              pendingSources: (agentState.pending_sources as unknown as SelectedSource[]) || [],
              startedAt: agentState.started_at ? new Date(agentState.started_at) : null,
              lastUpdated: agentState.last_updated ? new Date(agentState.last_updated) : null,
              agentStateId: agentState.id,
            })
          }
        } catch (error) {
          console.error('❌ [AGENT STORE] Fehler beim Laden des Agent States:', error)
        }
      },
    }),
    {
      name: 'bachelorarbeit-agent-state',
      partialize: (state) => ({
        isActive: state.isActive,
        arbeitType: state.arbeitType,
        thema: state.thema,
        currentStep: state.currentStep,
        stepData: state.stepData,
        selectedSources: state.selectedSources,
        startedAt: state.startedAt,
        lastUpdated: state.lastUpdated,
        agentStateId: state.agentStateId,
      }),
    }
  )
)

