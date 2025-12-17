'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VisibilityState = {
  tocEnabled: boolean;
  commentTocEnabled: boolean;
  suggestionTocEnabled: boolean;
  toggleToc: () => void;
  toggleCommentToc: () => void;
  toggleSuggestionToc: () => void;
};

export const useVisibilityStore = create<VisibilityState>()(
  persist(
    (set, get) => ({
      tocEnabled: true,
      commentTocEnabled: true,
      suggestionTocEnabled: true,
      toggleToc: () => set({ tocEnabled: !get().tocEnabled }),
      toggleCommentToc: () =>
        set({ commentTocEnabled: !get().commentTocEnabled }),
      toggleSuggestionToc: () =>
        set({ suggestionTocEnabled: !get().suggestionTocEnabled }),
    }),
    {
      name: 'visibility-store',
      version: 1,
    }
  )
);
