"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Plus,
  Settings2,
  Pin,
  PinOff,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { OnboardingSidebarButton } from "@/components/onboarding"
import { ProjectSwitcher } from "@/components/project-switcher"
import { useLanguage } from "@/lib/i18n/use-language"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

// Entfernt: defaultUser wird nicht mehr verwendet, da nur authentifizierte Benutzer die App nutzen können

const getNavMain = (t: (key: string) => string) => [
  {
    title: t('sidebar.workspace'),
    url: "/editor",
    icon: LayoutDashboard,
    isActive: true,
    items: [
      {
        title: t('sidebar.documents'),
        url: "/editor",
        isDocuments: true,
      },
      {
        title: t('sidebar.library'),
        url: "/editor",
        isLibrary: true,
      },
      {
        title: t('sidebar.aiChat'),
        url: "/editor",
        isAskAi: true,
      },
    ],
  },
  {
    title: t('sidebar.account'),
    url: "#",
    icon: Settings2,
    isSettings: true,
  },
]

export function AppSidebar({
  documentsVisible = true,
  onToggleDocuments,
  libraryVisible = true,
  onToggleLibrary,
  askAiVisible = false,
  onToggleAskAi,
  settingsOpen = false,
  onOpenSettings,
  onCreateDocument,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  documentsVisible?: boolean
  onToggleDocuments?: () => void
  libraryVisible?: boolean
  onToggleLibrary?: () => void
  askAiVisible?: boolean
  onToggleAskAi?: () => void
  settingsOpen?: boolean
  onOpenSettings?: (nav?: string) => void
  onCreateDocument?: () => void
}) {
  const { t, language } = useLanguage()
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)
  const supabase = createClient()
  const { addInteractionLock, removeInteractionLock, state } = useSidebar()
  const [isPinned, setIsPinned] = React.useState(false)
  const navMain = React.useMemo(() => getNavMain(t), [t, language])

  React.useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!userError && user) {
        setUser({
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || t('sidebar.user'),
          email: user.email || "",
          avatar: user.user_metadata?.avatar_url || `/logos/logosApp/ing_AI.png`,
        })
      } else {
        setUser(null)
      }
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            t('sidebar.user'),
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || `/logos/logosApp/ing_AI.png`,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, t])

  const handleCreateDocument = React.useCallback(() => {
    if (onCreateDocument) {
      onCreateDocument()
      return
    }
    onToggleDocuments?.()
  }, [onCreateDocument, onToggleDocuments])

  const handleTogglePin = React.useCallback(() => {
    if (isPinned) {
      removeInteractionLock()
      setIsPinned(false)
    } else {
      addInteractionLock()
      setIsPinned(true)
    }
  }, [isPinned, addInteractionLock, removeInteractionLock])

  React.useEffect(() => {
    return () => {
      if (isPinned) {
        removeInteractionLock()
      }
    }
  }, [isPinned, removeInteractionLock])

  return (
    <div suppressHydrationWarning>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <ProjectSwitcher />
            </div>
            {state === "expanded" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={handleTogglePin}
                aria-label={isPinned ? t('sidebar.unpinSidebar') : t('sidebar.pinSidebar')}
                title={isPinned ? t('sidebar.unpinSidebar') : t('sidebar.pinSidebar')}
                suppressHydrationWarning
              >
                {isPinned ? (
                  <Pin className="h-4 w-4" />
                ) : (
                  <PinOff className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <Button
            size="sm"
            variant="default"
            className="w-full justify-center gap-2 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
            onClick={handleCreateDocument}
            aria-label={t('sidebar.newDocument')}
            data-onboarding="new-document-btn"
            suppressHydrationWarning
          >
            <Plus className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden" suppressHydrationWarning>{t('sidebar.newDocument')}</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <NavMain
            items={navMain}
            onSelectDocument={onToggleDocuments}
            onSelectLibrary={onToggleLibrary}
            onSelectAskAi={onToggleAskAi}
            onSelectSettings={onOpenSettings}
            settingsOpen={settingsOpen}
          />
        </SidebarContent>
        <SidebarFooter className="gap-3">
          <OnboardingSidebarButton />
          {user && <NavUser user={user} onOpenSettings={onOpenSettings} />}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  )
}
