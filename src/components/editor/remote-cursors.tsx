'use client';

import * as React from 'react';
import { useEditorRef } from 'platejs/react';
import { ReactEditor } from 'slate-react';
import { Range } from 'slate';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type RealtimePresence } from '@/hooks/use-document-realtime';
import { type MyEditor } from './editor-kit';

export function RemoteCursors({
    presence,
    currentUserId,
    sessionId
}: {
    presence: Record<string, RealtimePresence>;
    currentUserId?: string;
    sessionId?: string;
}) {
    const editor = useEditorRef();

    // Filter out the local session and those without selection
    const remoteUsers = Object.values(presence).filter(
        (p) => p.sessionId !== sessionId && p.selection && p.lastUpdated > Date.now() - 10000
    );

    return (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            <AnimatePresence>
                {remoteUsers.map((user) => (
                    <RemoteCursor key={user.sessionId} user={user} editor={editor} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function RemoteCursor({ user, editor }: { user: RealtimePresence; editor: any }) {
    const [rects, setRects] = React.useState<Rect[]>([]);
    const [caretRect, setCaretRect] = React.useState<Rect | null>(null);

    interface Rect {
        left: number;
        top: number;
        width: number;
        height: number;
    }

    React.useEffect(() => {
        if (!user.selection) return;

        try {
            const domRange = ReactEditor.toDOMRange(editor as any, user.selection);
            const clientRects = domRange.getClientRects();
            const editorEl = ReactEditor.toDOMNode(editor as any, editor as any);
            const editorRect = editorEl.getBoundingClientRect();

            const newRects: Rect[] = [];
            for (let i = 0; i < clientRects.length; i++) {
                const r = clientRects[i];
                newRects.push({
                    left: r.left - editorRect.left,
                    top: r.top - editorRect.top,
                    width: r.width,
                    height: r.height
                });
            }
            setRects(newRects);

            // Caret is usually at the focus point (the end of the selection)
            const focus = user.selection.focus;
            const caretRange = { anchor: focus, focus };
            const domCaretRange = ReactEditor.toDOMRange(editor as any, caretRange);
            const caretClientRect = domCaretRange.getBoundingClientRect();

            setCaretRect({
                left: caretClientRect.left - editorRect.left,
                top: caretClientRect.top - editorRect.top,
                width: caretClientRect.width,
                height: caretClientRect.height
            });
        } catch (e) {
            // Range might be invalid or not in DOM yet
            setRects([]);
            setCaretRect(null);
        }
    }, [user.selection, editor]);

    if (rects.length === 0 && !caretRect) return null;

    const color = user.color || '#3b82f6';

    return (
        <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {rects.map((rect, i) => (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                        backgroundColor: color,
                        opacity: 0.15,
                    }}
                />
            ))}
            {caretRect && (
                <m.div
                    className="absolute w-[2px] z-20"
                    initial={{ x: caretRect.left, y: caretRect.top, height: caretRect.height || 20 }}
                    animate={{ x: caretRect.left, y: caretRect.top, height: caretRect.height || 20 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8,
                    }}
                    style={{
                        backgroundColor: color,
                    }}
                >
                    <m.div
                        className="absolute top-0 left-0 -translate-y-full flex items-center gap-1.5 px-2 py-0.5 rounded-t-md rounded-br-md shadow-lg backdrop-blur-sm z-30"
                        style={{
                            backgroundColor: color,
                        }}
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                    >
                        {user.avatarUrl && (
                            <Avatar className="size-3.5 border border-white/20">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="text-[6px]">{user.userName[0]}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="text-[11px] font-semibold text-white whitespace-nowrap drop-shadow-sm">
                            {user.userName}
                        </span>
                    </m.div>

                    {/* Pulsing effect for the caret head */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full z-40"
                        style={{ backgroundColor: color }}
                    >
                        <div
                            className="absolute inset-0 rounded-full animate-ping opacity-75"
                            style={{ backgroundColor: color }}
                        />
                    </div>
                </m.div>
            )}
        </m.div>
    );
}
