'use client';

import * as React from 'react';
import { PlateElement, useEditorRef, useFocused, useSelected, useEditorSelector } from 'platejs/react';
import type { PlateElementProps } from 'platejs/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';
import { KEYS, type TElement, NodeApi } from 'platejs';

// Custom element type for internal references
interface TInternalReferenceElement extends TElement {
    type: 'internal_reference';
    value: string;
    refType: ReferenceType;
}

type ReferenceType = 'figure' | 'table' | 'heading';

interface ReferenceableItem {
    id: string;
    type: ReferenceType;
    index: number;
    label: string;
    preview?: string;
}

/**
 * Hook to get the display info for a reference based on its ID and type
 */
function useReferenceDisplay(refId: string | undefined, refType: ReferenceType | undefined) {
    const { t } = useLanguage();

    return useEditorSelector(
        (ed) => {
            if (!refId || !refType) return { displayText: '?' };

            const typeConfig = getReferenceTypeConfig(refType, t);
            const items = getItemsOfType(ed, refType, t);
            const item = items.find(i => i.id === refId);

            if (item) {
                // For headings, show the actual heading text
                if (refType === 'heading') {
                    return { displayText: item.label };
                }
                // For figures and tables, show "[Type Index]" like LaTeX citation
                return { displayText: `[${typeConfig.label} ${item.index}]` };
            }

            return { displayText: '[?]' };
        },
        [refId, refType, t]
    );
}

function getReferenceTypeConfig(type: ReferenceType, t: (key: string) => string | undefined) {
    switch (type) {
        case 'figure':
            return {
                label: t('reference.figure') || 'Abbildung',
                keys: [KEYS.img, KEYS.video, KEYS.mediaEmbed, KEYS.audio, KEYS.file] as string[],
            };
        case 'table':
            return {
                label: t('reference.table') || 'Tabelle',
                keys: [KEYS.table] as string[],
            };
        case 'heading':
            return {
                label: t('reference.heading') || 'Kapitel',
                keys: [KEYS.h1, KEYS.h2, KEYS.h3, KEYS.h4, KEYS.h5, KEYS.h6] as string[],
            };
    }
}

function getItemsOfType(editor: any, type: ReferenceType, t: (key: string) => string | undefined): ReferenceableItem[] {
    const config = getReferenceTypeConfig(type, t);
    const items: ReferenceableItem[] = [];

    const nodes = Array.from(editor.api.nodes({
        at: [],
        match: (n: any) => {
            // Skip bibliography, figure list, and table list headings
            if (n.bibliographyHeading || n.bibliography ||
                n.figureListHeading || n.figureList ||
                n.tableListHeading || n.tableList) return false;
            return config.keys.includes((n as TElement).type as string);
        },
    }));

    (nodes as Array<[any, any]>).forEach(([node, _path], idx) => {
        const el = node as TElement & { id: string; caption?: any; name?: string; children?: any[] };
        let label = '';
        let preview = '';

        if (type === 'figure') {
            if (el.caption?.[0]?.children?.[0]?.text) {
                label = el.caption[0].children[0].text;
            } else if (el.name) {
                label = el.name;
            }
            preview = label || `${config.label} ${idx + 1}`;
        } else if (type === 'table') {
            // Try to get table caption or first cell content
            if (el.caption?.[0]?.children?.[0]?.text) {
                label = el.caption[0].children[0].text;
            } else {
                label = `${config.label} ${idx + 1}`;
            }
            preview = label;
        } else if (type === 'heading') {
            // Get heading text content
            label = NodeApi.string(el).trim() || `${config.label} ${idx + 1}`;
            preview = label;
        }

        items.push({
            id: el.id || `${type}-${idx}`,
            type,
            index: idx + 1,
            label: label || `${config.label} ${idx + 1}`,
            preview,
        });
    });

    return items;
}

export function ReferenceElement(props: PlateElementProps<TInternalReferenceElement>) {
    const { element } = props;
    const editor = useEditorRef();
    const { t } = useLanguage();

    const refId = element.value;
    const refType = element.refType || 'figure';
    const { displayText } = useReferenceDisplay(refId, refType);

    const selected = useSelected();
    const focused = useFocused();

    const handleLinkClick = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const nodes = Array.from(editor.api.nodes({
            at: [],
            match: (n) => (n as any).id === refId,
        }));

        if (nodes.length > 0) {
            const entry = nodes[0];
            if (entry) {
                const [node] = entry as [any, any];
                const dom = editor.api.toDOMNode(node);
                dom?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [editor, refId]);

    return (
        <PlateElement
            {...props}
            as="span"
            className={cn(
                'inline cursor-pointer font-medium text-primary transition-colors hover:underline',
                selected && focused && 'ring-2 ring-ring ring-offset-1',
            )}
            attributes={{
                ...props.attributes,
                contentEditable: false,
                onClick: handleLinkClick,
            } as any}
        >
            {displayText}
            {props.children}
        </PlateElement>
    );
}

