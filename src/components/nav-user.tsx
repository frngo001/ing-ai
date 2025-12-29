"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/use-language"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"

export function NavUser({
  user,
  onOpenSettings,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  onOpenSettings?: (nav?: string) => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useLanguage()
  const { isMobile, setOpen, addInteractionLock, removeInteractionLock } =
    useSidebar()
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setDropdownOpen(open)
      if (open) {
        // Prevent collapsing while the user menu is open.
        addInteractionLock()
        setOpen(true)
      } else {
        removeInteractionLock()
        if (!isMobile) {
          setOpen(false)
        }
      }
    },
    [addInteractionLock, removeInteractionLock, setOpen, isMobile]
  )

  React.useEffect(() => {
    return () => {
      if (dropdownOpen) {
        removeInteractionLock()
        if (!isMobile) {
          setOpen(false)
        }
      }
    }
  }, [dropdownOpen, removeInteractionLock, isMobile, setOpen])

  const handleLogout = React.useCallback(async () => {
    setDropdownOpen(false)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.replace("/auth/login")
      router.refresh()
    } catch (error: any) {
      console.error("Logout error", error)
      toast.error(t('sidebar.logoutFailed'), {
        description: error?.message ?? t('sidebar.pleaseTryAgain'),
      })
    }
  }, [supabase, router, t])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={dropdownOpen} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-neutral-100 data-[state=open]:text-sidebar-foreground hover:bg-neutral-50 dark:data-[state=open]:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                {t('sidebar.getProSubscription')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => {
                  setDropdownOpen(false)
                  onOpenSettings?.("account")
                }}
              >
                <BadgeCheck />
                {t('sidebar.account')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setDropdownOpen(false)
                  onOpenSettings?.("billing")
                }}
              >
                <CreditCard />
                {t('sidebar.billing')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setDropdownOpen(false)
                  onOpenSettings?.("notifications")
                }}
              >
                <Bell />
                {t('sidebar.notifications')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut />
              {t('sidebar.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
