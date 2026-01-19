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
 * Optimiert, um teure Dokument-Scans bei Updates zu vermeiden.
 */
export function TableRegistryProvider({ children }: { children: React.ReactNode }) {
    const editor = useEditorRef();
    const [registry, setRegistry] = React.useState<TableRegistry>({
        tables: [],
        indexById: new Map(),
        captionById: new Map(),
    });

    const updateRegistry = React.useCallback(() => {
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
            const caption = extractCaptionText(node.caption) ?? '';

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

        setRegistry({ tables, indexById, captionById });
    }, [editor]);

    // Wir nutzen useEditorSelector nur als Trigger
    useEditorSelector(
        (editor) => editor.operations.length,
        [],
        {
            equalityFn: (prev, next) => {
                onChangeTriggered();
                return true; // Prevent re-render
            }
        }
    );

    // Debounce Logic
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const idleRef = React.useRef<number | null>(null);

    const onChangeTriggered = React.useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (idleRef.current && typeof (window as any).cancelIdleCallback === 'function') {
            (window as any).cancelIdleCallback(idleRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (typeof (window as any).requestIdleCallback === 'function') {
                idleRef.current = (window as any).requestIdleCallback(() => updateRegistry());
            } else {
                updateRegistry();
            }
        }, 500); // 500ms Debounce
    }, [updateRegistry]);

    // Initialer Scan
    React.useEffect(() => {
        updateRegistry();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (idleRef.current && typeof (window as any).cancelIdleCallback === 'function') {
                (window as any).cancelIdleCallback(idleRef.current);
            }
        };
    }, [updateRegistry]);

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
