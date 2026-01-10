import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TDiscussion } from '@/components/editor/plugins/discussion-kit';
import { TComment } from '@/components/ui/comment';

export const useComments = (documentId: string) => {
    const [discussions, setDiscussions] = useState<TDiscussion[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchDiscussions = useCallback(async () => {
        if (!documentId) return;

        setLoading(true);
        try {
            // Fetch discussions for the document
            const { data: discussionsData, error: discussionsError } = await supabase
                .from('discussions')
                .select('*')
                .eq('document_id', documentId);

            if (discussionsError) throw discussionsError;

            if (!discussionsData || discussionsData.length === 0) {
                setDiscussions([]);
                setLoading(false);
                return;
            }

            // Fetch comments for these discussions
            const discussionIds = discussionsData.map((d) => d.id);
            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select('*')
                .in('discussion_id', discussionIds)
                .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;

            // Group comments by discussion
            const filledDiscussions: TDiscussion[] = discussionsData.map((d) => {
                const discussionComments = commentsData
                    ?.filter((c) => c.discussion_id === d.id)
                    .map((c) => ({
                        id: c.id,
                        contentRich: c.content_rich,
                        createdAt: new Date(c.created_at),
                        discussionId: c.discussion_id,
                        isEdited: c.is_edited,
                        userId: c.user_id,
                        userName: c.user_name,
                        avatarUrl: c.avatar_url,
                        updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
                    } as TComment)) || [];

                return {
                    id: d.id,
                    comments: discussionComments,
                    createdAt: new Date(d.created_at),
                    isResolved: d.is_resolved,
                    userId: d.user_id,
                    documentContent: d.document_content,
                };
            });

            setDiscussions(filledDiscussions);
        } catch (error) {
            console.error('Error fetching comments:', error);
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
