'use client';

import { createPlatePlugin } from 'platejs/react';

import { CitationElement } from '@/components/ui/citation-node';

export const CITATION_KEY = 'citation';

export interface TCitationElement {
  type: typeof CITATION_KEY;
  sourceId: string;
  authors: Array<{ fullName?: string; firstName?: string; lastName?: string }>;
  year?: number;
  title: string;
  doi?: string;
  url?: string;
  sourceType?: string;
  journal?: string;
  containerTitle?: string;
  collectionTitle?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  isbn?: string;
  issn?: string;
  note?: string;
  accessedAt?: string;
  accessed?: { 'date-parts': number[][] };
  issued?: { 'date-parts': number[][] };
  children: [{ text: '' }];
  // Allow Plate's generic element constraints
  [key: string]: unknown;
}

export const CitationPlugin = createPlatePlugin({
  key: CITATION_KEY,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
  },
}).withComponent(CitationElement);

export const CitationKit = [CitationPlugin];
