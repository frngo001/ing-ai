'use client';

import * as React from 'react';
import { createPlatePlugin } from 'platejs/react';
import type { TElement, Path } from 'platejs';
import { KEYS } from 'platejs';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import { useCollapsedHeadingsStore } from '@/lib/stores/collapsed-headings-store';

const HEADING_TYPES = [KEYS.h1, KEYS.h2, KEYS.h3, KEYS.h4, KEYS.h5, KEYS.h6];
const EMPTY_SET = new Set<string>();

/**
 * Hook der berechnet, welche Element-IDs unter eingeklappten Überschriften versteckt werden sollen.
 * Gibt ein Set von Element-IDs zurück, die versteckt werden sollen.
 */
export function useHiddenElementIds(documentId: string = 'global'): Set<string> {
  const collapsedHeadings = useCollapsedHeadingsStore((state) => state.collapsedHeadings);

  // Use a stable reference for the set to prevent useEditorSelector from re-running unnecessarily
  const collapsedIds = React.useMemo(() => {
    return collapsedHeadings.get(documentId) ?? EMPTY_SET;
  }, [collapsedHeadings, documentId]);

  const editor = useEditorRef();

  const hiddenIdsJson = useEditorSelector(
    (ed) => {
      if (collapsedIds.size === 0) return '[]';

      const headingTypes = HEADING_TYPES.map((key) => ed.getType(key));
      const hiddenIdsList: string[] = [];

      // Sammle alle Nodes
      const allNodes: Array<{ node: TElement; path: Path; level: number; id: string }> = [];

      const nodes = ed.api.nodes({
        at: [],
        match: (node: any) => {
          const asAny = node as any;
          return !asAny.bibliographyHeading && !asAny.bibliography &&
            !asAny.figureListHeading && !asAny.figureList &&
            !asAny.tableListHeading && !asAny.tableList;
        },
      });

      for (const [node, path] of nodes) {
        const element = node as TElement;
        const id = (element as any).id as string;
        if (!id) continue;

        const isHeading = headingTypes.includes(element.type);
        const level = isHeading ? headingTypes.indexOf(element.type) + 1 : 0;

        allNodes.push({ node: element, path: path as Path, level, id });
      }

      // Sortiere nach Position im Dokument
      allNodes.sort((a, b) => {
        const minLength = Math.min(a.path.length, b.path.length);
        for (let i = 0; i < minLength; i++) {
          if (a.path[i] !== b.path[i]) {
            return (a.path[i] ?? 0) - (b.path[i] ?? 0);
          }
        }
        return a.path.length - b.path.length;
      });

      // Gehe durch alle Nodes und markiere die versteckten
      let currentCollapsedHeading: { level: number; id: string } | null = null;

      for (const node of allNodes) {
        const isHeading = node.level > 0;

        if (isHeading) {
          // Prüfe, ob diese Überschrift den Collapse-Bereich beendet
          if (currentCollapsedHeading && node.level <= currentCollapsedHeading.level) {
            currentCollapsedHeading = null;
          }

          // Wenn wir in einem Collapse-Bereich sind und diese Überschrift niedriger ist,
          // verstecke sie
          if (currentCollapsedHeading && node.level > currentCollapsedHeading.level) {
            hiddenIdsList.push(node.id);
          }

          // Prüfe, ob diese Überschrift eingeklappt ist
          // WICHTIG: Nur wenn wir nicht bereits in einem Collapse-Bereich sind!
          // Wenn wir bereits versteckt sind (weil parent eingeklappt ist), ignorieren wir den Status des Childs.
          // Das Child ist sowieso versteckt. Wenn wir hier currentCollapsedHeading auf das Child setzen würden,
          // würden wir den Scope des Parents "vergessen" und das Child würde den Scope zu früh beenden.
          if (!currentCollapsedHeading && collapsedIds.has(node.id)) {
            currentCollapsedHeading = { level: node.level, id: node.id };
          }
        } else {
          // Kein Heading - verstecke wenn im Collapse-Bereich
          if (currentCollapsedHeading) {
            hiddenIdsList.push(node.id);
          }
        }
      }

      // Return consistent JSON string to ensure strict equality works in useEditorSelector
      return JSON.stringify(hiddenIdsList.sort());
    },
    [collapsedIds]
  );

  return React.useMemo(() => new Set(JSON.parse(hiddenIdsJson)), [hiddenIdsJson]);
}

