'use client';

import type { PlateEditor } from 'platejs/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';

/**
 * Bereitet den Editor für die Zitat-Einfügung vor, indem der Cursor
 * ans Ende des selektierten Textes gesetzt wird, damit das Zitat
 * nach dem Text eingefügt wird und nicht den Text ersetzt.
 */
export function prepareCitationInsertion(editor: PlateEditor): void {
  if (!editor) return;

  // Versuche zuerst Block-Selection
  const blockSelection = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes();

  if (blockSelection.length > 0) {
    // Wenn Block-Selection vorhanden, setze Cursor ans Ende des letzten Blocks
    const lastBlock = blockSelection[blockSelection.length - 1];
    const [, lastPath] = lastBlock;

    // Finde das Ende des Blocks und setze Cursor dort
    const blockEntry = editor.api.block({ at: lastPath });
    if (blockEntry) {
      const [, blockPath] = blockEntry;
      const blockNode = blockEntry[0] as any;
      const children = blockNode?.children || [];

      if (children.length > 0) {
        // Finde das letzte Text-Node im Block
        let lastTextPath: number[] | null = null;
        let lastTextOffset = 0;

        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          if (child && typeof child.text === 'string') {
            lastTextPath = [...blockPath, i];
            lastTextOffset = child.text.length;
            break;
          }
        }

        if (lastTextPath) {
          // Setze Cursor ans Ende des letzten Text-Nodes
          editor.tf.select({
            anchor: { path: lastTextPath, offset: lastTextOffset },
            focus: { path: lastTextPath, offset: lastTextOffset },
          });
        } else {
          // Kein Text-Node gefunden, setze Cursor nach dem Block
          const nextPath = [...blockPath];
          nextPath[nextPath.length - 1] = (nextPath[nextPath.length - 1] as number) + 1;
          editor.tf.select({
            anchor: { path: nextPath, offset: 0 },
            focus: { path: nextPath, offset: 0 },
          });
        }
      } else {
        // Block ist leer, setze Cursor in den Block
        editor.tf.select({
          anchor: { path: [...blockPath, 0], offset: 0 },
          focus: { path: [...blockPath, 0], offset: 0 },
        });
      }
    }
  } else if (editor.selection) {
    // Falls keine Block-Selection, aber normale Selection vorhanden
    // Setze Cursor ans Ende der Selection
    editor.tf.collapse({ edge: 'end' });
  }
}

