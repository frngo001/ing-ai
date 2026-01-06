'use client';

import type { Path } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import {
  CITATION_KEY,
  type TCitationElement,
} from '@/components/editor/plugins/citation-kit';
import { useCitationStore } from '@/lib/stores/citation-store';
import { devLog, devWarn, devError } from '@/lib/utils/logger';

type InsertCitationInput = Omit<TCitationElement, 'type' | 'children'> & {
  children?: TCitationElement['children'];
  sourceId: string;
  authors: Array<{ fullName?: string; firstName?: string; lastName?: string }>;
  title: string;
  targetText?: string;
};

const debug = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'production') return;
};

const formatPath = (p?: Path) => (Array.isArray(p) ? p.join(',') : String(p));

const pathsEqual = (a: Path, b: Path) =>
  a.length === b.length && a.every((value, idx) => value === b[idx]);

const comparePath = (a: Path, b: Path) => {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return a.length - b.length;
};

const isSkippableText = (node: any) =>
  typeof node?.text === 'string' && /^[\s,;:\-\.]*$/.test(node.text);

const findNearestCitation = (
  editor: PlateEditor,
  anchorPath: Path
): [TCitationElement, Path] | null => {
  const entries = Array.from(
    editor.api.nodes({
      at: [],
      match: (n) => (n as any)?.type === CITATION_KEY,
    })
  ) as Array<[TCitationElement, Path]>;

  if (!entries.length) return null;

  let candidate: [TCitationElement, Path] | null = null;

  for (const entry of entries) {
    const [, path] = entry;
    if (!candidate || comparePath(path, anchorPath) <= 0) {
      candidate = entry;
    } else {
      break;
    }
  }

  return candidate;
};

/**
 * Sucht nach einem Text im Editor und gibt die Position nach dem Text zurück
 * @param editor PlateEditor Instanz
 * @param targetText Der zu suchende Text
 * @returns Path und Offset nach dem gefundenen Text, oder null wenn nicht gefunden
 */
const findTextInEditor = (
  editor: PlateEditor,
  targetText: string
): { path: Path; offset: number } | null => {
  if (!targetText || !targetText.trim()) {
    return null;
  }

  const searchText = targetText.trim();
  devLog('🔍 [FIND TEXT] Suche nach Text:', searchText);

  // Durchsuche alle Blöcke im Editor rekursiv
  const blocks = editor.children || [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as any;
    const blockPath: Path = [i];

    // Extrahiere Text aus dem Block rekursiv
    const extractText = (node: any): string => {
      if (typeof node?.text === 'string') {
        return node.text;
      }
      if (node?.children && Array.isArray(node.children)) {
        return node.children
          .map((child: any) => extractText(child))
          .join('');
      }
      return '';
    };

    const blockText = extractText(block);
    if (blockText && blockText.includes(searchText)) {
      // Finde die Position im Block
      const textIndex = blockText.indexOf(searchText);
      const targetOffset = textIndex + searchText.length;

      // Finde das spezifische Text-Node und den Offset
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

            // Prüfe, ob der gesuchte Text in diesem Node ist
            if (nodeStart <= textIndex && nodeEnd >= targetOffset) {
              // Der Text ist in diesem Node
              targetPath = childPath;
              finalOffset = targetOffset - nodeStart;
              return true;
            } else if (nodeEnd >= textIndex && nodeStart < targetOffset) {
              // Der Text überspannt mehrere Nodes - verwende das Ende des ersten Nodes
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
        devLog('✅ [FIND TEXT] Text in Block gefunden:', {
          path: formatPath(targetPath),
          offset: finalOffset,
          blockIndex: i,
        });
        return { path: targetPath, offset: finalOffset };
      }
    }
  }

  devWarn('⚠️ [FIND TEXT] Text nicht gefunden:', searchText);
  return null;
};

