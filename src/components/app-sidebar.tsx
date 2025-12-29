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
import { useLanguage } from "@/lib/i18n/use-language"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Particles from "@/components/Particles"
import { createClient } from "@/lib/supabase/client"

const defaultUser = {
  name: "Ing AI",
  email: "support@ing.ai",
  avatar: "/logos/logosApp/ing_AI.png",
}

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
  const [user, setUser] = React.useState(defaultUser)
  const supabase = createClient()
  const { addInteractionLock, removeInteractionLock, state } = useSidebar()
  const [isPinned, setIsPinned] = React.useState(false)
  const navMain = React.useMemo(() => getNavMain(t), [t, language])

  React.useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || t('sidebar.user'),
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || defaultUser.avatar,
        })
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
          avatar: session.user.user_metadata?.avatar_url || defaultUser.avatar,
        })
      } else {
        setUser(defaultUser)
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
          <div className="flex items-center justify-between px-2 py-1">
            <div className={`flex items-center justify-center flex-1 ${state === "expanded" ? "-mt-5" : ""}`}>
              <Image
                src="/logos/logosApp/ing_AI.png"
                alt="Ing AI Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            {state === "expanded" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 -mt-5"
                onClick={handleTogglePin}
                aria-label={isPinned ? t('sidebar.unpinSidebar') : t('sidebar.pinSidebar')}
                title={isPinned ? t('sidebar.unpinSidebar') : t('sidebar.pinSidebar')}
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
            className="w-full justify-center gap-2"
            onClick={handleCreateDocument}
            aria-label={t('sidebar.newDocument')}
          >
            <Plus className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">{t('sidebar.newDocument')}</span>
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
          <Card className="relative hidden min-h-[190px] overflow-hidden lg:flex bg-white/80 dark:bg-background/60 text-card-foreground mx-1 border border-border/60 shadow-sm group-data-[state=collapsed]:hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/80 via-white/40 to-white/90 dark:from-black/30 dark:via-background/20 dark:to-black/50" />
            <Particles
              className="absolute inset-0 z-10 opacity-100 pointer-events-none"
              particleColors={["#ffffff", "#e5e7eb"]}
              particleCount={200}
              particleSpread={6}
              speed={0.2}
              particleBaseSize={40}
              sizeRandomness={1}
              moveParticlesOnHover
              disableRotation={false}
              particleHoverFactor={1.4}
              alphaParticles
              cameraDistance={6}
              overlay
            />
            <CardContent className="relative z-20 space-y-3 px-4 pt-4">
              <CardTitle className="text-sm font-semibold leading-tight">
                {t('sidebar.upgradeToPro')}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                {t('sidebar.upgradeDescription')}
              </CardDescription>
            </CardContent>
            <CardFooter className="relative z-20 px-4 pb-4 pt-1">
              <Button className="w-full text-sm" variant="default">
                {t('sidebar.upgradeNow')}
              </Button>
            </CardFooter>
          </Card>
          <NavUser user={user} onOpenSettings={onOpenSettings} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  )
}
