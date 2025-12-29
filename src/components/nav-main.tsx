"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/i18n/use-language"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onSelectDocument,
  onSelectLibrary,
  onSelectAskAi,
  onSelectSettings,
  settingsOpen = false,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      isDocuments?: boolean
      isLibrary?: boolean
      isAskAi?: boolean
    }[]
    isSettings?: boolean
  }[]
  onSelectDocument?: () => void
  onSelectLibrary?: () => void
  onSelectAskAi?: () => void
  onSelectSettings?: () => void
  settingsOpen?: boolean
}) {
  const pathname = usePathname()
  const { t, language } = useLanguage()

  return (
    <div suppressHydrationWarning>
      <SidebarGroup>
        <SidebarGroupLabel>{t('sidebar.platform')}</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = !!item.items?.length
            const isActiveTop = item.isSettings ? settingsOpen : item.url === pathname

            if (!hasChildren) {
              const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
                if (item.isSettings) {
                  event.preventDefault()
                  onSelectSettings?.()
                }
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveTop} tooltip={item.title}>
                    <Link href={item.url} onClick={handleClick}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            const isOpenDefault =
              item.isActive ||
              item.items?.some((subItem) => subItem.url === pathname) ||
              item.url === pathname

            return (
              <Collapsible key={item.title} asChild defaultOpen={isOpenDefault} className="group/collapsible">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActiveTop}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">{t('sidebar.toggle')}</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={subItem.url}
                              onClick={() => {
                                if (subItem.isDocuments) onSelectDocument?.()
                                if (subItem.isLibrary) onSelectLibrary?.()
                                if (subItem.isAskAi) onSelectAskAi?.()
                              }}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    </div>
  )
}
