'use client';

import { MentionInputPlugin, MentionPlugin } from '@platejs/mention/react';
import { FigureReferenceElement, FigureReferenceInputElement } from '@/components/ui/figure-reference-node';

export const FigureReferenceKit = [
    // Use .extend instead of .configure to allow overriding the 'key' property.
    // Plate plugins have a strict literal type for their key, and .extend creates a new plugin instance with the updated key.
    MentionPlugin.extend({
        key: 'figure_reference' as any,
        options: {
            trigger: '(Abb',
            triggerPreviousCharPattern: /^$|^[\s"']$/,
        },
        render: {
            afterEditable: () => null,
            node: FigureReferenceElement as any,
        },
    }),
    MentionInputPlugin.extend({
        key: 'figure_reference_input' as any,
        render: {
            node: FigureReferenceInputElement as any,
        },
    }),
];
