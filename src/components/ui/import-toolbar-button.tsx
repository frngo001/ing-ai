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

    // Store paragraph styles using text content as key (more robust than index)
    const paragraphStyles: Map<string, { align?: string; indent?: number; lineHeight?: number }> = new Map();

    // Helper to extract text from paragraph children
    const extractText = (element: any): string => {
      if (!element) return '';
      if (typeof element === 'string') return element;
      if (element.value) return element.value;
      if (element.children) {
        return element.children.map((c: any) => extractText(c)).join('');
      }
      return '';
    };

    const options = {
      // IMPORTANT: Preserve empty paragraphs for spacing/line breaks
      ignoreEmptyParagraphs: false,
      styleMap: [
        // English Headings
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",

        // German Headings
        "p[style-name='Überschrift 1'] => h1:fresh",
        "p[style-name='Überschrift 2'] => h2:fresh",
        "p[style-name='Überschrift 3'] => h3:fresh",
        "p[style-name='Überschrift 4'] => h4:fresh",
        "p[style-name='Überschrift 5'] => h5:fresh",
        "p[style-name='Überschrift 6'] => h6:fresh",
        "p[style-name='Überschrift'] => h1:fresh",

        // Title/Subtitle
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Titel'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Untertitel'] => h2:fresh",

        // Abstract/Summary
        "p[style-name='Abstract'] => h3:fresh",
        "p[style-name='Abstrakt'] => h3:fresh",
        "p[style-name='Kurzfassung'] => h3:fresh",

        // Quotes
        "p[style-name='Quote'] => blockquote:fresh > p:fresh",
        "p[style-name='Zitat'] => blockquote:fresh > p:fresh",
        "p[style-name='Intense Quote'] => blockquote:fresh > p:fresh",
        "p[style-name='Intensives Zitat'] => blockquote:fresh > p:fresh",

        // TOC Styles
        "p[style-name='TOC Heading'] => div.toc-ignore:fresh",
        "p[style-name='Inhaltsverzeichnisüberschrift'] => div.toc-ignore:fresh",
        "p[style-name='TOC 1'] => div.toc-item:fresh",
        "p[style-name='TOC 2'] => div.toc-item:fresh",
        "p[style-name='TOC 3'] => div.toc-item:fresh",
        "p[style-name='TOC 4'] => div.toc-item:fresh",
        "p[style-name='Verzeichnis 1'] => div.toc-item:fresh",
        "p[style-name='Verzeichnis 2'] => div.toc-item:fresh",
        "p[style-name='Verzeichnis 3'] => div.toc-item:fresh",

        // List Styles
        "p[style-name='List Paragraph'] => li > p:fresh",
        "p[style-name='Listenabsatz'] => li > p:fresh",
        "p[style-name='List Bullet'] => ul > li:fresh",
        "p[style-name='Aufzählungszeichen'] => ul > li:fresh",
        "p[style-name='List Number'] => ol > li:fresh",
        "p[style-name='Listenfortsetzung'] => li > p:fresh",
        "p[style-name='Normal (Web)'] => p:fresh",

        // Emphasis styles (for runs/text)
        "r[style-name='Emphasis'] => em",
        "r[style-name='Hervorhebung'] => em",
        "r[style-name='Strong'] => strong",
        "r[style-name='Fett'] => strong",
        "r[style-name='Intense Emphasis'] => strong > em",
        "r[style-name='Intensive Hervorhebung'] => strong > em",
      ],
      transformDocument: (element: any) => {
        const processElement = (el: any) => {
          if (el.children) {
            el.children.forEach((child: any) => {
              // Capture paragraph styles
              if (child.type === 'paragraph') {
                const text = extractText(child).trim();
                const style: {
                  align?: string;
                  indent?: number;
                  lineHeight?: number;
                  marginTop?: number;
                  marginBottom?: number;
                } = {};

                // Alignment
                if (child.alignment) {
                  const alignmentMap: Record<string, string> = {
                    'left': 'left',
                    'center': 'center',
                    'right': 'right',
                    'both': 'justify'
                  };
                  style.align = alignmentMap[child.alignment] || child.alignment;
                }

                // Indentation (convert twips to meaningful indent level)
                if (child.indent && child.indent.left) {
                  const marginPx = Math.round(child.indent.left / 20);
                  if (marginPx > 0) {
                    style.indent = Math.round(marginPx / 24);
                  }
                }

                // Paragraph spacing (before/after)
                if (child.spacing) {
                  // Line height
                  if (child.spacing.line) {
                    const lineHeight = parseFloat((child.spacing.line / 240).toFixed(2));
                    if (lineHeight > 0.1) {
                      style.lineHeight = lineHeight;
                    }
                  }
                  // Margin before (twips to pixels: 1 twip = 1/20 point, 1 point = 1.33px)
                  if (child.spacing.before) {
                    const marginTopPx = Math.round(child.spacing.before / 15);
                    if (marginTopPx > 0) {
                      style.marginTop = marginTopPx;
                    }
                  }
                  // Margin after
                  if (child.spacing.after) {
                    const marginBottomPx = Math.round(child.spacing.after / 15);
                    if (marginBottomPx > 0) {
                      style.marginBottom = marginBottomPx;
                    }
                  }
                }

                if (Object.keys(style).length > 0) {
                  // Use normalized text as key (first 100 chars to handle long paragraphs)
                  // For empty paragraphs, use a unique empty key with index
                  const key = text ? text.substring(0, 100).replace(/\s+/g, ' ') : `__empty_${paragraphStyles.size}__`;
                  paragraphStyles.set(key, style);
                }
              }

              // Recursive processing
              if (child.children) {
                processElement(child);
              }
            });
          }
        };
        processElement(element);
        return element;
      },
    };

    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    let html = result.value;

    // Post-process HTML to add styles based on text content matching
    // Helper function to build style string
    const buildStyleString = (style: any): string => {
      const styleAttrs: string[] = [];
      if (style.align && style.align !== 'left') {
        styleAttrs.push(`text-align: ${style.align}`);
      }
      if (style.indent && style.indent > 0) {
        styleAttrs.push(`margin-left: ${style.indent * 24}px`);
      }
      if (style.lineHeight && style.lineHeight > 1) {
        styleAttrs.push(`line-height: ${style.lineHeight}`);
      }
      if (style.marginTop && style.marginTop > 0) {
        styleAttrs.push(`margin-top: ${style.marginTop}px`);
      }
      if (style.marginBottom && style.marginBottom > 0) {
        styleAttrs.push(`margin-bottom: ${style.marginBottom}px`);
      }
      return styleAttrs.join('; ');
    };

    // Universal handler for ALL paragraph types (plain text, nested elements, mixed content)
    html = html.replace(/<p>([\s\S]*?)<\/p>/g, (match: string, content: string) => {
      // Extract plain text by stripping all HTML tags
      const plainText = content.replace(/<[^>]+>/g, '').trim();
      const normalizedText = plainText.substring(0, 100).replace(/\s+/g, ' ');

      const style = paragraphStyles.get(normalizedText);
      if (!style) return match;

      const styleString = buildStyleString(style);
      if (!styleString) return match;

      return `<p style="${styleString}">${content}</p>`;
    });

    // TOC Handling:
    // 1. Remove the "Inhaltsverzeichnis" title heading
    html = html.replace(/<div class="toc-ignore">[\s\S]*?<\/div>/g, '');

    // 2. Replace the first TOC item with a Plate TOC placeholder and remove others
    let tocPlaceholderInserted = false;
    html = html.replace(/<div class="toc-item">[\s\S]*?<\/div>/g, () => {
      if (!tocPlaceholderInserted) {
        tocPlaceholderInserted = true;
        return '<div class="plate-toc-placeholder"></div>';
      }
      return ''; // Remove subsequent items
    });

    // DEBUG: Log the generated HTML and any warnings
    console.log('=== MAMMOTH DEBUG ===');
    console.log('Generated HTML:', html.substring(0, 2000));
    console.log('Paragraph styles captured:', paragraphStyles.size);
    console.log('Style keys:', Array.from(paragraphStyles.keys()).slice(0, 10));
    console.log('Mammoth warnings:', result.messages);
    console.log('=== END MAMMOTH DEBUG ===');

    return html;
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
