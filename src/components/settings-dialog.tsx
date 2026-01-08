"use client"
import * as React from "react"
import { useTheme } from "next-themes"
import { BadgeCheck, Bell, CreditCard, Database, GraduationCap, Paintbrush, Settings, ShieldCheck, User } from "lucide-react"
import { useLanguage } from "@/lib/i18n/use-language"
import { useOnboardingStore } from "@/lib/stores/onboarding-store"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

const getNavItems = (t: (key: string) => string) => [
  { name: t('settings.general'), key: 'general', icon: Settings },
  { name: t('settings.notifications'), key: 'notifications', icon: Bell },
  { name: t('settings.personalization'), key: 'personalization', icon: Paintbrush },
  { name: t('settings.dataControl'), key: 'dataControl', icon: Database },
  { name: t('settings.billing'), key: 'billing', icon: CreditCard },
  { name: t('settings.security'), key: 'security', icon: ShieldCheck },
  { name: t('settings.account'), key: 'account', icon: User },
]

type ThemeChoice = "light" | "dark" | "system"
type DensityChoice = "komfort" | "ausgewogen" | "kompakt"
type ContrastChoice = "standard" | "hoch"

type DisplaySettings = {
  theme: ThemeChoice
  fontSize: number
  lineHeight: number
  density: DensityChoice
  contrast: ContrastChoice
  focusMode: boolean
}

type ActionRowConfig = {
  title: string
  description: string
  cta: string
  onClick: () => void
}

type ToggleRowConfig = {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const DISPLAY_SETTINGS_KEY = "display-settings"
const defaultDisplaySettings: DisplaySettings = {
  theme: "system",
  fontSize: 16,
  lineHeight: 150,
  density: "komfort",
  contrast: "standard",
  focusMode: false,
}

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialNav?: string
}

