'use client';

import * as React from 'react';
import { createClient } from '../lib/supabase/client';
import { type Value } from 'platejs';
import { devLog } from '../lib/utils/logger';
import { type RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimePresence {
    userId: string;
    userName: string;
    avatarUrl?: string;
    color?: string;
    cursor?: {
        path: number[];
        offset: number;
    };
    selection?: {
        anchor: { path: number[]; offset: number };
        focus: { path: number[]; offset: number };
    } | null;
    lastUpdated: number;
    sessionId: string;
}

export function useDocumentRealtime({
    documentId,
    onContentUpdate,
    enabled,
}: {
    documentId: string | null;
    onContentUpdate: (content: Value) => void;
    enabled: boolean;
}) {
    const supabase = React.useMemo(() => createClient(), []);
    const channelRef = React.useRef<RealtimeChannel | null>(null);
    const sessionId = React.useMemo(() => Math.random().toString(36).substring(7), []);
    const userColor = React.useMemo(() => {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#10b981',
            '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    const [presence, setPresence] = React.useState<Record<string, RealtimePresence>>({});

    React.useEffect(() => {
        if (!enabled || !documentId) return;

        devLog(`[REALTIME] Subscribing to document:${documentId}`);

        const channel = supabase.channel(`document:${documentId}`, {
            config: {
                broadcast: { self: false },
                presence: { key: documentId },
            },
        });

        channel
            .on('broadcast' as any, { event: 'content-update' }, (payload: { content: Value }) => {
                devLog('[REALTIME] Received content-update');
                if (payload.content) {
                    onContentUpdate(payload.content);
                }
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const simplified: Record<string, RealtimePresence> = {};

                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        // Use presence_ref as key for uniqueness, or sessionId
                        if (p.sessionId) {
                            simplified[p.presence_ref || p.sessionId] = p;
                        }
                    });
                });

                setPresence(simplified);
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    devLog(`[REALTIME] Subscribed successfully to document:${documentId}`);
                } else if (status === 'CLOSED') {
                    devLog(`[REALTIME] Subscription closed for document:${documentId}`);
                } else if (status === 'CHANNEL_ERROR') {
                    devLog(`[REALTIME] Channel error for document:${documentId}`);
                }
            });

        channelRef.current = channel;

        return () => {
            devLog(`[REALTIME] Unsubscribing from document:${documentId}`);
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [documentId, enabled, onContentUpdate, supabase]);

    const broadcastContent = React.useCallback((content: Value) => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'content-update',
            content,
        });
    }, []);

    const updatePresence = React.useCallback((data: Partial<RealtimePresence>) => {
        if (!channelRef.current) return;

        channelRef.current.track({
            ...data,
            sessionId,
            color: userColor,
            lastUpdated: Date.now(),
        });
    }, [sessionId, userColor]);

    return {
        broadcastContent,
        updatePresence,
        presence,
        sessionId,
    };
}
