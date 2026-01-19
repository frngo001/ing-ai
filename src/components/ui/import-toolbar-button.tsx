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

/**
 * Convert native HTML lists (ul/ol > li) to Plate.js-compatible paragraph format.
 * Plate.js deserializer doesn't properly handle nested list elements,
 * so we need to "flatten" lists into paragraphs with special attributes.
 *
 * Also adds unique markers to track list items through deserialization.
 *
 * @param html - The HTML string to process
 * @param wordListInfo - Map of text -> { isOrdered, level } from Word document (optional)
 *                       This is more reliable than HTML tags since Mammoth converts all lists to <ul>
 */
function convertNativeListsToPlateFormat(
  html: string,
  wordListInfo?: Map<string, { isOrdered: boolean; level: number }>
): { html: string; listMarkers: Map<string, { listStyleType: string; indent: number }> } {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Track all list items with unique markers
  const listMarkers = new Map<string, { listStyleType: string; indent: number }>();
  let markerIndex = 0;

  // Helper to extract plain text from an element, EXCLUDING nested lists
  // This is critical because textContent includes ALL descendant text,
  // but we only want the direct content of this LI (not nested LI text)
  const extractPlainText = (el: Element): string => {
    let text = '';

    // Walk through child nodes
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        // Direct text node
        text += child.textContent || '';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as Element;
        const tagName = childEl.tagName.toLowerCase();

        // Skip nested lists - we don't want their text
        if (tagName === 'ul' || tagName === 'ol') {
          return;
        }

        // For other elements (strong, em, span, etc.), recursively extract text
        // but still exclude any nested lists within them
        text += extractPlainText(childEl);
      }
    });

    return text.replace(/\s+/g, ' ').trim();
  };

  // Helper to determine list type from Word info or fallback to HTML tag
  const getListTypeFromWordInfo = (liElement: Element, htmlIsOrdered: boolean, depth: number): { listStyleType: string; indent: number } => {
    if (wordListInfo && wordListInfo.size > 0) {
      const plainText = extractPlainText(liElement);
      const normalizedText = plainText.substring(0, 100).replace(/\s+/g, ' ');

      // Try exact match first
      const wordInfo = wordListInfo.get(normalizedText);
      if (wordInfo) {
        console.log('[LIST TYPE] Found Word info for:', normalizedText.substring(0, 50), '-> isOrdered:', wordInfo.isOrdered, 'level:', wordInfo.level);
        return {
          listStyleType: wordInfo.isOrdered ? 'decimal' : 'disc',
          indent: wordInfo.level,
        };
      }

      // Try partial matching for longer texts
      for (const [key, info] of wordListInfo.entries()) {
        if (key.startsWith(normalizedText.substring(0, 30)) || normalizedText.startsWith(key.substring(0, 30))) {
          console.log('[LIST TYPE] Partial match for:', normalizedText.substring(0, 50), '-> isOrdered:', info.isOrdered, 'level:', info.level);
          return {
            listStyleType: info.isOrdered ? 'decimal' : 'disc',
            indent: info.level,
          };
        }
      }

      console.log('[LIST TYPE] No Word info found for:', normalizedText.substring(0, 50), '-> using HTML depth:', depth + 1);
    }

    // Fallback to HTML tag-based detection
    return {
      listStyleType: htmlIsOrdered ? 'decimal' : 'disc',
      indent: depth + 1,
    };
  };

  // Process all lists recursively
  const processLists = (element: Element, depth: number = 0) => {
    // Find direct child lists
    const lists = element.querySelectorAll(':scope > ul, :scope > ol');

    lists.forEach((list) => {
      const htmlIsOrdered = list.tagName.toLowerCase() === 'ol';
      const items = list.querySelectorAll(':scope > li');

      // Convert each LI to a P with list attributes
      const fragments: Node[] = [];
      items.forEach((li) => {
        // Check for nested lists inside this LI
        const nestedLists = li.querySelectorAll(':scope > ul, :scope > ol');

        // Create unique marker for this list item
        const marker = `__LIST_MARKER_${markerIndex++}__`;

        // Get list type from Word info (more accurate) or fallback to HTML tag
        const { listStyleType, indent } = getListTypeFromWordInfo(li, htmlIsOrdered, depth);

        // Create paragraph for the LI content
        const p = doc.createElement('p');
        p.className = 'MsoListParagraph';
        p.setAttribute('data-list-type', listStyleType === 'decimal' ? 'ordered' : 'unordered');
        p.setAttribute('data-list-level', String(indent));
        p.setAttribute('data-list-marker', marker);

        // Store marker info
        listMarkers.set(marker, {
          listStyleType,
          indent,
        });

        // Add invisible marker span at the beginning
        const markerSpan = doc.createElement('span');
        markerSpan.setAttribute('data-list-marker', marker);
        markerSpan.style.display = 'none';
        markerSpan.textContent = marker;
        p.appendChild(markerSpan);

        // Move LI's direct text/inline content to the new paragraph
        // (excluding nested lists)
        Array.from(li.childNodes).forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as Element;
            if (el.tagName.toLowerCase() !== 'ul' && el.tagName.toLowerCase() !== 'ol') {
              p.appendChild(child.cloneNode(true));
            }
          } else {
            p.appendChild(child.cloneNode(true));
          }
        });

        fragments.push(p);

        // Process nested lists recursively
        nestedLists.forEach((nestedList) => {
          // Create a temporary container for the nested list
          const tempContainer = doc.createElement('div');
          tempContainer.appendChild(nestedList.cloneNode(true));
          processLists(tempContainer, depth + 1);

          // Add all resulting paragraphs
          Array.from(tempContainer.childNodes).forEach((child) => {
            fragments.push(child.cloneNode(true));
          });
        });
      });

      // Replace the list with the converted paragraphs
      const parent = list.parentNode;
      if (parent) {
        fragments.forEach((fragment) => {
          parent.insertBefore(fragment, list);
        });
        parent.removeChild(list);
      }
    });
  };

  // Process the entire document
  processLists(doc.body);

  // Also handle any remaining lists at deeper levels
  let remainingLists = doc.body.querySelectorAll('ul, ol');
  while (remainingLists.length > 0) {
    remainingLists.forEach((list) => {
      const htmlIsOrdered = list.tagName.toLowerCase() === 'ol';
      const items = list.querySelectorAll(':scope > li');

      const fragments: Node[] = [];
      items.forEach((li) => {
        const marker = `__LIST_MARKER_${markerIndex++}__`;

        // Get list type from Word info (more accurate) or fallback to HTML tag
        const { listStyleType, indent } = getListTypeFromWordInfo(li, htmlIsOrdered, 0);

        const p = doc.createElement('p');
        p.className = 'MsoListParagraph';
        p.setAttribute('data-list-type', listStyleType === 'decimal' ? 'ordered' : 'unordered');
        p.setAttribute('data-list-level', String(indent));
        p.setAttribute('data-list-marker', marker);

        listMarkers.set(marker, {
          listStyleType,
          indent,
        });

        // Add invisible marker span at the beginning
        const markerSpan = doc.createElement('span');
        markerSpan.setAttribute('data-list-marker', marker);
        markerSpan.style.display = 'none';
        markerSpan.textContent = marker;
        p.appendChild(markerSpan);

        // Copy content
        const content = li.innerHTML;
        const tempDiv = doc.createElement('div');
        tempDiv.innerHTML = content;
        Array.from(tempDiv.childNodes).forEach(child => {
          p.appendChild(child.cloneNode(true));
        });

        fragments.push(p);
      });

      const parent = list.parentNode;
      if (parent) {
        fragments.forEach((fragment) => {
          parent.insertBefore(fragment, list);
        });
        parent.removeChild(list);
      }
    });

    remainingLists = doc.body.querySelectorAll('ul, ol');
  }

  console.log('[convertNativeListsToPlateFormat] Converted', listMarkers.size, 'list items to paragraphs');

  return { html: doc.body.innerHTML, listMarkers };
}

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
   * Returns both HTML and list markers for proper list type handling
   */
  const convertWordToHtml = async (arrayBuffer: ArrayBuffer): Promise<{
    html: string;
    listMarkers: Map<string, { listStyleType: string; indent: number }>;
  }> => {
    const mammothModule = await import('mammoth');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mammoth = (mammothModule as any).default || mammothModule;

    // Store paragraph styles using text content as key (more robust than index)
    const paragraphStyles: Map<string, { align?: string; indent?: number; lineHeight?: number }> = new Map();

    // Store list information for paragraphs - using TEXT as key (more robust than index)
    // Mammoth may skip/combine paragraphs, so index-based matching doesn't work
    const listInfo: Map<string, { isOrdered: boolean; level: number }> = new Map();

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

        // German Headings (case-insensitive matching via multiple entries)
        "p[style-name='Überschrift 1'] => h1:fresh",
        "p[style-name='Überschrift 2'] => h2:fresh",
        "p[style-name='Überschrift 3'] => h3:fresh",
        "p[style-name='Überschrift 4'] => h4:fresh",
        "p[style-name='Überschrift 5'] => h5:fresh",
        "p[style-name='Überschrift 6'] => h6:fresh",
        "p[style-name='Überschrift'] => h1:fresh",
        "p[style-name='heading 1'] => h1:fresh",
        "p[style-name='heading 2'] => h2:fresh",
        "p[style-name='heading 3'] => h3:fresh",
        "p[style-name='heading 4'] => h4:fresh",
        "p[style-name='heading 5'] => h5:fresh",
        "p[style-name='heading 6'] => h6:fresh",

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

        // TOC Styles - ignore them (will be replaced with Plate TOC)
        "p[style-name='TOC Heading'] => div.toc-ignore:fresh",
        "p[style-name='Inhaltsverzeichnisüberschrift'] => div.toc-ignore:fresh",
        "p[style-name='TOC 1'] => div.toc-item:fresh",
        "p[style-name='TOC 2'] => div.toc-item:fresh",
        "p[style-name='TOC 3'] => div.toc-item:fresh",
        "p[style-name='TOC 4'] => div.toc-item:fresh",
        "p[style-name='toc 1'] => div.toc-item:fresh",
        "p[style-name='toc 2'] => div.toc-item:fresh",
        "p[style-name='toc 3'] => div.toc-item:fresh",
        "p[style-name='Verzeichnis 1'] => div.toc-item:fresh",
        "p[style-name='Verzeichnis 2'] => div.toc-item:fresh",
        "p[style-name='Verzeichnis 3'] => div.toc-item:fresh",

        // List Styles - DO NOT override these, let Mammoth use native list conversion
        // Mammoth automatically converts numbered paragraphs to <ol><li> and bulleted to <ul><li>
        // We only need to handle "Normal (Web)" style
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
              // Capture paragraph styles and list info
              if (child.type === 'paragraph') {
                const text = extractText(child).trim();

                // Check for numbering (this is how Word stores list info)
                // Use normalized text as key (first 100 chars, spaces normalized)
                if (child.numbering && text) {
                  const level = parseInt(child.numbering.level || '0', 10) + 1;
                  const isOrdered = child.numbering.isOrdered === true;
                  const key = text.substring(0, 100).replace(/\s+/g, ' ');
                  listInfo.set(key, { isOrdered, level });
                }

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

    // Process paragraphs to add list information using TEXT-BASED matching
    // This is more robust than index-based since Mammoth may skip/combine elements
    html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/g, (match: string, attrs: string, content: string) => {
      // Extract plain text by stripping all HTML tags
      const plainText = content.replace(/<[^>]+>/g, '').trim();
      const normalizedText = plainText.substring(0, 100).replace(/\s+/g, ' ');

      // Look up list info by text content
      const listData = listInfo.get(normalizedText);
      const style = paragraphStyles.get(normalizedText);
      const styleString = style ? buildStyleString(style) : '';

      if (listData) {
        // This paragraph is a list item
        const listType = listData.isOrdered ? 'ordered' : 'unordered';
        const level = listData.level;
        const existingStyle = styleString ? `${styleString}; ` : '';
        const msoListStyle = `mso-list: level${level} ${listType}`;

        return `<p class="MsoListParagraph" style="${existingStyle}${msoListStyle}" data-list-type="${listType}" data-list-level="${level}"${attrs}>${content}</p>`;
      } else if (styleString) {
        return `<p${attrs} style="${styleString}">${content}</p>`;
      }

      return match;
    });

    // Also handle paragraphs with existing class attribute (from styleMap)
    html = html.replace(/<p class="MsoListParagraph"([^>]*)>([\s\S]*?)<\/p>/g, (match: string, attrs: string, content: string) => {
      // If already processed with data-list-type, skip
      if (attrs.includes('data-list-type')) return match;

      // Otherwise, mark as unordered list by default (will be detected by deserializer)
      return `<p class="MsoListParagraph" data-list-type="unordered" data-list-level="1"${attrs}>${content}</p>`;
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

    // CRITICAL: Convert native HTML lists to Plate.js-compatible paragraphs
    // Plate.js deserializer doesn't properly descend into UL/OL children,
    // so we need to transform lists BEFORE deserialization
    // Pass listInfo to use Word's accurate list type information (Mammoth converts all to <ul>)
    const { html: convertedHtml, listMarkers } = convertNativeListsToPlateFormat(html, listInfo);
    html = convertedHtml;

    // DEBUG: Log the generated HTML and any warnings
    console.log('=== MAMMOTH DEBUG ===');
    console.log('Generated HTML (first 5000 chars):', html.substring(0, 5000));
    console.log('List info captured from Word:', listInfo.size);
    // Log sample of list info to verify ordered/unordered detection
    const listInfoSample = Array.from(listInfo.entries()).slice(0, 20);
    console.log('List info sample (first 20):');
    listInfoSample.forEach(([key, info]) => {
      console.log(`  "${key.substring(0, 50)}..." -> isOrdered: ${info.isOrdered}, level: ${info.level}`);
    });
    console.log('List markers created:', listMarkers.size);
    // Log sample of list markers to verify types
    const markersSample = Array.from(listMarkers.entries()).slice(0, 20);
    console.log('List markers sample (first 20):');
    markersSample.forEach(([marker, info]) => {
      console.log(`  ${marker} -> listStyleType: ${info.listStyleType}, indent: ${info.indent}`);
    });
    console.log('Paragraph styles captured:', paragraphStyles.size);
    console.log('Mammoth warnings:', result.messages);

    // Count HTML list elements to verify conversion
    const ulCount = (html.match(/<ul/gi) || []).length;
    const olCount = (html.match(/<ol/gi) || []).length;
    const liCount = (html.match(/<li/gi) || []).length;
    const msoListCount = (html.match(/MsoListParagraph/gi) || []).length;
    console.log('After conversion - UL:', ulCount, 'OL:', olCount, 'LI:', liCount);
    console.log('MsoListParagraph count:', msoListCount);
    console.log('=== END MAMMOTH DEBUG ===');

    // Return both HTML and listMarkers for use in node processing
    return { html, listMarkers };
  };

  const { openFilePicker: openMdFilePicker } = useFilePicker({
    accept: ['.md', '.mdx'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      window.dispatchEvent(new CustomEvent('editor:set-loading', { detail: { loading: true } }));

      try {
        const text = await plainFiles[0].text();
        const nodes = getFileNodes(text, 'markdown');
        editor.tf.insertNodes(nodes);
      } catch (error) {
        console.error('Error importing markdown:', error);
      } finally {
        // Delay slightly for smoother transition if it's too fast
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('editor:set-loading', { detail: { loading: false } }));
        }, 300);
      }
    },
  });

  const { openFilePicker: openHtmlFilePicker } = useFilePicker({
    accept: ['text/html'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      window.dispatchEvent(new CustomEvent('editor:set-loading', { detail: { loading: true } }));

      try {
        const text = await plainFiles[0].text();
        const nodes = getFileNodes(text, 'html');
        editor.tf.insertNodes(nodes);
      } catch (error) {
        console.error('Error importing html:', error);
      } finally {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('editor:set-loading', { detail: { loading: false } }));
        }, 300);
      }
    },
  });

  const { openFilePicker: openWordFilePicker } = useFilePicker({
    accept: ['.docx', '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    multiple: false,
    onFilesSelected: async ({ plainFiles }) => {
      window.dispatchEvent(new CustomEvent('editor:set-loading', { detail: { loading: true } }));

      try {
        const file = plainFiles[0];
        const arrayBuffer = await file.arrayBuffer();

        // Convert Word to HTML using mammoth - returns HTML and list markers
        const { html, listMarkers } = await convertWordToHtml(arrayBuffer);

        // Deserialize HTML to Plate nodes
        const nodes = getFileNodes(html, 'html');

        // DEBUG: Log nodes to see if listStyleType is being set
        console.log('=== DESERIALIZED NODES DEBUG ===');
        console.log('Total nodes:', nodes.length);
        console.log('List markers available:', listMarkers.size);

        // Extract text recursively from Plate.js node (including marker text)
        const extractNodeText = (node: any): string => {
          if (typeof node === 'string') return node;
          if (node.text) return node.text;
          if (node.children && Array.isArray(node.children)) {
            return node.children.map((child: any) => extractNodeText(child)).join('');
          }
          return '';
        };

        // Apply list properties using marker-based matching
        // This is more reliable than text-based matching
        const processNodesWithMarkers = (nodeList: any[]): any[] => {
          return nodeList.map((node: any) => {
            if (node.type === 'p' && node.children) {
              // Extract all text including hidden markers
              const fullText = extractNodeText(node);

              // Check for list marker in the text
              const markerMatch = fullText.match(/__LIST_MARKER_(\d+)__/);
              if (markerMatch) {
                const marker = markerMatch[0];
                const listInfo = listMarkers.get(marker);

                if (listInfo) {
                  console.log('[MARKER] Applied list properties to node with marker:', marker);

                  // Remove the marker text from children
                  const cleanChildren = cleanMarkerFromChildren(node.children);

                  return {
                    ...node,
                    children: cleanChildren,
                    listStyleType: listInfo.listStyleType,
                    indent: listInfo.indent,
                  };
                }
              }
            }

            // Recursively process children if they exist (but not leaf text nodes)
            if (node.children && Array.isArray(node.children) && !node.text) {
              return {
                ...node,
                children: processNodesWithMarkers(node.children),
              };
            }

            return node;
          });
        };

        // Helper to remove marker text from children
        const cleanMarkerFromChildren = (children: any[]): any[] => {
          return children
            .map((child: any) => {
              if (child.text) {
                // Remove marker from text
                const cleanedText = child.text.replace(/__LIST_MARKER_\d+__/g, '');
                if (cleanedText === '' && Object.keys(child).length === 1) {
                  return null; // Remove empty text nodes
                }
                return { ...child, text: cleanedText };
              }
              if (child.children) {
                return { ...child, children: cleanMarkerFromChildren(child.children) };
              }
              return child;
            })
            .filter((child: any) => child !== null);
        };

        const processedNodes = processNodesWithMarkers(nodes);
        const nodesWithListStyle = processedNodes.filter((n: any) => n.listStyleType);

        console.log('Nodes with listStyleType (after marker processing):', nodesWithListStyle.length);
        console.log('Expected from markers:', listMarkers.size);

        if (nodesWithListStyle.length < listMarkers.size) {
          console.log(`[WARNING] ${listMarkers.size - nodesWithListStyle.length} list items could not be matched`);
        }

        if (nodesWithListStyle.length > 0) {
          console.log('Sample list nodes:', nodesWithListStyle.slice(0, 3));
        }

        console.log('=== END DESERIALIZED NODES DEBUG ===');

        editor.tf.insertNodes(processedNodes);
      } catch (error) {
        console.error('Error importing word:', error);
      } finally {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('editor:set-loading', { detail: { loading: false } }));
        }, 500);
      }
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
