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
    // Helper to fetch profile data which is more up-to-date than auth session
    const syncUser = async (sessionUser: any) => {
      if (!sessionUser) {
        setUser(null)
        return
      }

      // 1. Basic info from session
      let newUser = {
        name: sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || t('sidebar.user'),
        email: sessionUser.email || "",
        avatar: sessionUser.user_metadata?.avatar_url || `/logos/logosApp/ing_AI.png`,
      }

      // 2. Try to fetch latest profile data to get updated avatar immediately
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, email')
          .eq('id', sessionUser.id)
          .single()

        if (profile) {
          newUser = {
            name: profile.full_name || newUser.name,
            email: profile.email || newUser.email,
            avatar: profile.avatar_url || newUser.avatar,
          }
        }
      } catch (e) {
        console.error("Profile fetch error", e)
      }

      setUser(newUser)
    }

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      syncUser(user)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user)
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
            className="w-full justify-center gap-2"
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
