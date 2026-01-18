'use client';

import { LineHeightPlugin } from '@platejs/basic-styles/react';
import { KEYS } from 'platejs';

export const LineHeightKit = [
  LineHeightPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: 1.5,
        validNodeValues: [1, 1.2, 1.5, 2, 3],
      },
      targetPlugins: [...KEYS.heading, KEYS.p],
    },
    parsers: {
      html: {
        deserializer: {
          parse: ({ element }) => {
            const lineHeight = element.style?.lineHeight;
            if (lineHeight) {
              const lh = parseFloat(lineHeight);
              if (!isNaN(lh) && lh > 0) {
                return { lineHeight: lh };
              }
            }
            return undefined;
          },
        },
      },
    },
  }),
];
