import { createSlatePlugin } from 'platejs';

export const CITATION_KEY = 'citation';

export const BaseCitationPlugin = createSlatePlugin({
    key: CITATION_KEY,
    node: {
        isElement: true,
        isInline: true,
        isVoid: true,
    },
});

export const BaseCitationKit = [BaseCitationPlugin];
