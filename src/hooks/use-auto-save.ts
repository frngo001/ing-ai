import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Simple debounce implementation if lodash is not desired
function simpleDebounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

export function useAutoSave(
    documentId: string,
    content: string,
    title: string
) {
    const supabase = createClient()
    const lastSavedContent = useRef(content)
    const lastSavedTitle = useRef(title)

    const saveDocument = useCallback(
        async (currentContent: string, currentTitle: string) => {
            if (
                currentContent === lastSavedContent.current &&
                currentTitle === lastSavedTitle.current
            ) {
                return
            }

            try {
                const { error } = await supabase
                    .from('documents')
                    .update({
                        content: { html: currentContent }, // Storing as simple JSON for now
                        title: currentTitle,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', documentId)

                if (error) throw error

                lastSavedContent.current = currentContent
                lastSavedTitle.current = currentTitle

                // Optional: Show subtle indicator instead of toast for auto-save
                // toast.success('Saved') 
            } catch (error) {
                console.error('Auto-save error:', error)
                toast.error('Failed to save changes')
            }
        },
        [documentId, supabase]
    )

    // Create debounced save function
    const debouncedSave = useCallback(
        simpleDebounce((c: string, t: string) => saveDocument(c, t), 2000),
        [saveDocument]
    )

    // Trigger save when content or title changes
    useEffect(() => {
        debouncedSave(content, title)
    }, [content, title, debouncedSave])

    return {
        saveNow: () => saveDocument(content, title),
    }
}
