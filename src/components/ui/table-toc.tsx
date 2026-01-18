'use client';

import * as React from 'react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';
import { type Path, KEYS, NodeApi } from 'platejs';
import { Table as TableIcon } from 'lucide-react';

// Re-export from table-registry for backwards compatibility
export {
    useTableIndex,
    useTableRegistry,
    useTables,
    useTableCaption,
    TableRegistryProvider,
} from './table-registry';

import { useTables } from './table-registry';

type TableItem = {
    id: string;
    tag: string;
    preview?: string;
    path: Path;
};

export function TableTocSidebar({ className, visible = true }: { className?: string; visible?: boolean }) {
    const editor = useEditorRef();
    const { t, language } = useLanguage();
    const tables = useTables();

    const items = React.useMemo(() => {
        return tables.map(table => ({
            id: table.id,
            tag: `${t('table.table') || 'Tabelle'} ${table.index}`,
            preview: table.caption,
            path: table.path,
        }));
    }, [tables, t, language]);

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

    const showContent = visible && items.length > 0;
    if (!showContent) return null;

    return (
        <aside
            className={cn(
                'fixed left-4 top-12 hidden h-fit max-h-[40vh] min-w-[180px] max-w-xs rounded-lg border-none px-0 py-2 xl:block z-30 bg-background/50 backdrop-blur-sm shadow-sm',
                className
            )}
        >
            <div className="mb-2 text-sm font-semibold text-muted-foreground ml-4">
                {t('table.listTitle') || 'Tabellenverzeichnis'}
            </div>

            <nav className="flex flex-col gap-1 text-sm max-h-[35vh] overflow-auto px-2">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={cn(
                            'text-left text-muted-foreground hover:text-foreground cursor-pointer',
                            'rounded px-3 py-1.5 transition hover:bg-muted flex items-center gap-2'
                        )}
                        onClick={() => handleNavigate(item.path)}
                    >
                        <TableIcon className="size-3.5 flex-shrink-0" />
                        <div className="flex flex-col">
                            <span className="font-medium text-xs text-foreground leading-tight">
                                {item.tag}: {item.preview || '...'}
                            </span>
                        </div>
                    </button>
                ))}
            </nav>
        </aside>
    );
}
