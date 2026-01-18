'use client';

import * as React from 'react';
import { KEYS, type Path } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { useLanguage } from '@/lib/i18n/use-language';
import { useFigures, type FigureData } from '@/components/ui/figure-toc';

type FigureListItem = {
    path: Path;
    index: number;
    caption: string;
    type: string;
};

// Debounce delay for updating the figure list in the document (in ms)
// This prevents the document from being modified on every keystroke
const FIGURE_LIST_UPDATE_DEBOUNCE_MS = 1000;

/**
 * EditorFigureList
 * 
 * Automatically generates and maintains a figure list (Abbildungsverzeichnis) at the end of the document.
 * Similar to EditorBibliography, this component:
 * - Tracks all figures (images, videos, media embeds, etc.) in the document
 * - Generates an "Abbildungsverzeichnis" heading
 * - Lists all figures with their numbers and captions
 * - Updates automatically when figures are added/removed/modified
 * 
 * IMPORTANT: Updates are debounced to prevent performance issues during caption editing.
 */
export function EditorFigureList({ className: _className }: { className?: string }) {
    const editor = useEditorRef();
    const { t, language } = useLanguage();
    const prevSignature = React.useRef<string | null>(null);
    const updateTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const translations = React.useMemo(() => ({
        figureList: t('figure.listTitle') || 'Abbildungsverzeichnis',
        figure: t('figure.figure') || 'Abbildung',
    }), [t, language]);

    // Use the centralized figure registry for optimal performance
    const registryFigures = useFigures();

    // Transform registry figures to list items
    const items = React.useMemo((): FigureListItem[] => {
        return registryFigures.map((fig: FigureData) => ({
            path: fig.path,
            index: fig.index,
            caption: fig.caption || `${translations.figure} ${fig.index}`,
            type: fig.type,
        }));
    }, [registryFigures, translations.figure]);

    // Create a signature that identifies the current state
    // This is used to prevent unnecessary updates
    const signature = React.useMemo(() => {
        return items
            .map((item) => `${item.index}::${item.caption}::${item.path.join('-')}`)
            .join('|');
    }, [items]);

    // Store items in a ref so we can access the latest value in the debounced callback
    const itemsRef = React.useRef(items);
    React.useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // The actual document update logic - extracted so it can be debounced
    const updateFigureListInDocument = React.useCallback(() => {
        const currentItems = itemsRef.current;
        const headingType = editor.getType(KEYS.h1);
        const paragraphType = editor.getType(KEYS.p);

        editor.tf.withoutNormalizing(() => {
            // Remove existing figure list blocks
            const existing = Array.from(
                editor.api.nodes({
                    at: [],
                    match: (node) => (node as any).figureList === true,
                })
            ).reverse();

            existing.forEach(([, path]) => {
                editor.tf.removeNodes({ at: path });
            });

            if (currentItems.length === 0) return;

            // Insert figure list after table list if it exists, otherwise after bibliography, otherwise at the end
            let insertPosition = editor.children.length;

            // Find table list position
            const tableListNodes = Array.from(
                editor.api.nodes({
                    at: [],
                    match: (node) => (node as any).tableList === true,
                })
            );

            if (tableListNodes.length > 0) {
                // Insert before table list
                const firstTableListPath = tableListNodes[0][1] as Path;
                insertPosition = firstTableListPath[0];
            } else {
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
            }

            const figureListBlocks = [
                {
                    type: headingType,
                    figureList: true,
                    figureListHeading: true,
                    children: [{ text: translations.figureList }],
                },
                ...currentItems.map((item) => ({
                    type: paragraphType,
                    figureList: true,
                    figureListEntry: true,
                    children: [
                        {
                            text: `${translations.figure} ${item.index}: `,
                            bold: true,
                        },
                        {
                            text: item.caption,
                            bold: false,
                        },
                    ],
                })),
            ];

            editor.tf.insertNodes(figureListBlocks, {
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
            updateFigureListInDocument();
            updateTimeoutRef.current = null;
        }, FIGURE_LIST_UPDATE_DEBOUNCE_MS);

        // Cleanup on unmount or signature change
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [signature, updateFigureListInDocument]);

    // Cleanup on unmount - apply pending update immediately
    React.useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
                // Apply the final update on unmount
                updateFigureListInDocument();
            }
        };
    }, [updateFigureListInDocument]);

    return null;
}
