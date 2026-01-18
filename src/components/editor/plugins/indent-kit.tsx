'use client';

import { IndentPlugin } from '@platejs/indent/react';
import { KEYS } from 'platejs';

export const IndentKit = [
  IndentPlugin.configure({
    inject: {
      targetPlugins: [
        ...KEYS.heading,
        KEYS.p,
        KEYS.blockquote,
        KEYS.codeBlock,
        KEYS.toggle,
        KEYS.img,
      ],
    },
    options: {
      offset: 24,
    },
    parsers: {
      html: {
        deserializer: {
          parse: ({ element }) => {
            const style = element.style;
            if (!style) return undefined;

            const result: any = {};

            const marginLeft = style.marginLeft;
            if (marginLeft) {
              const margin = parseInt(marginLeft, 10);
              if (!isNaN(margin) && margin > 0) {
                result.indent = Math.round(margin / 24);
              }
            }

            const textIndent = style.textIndent;
            if (textIndent) {
              const ti = parseInt(textIndent, 10);
              if (!isNaN(ti) && ti !== 0) {
                // Map to level (approx 12px per level for textIndent)
                result.textIndent = Math.round(ti / 12);
              }
            }

            return Object.keys(result).length > 0 ? result : undefined;
          },
        },
      },
    },
  }),
];