const getCitationRun = (
  editor: PlateEditor,
  targetPath: Path,
  allCitations: Array<[TCitationElement, Path]>
):
  | {
      parentPath: Path;
      insertIndex: number;
      citations: Array<{ child: TCitationElement; idx: number; path: Path }>;
    }
  | undefined => {
  debug('run: start', { targetPath });

  const parentPath = targetPath.slice(0, -1);
  const parentEntry = editor.api.node({ at: parentPath } as any) as any;
  const parentNode = Array.isArray(parentEntry) ? parentEntry[0] : null;
  const parentChildren = Array.isArray(parentNode?.children)
    ? (parentNode.children as Array<any>)
    : undefined;

  if (parentChildren) {
    debug('run: parent children', {
      parentPath,
      childCount: parentChildren.length,
      childTypes: parentChildren.map((c, idx) => ({
        idx,
        type: (c as any)?.type,
        text: (c as any)?.text,
      })),
    });
  } else {
    debug('run: parent children missing');
  }

  const siblingCitations = allCitations
    .filter(([, p]) => pathsEqual(p.slice(0, -1), parentPath))
    .map(([child, p]) => ({
      child,
      path: p,
      idx: p[p.length - 1] ?? 0,
    }))
    .sort((a, b) => a.idx - b.idx);

  debug('run: sibling citations', {
    parentPath: formatPath(parentPath),
    siblings: siblingCitations.map((c) => ({
      path: formatPath(c.path),
      idx: c.idx,
      sourceId: c.child.sourceId,
    })),
  });

  const currentIdx = siblingCitations.findIndex((c) => pathsEqual(c.path, targetPath));
  if (currentIdx === -1) {
    debug('run: current citation not found among siblings', {
      targetPath,
      siblingPaths: siblingCitations.map((c) => c.path),
    });
    return undefined;
  }

  // Vereinfachung: Alle Citation-Geschwister im selben Parent werden als Run behandelt.
  const start = 0;
  const end = siblingCitations.length - 1;

  return {
    parentPath,
    insertIndex: siblingCitations[start]?.idx ?? 0,
    citations: siblingCitations.slice(start, end + 1) as Array<{
      child: TCitationElement;
      idx: number;
      path: Path;
    }>,
  };
};

