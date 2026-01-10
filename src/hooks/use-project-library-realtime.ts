import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { devLog } from '@/lib/utils/logger';

export function useProjectLibraryRealtime({
    projectId,
    onLibraryChange,
    enabled = true,
}: {
    projectId: string | null;
    onLibraryChange: () => void;
    enabled?: boolean;
}) {
    const supabase = createClient();

    useEffect(() => {
        if (!enabled || !projectId) return;

        devLog('[LIBRARY REALTIME] Setting up subscription for project:', projectId);

        const channel = supabase.channel(`project-library:${projectId}`);

        // Listen for changes to citation_libraries in this project
        channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'citation_libraries',
                    filter: `project_id=eq.${projectId}`,
                },
                (payload) => {
                    devLog('[LIBRARY REALTIME] Received library change:', payload);
                    onLibraryChange();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'citations',
                },
                (payload) => {
                    devLog('[LIBRARY REALTIME] Received citation change:', payload);
                    onLibraryChange();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    devLog('[LIBRARY REALTIME] Subscribed to library changes');
                }
            });

        return () => {
            devLog('[LIBRARY REALTIME] Unsubscribing from library changes');
            supabase.removeChannel(channel);
        };
    }, [projectId, enabled, onLibraryChange, supabase]);
}
