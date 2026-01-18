'use client';

import { AIChatPlugin } from '@platejs/ai/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { getPluginTypes, isHotkey, KEYS } from 'platejs';

import { BlockSelection } from '@/components/ui/block-selection';

export const BlockSelectionKit = [
  BlockSelectionPlugin.configure(({ editor }) => ({
    options: {
      enableContextMenu: true,
      isSelectable: (element) => {
        const path = editor.api.findPath(element);
        const isBibliography = path
          ? editor.api.some({
            at: path,
            match: (node) => (node as any).bibliography === true,
            mode: 'all',
          })
          : (element as any).bibliography;

        const isFigureList = path
          ? editor.api.some({
            at: path,
            match: (node) => (node as any).figureList === true,
            mode: 'all',
          })
          : (element as any).figureList;

        const isTableList = path
          ? editor.api.some({
            at: path,
            match: (node) => (node as any).tableList === true,
            mode: 'all',
          })
          : (element as any).tableList;

        if (isBibliography || isFigureList || isTableList) return false;

        return !getPluginTypes(editor, [
          KEYS.column,
          KEYS.codeLine,
          KEYS.td,
        ]).includes(element.type);
      },
      onKeyDownSelecting: (editor, e) => {
        if (isHotkey('mod+j')(e)) {
          editor.getApi(AIChatPlugin).aiChat.show();
        }
      },
    },
    render: {
      belowRootNodes: (props) => {
        if (!props.attributes.className?.includes('slate-selectable'))
          return null;

        return <BlockSelection {...(props as any)} />;
      },
    },
  })),
];
