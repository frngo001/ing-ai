import {
  Sparkles,
  FolderPlus,
  FileText,
  PenTool,
  Bot,
  Quote,
  Library,
  Search,
  Download,
  Upload,
  Settings,
  CheckCircle2,
} from 'lucide-react'
import type { OnboardingMainStep } from './onboarding-types'

export const ONBOARDING_MAIN_STEPS: OnboardingMainStep[] = [
  // Step 1: Welcome
  {
    id: 'welcome',
    titleKey: 'onboarding.steps.welcome.title',
    icon: Sparkles,
    color: 'from-amber-500/20 to-orange-500/20',
    accentColor: 'text-amber-600 dark:text-amber-400',
    subSteps: [
      {
        id: 'welcome-intro',
        target: 'body',
        position: 'center',
        titleKey: 'onboarding.subSteps.welcome.intro.title',
        descriptionKey: 'onboarding.subSteps.welcome.intro.description',
        tipKey: 'onboarding.subSteps.welcome.intro.tip',
      },
      {
        id: 'welcome-sidebar',
        target: '[data-sidebar="sidebar"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.welcome.sidebar.title',
        descriptionKey: 'onboarding.subSteps.welcome.sidebar.description',
        actionId: 'openSidebar',
      },
    ],
  },

  // Step 2: Create Project
  {
    id: 'create-project',
    titleKey: 'onboarding.steps.createProject.title',
    icon: FolderPlus,
    color: 'from-purple-500/20 to-indigo-500/20',
    accentColor: 'text-purple-600 dark:text-purple-400',
    subSteps: [
      {
        id: 'project-intro',
        target: '[data-onboarding="projects-menu"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.createProject.intro.title',
        descriptionKey: 'onboarding.subSteps.createProject.intro.description',
        highlightPadding: 8,
      },
      {
        id: 'open-projects',
        target: '[data-onboarding="projects-dropdown"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.createProject.dropdown.title',
        descriptionKey: 'onboarding.subSteps.createProject.dropdown.description',
        tipKey: 'onboarding.subSteps.createProject.dropdown.tip',
        waitForElement: true,
      },
      {
        id: 'project-create-btn',
        target: '[data-onboarding="new-project-btn"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.createProject.button.title',
        descriptionKey: 'onboarding.subSteps.createProject.button.description',
        highlightPadding: 8,
      },
    ],
  },

  // Step 3: Create Document
  {
    id: 'create-document',
    titleKey: 'onboarding.steps.createDocument.title',
    icon: FileText,
    color: 'from-blue-500/20 to-cyan-500/20',
    accentColor: 'text-blue-600 dark:text-blue-400',
    subSteps: [
      {
        id: 'new-doc-btn',
        target: '[data-onboarding="new-document-btn"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.createDocument.button.title',
        descriptionKey: 'onboarding.subSteps.createDocument.button.description',
        highlightPadding: 12,
      },
      {
        id: 'create-action',
        target: '[data-onboarding="new-document-btn"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.createDocument.action.title',
        descriptionKey: 'onboarding.subSteps.createDocument.action.description',
        actionId: 'createNewDocument',
      },
      {
        id: 'documents-pane',
        target: '[data-onboarding="documents-pane"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.createDocument.pane.title',
        descriptionKey: 'onboarding.subSteps.createDocument.pane.description',
        actionId: 'openDocumentsPane',
        waitForElement: true,
      },
    ],
  },

  // Step 3: Editor Basics (Interactive Demo)
  {
    id: 'editor-basics',
    titleKey: 'onboarding.steps.editorBasics.title',
    icon: PenTool,
    color: 'from-violet-500/20 to-purple-500/20',
    accentColor: 'text-violet-600 dark:text-violet-400',
    subSteps: [
      {
        id: 'editor-area',
        target: '[data-onboarding="editor-container"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.editor.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.editor.description',
        actionId: 'closeDocumentsPane',
      },
      {
        id: 'toolbar',
        target: '[data-onboarding="fixed-toolbar"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.editorBasics.toolbar.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.toolbar.description',
        tipKey: 'onboarding.subSteps.editorBasics.toolbar.tip',
      },
      // Interactive Demo: Write a heading about Ing AI
      {
        id: 'demo-write-heading',
        target: '[data-onboarding="editor-container"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.demoHeading.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.demoHeading.description',
        actionId: 'insertHeading:1,onboarding.demo.heading',
      },
      // Interactive Demo: Type intro text
      {
        id: 'demo-write-intro',
        target: '[data-onboarding="editor-container"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.demoIntro.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.demoIntro.description',
        actionId: 'typeInEditor:onboarding.demo.intro,20',
      },
      // Show slash commands menu
      {
        id: 'slash-commands-demo',
        target: '[data-onboarding="editor-container"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.slashDemo.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.slashDemo.description',
        tipKey: 'onboarding.subSteps.editorBasics.slashCommands.tip',
        actionId: 'showSlashMenu',
      },
      // Close slash menu and explain
      {
        id: 'slash-commands',
        target: '[data-onboarding="editor-container"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.slashCommands.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.slashCommands.description',
        actionId: 'closeSlashMenu',
      },
      // Add subheading for features
      {
        id: 'demo-write-features',
        target: '[data-onboarding="editor-container"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.demoFeatures.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.demoFeatures.description',
        actionId: 'insertHeading:2,onboarding.demo.features',
      },
      // Inline AI explanation
      {
        id: 'inline-ai',
        target: '[data-onboarding="editor-container"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.inlineAi.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.inlineAi.description',
        tipKey: 'onboarding.subSteps.editorBasics.inlineAi.tip',
      },
      // Comments
      {
        id: 'comments',
        target: '[data-onboarding="comment-btn"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.editorBasics.comments.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.comments.description',
        tipKey: 'onboarding.subSteps.editorBasics.comments.tip',
      },
      // Suggestions
      {
        id: 'suggestions',
        target: '[data-onboarding="mode-btn"]',
        position: 'top',
        titleKey: 'onboarding.subSteps.editorBasics.suggestions.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.suggestions.description',
      },
      // Suggestions modes (with dropdown open)
      {
        id: 'open-mode',
        target: '[data-onboarding="mode-dropdown"]',
        position: 'top',
        titleKey: 'onboarding.subSteps.editorBasics.suggestionsModes.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.suggestionsModes.description',
        tipKey: 'onboarding.subSteps.editorBasics.suggestionsModes.tip',
        waitForElement: true,
      },
    ],
  },

  // Step 4: AI Assistant (Interactive Demo)
  {
    id: 'ai-assistant',
    titleKey: 'onboarding.steps.aiAssistant.title',
    icon: Bot,
    color: 'from-emerald-500/20 to-teal-500/20',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    subSteps: [
      {
        id: 'ai-nav-btn',
        target: '[data-onboarding="nav-ai-chat"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.aiAssistant.nav.title',
        descriptionKey: 'onboarding.subSteps.aiAssistant.nav.description',
      },
      {
        id: 'open-ai-pane',
        target: '[data-onboarding="nav-ai-chat"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.aiAssistant.open.title',
        descriptionKey: 'onboarding.subSteps.aiAssistant.open.description',
        actionId: 'openAiPane',
      },
      {
        id: 'ai-pane-intro',
        target: '[data-onboarding="ask-ai-pane"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.aiAssistant.pane.title',
        descriptionKey: 'onboarding.subSteps.aiAssistant.pane.description',
        tipKey: 'onboarding.subSteps.aiAssistant.pane.tip',
        actionId: 'openAiPane',
        waitForElement: true,
      },
      // Demo: Show example question
      {
        id: 'ai-demo-question',
        target: '[data-onboarding="ask-ai-pane"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.aiAssistant.demoQuestion.title',
        descriptionKey: 'onboarding.subSteps.aiAssistant.demoQuestion.description',
        actionId: 'openAskAiWithQuestion:Help%20me%20improve%20this%20paragraph%20for%20academic%20writing',
      },
    ],
  },

  // Step 5: Citations (Interactive Demo)
  {
    id: 'citations',
    titleKey: 'onboarding.steps.citations.title',
    icon: Quote,
    color: 'from-rose-500/20 to-pink-500/20',
    accentColor: 'text-rose-600 dark:text-rose-400',
    subSteps: [
      {
        id: 'citation-btn',
        target: '[data-onboarding="citation-btn"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.citations.button.title',
        descriptionKey: 'onboarding.subSteps.citations.button.description',
        actionId: 'closeAiPane',
      },
      // Demo: Open citation dialog
      {
        id: 'citation-demo',
        target: '[data-onboarding="citation-btn"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.citations.demo.title',
        descriptionKey: 'onboarding.subSteps.citations.demo.description',
        actionId: 'insertCitation',
      },
      {
        id: 'citation-explain',
        target: '[data-onboarding="citation-btn"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.citations.explain.title',
        descriptionKey: 'onboarding.subSteps.citations.explain.description',
        tipKey: 'onboarding.subSteps.citations.explain.tip',
      },
    ],
  },

  // Step 6: Library
  {
    id: 'library',
    titleKey: 'onboarding.steps.library.title',
    icon: Library,
    color: 'from-indigo-500/20 to-blue-500/20',
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    subSteps: [
      {
        id: 'library-nav',
        target: '[data-onboarding="nav-library"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.library.nav.title',
        descriptionKey: 'onboarding.subSteps.library.nav.description',
      },
      {
        id: 'open-library',
        target: '[data-onboarding="nav-library"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.library.open.title',
        descriptionKey: 'onboarding.subSteps.library.open.description',
        actionId: 'openLibraryPane',
      },
      {
        id: 'library-features',
        target: '[data-onboarding="library-pane"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.library.features.title',
        descriptionKey: 'onboarding.subSteps.library.features.description',
        actionId: 'openLibraryPane',
        waitForElement: true,
      },
    ],
  },

  // Step 7: Research
  {
    id: 'research',
    titleKey: 'onboarding.steps.research.title',
    icon: Search,
    color: 'from-orange-500/20 to-red-500/20',
    accentColor: 'text-orange-600 dark:text-orange-400',
    subSteps: [
      {
        id: 'research-intro',
        target: '[data-onboarding="library-search"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.research.intro.title',
        descriptionKey: 'onboarding.subSteps.research.intro.description',
        actionId: 'openLibraryPane',
        waitForElement: true,
      },
      {
        id: 'add-source-btn',
        target: '[data-onboarding="add-source-btn"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.research.addSource.title',
        descriptionKey: 'onboarding.subSteps.research.addSource.description',
        tipKey: 'onboarding.subSteps.research.addSource.tip',
        actionId: 'openLibraryPane',
      },
    ],
  },

  // Step 8: Export
  {
    id: 'export',
    titleKey: 'onboarding.steps.export.title',
    icon: Download,
    color: 'from-cyan-500/20 to-sky-500/20',
    accentColor: 'text-cyan-600 dark:text-cyan-400',
    subSteps: [
      {
        id: 'export-btn',
        target: '[data-onboarding="export-btn"]',
        position: 'top',
        titleKey: 'onboarding.subSteps.export.button.title',
        descriptionKey: 'onboarding.subSteps.export.button.description',
        actionId: 'closeLibraryPane',
      },
      {
        id: 'open-export',
        target: '[data-onboarding="export-dropdown"]',
        position: 'top',
        titleKey: 'onboarding.subSteps.export.formats.title',
        descriptionKey: 'onboarding.subSteps.export.formats.description',
        tipKey: 'onboarding.subSteps.export.formats.tip',
        waitForElement: true,
      },
    ],
  },

  // Step 9: Import
  {
    id: 'import',
    titleKey: 'onboarding.steps.import.title',
    icon: Upload,
    color: 'from-teal-500/20 to-cyan-500/20',
    accentColor: 'text-teal-600 dark:text-teal-400',
    subSteps: [
      {
        id: 'import-btn',
        target: '[data-onboarding="import-btn"]',
        position: 'top',
        titleKey: 'onboarding.subSteps.import.button.title',
        descriptionKey: 'onboarding.subSteps.import.button.description',
        actionId: 'closeLibraryPane',
      },
      {
        id: 'open-import',
        target: '[data-onboarding="import-dropdown"]',
        position: 'top',
        titleKey: 'onboarding.subSteps.import.formats.title',
        descriptionKey: 'onboarding.subSteps.import.formats.description',
        tipKey: 'onboarding.subSteps.import.formats.tip',
        waitForElement: true,
      },
    ],
  },

  // Step 10: Settings
  {
    id: 'settings',
    titleKey: 'onboarding.steps.settings.title',
    icon: Settings,
    color: 'from-slate-500/20 to-gray-500/20',
    accentColor: 'text-slate-600 dark:text-slate-400',
    subSteps: [
      {
        id: 'settings-nav',
        target: '[data-onboarding="nav-settings"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.settings.nav.title',
        descriptionKey: 'onboarding.subSteps.settings.nav.description',
      },
      {
        id: 'open-settings',
        target: '[data-onboarding="nav-settings"]',
        position: 'right',
        titleKey: 'onboarding.subSteps.settings.open.title',
        descriptionKey: 'onboarding.subSteps.settings.open.description',
        actionId: 'openSettings',
      },
      {
        id: 'settings-intro',
        target: '[data-onboarding="settings-dialog"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.settings.intro.title',
        descriptionKey: 'onboarding.subSteps.settings.intro.description',
        actionId: 'openSettings',
        waitForElement: true,
      },
    ],
  },

  // Step 10: Complete
  {
    id: 'complete',
    titleKey: 'onboarding.steps.complete.title',
    icon: CheckCircle2,
    color: 'from-green-500/20 to-emerald-500/20',
    accentColor: 'text-green-600 dark:text-green-400',
    subSteps: [
      {
        id: 'celebration',
        target: 'body',
        position: 'center',
        titleKey: 'onboarding.subSteps.complete.celebration.title',
        descriptionKey: 'onboarding.subSteps.complete.celebration.description',
        actionId: 'closeSettings',
      },
      {
        id: 'start-writing',
        target: 'body',
        position: 'center',
        titleKey: 'onboarding.subSteps.complete.start.title',
        descriptionKey: 'onboarding.subSteps.complete.start.description',
        tipKey: 'onboarding.subSteps.complete.start.tip',
      },
    ],
  },
]

export const getTotalSubSteps = (): number => {
  return ONBOARDING_MAIN_STEPS.reduce((total, step) => total + step.subSteps.length, 0)
}

export const getSubStepByIndex = (
  mainStepIndex: number,
  subStepIndex: number
) => {
  const mainStep = ONBOARDING_MAIN_STEPS[mainStepIndex]
  if (!mainStep) return null
  return mainStep.subSteps[subStepIndex] || null
}

export const getMainStepByIndex = (mainStepIndex: number) => {
  return ONBOARDING_MAIN_STEPS[mainStepIndex] || null
}
