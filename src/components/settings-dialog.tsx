"use client"
import * as React from "react"
import { useTheme } from "next-themes"
import { BadgeCheck, Bell, CreditCard, Database, Paintbrush, Settings, ShieldCheck, User } from "lucide-react"

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

const data = {
  nav: [
    { name: "General", icon: Settings },
    { name: "Benachrichtigungen", icon: Bell },
    { name: "Personalisierung", icon: Paintbrush },
    { name: "Datenkontrolle", icon: Database },
    { name: "Abrechnung", icon: CreditCard },
    { name: "Sicherheit", icon: ShieldCheck },
    { name: "Konto", icon: User },
  ],
}

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
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [settings, setSettings] = React.useState<DisplaySettings>(() => ({
    ...defaultDisplaySettings,
    theme: (resolvedTheme as ThemeChoice | undefined) ?? defaultDisplaySettings.theme,
  }))
  const [activeNav, setActiveNav] = React.useState<string>(
    initialNav ?? data.nav[0]?.name ?? "General"
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

  const generalToggles: ToggleRowConfig[] = [
    {
      title: "Automatische Updates",
      description: "Neue Versionen automatisch installieren, wenn verfügbar.",
      checked: generalSettings.autoUpdates,
      onChange: (checked) => setGeneralSettings((prev) => ({ ...prev, autoUpdates: checked })),
    },
    {
      title: "Tastenkürzel",
      description: "Aktiviert Tastenkürzel für häufige Aktionen.",
      checked: generalSettings.keyboardShortcuts,
      onChange: (checked) =>
        setGeneralSettings((prev) => ({ ...prev, keyboardShortcuts: checked })),
    },
    {
      title: "Kompakter Modus",
      description: "Reduzierte Abstände für mehr Inhalte pro Seite.",
      checked: generalSettings.compactMode,
      onChange: (checked) => setGeneralSettings((prev) => ({ ...prev, compactMode: checked })),
    },
  ]

  const notificationToggles: ToggleRowConfig[] = [
    {
      title: "E-Mail-Benachrichtigungen",
      description: "Wichtige Updates und Zusammenfassungen per E-Mail.",
      checked: notificationSettings.email,
      onChange: (checked) => setNotificationSettings((prev) => ({ ...prev, email: checked })),
    },
    {
      title: "Push-Benachrichtigungen",
      description: "Push-Nachrichten auf unterstützten Geräten.",
      checked: notificationSettings.push,
      onChange: (checked) => setNotificationSettings((prev) => ({ ...prev, push: checked })),
    },
    {
      title: "Desktop-Benachrichtigungen",
      description: "Hinweise am Desktop anzeigen, wenn du angemeldet bist.",
      checked: notificationSettings.desktop,
      onChange: (checked) => setNotificationSettings((prev) => ({ ...prev, desktop: checked })),
    },
  ]

  const dataControlToggles: ToggleRowConfig[] = [
    {
      title: "Nutzungs-Telemetrie",
      description: "Anonyme Nutzungsdaten zur Produktverbesserung teilen.",
      checked: dataControlSettings.telemetry,
      onChange: (checked) => setDataControlSettings((prev) => ({ ...prev, telemetry: checked })),
    },
    {
      title: "Personalisierte Vorschläge",
      description: "Inhalte anhand deiner Nutzung personalisieren.",
      checked: dataControlSettings.personalization,
      onChange: (checked) =>
        setDataControlSettings((prev) => ({ ...prev, personalization: checked })),
    },
  ]

  const securityToggles: ToggleRowConfig[] = [
    {
      title: "Zwei-Faktor-Authentifizierung",
      description: "Zusätzliche Sicherheit beim Login aktivieren.",
      checked: securitySettings.twoFactor,
      onChange: (checked) => setSecuritySettings((prev) => ({ ...prev, twoFactor: checked })),
    },
    {
      title: "Login-Benachrichtigungen",
      description: "E-Mail-Benachrichtigungen bei neuen Geräten.",
      checked: securitySettings.sessionAlerts,
      onChange: (checked) =>
        setSecuritySettings((prev) => ({ ...prev, sessionAlerts: checked })),
    },
  ]

  const billingActions: ActionRowConfig[] = [
    {
      title: "Plan & Abrechnung",
      description: "Verwalte deinen aktuellen Tarif und Zahlungsdetails.",
      cta: "Plan verwalten",
      onClick: () => console.log("Plan verwalten"),
    },
    {
      title: "Rechnungs-E-Mails",
      description: "Rechnungen an deine Hauptadresse senden.",
      cta: "Adresse ändern",
      onClick: () => console.log("Abrechnungsadresse ändern"),
    },
  ]
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

  const accountActions: ActionRowConfig[] = [
    {
      title: "Profil",
      description: "Name, Avatar und Kontaktinformationen verwalten.",
      cta: "Bearbeiten",
      onClick: () => console.log("Profil bearbeiten"),
    },
    {
      title: "E-Mail",
      description: "Deine primäre Kontaktadresse.",
      cta: "E-Mail ändern",
      onClick: () => console.log("E-Mail ändern"),
    },
    {
      title: "Avatar",
      description: "Profilbild aktualisieren und für Team-Shares verwenden.",
      cta: "Avatar ändern",
      onClick: () => console.log("Avatar aktualisieren"),
    },
    {
      title: "Verknüpfte Konten",
      description: "Meldeoptionen (z. B. Google) und Zugriffsrechte verwalten.",
      cta: "Konten verwalten",
      onClick: () => console.log("Verknüpfte Konten öffnen"),
    },
    {
      title: "Workspace & Rollen",
      description: "Teamzugehörigkeit und Rollen in deinem Workspace anpassen.",
      cta: "Rollen bearbeiten",
      onClick: () => console.log("Workspace verwalten"),
    },
  ]

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
    }
  }, [open, initialNav])

  React.useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return
    applyDisplaySettings(settings)
    localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(settings))
  }, [applyDisplaySettings, isHydrated, settings])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Einstellungen</DialogTitle>
        <DialogDescription className="sr-only">
          Passe hier deine Einstellungen an.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.name === activeNav}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveNav(item.name)}
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
                      <BreadcrumbLink href="#">Einstellungen</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeNav}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pt-0">
              <section className="max-w-3xl space-y-6">
                {activeNav === "General" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {generalToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                  </div>
                )}

                {activeNav === "Benachrichtigungen" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {notificationToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Zusammenfassung</p>
                        <p className="text-xs text-muted-foreground">
                          Lege fest, wie oft Zusammenfassungen verschickt werden.
                        </p>
                      </div>
                      <Select
                        value={notificationSettings.summary}
                        onValueChange={(value: string) =>
                          setNotificationSettings((prev) => ({ ...prev, summary: value }))
                        }
                      >
                        <SelectTrigger className="min-w-[160px]">
                          <SelectValue placeholder="täglich" />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="realtime">Echtzeit</SelectItem>
                          <SelectItem value="daily">Täglich</SelectItem>
                          <SelectItem value="weekly">Wöchentlich</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {activeNav === "Personalisierung" && (
                  <div className="space-y-5 rounded-lg pr-3 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Farbschema</p>
                          <p className="text-xs text-muted-foreground">
                            Wähle zwischen hellem, dunklem oder systemweitem Modus.
                          </p>
                        </div>
                        <Select
                          value={settings.theme}
                          onValueChange={(value: ThemeChoice) =>
                            setSettings((prev) => ({ ...prev, theme: value }))
                          }
                        >
                          <SelectTrigger className="min-w-[160px]">
                            <SelectValue placeholder="System" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="light">Hell</SelectItem>
                            <SelectItem value="dark">Dunkel</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Schriftgröße</p>
                          <p className="text-xs text-muted-foreground">
                            Größere Schrift verbessert die Lesbarkeit.
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
                        aria-label="Schriftgröße"
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Zeilenhöhe</p>
                          <p className="text-xs text-muted-foreground">
                            Lockerer Zeilenabstand erleichtert längere Texte.
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
                        aria-label="Zeilenhöhe"
                      />
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Layoutdichte</p>
                          <p className="text-xs text-muted-foreground">
                            Steuert Abstände und kompakte Darstellungen.
                          </p>
                        </div>
                        <Select
                          value={settings.density}
                          onValueChange={(value: DensityChoice) =>
                            setSettings((prev) => ({ ...prev, density: value }))
                          }
                        >
                          <SelectTrigger className="min-w-[160px]">
                            <SelectValue placeholder="Komfort" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="komfort">Komfort</SelectItem>
                            <SelectItem value="ausgewogen">Ausgewogen</SelectItem>
                            <SelectItem value="kompakt">Kompakt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Kontrast</p>
                          <p className="text-xs text-muted-foreground">
                            Höherer Kontrast verbessert die Lesbarkeit.
                          </p>
                        </div>
                        <Select
                          value={settings.contrast}
                          onValueChange={(value: ContrastChoice) =>
                            setSettings((prev) => ({ ...prev, contrast: value }))
                          }
                        >
                          <SelectTrigger className="min-w-[160px]">
                            <SelectValue placeholder="Standard" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="hoch">Hoch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Ablenkungsfreier Modus</p>
                          <p className="text-xs text-muted-foreground">
                            Blendet sekundäre Elemente für fokussiertes Lesen aus.
                          </p>
                        </div>
                        <Label className="flex items-center gap-3">
                          <Switch
                            checked={settings.focusMode}
                            onCheckedChange={(checked: boolean) =>
                              setSettings((prev) => ({ ...prev, focusMode: checked }))
                            }
                            aria-label="Ablenkungsfreier Modus"
                          />
                          <span className="text-sm">Aktivieren</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {activeNav === "Datenkontrolle" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {dataControlToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Datenexport</p>
                      <p className="text-xs text-muted-foreground">
                        Exportiere deine Daten als Archiv.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
                      onClick={() => console.log("Data export requested")}
                    >
                      Export starten
                    </button>
                  </div>
                )}

                {activeNav === "Abrechnung" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {billingActions.map((item) => (
                      <ActionRow key={item.title} {...item} />
                    ))}
                  </div>
                )}

                {activeNav === "Sicherheit" && (
                  <div className="space-y-4 rounded-lg pr-3 py-3">
                    {securityToggles.map((item) => (
                      <ToggleRow key={item.title} {...item} />
                    ))}
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Passwort</p>
                      <p className="text-xs text-muted-foreground">
                        Ändere regelmäßig dein Passwort.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
                      onClick={() => console.log("Passwort ändern")}
                    >
                      Passwort ändern
                    </button>
                  </div>
                )}

                {activeNav === "Konto" && (
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
