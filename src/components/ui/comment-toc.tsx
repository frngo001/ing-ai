'use client';

import * as React from 'react';

import type { Path } from 'platejs';

import { CommentPlugin } from '@platejs/comment/react';
import { PathApi, NodeApi } from 'platejs';
import { useEditorRef, useEditorSelector, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';
import { commentPlugin } from '@/components/editor/plugins/comment-kit';
import { discussionPlugin } from '@/components/editor/plugins/discussion-kit';

type CommentTocItem = {
  id: string;
  preview: string;
  path?: Path;
  count: number;
  status: 'open' | 'resolved';
  createdAt: Date;
  index: number;
};

type CommentTocSidebarProps = {
  className?: string;
  visible?: boolean;
};

export function CommentTocSidebar({
  className,
  visible = true,
}: CommentTocSidebarProps) {
  const editor = useEditorRef();
  const discussions = usePluginOption(discussionPlugin, 'discussions');
  const uniquePathMap = usePluginOption(commentPlugin, 'uniquePathMap');
  const activeId = usePluginOption(commentPlugin, 'activeId');

  const commentApi = React.useMemo(
    () => editor?.getApi(CommentPlugin).comment,
    [editor]
  );

  // Reaktives Auslesen aller Kommentar-Nodes, damit neue Kommentare sofort im TOC erscheinen.
  const commentNodes = useEditorSelector(
    (ed) => {
      const api = ed.getApi(CommentPlugin).comment;
      return Array.from(api.nodes({ at: [] }));
    },
    [commentApi]
  );

  const resolvePath = React.useCallback(
    (discussionId: string): Path | undefined => {
      if (!editor || !commentApi) return undefined;

      const mappedPath = uniquePathMap.get(discussionId);
      if (mappedPath) return mappedPath;

      const fromNodes = commentNodes.find(
        ([node]) => commentApi.nodeId(node) === discussionId
      );
      if (fromNodes?.[1]) {
        const blockEntry = editor.api.block({ at: fromNodes[1] });
        return blockEntry?.[1] ?? fromNodes[1];
      }

      const directNode = commentApi.node({ id: discussionId });
      if (directNode?.[1]) {
        const blockEntry = editor.api.block({ at: directNode[1] });
        return blockEntry?.[1] ?? directNode[1];
      }

      return undefined;
    },
    [commentApi, commentNodes, editor, uniquePathMap]
  );

  const items = React.useMemo(() => {
    if (!editor || !discussions || !commentApi) return [];

    // Nur Diskussionen berücksichtigen, die im Dokument tatsächlich verankert sind
    const commentsIdsInDoc = new Set(
      commentNodes.map(([node]) => commentApi.nodeId(node)).filter(Boolean)
    );

    const discussionsInDoc = discussions
      .map((d) => ({ ...d, createdAt: new Date(d.createdAt) }))
      .filter(
        (d) => !!d.id && commentsIdsInDoc.has(d.id) && commentApi.has({ id: d.id })
      );

    const textPreview = (discussionId: string) => {
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) return 'Kommentar';

      const firstComment = discussion.comments.find((c) => c.contentRich?.length);
      const raw = firstComment
        ? NodeApi.string({
            children: firstComment.contentRich,
            type: 'p',
          })
        : '';

      const preview = (raw ?? '').toString().trim();
      if (preview.length <= 80) return preview || 'Kommentar';
      return `${preview.slice(0, 77)}...`;
    };

    const toItem = (discussionId: string, index: number): CommentTocItem => {
      const discussion = discussionsInDoc.find((d) => d.id === discussionId);
      const resolvedPath = resolvePath(discussionId);
      return {
        id: discussionId,
        preview: textPreview(discussionId),
        path: resolvedPath,
        count: discussion?.comments.length ?? 0,
        status: discussion?.isResolved ? 'resolved' : 'open',
        createdAt: discussion?.createdAt
          ? new Date(discussion.createdAt)
          : new Date(0),
        index,
      };
    };

    const base = discussionsInDoc
      .map((discussion, index) => toItem(discussion.id, index + 1))
      .filter((item) => item.path);

    const byPath = (a: CommentTocItem, b: CommentTocItem) => {
      if (a.path && b.path) return PathApi.compare(a.path, b.path);
      if (a.path) return -1;
      if (b.path) return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    };

    return base.sort(byPath);
  }, [commentApi, commentNodes, discussions, editor, resolvePath]);

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
    (discussionId: string, path?: Path) => {
      editor.setOption(commentPlugin, 'activeId', discussionId);

      const target = path ?? resolvePath(discussionId);
      if (!target) return;

      const blockEntry = editor.api.block({ at: target });
      const targetPath = blockEntry?.[1] ?? target;

      const start = editor.api.start(targetPath);
      if (start) {
        editor.tf.select(start);
        editor.tf.focus();
      }

      const entry = editor.api.node(targetPath) ?? blockEntry;
      const dom = entry ? editor.api.toDOMNode(entry[0]) : null;
      dom?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [editor, resolvePath]
  );

  if (!shouldRender) return null;

  return (
    <aside
      data-state={showContent ? 'open' : 'closed'}
      className={cn(
        'fixed left-20 top-12 hidden h-fit max-h-[40vh] max-w-[15vw] rounded-lg border-none px-0 py-2 xl:block z-30',
        'transition-[opacity,transform] duration-200 ease-out',
        'data-[state=closed]:opacity-0 data-[state=closed]:-translate-y-2 data-[state=closed]:pointer-events-none',
        className
      )}
    >
      <div className="mb-2 text-sm font-semibold text-muted-foreground ml-2">
        Du hast offene Kommentare. 
      </div>

      <nav className="flex flex-col gap-2 text-sm max-h-[40vh] max-w-[15vw] overflow-auto pr-1">
        {items.map((item) => {
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                'text-left text-muted-foreground hover:text-foreground cursor-pointer',
                'rounded-lg border border-transparent px-3 py-2 transition flex flex-col gap-1',
                'hover:border-muted',
                isActive && 'bg-muted border-muted'
              )}
              onClick={() => handleNavigate(item.id, item.path)}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    item.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                  )}
                >
                  {item.status === 'resolved' ? 'Erledigt' : 'Offen'}
                </span>
                <span className="text-sm leading-snug line-clamp-2">{item.preview}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

