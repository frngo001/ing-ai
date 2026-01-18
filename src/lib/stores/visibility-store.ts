'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type VisibilityState = {
  tocEnabled: boolean;
  commentTocEnabled: boolean;
  suggestionTocEnabled: boolean;
  figureTocEnabled: boolean;
  toggleToc: () => void;
  toggleCommentToc: () => void;
  toggleSuggestionToc: () => void;
  toggleFigureToc: () => void;
};

export const useVisibilityStore = create<VisibilityState>()(
  persist(
    (set, get) => ({
      tocEnabled: true,
      commentTocEnabled: true,
      suggestionTocEnabled: true,
      figureTocEnabled: true,
      toggleToc: () => set({ tocEnabled: !get().tocEnabled }),
      toggleCommentToc: () =>
        set({ commentTocEnabled: !get().commentTocEnabled }),
      toggleSuggestionToc: () =>
        set({ suggestionTocEnabled: !get().suggestionTocEnabled }),
      toggleFigureToc: () =>
        set({ figureTocEnabled: !get().figureTocEnabled }),
    }),
    {
      name: 'visibility-store',
      version: 1,
    }
  )
);
