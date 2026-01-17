"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, FolderOpen, Check, Loader2, Pencil, Share2, Trash2, Users } from "lucide-react"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { useOnboardingStore } from "@/lib/stores/onboarding-store"
import { useLanguage } from "@/lib/i18n/use-language"
import { devError } from "@/lib/utils/logger"
import { cn } from "@/lib/utils"
import { ProjectShareDialog } from "@/components/project-share-dialog"

export function ProjectSwitcher() {
  const { t } = useLanguage()
  const { isMobile, setOpen, addInteractionLock, removeInteractionLock } = useSidebar()

  const projects = useProjectStore((state) => state.projects)
  const currentProjectId = useProjectStore((state) => state.currentProjectId)
  const isLoading = useProjectStore((state) => state.isLoading)
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject)
  const createProject = useProjectStore((state) => state.createProject)
  const updateProject = useProjectStore((state) => state.updateProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const loadProjects = useProjectStore((state) => state.loadProjects)

  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [newProjectName, setNewProjectName] = React.useState("")
  const [newProjectDescription, setNewProjectDescription] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [projectToDelete, setProjectToDelete] = React.useState<{ id: string; name: string; isDefault: boolean } | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [projectToShare, setProjectToShare] = React.useState<{ id: string; name: string } | null>(null)
  const [editingProject, setEditingProject] = React.useState<{ id: string; name: string; description: string | null } | null>(null)
  const [editProjectName, setEditProjectName] = React.useState("")
  const [editProjectDescription, setEditProjectDescription] = React.useState("")
  const [isRenaming, setIsRenaming] = React.useState(false)

  // Onboarding integration
  const { isOpen: isOnboardingOpen, getCurrentSubStep } = useOnboardingStore()
  const currentSubStep = getCurrentSubStep()
  const isProjectOnboarding = currentSubStep?.id === 'open-projects' ||
    currentSubStep?.id === 'project-create-btn' ||
    currentSubStep?.id === 'share-btn-point'

  const isSharingOnboarding =
    currentSubStep?.id === 'share-dialog-intro' ||
    currentSubStep?.id === 'share-mode' ||
    currentSubStep?.id === 'share-generate' ||
    currentSubStep?.id === 'share-link-area'

  const shouldForceOpen = isOnboardingOpen && !shareDialogOpen && isProjectOnboarding

  // Effect to manage dropdown state during onboarding
  React.useEffect(() => {
    if (!isOnboardingOpen) return

    if (shouldForceOpen && !dropdownOpen) {
      setDropdownOpen(true)
    } else if (!shouldForceOpen && dropdownOpen && !shareDialogOpen) {
      // Close dropdown if we are in onboarding but not on a step that requires it
      setDropdownOpen(false)
    }

    // Explicitly close share dialog if we move back from a sharing step
    if (!isSharingOnboarding && shareDialogOpen) {
      setShareDialogOpen(false)
    }
  }, [shouldForceOpen, dropdownOpen, isOnboardingOpen, shareDialogOpen, isSharingOnboarding])

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
    const handleOpenShare = () => {
      if (currentProject) {
        setProjectToShare({ id: currentProject.id, name: currentProject.name })
        // Don't close dropdown if we are in onboarding, it might cause displacement
        if (!isOnboardingOpen) {
          setDropdownOpen(false)
        }
        setShareDialogOpen(true)
      }
    }

    window.addEventListener("projects:open-share", handleOpenShare)
    return () => {
      window.removeEventListener("projects:open-share", handleOpenShare)
      if (dropdownOpen) {
        removeInteractionLock()
        if (!isMobile) {
          setOpen(false)
        }
      }
    }
  }, [dropdownOpen, removeInteractionLock, isMobile, setOpen, currentProject])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsCreating(true)
    try {
      await createProject(newProjectName.trim(), newProjectDescription.trim() || undefined)
      setNewProjectName("")
      setNewProjectDescription("")
      setCreateDialogOpen(false)
    } catch (error) {
      devError("Error creating project:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectProject = (projectId: string) => {
    setCurrentProject(projectId)
    setDropdownOpen(false)
  }

  const handleOpenRenameDialog = (project: { id: string; name: string; description: string | null }, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProject(project)
    setEditProjectName(project.name)
    setEditProjectDescription(project.description || "")
    setDropdownOpen(false)
    setRenameDialogOpen(true)
  }

  const handleRenameProject = async () => {
    if (!editingProject || !editProjectName.trim()) return

    setIsRenaming(true)
    try {
      await updateProject(editingProject.id, {
        name: editProjectName.trim(),
        description: editProjectDescription.trim() || null,
      })
      setRenameDialogOpen(false)
      setEditingProject(null)
      setEditProjectName("")
      setEditProjectDescription("")
    } catch (error) {
      devError("Error renaming project:", error)
    } finally {
      setIsRenaming(false)
    }
  }

  const handleOpenDeleteDialog = (project: { id: string; name: string; isDefault: boolean }, e: React.MouseEvent) => {
    e.stopPropagation()
    setProjectToDelete(project)
    setDropdownOpen(false)
    setDeleteDialogOpen(true)
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    setIsDeleting(true)
    try {
      await deleteProject(projectToDelete.id)
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    } catch (error) {
      devError("Error deleting project:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleShareDialogChange = (open: boolean) => {
    setShareDialogOpen(open)
    if (!open) {
      setProjectToShare(null)
    }
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
                data-onboarding="projects-menu"
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
              className="w-(--radix-dropdown-menu-trigger-width) min-w-72 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
              data-onboarding="projects-dropdown"
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {t('projects.yourProjects')}
              </DropdownMenuLabel>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className="gap-2 p-2 group"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    {project.isShared ? (
                      <Users className="size-3.5 shrink-0 text-blue-500" />
                    ) : (
                      <FolderOpen className="size-3.5 shrink-0" />
                    )}
                  </div>
                  <span className="flex-1 truncate">{project.name}</span>
                  {project.isShared && (
                    <span className="text-xs text-blue-500 px-1.5 py-0.5 bg-blue-500/10 rounded">
                      {project.shareMode === 'view' ? t('projectSharing.viewMode') :
                        project.shareMode === 'edit' ? t('projectSharing.editMode') :
                          t('projectSharing.suggestMode')}
                    </span>
                  )}
                  {!project.isShared && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setProjectToShare({ id: project.id, name: project.name })
                          if (!isOnboardingOpen) {
                            setDropdownOpen(false)
                          }
                          setShareDialogOpen(true)
                        }}
                        className={cn(
                          "p-1 rounded hover:bg-muted transition-all",
                          isOnboardingOpen && currentSubStep?.id === 'share-btn-point'
                            ? "opacity-100 ring-2 ring-primary ring-offset-2 bg-primary/10"
                            : "opacity-0 group-hover:opacity-100"
                        )}
                        title={t('projectSharing.share')}
                        data-onboarding="share-project-btn"
                      >
                        <Share2 className="size-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => handleOpenRenameDialog({ id: project.id, name: project.name, description: project.description }, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                        title={t('projects.renameProject')}
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                      </button>
                      {!project.isDefault && (
                        <button
                          onClick={(e) => handleOpenDeleteDialog({ id: project.id, name: project.name, isDefault: project.isDefault }, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
                          title={t('projects.deleteProject')}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </button>
                      )}
                    </>
                  )}
                  {project.id === currentProjectId && (
                    <Check className="size-4 text-primary" />
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
                data-onboarding="new-project-btn"
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

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('projects.renameProject')}</DialogTitle>
            <DialogDescription>
              {t('projects.renameProjectDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-project-name">{t('projects.projectName')}</Label>
              <Input
                id="edit-project-name"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                placeholder={t('projects.projectNamePlaceholder')}
                onKeyDown={(e) => e.key === 'Enter' && !isRenaming && handleRenameProject()}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-project-description">{t('projects.projectDescription')}</Label>
              <Input
                id="edit-project-description"
                value={editProjectDescription}
                onChange={(e) => setEditProjectDescription(e.target.value)}
                placeholder={t('projects.projectDescriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleRenameProject}
              disabled={!editProjectName.trim() || isRenaming}
              variant="secondary"
              className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('projects.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {projectToShare && (
        <ProjectShareDialog
          open={shareDialogOpen}
          onOpenChange={handleShareDialogChange}
          projectId={projectToShare.id}
          projectName={projectToShare.name}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projects.deleteProjectTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projects.deleteProjectDescription').replace('{name}', projectToDelete?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setProjectToDelete(null)
              }}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('projects.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
