'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useComments } from '@/hooks/use-comments';
import { TDiscussion } from '@/components/editor/plugins/discussion-kit';
import { TComment } from '@/components/ui/comment';

type CommentsContextType = {
    discussions: TDiscussion[];
    loading: boolean;
    addDiscussion: (discussion: TDiscussion) => Promise<void>;
    addComment: (comment: TComment, discussionId: string) => Promise<void>;
    updateComment: (id: string, contentRich: any) => Promise<void>;
    resolveDiscussion: (id: string) => Promise<void>;
    deleteDiscussion: (id: string) => Promise<void>;
    deleteComment: (id: string) => Promise<void>;
};

export const CommentsContext = createContext<CommentsContextType | null>(null);

export function CommentsProvider({
    children,
    documentId,
}: {
    children: React.ReactNode;
    documentId: string;
}) {
    const comments = useComments(documentId);

    return (
        <CommentsContext.Provider value={comments}>
            {children}
        </CommentsContext.Provider>
    );
}

export function useCommentsContext() {
    const context = useContext(CommentsContext);
    if (!context) {
        throw new Error('useCommentsContext must be used within a CommentsProvider');
    }
    return context;
}
