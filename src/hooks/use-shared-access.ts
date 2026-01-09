'use client'

import { useSearchParams } from 'next/navigation'
import { useSharedProjectStore } from '@/lib/stores/shared-project-store'
import { useEffect, useMemo } from 'react'

type ShareMode = 'view' | 'edit' | 'suggest'

interface SharedAccessState {
  isSharedAccess: boolean
  shareToken: string | null
  shareMode: ShareMode | null
  isOwner: boolean
  canEdit: boolean
  canSuggest: boolean
  canView: boolean
  isReadOnly: boolean
}

export function useSharedAccess(): SharedAccessState {
  const searchParams = useSearchParams()
  const sharedToken = searchParams.get('shared')
  
  const sharedProject = useSharedProjectStore((state) => state.sharedProject)
  const loadSharedProject = useSharedProjectStore((state) => state.loadSharedProject)

  useEffect(() => {
    if (sharedToken && (!sharedProject || sharedProject.token !== sharedToken)) {
      loadSharedProject(sharedToken)
    }
  }, [sharedToken, sharedProject, loadSharedProject])

  return useMemo(() => {
    const isSharedAccess = !!sharedToken && !!sharedProject
    const shareMode = sharedProject?.mode || null
    const isOwner = sharedProject?.isOwner || false

    if (!isSharedAccess || isOwner) {
      return {
        isSharedAccess,
        shareToken: sharedToken,
        shareMode,
        isOwner,
        canEdit: true,
        canSuggest: true,
        canView: true,
        isReadOnly: false,
      }
    }

    return {
      isSharedAccess: true,
      shareToken: sharedToken,
      shareMode,
      isOwner: false,
      canEdit: shareMode === 'edit',
      canSuggest: shareMode === 'edit' || shareMode === 'suggest',
      canView: true,
      isReadOnly: shareMode === 'view',
    }
  }, [sharedToken, sharedProject])
}

export function useSharedAccessBadge(): {
  showBadge: boolean
  badgeText: string
  badgeVariant: 'default' | 'secondary' | 'outline'
} {
  const { isSharedAccess, shareMode, isOwner } = useSharedAccess()

  return useMemo(() => {
    if (!isSharedAccess || isOwner) {
      return {
        showBadge: false,
        badgeText: '',
        badgeVariant: 'default' as const,
      }
    }

    switch (shareMode) {
      case 'view':
        return {
          showBadge: true,
          badgeText: 'Nur Ansicht',
          badgeVariant: 'secondary' as const,
        }
      case 'edit':
        return {
          showBadge: true,
          badgeText: 'Bearbeiten',
          badgeVariant: 'default' as const,
        }
      case 'suggest':
        return {
          showBadge: true,
          badgeText: 'Vorschlagen',
          badgeVariant: 'outline' as const,
        }
      default:
        return {
          showBadge: false,
          badgeText: '',
          badgeVariant: 'default' as const,
        }
    }
  }, [isSharedAccess, shareMode, isOwner])
}
