'use client'

import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useNotificationSettingsStore } from '@/lib/stores/notification-settings-store'

export type NotificationOptions = {
  title: string
  body?: string
  icon?: string
  tag?: string
  onClick?: () => void
  // Override settings check (for critical notifications)
  force?: boolean
}

export function useNotifications() {
  const {
    email,
    push,
    desktop,
    summary,
    desktopPermission,
    setEmailNotifications,
    setPushNotifications,
    setDesktopNotifications,
    setSummaryFrequency,
    updateDesktopPermission,
    requestDesktopPermission,
  } = useNotificationSettingsStore()

  // Update permission state when component mounts or window regains focus
  useEffect(() => {
    updateDesktopPermission()

    const handleFocus = () => updateDesktopPermission()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [updateDesktopPermission])

  // Send a desktop notification
  const sendDesktopNotification = useCallback(
    (options: NotificationOptions) => {
      // Check if desktop notifications are enabled (unless forced)
      if (!options.force && !desktop) {
        return null
      }

      // Check permission
      if (desktopPermission !== 'granted') {
        return null
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/logos/logosApp/ing_AI.png',
          tag: options.tag,
        })

        if (options.onClick) {
          notification.onclick = () => {
            window.focus()
            options.onClick?.()
            notification.close()
          }
        }

        return notification
      } catch (error) {
        console.error('Failed to send desktop notification:', error)
        return null
      }
    },
    [desktop, desktopPermission]
  )

  // Send a toast notification
  const sendToastNotification = useCallback(
    (options: NotificationOptions & { type?: 'success' | 'error' | 'info' | 'warning' }) => {
      const { title, body, type = 'info', onClick } = options

      const toastOptions = {
        description: body,
        action: onClick
          ? {
              label: 'View',
              onClick,
            }
          : undefined,
      }

      switch (type) {
        case 'success':
          toast.success(title, toastOptions)
          break
        case 'error':
          toast.error(title, toastOptions)
          break
        case 'warning':
          toast.warning(title, toastOptions)
          break
        default:
          toast.info(title, toastOptions)
      }
    },
    []
  )

  // Unified notification sender - sends both desktop and toast based on settings
  const notify = useCallback(
    (
      options: NotificationOptions & {
        type?: 'success' | 'error' | 'info' | 'warning'
        desktopOnly?: boolean
        toastOnly?: boolean
      }
    ) => {
      const { desktopOnly, toastOnly, ...rest } = options

      // Send desktop notification if enabled
      if (!toastOnly) {
        sendDesktopNotification(rest)
      }

      // Send toast notification
      if (!desktopOnly) {
        sendToastNotification(rest)
      }
    },
    [sendDesktopNotification, sendToastNotification]
  )

  // Notification for export complete
  const notifyExportComplete = useCallback(
    (format: string) => {
      notify({
        title: 'Export Complete',
        body: `Your document has been exported as ${format}.`,
        type: 'success',
        tag: 'export-complete',
      })
    },
    [notify]
  )

  // Send email notification for project creation
  const sendProjectCreatedEmail = useCallback(
    async (projectName: string, projectDescription?: string) => {
      // Only send if email notifications are enabled
      if (!email) {
        return { sent: false, reason: 'email_disabled' }
      }

      try {
        const response = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'project_created',
            payload: { projectName, projectDescription },
          }),
        })

        const result = await response.json()
        return { sent: result.sent ?? false, error: result.error }
      } catch (error) {
        console.error('Failed to send project email:', error)
        return { sent: false, error }
      }
    },
    [email]
  )

  // Notification for project created (desktop + optional email)
  const notifyProjectCreated = useCallback(
    async (projectName: string, projectDescription?: string) => {
      // Desktop/toast notification
      notify({
        title: 'Project Created',
        body: `"${projectName}" has been created successfully.`,
        type: 'success',
        tag: 'project-created',
      })

      // Email notification (async, don't block)
      sendProjectCreatedEmail(projectName, projectDescription)
    },
    [notify, sendProjectCreatedEmail]
  )

  return {
    // Settings
    settings: {
      email,
      push,
      desktop,
      summary,
      desktopPermission,
    },
    // Setting actions
    setEmailNotifications,
    setPushNotifications,
    setDesktopNotifications,
    setSummaryFrequency,
    requestDesktopPermission,
    // Notification methods
    notify,
    sendDesktopNotification,
    sendToastNotification,
    // Active notification helpers
    notifyExportComplete,
    notifyProjectCreated,
    sendProjectCreatedEmail,
  }
}
