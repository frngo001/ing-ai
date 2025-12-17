"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  Plus,
  Settings2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
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

// Sidebar data tailored for the editor workspace.
const defaultUser = {
  name: "Ing AI",
  email: "support@ing.ai",
  avatar: "/logos/logosApp/ing_AI.png",
}

const data = {
  teams: [
    {
      name: "Ing AI Team",
      logo: GalleryVerticalEnd,
      plan: "Produktiv",
    },
    {
      name: "Content Ops",
      logo: AudioWaveform,
      plan: "Review",
    },
    {
      name: "Labs",
      logo: Command,
      plan: "Beta",
    },
  ],
  navMain: [
    {
      title: "Workspace",
      url: "/editor",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Dokumente",
          url: "/editor",
          isDocuments: true,
        },
        {
          title: "Bibliothek",
          url: "/editor",
          isLibrary: true,
        },
        {
          title: "AI chat",
          url: "/editor",
          isAskAi: true,
        },
      ],
    },
    {
      title: "Einstellungen",
      url: "#",
      icon: Settings2,
      isSettings: true,
    },
  ],
}

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
  const [user, setUser] = React.useState(defaultUser)
  const supabase = createClient()

  React.useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        setUser({
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Benutzer",
          email: authUser.email || "",
          avatar: authUser.user_metadata?.avatar_url || defaultUser.avatar,
        })
      }
    }

    fetchUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Benutzer",
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
  }, [supabase])

  const handleCreateDocument = React.useCallback(() => {
    if (onCreateDocument) {
      onCreateDocument()
      return
    }
    onToggleDocuments?.()
  }, [onCreateDocument, onToggleDocuments])

  return (
    <div suppressHydrationWarning>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader className="space-y-2">
          <TeamSwitcher teams={data.teams} />
          <Button
            size="sm"
            className="w-full justify-center gap-2"
            onClick={handleCreateDocument}
            aria-label="Neues Dokument erstellen"
          >
            <Plus className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Neues Dokument</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <NavMain
            items={data.navMain}
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
                Upgrade auf Pro
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Schalte AI-Features und unbegrenzte Dokumente frei. Keine Limits, mehr Produktivität.
              </CardDescription>
            </CardContent>
            <CardFooter className="relative z-20 px-4 pb-4 pt-1">
              <Button className="w-full text-sm" variant="default">
                Jetzt upgraden
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
