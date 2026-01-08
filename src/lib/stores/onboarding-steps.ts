import {
  Sparkles,
  FileText,
  PenTool,
  Bot,
  Quote,
  Library,
  Search,
  Download,
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

  // Step 2: Create Document
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

  // Step 3: Editor Basics
  {
    id: 'editor-basics',
    titleKey: 'onboarding.steps.editorBasics.title',
    icon: PenTool,
    color: 'from-violet-500/20 to-purple-500/20',
    accentColor: 'text-violet-600 dark:text-violet-400',
    subSteps: [
      {
        id: 'editor-area',
        target: '[data-slate-editor="true"]',
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
      {
        id: 'slash-commands',
        target: '[data-slate-editor="true"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.slashCommands.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.slashCommands.description',
        tipKey: 'onboarding.subSteps.editorBasics.slashCommands.tip',
      },
      {
        id: 'inline-ai',
        target: '[data-slate-editor="true"]',
        position: 'left',
        titleKey: 'onboarding.subSteps.editorBasics.inlineAi.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.inlineAi.description',
        tipKey: 'onboarding.subSteps.editorBasics.inlineAi.tip',
      },
      {
        id: 'comments',
        target: '[data-onboarding="comment-btn"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.editorBasics.comments.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.comments.description',
        tipKey: 'onboarding.subSteps.editorBasics.comments.tip',
      },
      {
        id: 'suggestions',
        target: '[data-onboarding="suggestion-btn"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.editorBasics.suggestions.title',
        descriptionKey: 'onboarding.subSteps.editorBasics.suggestions.description',
      },
    ],
  },

  // Step 4: AI Assistant
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
    ],
  },

  // Step 5: Citations
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
        position: 'bottom',
        titleKey: 'onboarding.subSteps.export.button.title',
        descriptionKey: 'onboarding.subSteps.export.button.description',
        actionId: 'closeLibraryPane',
      },
      {
        id: 'export-formats',
        target: '[data-onboarding="export-btn"]',
        position: 'bottom',
        titleKey: 'onboarding.subSteps.export.formats.title',
        descriptionKey: 'onboarding.subSteps.export.formats.description',
        tipKey: 'onboarding.subSteps.export.formats.tip',
      },
    ],
  },

  // Step 9: Settings
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