export const insertCitationWithMerge = (
  editor: PlateEditor,
  data: InsertCitationInput
) => {
  if (!editor) {
    devError('❌ [INSERT CITATION] Kein Editor verfügbar')
    return;
  }

  devLog('📝 [INSERT CITATION] Starte Citation-Einfügung:', {
    sourceId: data.sourceId,
    title: data.title,
    year: data.year,
    authors: data.authors,
    targetText: data.targetText,
  });

  debug('insert start', { data });

  // Validiere erforderliche Felder
  if (!data.sourceId) {
    devError('❌ [INSERT CITATION] sourceId fehlt')
    return
  }
  if (!data.title) {
    devError('❌ [INSERT CITATION] title fehlt')
    return
  }

  // Wenn targetText angegeben ist, suche nach dem Text und setze die Selection
  if (data.targetText && data.targetText.trim()) {
    const textPosition = findTextInEditor(editor, data.targetText);
    if (textPosition) {
      devLog('✅ [INSERT CITATION] Text gefunden, setze Selection:', {
        path: formatPath(textPosition.path),
        offset: textPosition.offset,
      });
      // Setze die Selection auf die Position nach dem gefundenen Text
      editor.tf.select({
        anchor: { path: textPosition.path, offset: textPosition.offset },
        focus: { path: textPosition.path, offset: textPosition.offset },
      });
    } else {
      devWarn('⚠️ [INSERT CITATION] targetText nicht gefunden, verwende aktuelle Cursor-Position:', data.targetText);
    }
  }

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
  };

  devLog('📝 [INSERT CITATION] Citation-Node erstellt:', citationNode);

  try {
    editor.tf.insertNodes(citationNode, { select: true });
    devLog('✅ [INSERT CITATION] Citation-Node erfolgreich eingefügt')
  } catch (error) {
    devError('❌ [INSERT CITATION] Fehler beim Einfügen des Citation-Nodes:', error)
    throw error
  }

  // Nach dem Einfügen den Pfad des neu eingefügten Knotens ermitteln (letzter Citation in Doc).
  const allAfterInsert = Array.from(
    editor.api.nodes({
      at: [],
      match: (n) => (n as any)?.type === CITATION_KEY,
    })
  ) as Array<[TCitationElement, Path]>;

  const lastCitation = allAfterInsert.at(-1);
  const insertedPath = lastCitation?.[1];
  debug('post-insert path resolve', { insertedPath, total: allAfterInsert.length });

  const { citationFormat } = useCitationStore.getState();
  if (citationFormat !== 'numeric') {
    debug('skip merge: format not numeric', citationFormat);
    return;
  }

  const selection = editor.selection;
  if (!selection) {
    debug('skip merge: no selection');
    return;
  }

  const allCitations = Array.from(
    editor.api.nodes({
      at: [],
      match: (n) => (n as any)?.type === CITATION_KEY,
    })
  ) as Array<[TCitationElement, Path]>;

  debug('citations in document', {
    count: allCitations.length,
    entries: allCitations.map(([node, p]) => ({
      sourceId: node.sourceId,
      path: formatPath(p),
      parentPath: formatPath(p.slice(0, -1)),
    })),
    selectionAnchor: selection.anchor,
    selectionFocus: selection.focus,
  });

  // Nutze bevorzugt den Pfad des gerade eingefügten Knotens, falls vorhanden.
  const nearestPath = insertedPath ?? selection.anchor.path;
  const nearest = findNearestCitation(editor, nearestPath);
  if (!nearest) {
    debug('skip merge: no nearest citation found');
    return;
  }

  const parentPathStr = formatPath(nearest[1].slice(0, -1));
  const siblingGroup = allCitations.filter(
    ([, p]) => formatPath(p.slice(0, -1)) === parentPathStr
  );

  debug('sibling group', {
    parentPath: parentPathStr,
    count: siblingGroup.length,
    paths: siblingGroup.map(([, p]) => formatPath(p)),
  });

  let run = getCitationRun(editor, nearest[1], allCitations);
  if (!run) {
    // Fallback: treat the nearest citation as a single run, so we can at
    // least dedup and not bail out silently.
    debug('fallback: construct single-item run');
    const parentPath = nearest[1].slice(0, -1);
    run = {
      parentPath,
      insertIndex: nearest[1][nearest[1].length - 1] ?? 0,
      citations: [
        {
          child: nearest[0],
          idx: nearest[1][nearest[1].length - 1] ?? 0,
          path: nearest[1],
        },
      ],
    };
  }

  debug('merge run', {
    parentPath: run.parentPath,
    insertIndex: run.insertIndex,
    citations: run.citations.map((c) => ({
      sourceId: c.child.sourceId,
      path: c.path,
      idx: c.idx,
    })),
  });

  const unique: TCitationElement[] = [];
  const seen = new Set<string>();

  run.citations.forEach(({ child }) => {
    const key = child.sourceId || '';
    if (key) {
      if (seen.has(key)) return;
      seen.add(key);
    }
    unique.push(child);
  });

  debug('unique citations after dedupe', unique.map((c) => c.sourceId || '<no-source>'));

  editor.tf.withoutNormalizing(() => {
    for (let i = run.citations.length - 1; i >= 0; i -= 1) {
      editor.tf.removeNodes({ at: run.citations[i].path });
    }

    unique.forEach((citation, idx) => {
      editor.tf.insertNodes(
        {
          ...citation,
          type: CITATION_KEY,
          children: citation.children ?? [{ text: '' }],
        },
        { at: [...run.parentPath, run.insertIndex + idx] }
      );
    });
  });

  debug('merge complete');
};
