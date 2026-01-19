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
 * Optimiert, um teure Dokument-Scans bei jedem Keystroke zu vermeiden.
 */
export function FigureRegistryProvider({ children }: { children: React.ReactNode }) {
    const editor = useEditorRef();
    const [registry, setRegistry] = React.useState<FigureRegistry>({
        figures: [],
        indexById: new Map(),
        captionById: new Map(),
    });

    const updateRegistry = React.useCallback(() => {
        // Diese Funktion führt den teuren Scan durch
        const figures: FigureData[] = [];
        const indexById = new Map<string, number>();
        const captionById = new Map<string, string>();

        const nodes = Array.from(editor.api.nodes({
            at: [],
            match: (n: any) => MEDIA_TYPES.includes(n.type as any),
        })) as [any, Path][];

        let index = 1;
        for (const [node, path] of nodes) {
            const id = node.id || path.join('-');
            const caption = extractCaptionText(node.caption) ?? node.name ?? '';

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

        setRegistry({ figures, indexById, captionById });
    }, [editor]);

    // Listener für Änderungen im Editor
    React.useEffect(() => {
        let timeoutId: number;
        let idleId: number;

        const handleChange = () => {
            // Cancel pending updates
            clearTimeout(timeoutId);
            if (typeof (window as any).cancelIdleCallback === 'function') {
                (window as any).cancelIdleCallback(idleId);
            }

            // Debounce update: Warte 500ms Inaktivität ab, bevor gescannt wird
            timeoutId = window.setTimeout(() => {
                if (typeof (window as any).requestIdleCallback === 'function') {
                    idleId = (window as any).requestIdleCallback(() => updateRegistry());
                } else {
                    updateRegistry();
                }
            }, 500);
        };

        // Plate bietet kein direktes "subscribe to all changes" Event im React-Kontext ohne Selector,
        // daher nutzen wir einen Listener auf das DOM-Event 'plate-change' falls verfügbar,
        // oder wir nutzen einen Interval-Check als Fallback für Änderungen
        // BESSER: Wir wrappen den Editor-OnChange oder injecten uns.
        // Da wir hier Zugriff auf die Editor-Instanz haben, können wir uns nicht einfach in onChange hooken.

        // Workaround: Wir nutzen useEditorSelector mit einer sehr "dumb" selector function,
        // die nur eine Versionsnummer zurückgibt, um Trigger zu erhalten, 
        // ABER wir führen den teuren Scan nur debounced aus.
        return () => {
            clearTimeout(timeoutId);
            if (typeof (window as any).cancelIdleCallback === 'function') {
                (window as any).cancelIdleCallback(idleId);
            }
        };
    }, [updateRegistry]);

    // Wir nutzen useEditorSelector nur als Trigger, geben aber immer denselben Wert zurück,
    // um Rerenders zu minimieren, und feuern dann den debounced Scan.
    useEditorSelector(
        (editor) => {
            // Wir nutzen operations.length als Proxy für Änderungen
            // Das ist billig.
            return editor.operations.length;
        },
        [],
        {
            equalityFn: (prev, next) => {
                // Wenn sich operations.length ändert (oder einfach immer wenn der Selector läuft),
                // triggern wir den debounced update. 
                // Da equalityFn bestimmt ob gerendert wird, nutzen wir es als Side-Effect Trigger
                // und geben true zurück, um React-Rendering zu verhindern.

                // HACK: Side-effect im Equality-Check, um den Debounce-Timer zu starten
                // ohne dass React neu rendert.
                onChangeTriggered();
                return true;
            }
        }
    );

    // Debounce Logic ausgelagert, damit sie vom Selector aufgerufen werden kann
    // Debounce Logic ausgelagert, damit sie vom Selector aufgerufen werden kann
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

    // Initialer Scan beim Mounten
    React.useEffect(() => {
        updateRegistry();
    }, [updateRegistry]);

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
