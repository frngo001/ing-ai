import { MarkdownPlugin, remarkMdx, remarkMention } from '@platejs/markdown';
import { KEYS } from 'platejs';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { CITATION_KEY } from '@/components/editor/plugins/citation-kit';

export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      // Ignoriere Citation-Knoten bei Markdown-Serialisierung, um
      // Warnungen aus dem Serializer zu vermeiden.
      disallowedNodes: [CITATION_KEY],
      plainMarks: [KEYS.suggestion, KEYS.comment],
      remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
    },
  }),
];