export function SettingsDialog({ open, onOpenChange, initialNav }: SettingsDialogProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [settings, setSettings] = React.useState<DisplaySettings>(() => ({
    ...defaultDisplaySettings,
    theme: (resolvedTheme as ThemeChoice | undefined) ?? defaultDisplaySettings.theme,
  }))
  const navItems = React.useMemo(() => getNavItems(t), [t, language])
  const [activeNav, setActiveNav] = React.useState<string>(
    initialNav ?? navItems[0]?.key ?? "general"
  )
  const [generalSettings, setGeneralSettings] = React.useState({
    autoUpdates: true,
    keyboardShortcuts: true,
    compactMode: false,
  })
  const [notificationSettings, setNotificationSettings] = React.useState({
    email: true,
    push: false,
    desktop: true,
    summary: "daily",
  })
  const [dataControlSettings, setDataControlSettings] = React.useState({
    telemetry: true,
    personalization: true,
  })
  const [securitySettings, setSecuritySettings] = React.useState({
    twoFactor: false,
    sessionAlerts: true,
  })

  const generalToggles: ToggleRowConfig[] = React.useMemo(() => [
    {
      title: t('settings.autoUpdates'),
      description: t('settings.autoUpdatesDescription'),
      checked: generalSettings.autoUpdates,
      onChange: (checked) => setGeneralSettings((prev) => ({ ...prev, autoUpdates: checked })),
    },
    {
      title: t('settings.keyboardShortcuts'),
      description: t('settings.keyboardShortcutsDescription'),
      checked: generalSettings.keyboardShortcuts,
      onChange: (checked) =>
        setGeneralSettings((prev) => ({ ...prev, keyboardShortcuts: checked })),
    },
    {
      title: t('settings.compactMode'),
      description: t('settings.compactModeDescription'),
      checked: generalSettings.compactMode,
      onChange: (checked) => setGeneralSettings((prev) => ({ ...prev, compactMode: checked })),
    },
  ], [t, language, generalSettings])

  const notificationToggles: ToggleRowConfig[] = React.useMemo(() => [
    {
      title: t('settings.emailNotifications'),
      description: t('settings.emailNotificationsDescription'),
      checked: notificationSettings.email,
      onChange: (checked) => setNotificationSettings((prev) => ({ ...prev, email: checked })),
    },
    {
      title: t('settings.pushNotifications'),
      description: t('settings.pushNotificationsDescription'),
      checked: notificationSettings.push,
      onChange: (checked) => setNotificationSettings((prev) => ({ ...prev, push: checked })),
    },
    {
      title: t('settings.desktopNotifications'),
      description: t('settings.desktopNotificationsDescription'),
      checked: notificationSettings.desktop,
      onChange: (checked) => setNotificationSettings((prev) => ({ ...prev, desktop: checked })),
    },
  ], [t, language, notificationSettings])

  const dataControlToggles: ToggleRowConfig[] = React.useMemo(() => [
    {
      title: t('settings.telemetry'),
      description: t('settings.telemetryDescription'),
      checked: dataControlSettings.telemetry,
      onChange: (checked) => setDataControlSettings((prev) => ({ ...prev, telemetry: checked })),
    },
    {
      title: t('settings.personalizedSuggestions'),
      description: t('settings.personalizedSuggestionsDescription'),
      checked: dataControlSettings.personalization,
      onChange: (checked) =>
        setDataControlSettings((prev) => ({ ...prev, personalization: checked })),
    },
  ], [t, language, dataControlSettings])

  const securityToggles: ToggleRowConfig[] = React.useMemo(() => [
    {
      title: t('settings.twoFactorAuth'),
      description: t('settings.twoFactorAuthDescription'),
      checked: securitySettings.twoFactor,
      onChange: (checked) => setSecuritySettings((prev) => ({ ...prev, twoFactor: checked })),
    },
    {
      title: t('settings.loginNotifications'),
      description: t('settings.loginNotificationsDescription'),
      checked: securitySettings.sessionAlerts,
      onChange: (checked) =>
        setSecuritySettings((prev) => ({ ...prev, sessionAlerts: checked })),
    },
  ], [t, language, securitySettings])

  const billingActions: ActionRowConfig[] = React.useMemo(() => [
    {
      title: t('settings.planBilling'),
      description: t('settings.planBillingDescription'),
      cta: t('settings.managePlan'),
      onClick: () => console.log("Plan verwalten"),
    },
    {
      title: t('settings.invoiceEmails'),
      description: t('settings.invoiceEmailsDescription'),
      cta: t('settings.changeAddress'),
      onClick: () => console.log("Abrechnungsadresse ändern"),
    },
  ], [t, language])
  const ActionRow = ({ title, description, cta, onClick }: ActionRowConfig) => (
    <div className="grid grid-cols-[1fr_auto] items-start gap-3 pr-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        className="inline-flex h-9 min-w-[140px] items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
        onClick={onClick}
      >
        {cta}
      </button>
    </div>
  )

  const ToggleRow = ({ title, description, checked, onChange }: ToggleRowConfig) => (
    <div className="flex items-center justify-between gap-3 pr-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )

  const accountActions: ActionRowConfig[] = React.useMemo(() => [
    {
      title: t('settings.profileTitle'),
      description: t('settings.profileDescription'),
      cta: t('settings.edit'),
      onClick: () => console.log("Profil bearbeiten"),
    },
    {
      title: t('settings.email'),
      description: t('settings.emailDescription'),
      cta: t('settings.changeEmail'),
      onClick: () => console.log("E-Mail ändern"),
    },
    {
      title: t('settings.avatar'),
      description: t('settings.avatarDescription'),
      cta: t('settings.changeAvatar'),
      onClick: () => console.log("Avatar aktualisieren"),
    },
    {
      title: t('settings.linkedAccounts'),
      description: t('settings.linkedAccountsDescription'),
      cta: t('settings.manageAccounts'),
      onClick: () => console.log("Verknüpfte Konten öffnen"),
    },
    {
      title: t('settings.workspaceRoles'),
      description: t('settings.workspaceRolesDescription'),
      cta: t('settings.editRoles'),
      onClick: () => console.log("Workspace verwalten"),
    },
  ], [t, language])

  const AccountRow = ({ title, description, cta, onClick }: ActionRowConfig) => (
    <div className="grid grid-cols-[1fr_auto] items-start gap-3 pr-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        className="inline-flex h-9 min-w-[140px] items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
        onClick={onClick}
      >
        {cta}
      </button>
    </div>
  )

  const applyDisplaySettings = React.useCallback(
    (draft: DisplaySettings) => {
      if (typeof document === "undefined") return
      const root = document.documentElement

      root.style.setProperty("--app-font-size", `${draft.fontSize}px`)
      root.style.fontSize = `${draft.fontSize}px`

      root.style.setProperty(
        "--app-line-height",
        (draft.lineHeight / 100).toFixed(2).toString()
      )

      root.style.setProperty(
        "--app-contrast-strength",
        draft.contrast === "hoch" ? "1.05" : "1"
      )

      root.dataset.density = draft.density
      root.dataset.contrast = draft.contrast
      root.dataset.focusMode = draft.focusMode ? "on" : "off"

      setTheme(draft.theme)
    },
    [setTheme]
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(DISPLAY_SETTINGS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<DisplaySettings>
        const merged = {
          ...defaultDisplaySettings,
          ...parsed,
          theme:
            (parsed.theme as ThemeChoice | undefined) ??
            (resolvedTheme as ThemeChoice | undefined) ??
            defaultDisplaySettings.theme,
        }
        setSettings(merged)
        applyDisplaySettings(merged)
        setIsHydrated(true)
        return
      } catch (error) {
        console.error("Konnte Anzeige-Einstellungen nicht laden:", error)
      }
    }

    const initialSettings = {
      ...defaultDisplaySettings,
      theme: (resolvedTheme as ThemeChoice | undefined) ?? defaultDisplaySettings.theme,
    }
    setSettings(initialSettings)
    applyDisplaySettings(initialSettings)
    setIsHydrated(true)
  }, [applyDisplaySettings, resolvedTheme])

  React.useEffect(() => {
    if (!open) return
    if (initialNav) {
      setActiveNav(initialNav)
    } else {
      setActiveNav(navItems[0]?.key ?? "general")
    }
  }, [open, initialNav, navItems])

  React.useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return
    applyDisplaySettings(settings)
    localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(settings))
  }, [applyDisplaySettings, isHydrated, settings])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-onboarding="settings-dialog" className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">{t('settings.title')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('settings.description')}
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.key === activeNav}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveNav(item.key)}
                            className="flex items-center gap-2"
                          >
                            <item.icon />
                            <span>{item.name}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">{t('settings.title')}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{navItems.find(item => item.key === activeNav)?.name || activeNav}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pt-0">
              <section className="max-w-3xl space-y-6">
                {activeNav === "general" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t('settings.language')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.languageDescription')}
                        </p>
                      </div>
                      <Select
                        value={language}
                        onValueChange={(value) => setLanguage(value as "en" | "de" | "fr" | "es")}
                      >
                        <SelectTrigger className="min-w-[160px]">
                          <SelectValue placeholder={t('settings.language')} />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    {generalToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                    <Separator />
                    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t('settings.restartOnboarding')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.restartOnboardingDescription')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 min-w-[140px] items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
                        onClick={async () => {
                          const { resetOnboarding } = useOnboardingStore.getState()
                          await resetOnboarding()
                          onOpenChange(false)
                        }}
                      >
                        <GraduationCap className="h-4 w-4" />
                        {t('settings.restartOnboardingButton')}
                      </button>
                    </div>
                  </div>
                )}

                {activeNav === "notifications" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {notificationToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t('settings.summary')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.summaryDescription')}
                        </p>
                      </div>
                      <Select
                        value={notificationSettings.summary}
                        onValueChange={(value: string) =>
                          setNotificationSettings((prev) => ({ ...prev, summary: value }))
                        }
                      >
                        <SelectTrigger className="min-w-[160px]">
                          <SelectValue placeholder={t('settings.daily')} />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="realtime">{t('settings.realtime')}</SelectItem>
                          <SelectItem value="daily">{t('settings.daily')}</SelectItem>
                          <SelectItem value="weekly">{t('settings.weekly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeNav === "personalization" && (
                  <div className="space-y-5 rounded-lg pr-3 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('settings.colorScheme')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.colorSchemeDescription')}
                          </p>
                        </div>
                        <Select
                          value={settings.theme}
                          onValueChange={(value: ThemeChoice) =>
                            setSettings((prev) => ({ ...prev, theme: value }))
                          }
                        >
                          <SelectTrigger className="min-w-[160px]">
                            <SelectValue placeholder={t('settings.system')} />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="light">{t('settings.light')}</SelectItem>
                            <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                            <SelectItem value="system">{t('settings.system')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('settings.fontSize')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.fontSizeDescription')}
                          </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          {settings.fontSize}px
                        </span>
                      </div>
                      <Slider
                        min={12}
                        max={20}
                        step={1}
                        value={[settings.fontSize]}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            fontSize: value?.[0] ?? prev.fontSize,
                          }))
                        }
                        aria-label={t('settings.fontSize')}
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('settings.lineHeight')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.lineHeightDescription')}
                          </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          {settings.lineHeight}%
                        </span>
                      </div>
                      <Slider
                        min={120}
                        max={200}
                        step={10}
                        value={[settings.lineHeight]}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            lineHeight: value?.[0] ?? prev.lineHeight,
                          }))
                        }
                        aria-label={t('settings.lineHeight')}
                      />
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('settings.layoutDensity')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.layoutDensityDescription')}
                          </p>
                        </div>
                        <Select
                          value={settings.density}
                          onValueChange={(value: DensityChoice) =>
                            setSettings((prev) => ({ ...prev, density: value }))
                          }
                        >
                          <SelectTrigger className="min-w-[160px]">
                            <SelectValue placeholder={t('settings.comfort')} />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="komfort">{t('settings.comfort')}</SelectItem>
                            <SelectItem value="ausgewogen">{t('settings.balanced')}</SelectItem>
                            <SelectItem value="kompakt">{t('settings.compact')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('settings.contrast')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.contrastDescription')}
                          </p>
                        </div>
                        <Select
                          value={settings.contrast}
                          onValueChange={(value: ContrastChoice) =>
                            setSettings((prev) => ({ ...prev, contrast: value }))
                          }
                        >
                          <SelectTrigger className="min-w-[160px]">
                            <SelectValue placeholder={t('settings.standard')} />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="standard">{t('settings.standard')}</SelectItem>
                            <SelectItem value="hoch">{t('settings.high')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('settings.focusMode')}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.focusModeDescription')}
                          </p>
                        </div>
                        <Label className="flex items-center gap-3">
                          <Switch
                            checked={settings.focusMode}
                            onCheckedChange={(checked: boolean) =>
                              setSettings((prev) => ({ ...prev, focusMode: checked }))
                            }
                            aria-label={t('settings.focusMode')}
                          />
                          <span className="text-sm">{t('settings.enable')}</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {activeNav === "dataControl" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {dataControlToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t('settings.dataExport')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.dataExportDescription')}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
                      onClick={() => console.log("Data export requested")}
                    >
                      {t('settings.startExport')}
                    </button>
                  </div>
                )}

                {activeNav === "billing" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {billingActions.map((item) => (
                      <ActionRow key={item.title} {...item} />
                    ))}
                  </div>
                )}

                {activeNav === "security" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {securityToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t('settings.password')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.passwordDescription')}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
                      onClick={() => console.log("Passwort ändern")}
                    >
                      {t('settings.changePassword')}
                    </button>
                  </div>
                )}

                {activeNav === "account" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {accountActions.map((item) => (
                      <AccountRow key={item.title} {...item} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
