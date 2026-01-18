'use client';

import { create } from 'zustand';
import type { BaseSelection } from 'slate';

interface ReferencePickerState {
    isOpen: boolean;
    editor: any | null;
    savedSelection: BaseSelection | null;
    openPicker: (editor: any) => void;
    closePicker: () => void;
}

export const useReferencePickerStore = create<ReferencePickerState>((set) => ({
    isOpen: false,
    editor: null,
    savedSelection: null,
    openPicker: (editor: any) => set({
        isOpen: true,
        editor,
        savedSelection: editor?.selection ?? null,
    }),
    closePicker: () => set({ isOpen: false, editor: null, savedSelection: null }),
}));
