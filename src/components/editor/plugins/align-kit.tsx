'use client';

import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { KEYS } from 'platejs';

export const AlignKit = [
  TextAlignPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: 'justify',
        nodeKey: 'align',
        styleKey: 'textAlign',
        validNodeValues: ['start', 'left', 'center', 'right', 'end', 'justify'],
      },
      targetPlugins: [
        KEYS.p,
        KEYS.blockquote,
        KEYS.lic,
        KEYS.callout,
        KEYS.toggle,
      ],
    },
  }),
  TextAlignPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: 'start',
        nodeKey: 'align',
        styleKey: 'textAlign',
        validNodeValues: ['start', 'left', 'center', 'right', 'end', 'justify'],
      },
      targetPlugins: [
        ...KEYS.heading,
        KEYS.img,
        KEYS.mediaEmbed,
        KEYS.video,
        KEYS.audio,
      ],
    },
  }),
];
