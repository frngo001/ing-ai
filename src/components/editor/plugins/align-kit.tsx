'use client';

import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { KEYS } from 'platejs';

export const AlignKit = [
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
        KEYS.p,
        KEYS.mediaEmbed,
        KEYS.video,
        KEYS.audio,
      ],
    },
    parsers: {
      html: {
        deserializer: {
          parse: ({ element }) => {
            const textAlign = element.style?.textAlign;
            if (textAlign) {
              return { align: textAlign };
            }
            return undefined;
          },
        },
      },
    },
  }),
];
