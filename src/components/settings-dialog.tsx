"use client"
import * as React from "react"
import { useTheme } from "next-themes"
import { BadgeCheck, Bell, CreditCard, Database, GraduationCap, Paintbrush, Settings, ShieldCheck, User, Camera, Mail, UserCircle, Loader2, X as XIcon, Lock, ArrowRight, Check, Globe, Gift, Users } from "lucide-react"
import { useLanguage } from "@/lib/i18n/use-language"
import { useOnboardingStore } from "@/lib/stores/onboarding-store"
import { useNotifications } from "@/hooks/use-notifications"
import { useCurrentUserId } from "@/hooks/use-auth"
import { useUserProfile } from "@/hooks/use-user-profile"
import { createClient } from "@/lib/supabase/client"
import { updateProfile } from "@/lib/supabase/utils/profiles"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Announcement, AnnouncementTitle } from "@/components/ui/announcement"
import GithubMark from "@/components/logos/github"
import GoogleLogo from "@/components/logos/google"

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
  DialogTitle,
  DialogDescription,
  DialogClose,
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
import { cn } from "@udecode/cn"

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
  // Use the notification hook for persistent settings
  const {
    settings: notificationSettings,
    setEmailNotifications,
    setPushNotifications,
    setDesktopNotifications,
    setSummaryFrequency,
  } = useNotifications()
  const [dataControlSettings, setDataControlSettings] = React.useState({
    telemetry: true,
    personalization: true,
  })
  const [securitySettings, setSecuritySettings] = React.useState({
    twoFactor: false,
    sessionAlerts: true,
  })

  // Profile and Account state
  const userId = useCurrentUserId()
  const { profile, loading: profileLoading, refreshProfile } = useUserProfile(userId ?? undefined)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [accountForm, setAccountForm] = React.useState({
    name: "",
    email: "",
    avatarUrl: "",
  })
  const [passwordForm, setPasswordForm] = React.useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [identities, setIdentities] = React.useState<any[]>([])

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId) return

    setIsUpdating(true)
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrlWithCacheBust = `${publicUrl}?t=${new Date().getTime()}`

      // 3. Update local state
      setAccountForm(p => ({ ...p, avatarUrl: publicUrlWithCacheBust }))
      toast.success(t('settings.profileUpdateSuccess'))
    } catch (error: any) {
      console.error("Upload Fehler:", error)
      toast.error(t('settings.profileUpdateError'), {
        description: error.message
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const hasChanges = React.useMemo(() => {
    if (!profile) return false
    const nameChanged = accountForm.name !== (profile.name || "")
    const emailChanged = accountForm.email !== (profile.email || "")
    const avatarChanged = accountForm.avatarUrl !== (profile.avatarUrl || "")

    return nameChanged || emailChanged || avatarChanged
  }, [accountForm, profile])

  // Track if email verification is pending (if we had access to auth user object)
  // For now, we'll just show the email from the profile.

  const supabase = createClient()

  // Sync accountForm when profile loads
  React.useEffect(() => {
    if (profile) {
      setAccountForm({
        name: profile.name || "",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
      })
    }
  }, [profile])

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
      onChange: (checked) => setEmailNotifications(checked),
    },
    {
      title: t('settings.pushNotifications'),
      description: t('settings.pushNotificationsDescription'),
      checked: notificationSettings.push,
      onChange: (checked) => setPushNotifications(checked),
    },
    {
      title: t('settings.desktopNotifications'),
      description: notificationSettings.desktopPermission === 'denied'
        ? t('settings.desktopNotificationsBlocked')
        : t('settings.desktopNotificationsDescription'),
      checked: notificationSettings.desktop,
      onChange: async (checked) => {
        const success = await setDesktopNotifications(checked)
        if (!success && checked) {
          toast.error(t('settings.desktopNotificationsError'), {
            description: t('settings.desktopNotificationsErrorDescription'),
          })
        }
      },
    },
  ], [t, language, notificationSettings, setEmailNotifications, setPushNotifications, setDesktopNotifications])

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
      onClick: () => {
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 1000)),
          {
            loading: 'Portal wird geladen...',
            success: 'Abrechnungs-Portal geöffnet',
            error: 'Fehler beim Laden',
          }
        )
      },
    },
    {
      title: t('settings.invoiceEmails'),
      description: t('settings.invoiceEmailsDescription'),
      cta: t('settings.changeAddress'),
      onClick: () => toast("Adress-Änderung", {
        description: "Bitte kontaktieren Sie unseren Support für Adressänderungen.",
        action: {
          label: "Support",
          onClick: () => console.log("Support contact")
        }
      }),
    },
  ], [t, language])

  const planMapping = {
    free: {
      name: t('settings.freePlan'),
      icon: <Gift className="h-5 w-5" />,
      color: "text-muted-foreground"
    },
    pro: {
      name: t('settings.proPlan'),
      icon: <User className="h-5 w-5" />,
      color: "text-primary"
    },
    enterprise: {
      name: t('settings.enterprisePlan'),
      icon: <Users className="h-5 w-5" />,
      color: "text-indigo-500"
    }
  }

  const ActionRow = ({ title, description, cta, onClick, variant = "outline" }: ActionRowConfig & { variant?: "outline" | "default" }) => (
    <div className="group grid grid-cols-[1fr_auto] items-center gap-4 -mx-2 px-2 py-2 rounded-lg transition-all duration-200 hover:bg-muted/40">
      <div className="space-y-0.5">
        <p className="text-sm font-medium transition-colors">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Button
        variant={variant}
        size="sm"
        className={cn(
          "h-8 min-w-[100px] text-[11px] font-medium transition-all duration-300",
          variant === "outline" && "bg-background/50 border-muted-foreground/20 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        )}
        onClick={onClick}
      >
        {cta}
      </Button>
    </div>
  )

  const ToggleRow = ({ title, description, checked, onChange }: ToggleRowConfig) => (
    <div className="flex items-center justify-between gap-3 -mx-2 px-2 py-2 rounded-lg transition-all duration-200 hover:bg-muted/40">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )

  const accountActions: ActionRowConfig[] = React.useMemo(() => [
    {
      title: t('settings.workspaceRoles'),
      description: t('settings.workspaceRolesDescription'),
      cta: t('settings.editRoles'),
      onClick: () => toast.info("Workspace Roles", { description: "Pro-Version verfügbar." }),
    },
  ], [t, language])

  const handleUpdateAccount = async () => {
    if (!userId) return
    setIsUpdating(true)
    try {
      const updates: any = {}
      let authUpdate: any = { data: {} }
      let changed = false
      let emailChanged = false

      if (accountForm.name !== (profile?.name || "")) {
        updates.full_name = accountForm.name
        authUpdate.data = { ...authUpdate.data, full_name: accountForm.name }
        changed = true
      }

      if (accountForm.avatarUrl !== (profile?.avatarUrl || "")) {
        updates.avatar_url = accountForm.avatarUrl
        authUpdate.data = { ...authUpdate.data, avatar_url: accountForm.avatarUrl }
        changed = true
      }

      if (accountForm.email !== (profile?.email || "")) {
        authUpdate.email = accountForm.email
        emailChanged = true
      }

      if (changed) {
        await updateProfile(userId, updates)
        if (Object.keys(authUpdate.data || {}).length > 0) {
          await supabase.auth.updateUser({ data: authUpdate.data })
        }
        await refreshProfile()
      }

      if (emailChanged) {
        const { error } = await supabase.auth.updateUser({ email: authUpdate.email })
        if (error) throw error
        toast.success(t('settings.emailChangeSuccess'), {
          description: t('settings.emailChangeVerify')
        })
      } else if (changed) {
        toast.success(t('settings.profileUpdateSuccess'))
      } else {
        toast.info(t('settings.profileUpdateNoChanges'))
      }
    } catch (error: any) {
      console.error("Fehler beim Account-Update:", error)
      toast.error(t('settings.profileUpdateError'), {
        description: error?.message || t('settings.profileUpdateTryLater')
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!passwordForm.newPassword) return
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.passwordMismatch'))
      return
    }
    setIsUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })
      if (error) throw error
      toast.success(t('settings.passwordUpdateSuccess'))
      setPasswordForm({ newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      toast.error(t('settings.passwordUpdateError'), {
        description: error?.message || t('settings.passwordUpdateCheckInput')
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLinkIdentity = async (provider: string) => {
    try {
      const { data, error } = await supabase.auth.linkIdentity({ provider: provider as any })
      if (error) throw error
      // Redirect happens automatically
    } catch (error: any) {
      toast.error(t('settings.connectionFailed'), { description: error.message })
    }
  }

  const handleUnlinkIdentity = async (identity: any) => {
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity)
      if (error) throw error
      toast.success(t('settings.connectionDisconnected'))
      // Refresh identities
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setIdentities(user.identities || [])
    } catch (error: any) {
      toast.error(t('settings.disconnectionFailed'), { description: error.message })
    }
  }

  // Initial fetch of identities
  React.useEffect(() => {
    const fetchIdentities = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIdentities(user.identities || [])
      }
    }
    fetchIdentities()
  }, [])


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
      <DialogContent data-onboarding="settings-dialog" className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]" showCloseButton={false}>
        <div className="absolute top-4 right-4 z-[60] flex items-center gap-2">
          <DialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
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
                        onValueChange={(value: "realtime" | "daily" | "weekly") =>
                          setSummaryFrequency(value)
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
                  <div className="space-y-6 py-2">
                    <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-linear-to-b from-muted/50 to-muted/20 p-6">
                      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
                      <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                            {t('settings.currentPlan')}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm border border-primary/10",
                              planMapping[profile?.planType as keyof typeof planMapping]?.color
                            )}>
                              {planMapping[profile?.planType as keyof typeof planMapping]?.icon || <Gift className="h-5 w-5" />}
                            </div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl font-black tracking-tight text-foreground">
                                {planMapping[profile?.planType as keyof typeof planMapping]?.name || t('settings.freePlan')}
                              </h2>
                              {profile?.planType === 'pro' && (
                                <div className="px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                                  <span className="text-[9px] font-bold text-primary uppercase">Active</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {billingActions.map((item) => (
                        <ActionRow key={item.title} {...item} />
                      ))}
                    </div>
                  </div>
                )}

                {activeNav === "security" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {securityToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                    <Separator />

                    <div className="space-y-4 pt-4">
                      {/* Linked Accounts Section */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">{t('settings.linkedAccounts')}</h3>
                        <div className="space-y-3">
                          {/* Google */}
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-muted/30">
                                <GoogleLogo className="h-4 w-4" />
                              </div>
                              <div className="grid gap-0.5">
                                <p className="text-sm font-medium">{t('settings.google')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {identities.some(i => i.provider === 'google') ? t('settings.connected') : t('settings.disconnect')}
                                </p>
                              </div>
                            </div>
                            {identities.some(i => i.provider === 'google') ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const identity = identities.find(i => i.provider === 'google')
                                  if (identity) handleUnlinkIdentity(identity)
                                }}
                                disabled={identities.length <= 1} // Prevent locking out
                              >
                                {t('settings.disconnect')}
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleLinkIdentity('google')}>
                                {t('settings.connect')}
                              </Button>
                            )}
                          </div>

                          {/* GitHub */}
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-muted/30">
                                <GithubMark className="h-4 w-4" />
                              </div>
                              <div className="grid gap-0.5">
                                <p className="text-sm font-medium">{t('settings.github')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {identities.some(i => i.provider === 'github') ? t('settings.connected') : t('settings.disconnect')}
                                </p>
                              </div>
                            </div>
                            {identities.some(i => i.provider === 'github') ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const identity = identities.find(i => i.provider === 'github')
                                  if (identity) handleUnlinkIdentity(identity)
                                }}
                                disabled={identities.length <= 1}
                              >
                                {t('settings.disconnect')}
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleLinkIdentity('github')}>
                                {t('settings.connect')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {identities.some(i => i.provider === 'email')
                            ? t('settings.changePassword')
                            : t('settings.setPassword')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.passwordDescription')}
                        </p>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="grid gap-1.5">
                          <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder={t('settings.newPassword')}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="confirm-password">{t('settings.confirmPassword')}</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder={t('settings.confirmPassword')}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                          />
                        </div>
                        <button
                          onClick={handleUpdatePassword}
                          disabled={isUpdating || !passwordForm.newPassword}
                          className="group focus:outline-none w-full sm:w-auto"
                        >
                          <Announcement movingBorder className="px-4 py-0 h-9 bg-background hover:bg-muted/30 transition-colors cursor-pointer w-full justify-center">
                            <AnnouncementTitle className="gap-2 text-sm font-medium">
                              {isUpdating && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              )}
                              <span className="text-foreground/80 transition-colors">
                                {identities.some(i => i.provider === 'email')
                                  ? t('settings.changePassword')
                                  : t('settings.setPassword')}
                              </span>
                            </AnnouncementTitle>
                          </Announcement>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeNav === "account" && (
                  <div className="space-y-6 rounded-lg pr-3 py-3 overflow-y-auto">
                    {profileLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                        <p className="text-xs text-muted-foreground animate-pulse">{t('settings.profileLoading')}</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Interactive Profile Header */}
                        <div className="flex items-start gap-6 pb-2">
                          <div className="relative group shrink-0">
                            <div className="h-12 w-12 rounded-full overflow-hidden border-4 border-background shadow-2xl ring-2 ring-primary/5 transition-all duration-500 group-hover:ring-primary/20 ml-1">
                              {accountForm.avatarUrl ? (
                                <img
                                  src={accountForm.avatarUrl}
                                  alt="Avatar"
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/logos/logosApp/ing_AI.png"
                                  }}
                                />
                              ) : (
                                <div className="h-full w-full bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                  <UserCircle className="h-12 w-12 text-primary/20" />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border-2 border-primary/20"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3 w-3 text-white animate-spin" />
                              ) : (
                                <>
                                  <Camera className="h-3 w-3 text-white mb-1" />
                                  <span className="text-[8px] text-white font-medium">{t('settings.changeAvatar')}</span>
                                </>
                              )}
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                            />
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="grid gap-1.5">
                              <Label htmlFor="user-name" className="text-xs font-semibold">
                                {t('settings.profileTitle')}
                              </Label>
                              <div className="relative flex items-center">
                                <Input
                                  id="user-name"
                                  value={accountForm.name}
                                  onChange={(e) => setAccountForm(p => ({ ...p, name: e.target.value }))}
                                  placeholder="Ihr Name"
                                  className="h-9 pr-10"
                                />
                                {hasChanges && (
                                  <button
                                    onClick={handleUpdateAccount}
                                    disabled={isUpdating}
                                    className="absolute right-2 p-1.5 rounded-xs hover:bg-primary/10 text-primary transition-all duration-200 animate-in fade-in zoom-in-50"
                                    title={t('common.save')}
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4 stroke-[3px]" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {t('settings.profileDescription')}
                              </p>
                            </div>

                            <div className="grid gap-1.5">
                              <Label htmlFor="user-email" className="text-xs font-semibold">
                                {t('settings.email')}
                              </Label>
                              <Input
                                id="user-email"
                                value={accountForm.email}
                                onChange={(e) => setAccountForm(p => ({ ...p, email: e.target.value }))}
                                placeholder="email@example.com"
                                className="h-9 opacity-50 cursor-not-allowed"
                                disabled
                              />
                              <p className="text-[10px] text-muted-foreground">
                                {t('settings.emailDescription')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator className="opacity-50" />

                        {/* Additional Info Rows (Current Design Style) */}
                        <div className="space-y-4">
                          {accountActions.map((item) => (
                            <AccountRow key={item.title} {...item} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </main >
        </SidebarProvider >
      </DialogContent >
    </Dialog >
  )
}
