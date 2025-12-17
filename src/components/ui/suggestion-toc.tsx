'use client';

import * as React from 'react';

import type { Path } from 'platejs';
import { PathApi, NodeApi } from 'platejs';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import { cn } from '@/lib/utils';
import { suggestionPlugin } from '@/components/editor/plugins/suggestion-kit';

type SuggestionTocItem = {
  id: string;
  path?: Path;
  preview: string;
  index: number;
};

export function SuggestionTocSidebar({
  className,
  visible = true,
}: {
  className?: string;
  visible?: boolean;
}) {
  const editor = useEditorRef();
  const suggestionApi = React.useMemo(
    () => editor?.getApi(SuggestionPlugin).suggestion,
    [editor]
  );

  const suggestionNodes = useEditorSelector(
    (ed) => {
      const api = ed.getApi(SuggestionPlugin).suggestion;
      return Array.from(api.nodes({ at: [] }));
    },
    [suggestionApi]
  );

  const items = React.useMemo((): SuggestionTocItem[] => {
    if (!editor || !suggestionApi) return [];

    const unique = new Map<string, Path>();

    for (const [node, path] of suggestionNodes) {
      const id = suggestionApi.nodeId(node);
      if (!id) continue;
      if (!unique.has(id)) unique.set(id, path);
    }

    const toItem = (id: string, path: Path, index: number): SuggestionTocItem => {
      const blockEntry = editor.api.block({ at: path });
      const targetPath = blockEntry?.[1] ?? path;
      const previewNode = editor.api.node(targetPath)?.[0] ?? blockEntry?.[0];
      const preview = previewNode ? NodeApi.string(previewNode).slice(0, 80) : 'Vorschlag';
      return { id, path: targetPath, preview: preview || 'Vorschlag', index };
    };

    return Array.from(unique.entries())
      .map(([id, path], idx) => toItem(id, path, idx + 1))
      .sort((a, b) => {
        if (a.path && b.path) return PathApi.compare(a.path, b.path);
        if (a.path) return -1;
        if (b.path) return 1;
        return a.index - b.index;
      });
  }, [editor, suggestionApi, suggestionNodes]);

  const showContent = visible && items.length > 0;
  const [shouldRender, setShouldRender] = React.useState(showContent);
  const TRANSITION_MS = 200;

  React.useEffect(() => {
    if (showContent) {
      setShouldRender(true);
      return;
    }
    const timeout = window.setTimeout(() => setShouldRender(false), TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [showContent]);

  const handleNavigate = React.useCallback(
    (item: SuggestionTocItem) => {
      if (!editor || !item.path) return;
      const start = editor.api.start(item.path);
      if (start) {
        editor.tf.select(start);
        editor.tf.focus();
      }
      const entry = editor.api.node(item.path);
      const dom = entry ? editor.api.toDOMNode(entry[0]) : null;
      dom?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      editor.setOption(suggestionPlugin, 'activeId', item.id);
    },
    [editor]
  );

  if (!shouldRender) return null;

  return (
    <aside
      data-state={showContent ? 'open' : 'closed'}
      className={cn(
        'fixed left-20 top-12 hidden h-fit min-w-[200px] max-w-xs rounded-lg border-none px-0 py-2 xl:block z-30',
        'transition-[opacity,transform] duration-200 ease-out',
        'data-[state=closed]:opacity-0 data-[state=closed]:-translate-y-2 data-[state=closed]:pointer-events-none',
        className
      )}
    >
      <div className="mb-2 text-sm font-semibold text-muted-foreground ml-2">
        Hey, du hast offene Reviews.
      </div>

      <nav className="flex flex-col gap-2 text-sm max-h-[40vh] max-w-[15vw] overflow-auto pr-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'flex flex-col gap-1 rounded-md px-2 py-1 text-left transition-colors',
              'bg-muted/40 hover:bg-muted text-foreground'
            )}
            onClick={() => handleNavigate(item)}
          >
            <span className="text-xs text-muted-foreground">#{item.index}</span>
            <span className="line-clamp-2">{item.preview}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
