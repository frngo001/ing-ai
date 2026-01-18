'use client';

import * as React from 'react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import { type Path, KEYS, NodeApi } from 'platejs';

// Types for our table registry
export type TableData = {
    id: string;
    index: number;
    caption: string;
    type: string;
    path: Path;
};

type TableRegistry = {
    tables: TableData[];
    indexById: Map<string, number>;
    captionById: Map<string, string>;
};

// Context for the table registry
const TableRegistryContext = React.createContext<TableRegistry | null>(null);

// Debounce delay for caption updates (in ms)
const CAPTION_UPDATE_DEBOUNCE_MS = 500;

// Minimal node representation for comparison (only structural changes)
type MinimalTableNode = {
    id: string;
    type: string;
};

// Full node representation including captions
type FullTableNode = {
    id: string;
    type: string;
    caption: string;
};

/**
 * Extract a stable string from caption content
 */
function extractCaptionText(captionContent: any): string {
    if (!captionContent) return '';
    if (Array.isArray(captionContent) && captionContent.length > 0) {
        return NodeApi.string({ children: captionContent } as any).trim();
    }
    return '';
}

/**
 * Create a minimal representation of table nodes for STRUCTURAL comparison.
 */
function extractMinimalTables(editor: any): MinimalTableNode[] {
    const nodes = Array.from(editor.api.nodes({
        at: [],
        match: (n: any) => n.type === KEYS.table,
    })) as [any, Path][];

    return nodes.map(([node]) => ({
        id: node.id || '',
        type: node.type,
    }));
}

/**
 * Create a full representation of table nodes including captions.
 */
function extractFullTables(editor: any): FullTableNode[] {
    const nodes = Array.from(editor.api.nodes({
        at: [],
        match: (n: any) => n.type === KEYS.table,
    })) as [any, Path][];

    return nodes.map(([node]) => ({
        id: node.id || '',
        type: node.type,
        caption: extractCaptionText(node.caption),
    }));
}

/**
 * Equality check for STRUCTURAL changes only
 */
function structuralEqual(prev: MinimalTableNode[], next: MinimalTableNode[]): boolean {
    if (prev.length !== next.length) return false;

    for (let i = 0; i < prev.length; i++) {
        const p = prev[i];
        const n = next[i];
        if (p.id !== n.id || p.type !== n.type) {
            return false;
        }
    }

    return true;
}

/**
 * Equality check for caption changes
 */
function captionsEqual(prev: FullTableNode[], next: FullTableNode[]): boolean {
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
 * Provider component that maintains the table registry.
 */
export function TableRegistryProvider({ children }: { children: React.ReactNode }) {
    const editor = useEditorRef();

    // Track STRUCTURAL changes immediately
    const minimalTables = useEditorSelector(
        (ed) => extractMinimalTables(ed),
        [],
        {
            equalityFn: structuralEqual,
        }
    );

    // Track the FULL tables including captions for debounced updates
    const fullTables = useEditorSelector(
        (ed) => extractFullTables(ed),
        [],
        {
            equalityFn: captionsEqual,
        }
    );

    // Debounced caption state
    const [debouncedCaptions, setDebouncedCaptions] = React.useState<Map<string, string>>(new Map());
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Update debounced captions after delay
    React.useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            const newCaptions = new Map<string, string>();
            for (const table of fullTables) {
                newCaptions.set(table.id, table.caption);
            }
            setDebouncedCaptions(newCaptions);
            debounceRef.current = null;
        }, CAPTION_UPDATE_DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [fullTables]);

    // Compute the registry
    const registry = React.useMemo((): TableRegistry => {
        const tables: TableData[] = [];
        const indexById = new Map<string, number>();
        const captionById = new Map<string, string>();

        const nodes = Array.from(editor.api.nodes({
            at: [],
            match: (n: any) => n.type === KEYS.table,
        })) as [any, Path][];

        let index = 1;
        for (const [node, path] of nodes) {
            const id = node.id || path.join('-');
            const caption = debouncedCaptions.get(id) ?? extractCaptionText(node.caption) ?? '';

            tables.push({
                id,
                index,
                caption,
                type: node.type,
                path,
            });

            indexById.set(id, index);
            captionById.set(id, caption);

            index++;
        }

        return { tables, indexById, captionById };
    }, [minimalTables, debouncedCaptions, editor]);

    return (
        <TableRegistryContext.Provider value={registry}>
            {children}
        </TableRegistryContext.Provider>
    );
}

/**
 * Hook to access the table registry.
 */
export function useTableRegistry(): TableRegistry {
    const registry = React.useContext(TableRegistryContext);
    if (!registry) {
        return {
            tables: [],
            indexById: new Map(),
            captionById: new Map(),
        };
    }
    return registry;
}

/**
 * Hook to get the index of a specific table by its ID.
 */
export function useTableIndex(id?: string): number | undefined {
    const registry = useTableRegistry();

    return React.useMemo(() => {
        if (!id) return undefined;
        return registry.indexById.get(id);
    }, [id, registry.indexById]);
}

/**
 * Hook to get the caption of a specific table by its ID.
 */
export function useTableCaption(id?: string): string | undefined {
    const registry = useTableRegistry();

    return React.useMemo(() => {
        if (!id) return undefined;
        return registry.captionById.get(id);
    }, [id, registry.captionById]);
}

/**
 * Hook to get all tables.
 */
export function useTables(): TableData[] {
    const registry = useTableRegistry();
    return registry.tables;
}
