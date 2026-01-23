'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationSummaryFrequency = 'realtime' | 'daily' | 'weekly'

export type NotificationSettings = {
  email: boolean
  push: boolean
  desktop: boolean
  summary: NotificationSummaryFrequency
  // Desktop notification permission state
  desktopPermission: NotificationPermission | 'unsupported'
}

type NotificationSettingsState = NotificationSettings & {
  // Actions
  setEmailNotifications: (enabled: boolean) => void
  setPushNotifications: (enabled: boolean) => void
  setDesktopNotifications: (enabled: boolean) => Promise<boolean>
  setSummaryFrequency: (frequency: NotificationSummaryFrequency) => void
  updateDesktopPermission: () => void
  // Utility
  requestDesktopPermission: () => Promise<NotificationPermission>
}

const getInitialDesktopPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined') return 'default'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set, get) => ({
      // Default values
      email: true,
      push: false,
      desktop: false,
      summary: 'daily',
      desktopPermission: 'default',

      setEmailNotifications: (enabled) => set({ email: enabled }),

      setPushNotifications: (enabled) => set({ push: enabled }),

      setDesktopNotifications: async (enabled) => {
        if (!enabled) {
          set({ desktop: false })
          return true
        }

        // Request permission if enabling
        const permission = await get().requestDesktopPermission()
        if (permission === 'granted') {
          set({ desktop: true, desktopPermission: 'granted' })
          return true
        }

        set({ desktop: false, desktopPermission: permission })
        return false
      },

      setSummaryFrequency: (frequency) => set({ summary: frequency }),

      updateDesktopPermission: () => {
        const permission = getInitialDesktopPermission()
        set({ desktopPermission: permission })
        // If permission was revoked, disable desktop notifications
        if (permission !== 'granted') {
          set({ desktop: false })
        }
      },

      requestDesktopPermission: async () => {
        if (typeof window === 'undefined') return 'default'
        if (!('Notification' in window)) return 'denied'

        const permission = await Notification.requestPermission()
        set({ desktopPermission: permission })
        return permission
      },
    }),
    {
      name: 'notification-settings',
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Update permission state on hydration
        if (state) {
          state.updateDesktopPermission()
        }
      },
    }
  )
)
