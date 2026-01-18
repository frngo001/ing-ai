'use client';

import * as React from 'react';
import { useEditorSelector } from 'platejs/react';
import { KEYS, type TElement, NodeApi } from 'platejs';
import { useReferencePickerStore } from '@/lib/stores/reference-picker-store';
import { useLanguage } from '@/lib/i18n/use-language';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
// No icons needed for minimalist style

type ReferenceType = 'figure' | 'table' | 'heading';

interface ReferenceableItem {
    id: string;
    type: ReferenceType;
    index: number;
    label: string;
    preview?: string;
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
            if (n.bibliographyHeading || n.bibliography) return false;
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
            if (el.caption?.[0]?.children?.[0]?.text) {
                label = el.caption[0].children[0].text;
            } else {
                label = `${config.label} ${idx + 1}`;
            }
            preview = label;
        } else if (type === 'heading') {
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

export function ReferencePicker() {
    const { t } = useLanguage();
    const { isOpen, closePicker, editor, savedSelection } = useReferencePickerStore();

    const allItems = useEditorSelector((ed) => {
        const figures = getItemsOfType(ed, 'figure', t);
        const tables = getItemsOfType(ed, 'table', t);
        const headings = getItemsOfType(ed, 'heading', t);
        return { figures, tables, headings };
    }, [t]);

    const insertReference = React.useCallback((item: ReferenceableItem) => {
        if (!editor) return;

        // Restore selection before inserting
        if (savedSelection) {
            editor.tf.select(savedSelection);
        }

        editor.tf.insertNodes({
            type: 'internal_reference',
            value: item.id,
            refType: item.type,
            children: [{ text: '' }],
        } as any, { select: true });

        closePicker();

        // Focus editor after inserting
        setTimeout(() => {
            editor.tf.focus();
        }, 0);
    }, [editor, savedSelection, closePicker]);

    const hasAnyItems = allItems.figures.length > 0 || allItems.tables.length > 0 || allItems.headings.length > 0;

    return (
        <CommandDialog open={isOpen} onOpenChange={(open) => !open && closePicker()}>
            <CommandInput placeholder={t('reference.searchPlaceholder') || "Referenz suchen..."} />
            <CommandList>
                <CommandEmpty>{t('reference.noResults') || 'Keine Elemente gefunden'}</CommandEmpty>

                {allItems.figures.length > 0 && (
                    <CommandGroup heading={t('reference.figures') || 'Abbildungen'}>
                        {allItems.figures.map((item) => (
                            <CommandItem
                                key={item.id}
                                value={`figure-${item.id}-${item.preview}`}
                                onSelect={() => insertReference(item)}
                            >
                                <span className="font-medium mr-2">{item.index}:</span>
                                <span className="truncate">{item.preview}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {allItems.tables.length > 0 && (
                    <CommandGroup heading={t('reference.tables') || 'Tabellen'}>
                        {allItems.tables.map((item) => (
                            <CommandItem
                                key={item.id}
                                value={`table-${item.id}-${item.preview}`}
                                onSelect={() => insertReference(item)}
                            >
                                <span className="font-medium mr-2">{item.index}:</span>
                                <span className="truncate">{item.preview}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {allItems.headings.length > 0 && (
                    <CommandGroup heading={t('reference.headings') || 'Kapitel'}>
                        {allItems.headings.map((item) => (
                            <CommandItem
                                key={item.id}
                                value={`heading-${item.id}-${item.preview}`}
                                onSelect={() => insertReference(item)}
                            >
                                <span className="truncate">{item.preview}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
