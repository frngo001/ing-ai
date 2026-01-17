'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { MarkdownPlugin } from '@platejs/markdown';
import { ArrowUpToLineIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { useFilePicker } from 'use-file-picker';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';
import { useLanguage } from '@/lib/i18n/use-language';

type ImportType = 'html' | 'markdown';

export function ImportToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const { t, language } = useLanguage();

  // Check if onboarding is showing import step
  const { isOpen: isOnboardingOpen, getCurrentSubStep } = useOnboardingStore();
  const currentSubStep = getCurrentSubStep();
  const shouldForceOpen = isOnboardingOpen && currentSubStep?.id === 'open-import';

  // Effect to open dropdown when onboarding reaches import step
  React.useEffect(() => {
    if (shouldForceOpen && !open) {
      setOpen(true);
    }
  }, [shouldForceOpen, open]);

  // Handle open change - prevent closing during onboarding
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (shouldForceOpen && !newOpen) {
      return; // Prevent closing during onboarding
    }
    setOpen(newOpen);
  }, [shouldForceOpen]);

  const tooltipText = React.useMemo(() => t('toolbar.import'), [t, language]);
  const importFromHtmlText = React.useMemo(() => t('toolbar.importFromHtml'), [t, language]);
  const importFromMarkdownText = React.useMemo(() => t('toolbar.importFromMarkdown'), [t, language]);
  const importFromWordText = React.useMemo(() => t('toolbar.importFromWord'), [t, language]);

  const getFileNodes = (text: string, type: ImportType) => {
    if (!text) return [];

    if (type === 'html') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      const nodes = editor.api.html.deserialize({
        element: doc.body,
      });

      return nodes;
    }

    if (type === 'markdown') {
      return editor.getApi(MarkdownPlugin).markdown.deserialize(text);
    }

    return [];
  };

  /**
   * Convert Word document to HTML using mammoth
   * This is better for images and complex formatting than Markdown
   */
  const convertWordToHtml = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const mammothModule = await import('mammoth');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammoth = (mammothModule as any).default || mammothModule;
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  };

  const { openFilePicker: openMdFilePicker } = useFilePicker({
    accept: ['.md', '.mdx'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      const text = await plainFiles[0].text();

      const nodes = getFileNodes(text, 'markdown');

      editor.tf.insertNodes(nodes);
    },
  });

  const { openFilePicker: openHtmlFilePicker } = useFilePicker({
    accept: ['text/html'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      const text = await plainFiles[0].text();

      const nodes = getFileNodes(text, 'html');

      editor.tf.insertNodes(nodes);
    },
  });

  const { openFilePicker: openWordFilePicker } = useFilePicker({
    accept: ['.docx', '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      const file = plainFiles[0];
      const arrayBuffer = await file.arrayBuffer();

      // Convert Word to HTML using mammoth - better for images
      const html = await convertWordToHtml(arrayBuffer);

      // Deserialize HTML to Plate nodes
      const nodes = getFileNodes(html, 'html');

      editor.tf.insertNodes(nodes);
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={tooltipText} isDropdown data-onboarding="import-btn">
          <ArrowUpToLineIcon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" data-onboarding="import-dropdown">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              openHtmlFilePicker();
            }}
          >
            {importFromHtmlText}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              openMdFilePicker();
            }}
          >
            {importFromMarkdownText}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              openWordFilePicker();
            }}
          >
            {importFromWordText}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
