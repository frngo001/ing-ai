'use client';

import { createPlatePlugin } from 'platejs/react';
import { ReferenceElement } from '@/components/ui/reference-node';

// Custom inline element plugin for internal references
const InternalReferencePlugin = createPlatePlugin({
    key: 'internal_reference',
    node: {
        isElement: true,
        isInline: true,
        isVoid: true,
        component: ReferenceElement,
    },
});

export const ReferenceKit = [InternalReferencePlugin];
