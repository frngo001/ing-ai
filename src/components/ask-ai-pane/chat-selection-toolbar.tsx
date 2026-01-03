'use client';

import * as React from 'react';
import { 
  ChevronsDown,
  FileEdit, 
  Copy,
  Check,
} from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Toolbar, ToolbarGroup } from '@/components/ui/toolbar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';
import type { ChatMessage, MessageContext } from '@/lib/ask-ai-pane/types';
import * as chatMessagesUtils from '@/lib/supabase/utils/chat-messages';

interface ChatSelectionToolbarProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  conversationId: string;
  input: string;
  setInput: (value: string | ((prev: string) => string)) => void;
  pendingContext: MessageContext[];
  setPendingContext: React.Dispatch<React.SetStateAction<MessageContext[]>>;
  onContextAdded?: () => void;
}

export function ChatSelectionToolbar({
  messages,
  setMessages,
  conversationId,
  input,
  setInput,
  pendingContext,
  setPendingContext,
  onContextAdded,
}: ChatSelectionToolbarProps) {
  const [showToolbar, setShowToolbar] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = React.useState('');
  const [sourceMessageId, setSourceMessageId] = React.useState<string | null>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  
  const { isCopied, handleCopy } = useCopyToClipboard({
    text: selectedText,
    withToast: false,
  });
  
  // Memoized translations
  const translations = React.useMemo(() => ({
    askInChat: t('askAi.askInChat'),
    addToEditor: t('askAi.addToEditor'),
    inEditor: t('askAi.inEditor'),
    copy: t('common.copy'),
    copied: t('common.copied'),
  }), [t, language]);

  React.useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        
        if (!selection || selection.rangeCount === 0) {
          setShowToolbar(false);
          return;
        }

        const text = selection.toString().trim();
        
        if (text.length === 0) {
          setShowToolbar(false);
          return;
        }

        try {
          const range = selection.getRangeAt(0);
          let element: Element | null = range.commonAncestorContainer as Element;
          
          if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
          }
          
          if (!element) {
            setShowToolbar(false);
            return;
          }
          
          // Prüfe, ob die Selection innerhalb einer Message mit data-message-id ist
          const messageElement = element.closest('[data-message-id]') as HTMLElement;
          
          if (!messageElement) {
            setShowToolbar(false);
            return;
          }

          // Prüfe, ob es eine Assistant-Nachricht ist
          // Assistant-Nachrichten haben "justify-start" (nicht "justify-end")
          const className = messageElement.className || '';
          const hasJustifyStart = className.includes('justify-start');
          const hasJustifyEnd = className.includes('justify-end');
          
          // Nur Assistant-Nachrichten (justify-start, nicht justify-end)
          if (!hasJustifyStart || hasJustifyEnd) {
            setShowToolbar(false);
            return;
          }

          // Speichere die Message-ID der Quelle
          const msgId = messageElement.getAttribute('data-message-id');
          setSourceMessageId(msgId);

          // Berechne Position der Toolbar über der Selection
          const rect = range.getBoundingClientRect();
          
          const offsetTop = 8;
          const offsetBottom = 12; // Abstand wenn unten angezeigt
          const toolbarHeight = 40; // Geschätzte Höhe der Toolbar
          const toolbarWidth = 250; // Geschätzte Breite der Toolbar (etwas größer für Sicherheit)
          
          // Horizontale Position (zentriert über Selection)
          let x = rect.left + rect.width / 2;

          const padding = 12;
          const minLeftOffset = 40; 
          const minLeft = padding + minLeftOffset + toolbarWidth / 2;
          const maxLeft = window.innerWidth - padding - toolbarWidth ; 
          
          if (x < minLeft) {
            x = minLeft;
          } else if (x > maxLeft) {
            x = maxLeft;
          }
          
          const spaceAbove = rect.top;
          const spaceBelow = window.innerHeight - rect.bottom;
          
          let y: number;
          if (spaceBelow >= toolbarHeight + offsetBottom) {
            y = rect.bottom + offsetBottom;
          } else if (spaceAbove >= toolbarHeight + offsetTop) {
            y = rect.top - toolbarHeight - offsetTop;
          } else {
            y = rect.bottom + offsetBottom;
          }
          
          if (y < padding) {
            y = padding;
          } else if (y + toolbarHeight > window.innerHeight - padding) {
            y = window.innerHeight - padding - toolbarHeight;
          }

          setSelectedText(text);
          setPosition({ x, y });
          setShowToolbar(true);
        } catch (e) {
          setShowToolbar(false);
        }
      }, 100);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setShowToolbar(false);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!showToolbar) return null;

  return (
    <div
      ref={toolbarRef}
      className={cn(
        'scrollbar-hide fixed z-50 overflow-x-auto whitespace-nowrap rounded-md border bg-popover p-1 opacity-100 shadow-md print:hidden',
        'max-w-[80vw]'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Toolbar>
        <ToolbarGroup>
          <button
            type="button"
            onClick={() => {
              if (!selectedText.trim() || !sourceMessageId) {
                setShowToolbar(false);
                return;
              }

              try {
                const newContext: MessageContext = {
                  text: selectedText.trim(),
                  addedAt: Date.now(),
                  sourceMessageId,
                };

                setPendingContext((prev) => [...prev, newContext]);

                onContextAdded?.();
                setShowToolbar(false);
              } catch (error) {
                console.error('Fehler beim Hinzufügen des Kontexts:', error);
                setShowToolbar(false);
              }
            }}
            onMouseDown={(e) => e.preventDefault()}
            className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:border-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 h-8 min-w-8 px-2 bg-transparent"
            aria-label={translations.askInChat}
          >
            <ChevronsDown className="size-4" />
            <span className="text-xs">{translations.askInChat}</span>
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  if (!selectedText.trim()) {
                    setShowToolbar(false);
                    return;
                  }

                  try {
                    // Füge Text als neuen Block vor dem Quellenverzeichnis hinzu
                    const insertEvent = new CustomEvent('insert-text-in-editor', {
                      detail: {
                        markdown: selectedText.trim(),
                        position: 'before-bibliography',
                      },
                    });
                    window.dispatchEvent(insertEvent);
                    setShowToolbar(false);
                  } catch (error) {
                    console.error('Fehler beim Hinzufügen zum Editor:', error);
                    setShowToolbar(false);
                  }
                }}
                onMouseDown={(e) => e.preventDefault()}
                className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:border-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 h-8 min-w-8 px-2 bg-transparent"
                aria-label={translations.addToEditor}
              >
                <FileEdit className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{translations.addToEditor}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  if (!selectedText.trim()) {
                    return;
                  }
                  handleCopy();
                }}
                onMouseDown={(e) => e.preventDefault()}
                className="relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:border-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 h-8 min-w-8 px-2 bg-transparent"
                aria-label={isCopied ? translations.copied : translations.copy}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className={cn(
                      "size-4 transition-transform ease-in-out",
                      isCopied ? "scale-100" : "scale-0"
                    )}
                  />
                </div>
                <Copy
                  className={cn(
                    "size-4 transition-transform ease-in-out",
                    isCopied ? "scale-0" : "scale-100"
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{isCopied ? translations.copied : translations.copy}</TooltipContent>
          </Tooltip>
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
}
