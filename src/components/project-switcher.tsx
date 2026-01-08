"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, FolderOpen, Check, Loader2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useProjectStore } from "@/lib/stores/project-store"
import { useLanguage } from "@/lib/i18n/use-language"

export function ProjectSwitcher() {
  const { t } = useLanguage()
  const { isMobile, setOpen, addInteractionLock, removeInteractionLock } = useSidebar()

  const projects = useProjectStore((state) => state.projects)
  const currentProjectId = useProjectStore((state) => state.currentProjectId)
  const isLoading = useProjectStore((state) => state.isLoading)
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject)
  const createProject = useProjectStore((state) => state.createProject)
  const loadProjects = useProjectStore((state) => state.loadProjects)

  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState("")
  const [newProjectDescription, setNewProjectDescription] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const currentProject = React.useMemo(
    () => projects.find((p) => p.id === currentProjectId),
    [projects, currentProjectId]
  )

  // Load projects on mount
  React.useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setDropdownOpen(open)
      if (open) {
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

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsCreating(true)
    try {
      await createProject(newProjectName.trim(), newProjectDescription.trim() || undefined)
      setNewProjectName("")
      setNewProjectDescription("")
      setCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectProject = (projectId: string) => {
    setCurrentProject(projectId)
    setDropdownOpen(false)
  }

  // Show loading state
  if (isLoading && projects.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground dark:bg-neutral-700 dark:text-white">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-muted-foreground">
                {t('common.loading')}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Show create project button if no projects exist yet
  if (!currentProject) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => setCreateDialogOpen(true)}
              className="hover:bg-muted/80 dark:hover:bg-neutral-800"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground dark:bg-neutral-700 dark:text-white">
                <Plus className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{t('projects.createFirstProject')}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {t('projects.noProjectsYet')}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('projects.createProject')}</DialogTitle>
              <DialogDescription>
                {t('projects.createProjectDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">{t('projects.projectName')}</Label>
                <Input
                  id="project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('projects.projectNamePlaceholder')}
                  onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreateProject()}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-description">{t('projects.projectDescription')}</Label>
                <Input
                  id="project-description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder={t('projects.projectDescriptionPlaceholder')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isCreating}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || isCreating}
                variant="default"
                className="dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('projects.create')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={dropdownOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-muted/90 data-[state=open]:text-sidebar-foreground hover:bg-muted/80 dark:data-[state=open]:bg-neutral-850 dark:hover:bg-neutral-800"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground dark:bg-neutral-700 dark:text-white">
                  <FolderOpen className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{currentProject.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t('projects.activeProject')}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {t('projects.yourProjects')}
              </DropdownMenuLabel>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <FolderOpen className="size-3.5 shrink-0" />
                  </div>
                  <span className="flex-1 truncate">{project.name}</span>
                  {project.id === currentProjectId && (
                    <Check className="size-4 text-primary" />
                  )}
                  {project.isDefault && (
                    <span className="text-xs text-muted-foreground">
                      {t('projects.default')}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => {
                  setDropdownOpen(false)
                  setCreateDialogOpen(true)
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  {t('projects.newProject')}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('projects.createProject')}</DialogTitle>
            <DialogDescription>
              {t('projects.createProjectDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">{t('projects.projectName')}</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={t('projects.projectNamePlaceholder')}
                onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreateProject()}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">{t('projects.projectDescription')}</Label>
              <Input
                id="project-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder={t('projects.projectDescriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || isCreating}
              variant="secondary"
              className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('projects.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
