'use client';

import type { Path } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import { CITATION_KEY, type TCitationElement } from '@/components/editor/plugins/citation-kit';

// ============================================================================
// Types
// ============================================================================

type InsertCitationInput = Omit<TCitationElement, 'type' | 'children'> & {
  children?: TCitationElement['children'];
  sourceId: string;
  authors: Array<{ fullName?: string; firstName?: string; lastName?: string }>;
  title: string;
  targetText?: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts all text content from a node recursively
 */
const extractText = (node: any): string => {
  if (typeof node?.text === 'string') {
    return node.text;
  }
  if (node?.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('');
  }
  return '';
};

/**
 * Finds text in the editor and returns the position after the text
 */
const findTextInEditor = (
  editor: PlateEditor,
  targetText: string
): { path: Path; offset: number } | null => {
  const searchText = targetText?.trim();
  if (!searchText) return null;

  const blocks = editor.children || [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as any;
    const blockPath: Path = [i];
    const blockText = extractText(block);

    if (!blockText?.includes(searchText)) continue;

    const textIndex = blockText.indexOf(searchText);
    const targetOffset = textIndex + searchText.length;

    let currentOffset = 0;
    let targetPath: Path | null = null;
    let finalOffset = 0;

    const findInChildren = (children: any[], parentPath: Path): boolean => {
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        const childPath = [...parentPath, j];

        if (typeof child?.text === 'string') {
          const textLength = child.text.length;
          const nodeStart = currentOffset;
          const nodeEnd = currentOffset + textLength;

          if (nodeStart <= textIndex && nodeEnd >= targetOffset) {
            targetPath = childPath;
            finalOffset = targetOffset - nodeStart;
            return true;
          } else if (nodeEnd >= textIndex && nodeStart < targetOffset) {
            targetPath = childPath;
            finalOffset = textLength;
            return true;
          }

          currentOffset += textLength;
        } else if (child?.children && Array.isArray(child.children)) {
          if (findInChildren(child.children, childPath)) {
            return true;
          }
        }
      }
      return false;
    };

    if (block.children && Array.isArray(block.children)) {
      findInChildren(block.children, blockPath);
    }

    if (targetPath) {
      return { path: targetPath, offset: finalOffset };
    }
  }

  return null;
};

// ============================================================================
// Main Function
// ============================================================================

/**
 * Inserts a citation at the current cursor position or after a target text.
 * Adjacent citations are automatically merged by the CitationElement component.
 */
export const insertCitationWithMerge = (
  editor: PlateEditor,
  data: InsertCitationInput
): void => {
  if (!editor) return;
  if (!data.sourceId || !data.title) return;

  // If targetText is specified, find and select that position
  if (data.targetText?.trim()) {
    const textPosition = findTextInEditor(editor, data.targetText);
    if (textPosition) {
      editor.tf.select({
        anchor: { path: textPosition.path, offset: textPosition.offset },
        focus: { path: textPosition.path, offset: textPosition.offset },
      });
    }
  }

  // Create citation node
  const citationNode: TCitationElement = {
    type: CITATION_KEY,
    children: [{ text: '' }],
    sourceId: data.sourceId,
    title: data.title,
    authors: data.authors || [],
    year: typeof data.year === 'number' ? data.year : undefined,
    doi: typeof data.doi === 'string' ? data.doi : undefined,
    url: typeof data.url === 'string' ? data.url : undefined,
    sourceType: typeof data.sourceType === 'string' ? data.sourceType : undefined,
    journal: typeof data.journal === 'string' ? data.journal : undefined,
    containerTitle: typeof data.containerTitle === 'string' ? data.containerTitle : undefined,
    publisher: typeof data.publisher === 'string' ? data.publisher : undefined,
    volume: typeof data.volume === 'string' ? data.volume : undefined,
    issue: typeof data.issue === 'string' ? data.issue : undefined,
    pages: typeof data.pages === 'string' ? data.pages : undefined,
    isbn: typeof data.isbn === 'string' ? data.isbn : undefined,
    issn: typeof data.issn === 'string' ? data.issn : undefined,
    note: typeof data.note === 'string' ? data.note : undefined,
    accessedAt: typeof data.accessedAt === 'string' ? data.accessedAt : undefined,
    edition: typeof (data as any).edition === 'string' ? (data as any).edition : undefined,
    publisherPlace: typeof (data as any).publisherPlace === 'string' ? (data as any).publisherPlace : undefined,
    shortTitle: typeof (data as any).shortTitle === 'string' ? (data as any).shortTitle : undefined,
    abstract: typeof (data as any).abstract === 'string' ? (data as any).abstract : undefined,
    imageUrl: typeof (data as any).imageUrl === 'string' ? (data as any).imageUrl :
      typeof (data as any).image === 'string' ? (data as any).image : undefined,
    description: typeof (data as any).description === 'string' ? (data as any).description : undefined,
  };

  // Insert the citation
  editor.tf.insertNodes(citationNode, { select: true });
};