/**
 * Komponente, die versteckte Elemente per CSS versteckt.
 * Muss als Kind des Plate-Editors gerendert werden.
 */
export function CollapsibleHeadingsManager({ documentId = 'global' }: { documentId?: string }) {
  const hiddenIds = useHiddenElementIds(documentId);
  const editor = useEditorRef();

  const prevHiddenIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    // Deep equality check to prevent infinite loops
    // Only proceed if the set of hidden IDs has actually changed
    const prevHiddenIds = prevHiddenIdsRef.current;
    if (
      hiddenIds.size === prevHiddenIds.size &&
      [...hiddenIds].every((id) => prevHiddenIds.has(id))
    ) {
      return;
    }
    prevHiddenIdsRef.current = hiddenIds;

    let rafId: number;

    // Setze data-hidden auf alle versteckten Elemente
    const updateDOM = () => {
      const editorEl = editor.api.toDOMNode(editor);
      if (!editorEl) return;

      // 1. Identifiziere DOM-Elemente, die versteckt werden sollen
      const desiredHiddenWrappers = new Set<Element>();

      if (hiddenIds.size > 0) {
        try {
          const entries = editor.api.nodes({
            at: [],
            match: (n: any) => hiddenIds.has(n.id),
          });

          for (const [node] of entries) {
            const domNode = editor.api.toDOMNode(node as TElement);
            if (domNode) {
              const blockWrapper = domNode.closest('[data-slate-node="element"]') || domNode.parentElement;
              if (blockWrapper) {
                desiredHiddenWrappers.add(blockWrapper);
              }
            }
          }
        } catch (e) {
          console.error('Error finding nodes to hide:', e);
        }
      }

      // 2. Finde aktuell versteckte Elemente
      const currentlyHiddenElements = editorEl.querySelectorAll('[data-collapsed-hidden="true"]');

      // 3. Entferne Attribut von Elementen, die nicht mehr versteckt sein sollen
      currentlyHiddenElements.forEach((el) => {
        if (!desiredHiddenWrappers.has(el)) {
          el.removeAttribute('data-collapsed-hidden');
        }
      });

      // 4. Füge Attribut zu Elementen hinzu, die versteckt sein sollen (falls noch nicht gesetzt)
      desiredHiddenWrappers.forEach((el) => {
        if (el.getAttribute('data-collapsed-hidden') !== 'true') {
          el.setAttribute('data-collapsed-hidden', 'true');
        }
      });
    };

    // Use requestAnimationFrame to decouple DOM updates from the render cycle
    rafId = requestAnimationFrame(updateDOM);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [hiddenIds, editor]);

  return null;
}

/**
 * CSS-Styles für das Verstecken von Elementen unter eingeklappten Überschriften.
 * Die Styles sind in globals.css definiert, diese Komponente ist nur für Kompatibilität.
 */
export function CollapsibleHeadingsStyles() {
  return null;
}

/**
 * Plugin für klappbare Überschriften.
 * Fügt die notwendige Logik hinzu, um Elemente unter eingeklappten Überschriften zu verstecken.
 */
export const CollapsibleHeadingsPlugin = createPlatePlugin({
  key: 'collapsibleHeadings',
  options: {
    documentId: 'global',
  },
});

export const useCollapsibleDocumentId = () => {
  const editor = useEditorRef();
  return editor.getOption(CollapsibleHeadingsPlugin, 'documentId') ?? 'global';
};

export const CollapsibleHeadingsKit = [CollapsibleHeadingsPlugin];
