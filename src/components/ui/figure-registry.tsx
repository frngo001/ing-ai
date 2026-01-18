'use client';

import * as React from 'react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import { type Path, KEYS, NodeApi } from 'platejs';

// Types for our figure registry
export type FigureData = {
    id: string;
    index: number;
    caption: string;
    type: string;
    path: Path;
};

type FigureRegistry = {
    figures: FigureData[];
    indexById: Map<string, number>;
    captionById: Map<string, string>;
};

// Context for the figure registry
const FigureRegistryContext = React.createContext<FigureRegistry | null>(null);

// Media types to track
const MEDIA_TYPES = [
    KEYS.img,
    KEYS.video,
    KEYS.mediaEmbed,
    KEYS.audio,
    KEYS.file,
] as const;

// Debounce delay for caption updates (in ms)
// This prevents re-renders on every keystroke when editing captions
const CAPTION_UPDATE_DEBOUNCE_MS = 500;

// Minimal node representation for comparison (only structural changes)
type MinimalFigureNode = {
    id: string;
    type: string;
};

// Full node representation including captions
type FullFigureNode = {
    id: string;
    type: string;
    caption: string;
    name: string;
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
 * Create a minimal representation of figure nodes for STRUCTURAL comparison.
 * This only tracks ID and type - NOT captions. Used for immediate updates.
 */
function extractMinimalFigures(editor: any): MinimalFigureNode[] {
    const nodes = Array.from(editor.api.nodes({
        at: [],
        match: (n: any) => MEDIA_TYPES.includes(n.type as any),
    })) as [any, Path][];

    return nodes.map(([node]) => ({
        id: node.id || '',
        type: node.type,
    }));
}

/**
 * Create a full representation of figure nodes including captions.
 * Used for debounced caption updates.
 */
function extractFullFigures(editor: any): FullFigureNode[] {
    const nodes = Array.from(editor.api.nodes({
        at: [],
        match: (n: any) => MEDIA_TYPES.includes(n.type as any),
    })) as [any, Path][];

    return nodes.map(([node]) => ({
        id: node.id || '',
        type: node.type,
        caption: extractCaptionText(node.caption),
        name: node.name || '',
    }));
}

/**
 * Equality check for STRUCTURAL changes only (add/remove/reorder figures)
 */
function structuralEqual(prev: MinimalFigureNode[], next: MinimalFigureNode[]): boolean {
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
function captionsEqual(prev: FullFigureNode[], next: FullFigureNode[]): boolean {
    if (prev.length !== next.length) return false;

    for (let i = 0; i < prev.length; i++) {
        const p = prev[i];
        const n = next[i];
        if (p.id !== n.id ||
            p.caption !== n.caption ||
            p.name !== n.name) {
            return false;
        }
    }

    return true;
}

/**
 * Provider component that maintains the figure registry.
 * It tracks media nodes and their order/captions with debounced caption updates.
 */
export function FigureRegistryProvider({ children }: { children: React.ReactNode }) {
    const editor = useEditorRef();

    // Track STRUCTURAL changes immediately (add/remove/reorder figures)
    const minimalFigures = useEditorSelector(
        (ed) => extractMinimalFigures(ed),
        [],
        {
            equalityFn: structuralEqual,
        }
    );

    // Track the FULL figures including captions for debounced updates
    const fullFigures = useEditorSelector(
        (ed) => extractFullFigures(ed),
        [],
        {
            equalityFn: captionsEqual,
        }
    );

    // Debounced caption state - this is what we actually use for the registry
    const [debouncedCaptions, setDebouncedCaptions] = React.useState<Map<string, string>>(new Map());
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Update debounced captions after delay
    React.useEffect(() => {
        // Clear existing timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Schedule debounced update
        debounceRef.current = setTimeout(() => {
            const newCaptions = new Map<string, string>();
            for (const fig of fullFigures) {
                newCaptions.set(fig.id, fig.caption || fig.name);
            }
            setDebouncedCaptions(newCaptions);
            debounceRef.current = null;
        }, CAPTION_UPDATE_DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [fullFigures]);

    // Compute the registry - uses structural data immediately, captions debounced
    const registry = React.useMemo((): FigureRegistry => {
        const figures: FigureData[] = [];
        const indexById = new Map<string, number>();
        const captionById = new Map<string, string>();

        // Get the actual nodes with paths
        const nodes = Array.from(editor.api.nodes({
            at: [],
            match: (n: any) => MEDIA_TYPES.includes(n.type as any),
        })) as [any, Path][];

        let index = 1;
        for (const [node, path] of nodes) {
            const id = node.id || path.join('-');
            // Use debounced caption if available, otherwise get fresh caption
            const caption = debouncedCaptions.get(id) ?? extractCaptionText(node.caption) ?? node.name ?? '';

            figures.push({
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

        return { figures, indexById, captionById };
    }, [minimalFigures, debouncedCaptions, editor]);

    return (
        <FigureRegistryContext.Provider value={registry}>
            {children}
        </FigureRegistryContext.Provider>
    );
}

/**
 * Hook to access the figure registry.
 */
export function useFigureRegistry(): FigureRegistry {
    const registry = React.useContext(FigureRegistryContext);
    if (!registry) {
        // Return empty registry if provider not available (for compatibility)
        return {
            figures: [],
            indexById: new Map(),
            captionById: new Map(),
        };
    }
    return registry;
}

/**
 * Hook to get the index of a specific figure by its ID.
 * This is highly optimized - it only reads from the cached registry.
 */
export function useFigureIndex(id?: string): number | undefined {
    const registry = useFigureRegistry();

    return React.useMemo(() => {
        if (!id) return undefined;
        return registry.indexById.get(id);
    }, [id, registry.indexById]);
}

/**
 * Hook to get the caption of a specific figure by its ID.
 */
export function useFigureCaption(id?: string): string | undefined {
    const registry = useFigureRegistry();

    return React.useMemo(() => {
        if (!id) return undefined;
        return registry.captionById.get(id);
    }, [id, registry.captionById]);
}

/**
 * Hook to get all figures (for the TOC sidebar).
 * Returns a stable reference when figures haven't changed.
 */
export function useFigures(): FigureData[] {
    const registry = useFigureRegistry();
    return registry.figures;
}
