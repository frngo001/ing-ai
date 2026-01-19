'use client';

import * as React from 'react';
import { useEditorRef } from 'platejs/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';
import { type Path } from 'platejs';
import { Image as ImageIcon, Video, Music, FileText, Link2 } from 'lucide-react';

// Re-export from figure-registry for backwards compatibility
export {
    useFigureIndex,
    useFigureRegistry,
    useFigures,
    useFigureCaption,
    FigureRegistryProvider,
    type FigureData
} from './figure-registry';

import { useFigures, type FigureData } from './figure-registry';
import { KEYS } from 'platejs';

/**
 * Get the appropriate icon for a figure type
 */
function getFigureIcon(type: string) {
    switch (type) {
        case KEYS.img:
            return ImageIcon;
        case KEYS.video:
            return Video;
        case KEYS.audio:
            return Music;
        case KEYS.file:
            return FileText;
        case KEYS.mediaEmbed:
            return Link2;
        default:
            return ImageIcon;
    }
}

/**
 * Figure TOC Sidebar component.
 * Displays a list of all figures in the document with their captions.
 */
export function FigureTocSidebar({
    className,
    visible = true
}: {
    className?: string;
    visible?: boolean
}) {
    const editor = useEditorRef();
    const { t, language } = useLanguage();
    const figures = useFigures();

    const handleNavigate = React.useCallback(
        (path: Path) => {
            const entry = editor.api.node(path);
            if (entry) {
                const dom = editor.api.toDOMNode(entry[0]);
                dom?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Brief selection to highlight
                const start = editor.api.start(path);
                if (start) {
                    editor.tf.select(start);
                    editor.tf.focus();
                }
            }
        },
        [editor]
    );

    const showContent = visible && figures.length > 0;
    if (!showContent) return null;

    return (
        <aside
            className={cn(
                'fixed left-4 top-12 hidden h-fit max-h-[40vh] min-w-[180px] max-w-xs rounded-lg border-none px-0 py-2 xl:block z-30 bg-background/50 backdrop-blur-sm shadow-sm',
                className
            )}
        >
            <div className="mb-2 text-sm font-semibold text-muted-foreground ml-4">
                {t('figure.listTitle')}
            </div>

            <nav className="flex flex-col gap-1 text-sm max-h-[35vh] overflow-auto px-2">
                {figures.map((figure) => {
                    const Icon = getFigureIcon(figure.type);
                    return (
                        <FigureTocItem
                            key={figure.id}
                            figure={figure}
                            Icon={Icon}
                            onNavigate={handleNavigate}
                            t={t}
                        />
                    );
                })}
            </nav>
        </aside>
    );
}

/**
 * Memoized figure TOC item to prevent unnecessary re-renders
 */
const FigureTocItem = React.memo(function FigureTocItem({
    figure,
    Icon,
    onNavigate,
    t,
}: {
    figure: FigureData;
    Icon: React.ElementType;
    onNavigate: (path: Path) => void;
    t: (key: string) => string;
}) {
    const label = `${t('figure.figure') || 'Abbildung'} ${figure.index}`;

    return (
        <button
            type="button"
            className={cn(
                'text-left text-muted-foreground hover:text-foreground cursor-pointer',
                'rounded px-3 py-1.5 transition hover:bg-muted flex items-center gap-2'
            )}
            onClick={() => onNavigate(figure.path)}
        >
            <Icon className="size-3.5 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
                <span className="font-medium text-xs text-foreground leading-tight truncate">
                    {label}: {figure.caption || '...'}
                </span>
            </div>
        </button>
    );
});
