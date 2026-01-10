'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { devLog } from '@/lib/utils/logger';
import { type RealtimeChannel } from '@supabase/supabase-js';

export function useProjectDocumentsRealtime({
    projectId,
    userId,
    onDocumentsChange,
    enabled = true,
}: {
    projectId: string | null;
    userId: string | null;
    onDocumentsChange: () => void;
    enabled?: boolean;
}) {
    const supabase = React.useMemo(() => createClient(), []);
    const channelRef = React.useRef<RealtimeChannel | null>(null);

    React.useEffect(() => {
        if (!enabled || !projectId || !userId) return;

        devLog(`[PROJECT REALTIME] Subscribing to project:${projectId}`);

        const channel = supabase.channel(`project-documents:${projectId}`);

        channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'documents',
                    filter: `project_id=eq.${projectId}`,
                },
                (payload) => {
                    devLog('[PROJECT REALTIME] Received database change:', payload);
                    onDocumentsChange();
                }
            )
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    devLog(`[PROJECT REALTIME] Subscribed to project documents: ${projectId}`);
                } else if (status === 'CLOSED') {
                    devLog(`[PROJECT REALTIME] Subscription closed: ${projectId}`);
                } else if (status === 'CHANNEL_ERROR') {
                    devLog(`[PROJECT REALTIME] Channel error: ${projectId}`);
                }
            });

        channelRef.current = channel;

        return () => {
            devLog(`[PROJECT REALTIME] Unsubscribing from project:${projectId}`);
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [projectId, userId, enabled, onDocumentsChange, supabase]);

    return {};
}
