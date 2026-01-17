import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TDiscussion } from '@/components/editor/plugins/discussion-kit';
import { TComment } from '@/components/ui/comment';
import * as discussionsUtils from '@/lib/supabase/utils/discussions';

export const useComments = (documentId: string) => {
    const [discussions, setDiscussions] = useState<TDiscussion[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchDiscussions = useCallback(async () => {
        if (!documentId) return;

        // Validating documentId before attempting to fetch
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId);
        if (!isUUID) {
            setDiscussions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Use the utility function to get deep discussions with comments in one go
            const discussionsWithComments = await discussionsUtils.getDeepDiscussionsByDocument(documentId);
            setDiscussions(discussionsWithComments);
        } catch (error) {
            console.error('Error fetching comments:', JSON.stringify(error, null, 2) || error);
        } finally {
            setLoading(false);
        }
    }, [documentId, supabase]);

    useEffect(() => {
        void fetchDiscussions();

        // Subscribe to realtime changes
        const channel = supabase
            .channel(`comments:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'discussions',
                    filter: `document_id=eq.${documentId}`,
                },
                () => {
                    void fetchDiscussions();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                },
                (payload) => {
                    // Check if this comment belongs to one of our discussions
                    // This is a simplified approach; ideally we'd filter server-side or check discussion IDs
                    void fetchDiscussions();
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [documentId, fetchDiscussions, supabase]);

    const addDiscussion = async (discussion: TDiscussion) => {
        try {
            const { error } = await supabase.from('discussions').insert({
                id: discussion.id,
                document_id: documentId,
                user_id: discussion.userId,
                document_content: discussion.documentContent,
                is_resolved: discussion.isResolved,
                created_at: discussion.createdAt.toISOString(),
            });

            if (error) throw error;

            // Optimistic update
            setDiscussions((prev) => [...prev, discussion]);

            // Add comments for the discussion
            for (const comment of discussion.comments) {
                await addComment(comment, discussion.id);
            }
        } catch (error) {
            console.error('Error adding discussion:', error);
        }
    };

    const addComment = async (comment: TComment, discussionId: string) => {
        try {
            const { error } = await supabase.from('comments').insert({
                id: comment.id,
                discussion_id: discussionId,
                user_id: comment.userId,
                content_rich: comment.contentRich,
                is_edited: comment.isEdited,
                created_at: comment.createdAt.toISOString(),
                user_name: comment.userName,
                avatar_url: comment.avatarUrl,
            });

            if (error) throw error;

            // Optimistic updat within fetchDiscussions or separate state update
            // For now relying on fetchDiscussions re-trigger or optimistic logic in caller
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const updateComment = async (id: string, contentRich: any) => {
        try {
            const { error } = await supabase
                .from('comments')
                .update({
                    content_rich: contentRich,
                    is_edited: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const resolveDiscussion = async (id: string) => {
        try {
            const { error } = await supabase
                .from('discussions')
                .update({ is_resolved: true })
                .eq('id', id);

            if (error) throw error;

            setDiscussions(prev => prev.map(d => d.id === id ? { ...d, isResolved: true } : d));
        } catch (error) {
            console.error('Error resolving discussion:', error);
        }
    };

    const deleteDiscussion = async (id: string) => {
        try {
            // Comments cascade delete
            const { error } = await supabase
                .from('discussions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setDiscussions(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting discussion:', error);
        }
    };

    const deleteComment = async (id: string) => {
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    return {
        discussions,
        loading,
        addDiscussion,
        addComment,
        updateComment,
        resolveDiscussion,
        deleteDiscussion,
        deleteComment,
    };
};
