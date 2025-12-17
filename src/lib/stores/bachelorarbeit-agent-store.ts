'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  startAgent: (arbeitType: ArbeitType, thema?: string) => void
  stopAgent: () => void
  setThema: (thema: string) => void
  setCurrentStep: (step: AgentStep) => void
  updateStepData: (step: number, data: any) => void
  getStepData: (step: number) => any

  // Quellen-Actions
  addSelectedSource: (source: SelectedSource) => void
  removeSelectedSource: (id: string) => void
  setPendingSources: (sources: SelectedSource[]) => void
  confirmSources: () => void
  rejectSources: () => void

  // Progress
  calculateProgress: () => number
  reset: () => void
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

      // Actions
      startAgent: (arbeitType, thema) => {
        set({
          isActive: true,
          arbeitType,
          thema,
          currentStep: 4, // Start mit Literaturrecherche
          startedAt: new Date(),
          lastUpdated: new Date(),
          progress: 0,
        })
      },

      stopAgent: () => {
        set({
          isActive: false,
          currentStep: null,
        })
      },

      setThema: (thema) => {
        set({ thema, lastUpdated: new Date() })
      },

      setCurrentStep: (step) => {
        set({
          currentStep: step,
          lastUpdated: new Date(),
          progress: get().calculateProgress(),
        })
      },

      updateStepData: (step, data) => {
        set((state) => {
          const newStepData = { ...state.stepData, [step]: data }
          return {
            stepData: newStepData,
            lastUpdated: new Date(),
            progress: get().calculateProgress(),
          }
        })
      },

      getStepData: (step) => {
        return get().stepData[step] || null
      },

      // Quellen-Actions
      addSelectedSource: (source) => {
        set((state) => ({
          selectedSources: [...state.selectedSources, source],
          lastUpdated: new Date(),
        }))
      },

      removeSelectedSource: (id) => {
        set((state) => ({
          selectedSources: state.selectedSources.filter((s) => s.id !== id),
          lastUpdated: new Date(),
        }))
      },

      setPendingSources: (sources) => {
        set({
          pendingSources: sources,
          lastUpdated: new Date(),
        })
      },

      confirmSources: () => {
        set((state) => ({
          selectedSources: [...state.selectedSources, ...state.pendingSources],
          pendingSources: [],
          lastUpdated: new Date(),
        }))
      },

      rejectSources: () => {
        set({
          pendingSources: [],
          lastUpdated: new Date(),
        })
      },

      calculateProgress: () => {
        const state = get()
        if (!state.currentStep) return 0

        // Phase 2: Schritt 4-6
        const stepProgress = ((state.currentStep - 4) / TOTAL_STEPS) * 100
        const dataProgress = Object.keys(state.stepData).length > 0 ? 10 : 0

        return Math.min(stepProgress + dataProgress, 100)
      },

      reset: () => {
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
        })
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
      }),
    }
  )
)

