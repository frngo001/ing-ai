'use client';

import * as React from 'react';
import { KEYS, type Path, NodeApi } from 'platejs';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import { useLanguage } from '@/lib/i18n/use-language';

type TableListItem = {
    path: Path;
    index: number;
    caption: string;
};

// Debounce delay for updating the table list in the document (in ms)
// This prevents the document from being modified on every keystroke
const TABLE_LIST_UPDATE_DEBOUNCE_MS = 1000;

// Minimal table node representation for comparison
type MinimalTableNode = {
    id: string;
    caption: string;
};

/**
 * Extract caption text from table node
 */
function extractTableCaption(captionContent: any): string {
    if (!captionContent) return '';
    if (Array.isArray(captionContent) && captionContent.length > 0) {
        return NodeApi.string({ children: captionContent } as any).trim();
    }
    return '';
}

/**
 * Extract minimal table representations for comparison
 */
function extractMinimalTables(editor: any): MinimalTableNode[] {
    const nodes = Array.from(
        editor.api.nodes({
            at: [],
            match: (node: any) => node.type === KEYS.table,
        })
    ) as [any, Path][];

    return nodes.map(([node]) => ({
        id: node.id || '',
        caption: extractTableCaption(node.caption),
    }));
}

/**
 * Deep equality check for minimal table nodes
 */
function tablesEqual(prev: MinimalTableNode[], next: MinimalTableNode[]): boolean {
    if (prev.length !== next.length) return false;

    for (let i = 0; i < prev.length; i++) {
        const p = prev[i];
        const n = next[i];
        if (p.id !== n.id || p.caption !== n.caption) {
            return false;
        }
    }

    return true;
}

/**
 * EditorTableList
 * 
 * Automatically generates and maintains a table list (Tabellenverzeichnis) at the end of the document.
 * Similar to EditorBibliography, this component:
 * - Tracks all tables in the document
 * - Generates a "Tabellenverzeichnis" heading
 * - Lists all tables with their numbers and captions
 * - Updates automatically when tables are added/removed/modified
 * 
 * IMPORTANT: Updates are debounced to prevent performance issues during caption editing.
 */
export function EditorTableList({ className: _className }: { className?: string }) {
    const editor = useEditorRef();
    const { t, language } = useLanguage();
    const prevSignature = React.useRef<string | null>(null);
    const updateTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const translations = React.useMemo(() => ({
        tableList: t('table.listTitle') || 'Tabellenverzeichnis',
        table: t('table.table') || 'Tabelle',
    }), [t, language]);

    // Use optimized selector with proper equality function
    const minimalTables = useEditorSelector(
        (ed) => extractMinimalTables(ed),
        [],
        {
            equalityFn: tablesEqual,
        }
    );

    // Transform to list items
    const items = React.useMemo((): TableListItem[] => {
        const nodes = Array.from(
            editor.api.nodes({
                at: [],
                match: (node: any) => node.type === KEYS.table,
            })
        ) as [any, Path][];

        return nodes.map(([node, path], idx) => ({
            path,
            index: idx + 1,
            caption: extractTableCaption(node.caption) || `${translations.table} ${idx + 1}`,
        }));
    }, [minimalTables, editor, translations.table]);

    // Create signature for change detection
    const signature = React.useMemo(() => {
        return items
            .map((item) => `${item.index}::${item.caption}::${item.path.join('-')}`)
            .join('|');
    }, [items]);

    // Store items in ref for debounced callback
    const itemsRef = React.useRef(items);
    React.useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // The actual document update logic
    const updateTableListInDocument = React.useCallback(() => {
        const currentItems = itemsRef.current;
        const headingType = editor.getType(KEYS.h1);
        const paragraphType = editor.getType(KEYS.p);

        editor.tf.withoutNormalizing(() => {
            // Remove existing table list blocks
            const existing = Array.from(
                editor.api.nodes({
                    at: [],
                    match: (node) => (node as any).tableList === true,
                })
            ).reverse();

            existing.forEach(([, path]) => {
                editor.tf.removeNodes({ at: path });
            });

            if (currentItems.length === 0) return;

            // Insert table list after bibliography if it exists, otherwise at the end
            let insertPosition = editor.children.length;

            // Find bibliography position
            const bibliographyNodes = Array.from(
                editor.api.nodes({
                    at: [],
                    match: (node) => (node as any).bibliography === true,
                })
            );

            if (bibliographyNodes.length > 0) {
                // Insert before bibliography
                const firstBibPath = bibliographyNodes[0][1] as Path;
                insertPosition = firstBibPath[0];
            }

            const tableListBlocks = [
                {
                    type: headingType,
                    tableList: true,
                    tableListHeading: true,
                    children: [{ text: translations.tableList }],
                },
                ...currentItems.map((item) => ({
                    type: paragraphType,
                    tableList: true,
                    tableListEntry: true,
                    children: [
                        {
                            text: `${translations.table} ${item.index}: `,
                            bold: true,
                        },
                        {
                            text: item.caption,
                            bold: false,
                        },
                    ],
                })),
            ];

            editor.tf.insertNodes(tableListBlocks, {
                at: [insertPosition],
                select: false,
            });
        });
    }, [editor, translations]);

    // Debounced update effect
    React.useEffect(() => {
        // Skip if signature hasn't changed
        if (prevSignature.current === signature) return;

        // Clear any pending update
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Schedule debounced update
        updateTimeoutRef.current = setTimeout(() => {
            prevSignature.current = signature;
            updateTableListInDocument();
            updateTimeoutRef.current = null;
        }, TABLE_LIST_UPDATE_DEBOUNCE_MS);

        // Cleanup on signature change
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [signature, updateTableListInDocument]);

    // Cleanup on unmount - apply pending update immediately
    React.useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
                // Apply the final update on unmount
                updateTableListInDocument();
            }
        };
    }, [updateTableListInDocument]);

    return null;
}
