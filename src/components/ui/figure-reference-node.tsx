'use client';

import * as React from 'react';
import { PlateElement, useEditorRef, useFocused, useReadOnly, useSelected } from 'platejs/react';
import type { PlateElementProps } from 'platejs/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';
import { useFigureIndex, useFigures } from './figure-toc';
import {
    InlineCombobox,
    InlineComboboxContent,
    InlineComboboxEmpty,
    InlineComboboxGroup,
    InlineComboboxGroupLabel,
    InlineComboboxInput,
    InlineComboboxItem
} from './inline-combobox';
import { type TMentionElement, type TComboboxInputElement } from 'platejs';


export function FigureReferenceElement(props: PlateElementProps<TMentionElement>) {
    const { element } = props;
    const editor = useEditorRef();
    const { t } = useLanguage();
    // MentionPlugin uses 'value' for the unique identifier
    const figureId = element.value;
    const index = useFigureIndex(figureId);
    const selected = useSelected();
    const focused = useFocused();
    const readOnly = useReadOnly();

    const handleLinkClick = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const nodes = Array.from(editor.api.nodes({
            at: [],
            match: (n) => (n as any).id === figureId,
        }));

        if (nodes.length > 0) {
            const entry = nodes[0];
            if (entry) {
                const [node, path] = entry as [any, any];
                const dom = editor.api.toDOMNode(node);
                dom?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [editor, figureId]);

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
            [{t('figure.figure') || 'Abbildung'} {index ?? '?'}]
            {props.children}
        </PlateElement>
    );
}

export function FigureReferenceInputElement(props: PlateElementProps<TComboboxInputElement>) {
    const { editor, element } = props;
    const { t, language } = useLanguage();
    const [search, setSearch] = React.useState('');

    // Use centralized figure registry instead of separate selector
    const allFigures = useFigures();

    const figures = React.useMemo(() => {
        return allFigures.map((fig: any) => ({
            id: fig.id,
            index: fig.index,
            label: fig.caption || `${t('figure.figure') || 'Abbildung'} ${fig.index}`,
        }));
    }, [allFigures, t]);

    const filteredFigures = figures.filter((f: any) =>
        f.label.toLowerCase().includes(search.toLowerCase()) ||
        f.index.toString().includes(search)
    );

    return (
        <PlateElement {...props} as="span" className="inline-block">
            <InlineCombobox
                element={element}
                value={search}
                setValue={setSearch}
                trigger="(Abb"
                showTrigger={false}
            >
                <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring">
                    <InlineComboboxInput {...{ placeholder: t('figure.tagPlaceholder') || "Wähle eine Abbildung..." } as any} />
                </span>

                <InlineComboboxContent className="my-1.5">
                    <InlineComboboxEmpty>Keine Abbildungen gefunden</InlineComboboxEmpty>
                    <InlineComboboxGroup>
                        <InlineComboboxGroupLabel>Abbildungen</InlineComboboxGroupLabel>
                        {filteredFigures.map((fig) => (
                            <InlineComboboxItem
                                key={fig.id}
                                value={fig.label}
                                onClick={() => {
                                    editor.tf.withoutNormalizing(() => {
                                        const path = editor.api.findPath(element);
                                        if (!path) return;
                                        editor.tf.removeNodes({ at: path });
                                        editor.tf.insertNodes({
                                            type: 'figure_reference',
                                            value: fig.id,
                                            children: [{ text: '' }],
                                        } as any, { select: true });
                                    });
                                }}
                            >
                                <span className="font-medium mr-2">{t('figure.figure') || 'Abbildung'} {fig.index}:</span>
                                <span className="truncate max-w-[200px]">{fig.label}</span>
                            </InlineComboboxItem>
                        ))}
                    </InlineComboboxGroup>
                </InlineComboboxContent>
            </InlineCombobox>
            {props.children}
        </PlateElement>
    );
}
