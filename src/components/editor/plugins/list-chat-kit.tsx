import { BaseListPlugin } from '@platejs/list';
import { KEYS } from 'platejs';

import { BaseIndentKit } from '@/components/editor/plugins/indent-base-kit';
import { BlockListChat } from '@/components/ui/block-list-chat';

/**
 * Liste-Plugin speziell für das Chat-Panel
 * Verwendet BlockListChat statt BlockListStatic, um Nummerierungen korrekt zu rendern
 */
export const ListChatKit = [
  ...BaseIndentKit,
  BaseListPlugin.configure({
    inject: {
      targetPlugins: [
        ...KEYS.heading,
        KEYS.p,
        KEYS.blockquote,
        KEYS.codeBlock,
        KEYS.toggle,
      ],
    },
    render: {
      belowNodes: BlockListChat,
    },
  }),
];

