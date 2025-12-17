'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type EditorSettingsState = {
  autocompleteEnabled: boolean
  setAutocompleteEnabled: (enabled: boolean) => void
  toggleAutocomplete: () => void
}

export const useEditorSettingsStore = create<EditorSettingsState>()(
  persist(
    (set, get) => ({
      autocompleteEnabled: true,
      setAutocompleteEnabled: (enabled) => set({ autocompleteEnabled: enabled }),
      toggleAutocomplete: () =>
        set({ autocompleteEnabled: !get().autocompleteEnabled }),
    }),
    {
      name: 'editor-settings',
      version: 1,
    }
  )
)

