'use client';

import * as React from 'react';
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from 'react-textarea-autosize';

import type { TEquationElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useEquationElement, useEquationInput } from '@platejs/math/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { CornerDownLeftIcon, RadicalIcon } from 'lucide-react';
import {
  createPrimitiveComponent,
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useReadOnly,
  useSelected,
} from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MathLiveInput } from '@/components/ui/mathlive-input';
import { cn } from '@/lib/utils';

export function EquationElement(props: PlateElementProps<TEquationElement>) {
  const editor = useEditorRef();
  const selected = useSelected();
  const [open, setOpen] = React.useState(selected);
  const katexRef = React.useRef<HTMLDivElement | null>(null);
  const hasContent = props.element.texExpression.length > 0;
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (selected && isMountedRef.current) {
      // Prüfe ob das Element noch existiert
      try {
        const path = editor.api.findPath(props.element);
        if (path) {
          // Verwende requestAnimationFrame, um sicherzustellen, dass das Element noch im DOM ist
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              try {
                const currentPath = editor.api.findPath(props.element);
                if (currentPath) {
                  setOpen(true);
                }
              } catch (e) {
                // Element existiert nicht mehr
              }
            }
          });
        }
      } catch (e) {
        // Element existiert nicht mehr, schließe das Popover
        setOpen(false);
      }
    } else if (!selected) {
      setOpen(false);
    }
  }, [selected, editor, props.element]);

  useEquationElement({
    element: props.element,
    katexRef,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { 
        '\\f': '#1f(#2)',
        '\\binom': '\\genfrac{(}{)}{0pt}{}{#1}{#2}',
        // Makro für Multinomial-Summation
        '\\multisum': '\\sum\\limits',
      },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  });

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    // Prüfe ob das Element noch existiert, bevor wir den State ändern
    try {
      const path = editor.api.findPath(props.element);
      if (!path && newOpen) {
        // Element existiert nicht mehr, öffne das Popover nicht
        return;
      }
      if (isMountedRef.current) {
        setOpen(newOpen);
      }
    } catch (e) {
      // Element existiert nicht mehr, ignoriere Fehler
      if (!newOpen) {
        setOpen(false);
      }
    }
  }, [editor, props.element]);

  return (
    <PlateElement className="my-1 w-full" {...props}>
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'group flex w-full cursor-pointer select-none items-center rounded-sm hover:bg-primary/10 data-[selected=true]:bg-primary/10',
              hasContent ? 'equation-counter px-2 py-1' : 'bg-muted p-3 pr-9'
            )}
            data-selected={selected}
            contentEditable={false}
            role="button"
          >
            <div className="flex flex-1 items-center justify-center">
              {hasContent ? (
                <span ref={katexRef} />
              ) : (
                <div className="flex h-7 w-full items-center gap-2 whitespace-nowrap text-muted-foreground text-sm">
                  <RadicalIcon className="size-6 text-muted-foreground/80" />
                  <div>Tex-Formel hinzufügen</div>
                </div>
              )}
            </div>

            {hasContent && <span className="equation-number" aria-hidden="true" />}
          </div>
        </PopoverTrigger>

        <EquationPopoverContent
          open={open}
          placeholder={
            'f(x) = \\begin{cases}\n  x^2, &\\quad x > 0 \\\\\n  0, &\\quad x = 0 \\\\\n  -x^2, &\\quad x < 0\n\\end{cases}'
          }
          isInline={false}
          setOpen={handleOpenChange}
        />
      </Popover>

      {props.children}
    </PlateElement>
  );
}

export function InlineEquationElement(
  props: PlateElementProps<TEquationElement>
) {
  const editor = useEditorRef();
  const element = props.element;
  const katexRef = React.useRef<HTMLDivElement | null>(null);
  const selected = useSelected();
  const isCollapsed = useEditorSelector(
    (editor) => editor.api.isCollapsed(),
    []
  );
  const [open, setOpen] = React.useState(selected && isCollapsed);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (selected && isCollapsed && isMountedRef.current) {
      // Prüfe ob das Element noch existiert
      try {
        const path = editor.api.findPath(element);
        if (path) {
          // Verwende requestAnimationFrame, um sicherzustellen, dass das Element noch im DOM ist
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              try {
                const currentPath = editor.api.findPath(element);
                if (currentPath) {
                  setOpen(true);
                }
              } catch (e) {
                // Element existiert nicht mehr
              }
            }
          });
        }
      } catch (e) {
        // Element existiert nicht mehr, schließe das Popover
        setOpen(false);
      }
    } else if (!selected) {
      setOpen(false);
    }
  }, [selected, isCollapsed, editor, element]);

  useEquationElement({
    element,
    katexRef,
    options: {
      displayMode: true,
      errorColor: '#cc0000',
      fleqn: false,
      leqno: false,
      macros: { 
        '\\f': '#1f(#2)',
        '\\binom': '\\genfrac{(}{)}{0pt}{}{#1}{#2}',
        // Makro für Multinomial-Summation
        '\\multisum': '\\sum\\limits',
      },
      output: 'htmlAndMathml',
      strict: 'warn',
      throwOnError: false,
      trust: false,
    },
  });

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    // Prüfe ob das Element noch existiert, bevor wir den State ändern
    try {
      const path = editor.api.findPath(element);
      if (!path && newOpen) {
        // Element existiert nicht mehr, öffne das Popover nicht
        return;
      }
      if (isMountedRef.current) {
        setOpen(newOpen);
      }
    } catch (e) {
      // Element existiert nicht mehr, ignoriere Fehler
      if (!newOpen) {
        setOpen(false);
      }
    }
  }, [editor, element]);

  return (
    <PlateElement
      {...props}
      className={cn(
        'mx-1 inline-block select-none rounded-sm [&_.katex-display]:my-0!'
      )}
    >
      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'after:-top-0.5 after:-left-1 after:absolute after:inset-0 after:z-1 after:h-[calc(100%)+4px] after:w-[calc(100%+8px)] after:rounded-sm after:content-[""]',
              'h-6',
              ((element.texExpression.length > 0 && open) || selected) &&
                'after:bg-brand/15',
              element.texExpression.length === 0 &&
                'text-muted-foreground after:bg-neutral-500/10'
            )}
            contentEditable={false}
          >
            <span
              ref={katexRef}
              className={cn(
                element.texExpression.length === 0 && 'hidden',
                'font-mono leading-none'
              )}
            />
            {element.texExpression.length === 0 && (
              <span>
                <RadicalIcon className="mr-1 inline-block h-[19px] w-4 py-[1.5px] align-text-bottom" />
                Neue Formel hinzufügen
              </span>
            )}
          </div>
        </PopoverTrigger>

        <EquationPopoverContent
          className="my-auto"
          open={open}
          placeholder="E = mc^2"
          setOpen={handleOpenChange}
          isInline
        />
      </Popover>

      {props.children}
    </PlateElement>
  );
}

const EquationInput = createPrimitiveComponent(TextareaAutosize)({
  propsHook: useEquationInput,
});

const EquationPopoverContent = ({
  className,
  isInline,
  open,
  setOpen,
  ...props
}: {
  isInline: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
} & TextareaAutosizeProps) => {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const element = useElement<TEquationElement>();
  const [useMathLive, setUseMathLive] = React.useState(true);
  const [latexValue, setLatexValue] = React.useState(element.texExpression);

  // Entferne diesen useEffect, da er zu Problemen führen kann
  // Das Popover sollte nur durch den Parent-State gesteuert werden

  React.useEffect(() => {
    setLatexValue(element.texExpression);
  }, [element.texExpression, open]);

  // Schließe das Popover, wenn das Element nicht mehr im Editor existiert
  React.useEffect(() => {
    const path = editor.api.findPath(element);
    if (!path && open) {
      setOpen(false);
    }
  }, [editor, element, open, setOpen]);

  if (readOnly) return null;

  const handleValueChange = (newValue: string) => {
    setLatexValue(newValue);
    // Aktualisiere das Element direkt
    try {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(
          { texExpression: newValue } as Partial<TEquationElement>,
          { at: path }
        );
      }
    } catch (e) {
      // Element existiert nicht mehr, ignoriere Fehler
    }
  };

  const onClose = () => {
    // Prüfe ob das Element noch existiert, bevor wir versuchen zu schließen
    const path = editor.api.findPath(element);
    if (!path) {
      // Element existiert nicht mehr, schließe das Popover direkt
      setOpen(false);
      return;
    }
    
    setOpen(false);

    // Verwende requestAnimationFrame, um sicherzustellen, dass das Element noch im DOM ist
    requestAnimationFrame(() => {
      const currentPath = editor.api.findPath(element);
      if (!currentPath) return; // Element wurde entfernt
      
      if (isInline) {
        try {
          editor.tf.select(element, { focus: true, next: true });
        } catch (e) {
          // Element existiert nicht mehr, ignoriere Fehler
        }
      } else {
        try {
          editor
            .getApi(BlockSelectionPlugin)
            .blockSelection.set(element.id as string);
        } catch (e) {
          // Element existiert nicht mehr, ignoriere Fehler
        }
      }
    });
  };

  return (
    <PopoverContent
      className="flex flex-col gap-2 p-4"
      onEscapeKeyDown={(e) => {
        e.preventDefault();
      }}
      contentEditable={false}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Formel bearbeiten</span>
        <div className="flex items-center gap-2">
          <Button
            variant={useMathLive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setUseMathLive(true)}
            className="h-7 text-xs"
          >
            MathLive
          </Button>
          <Button
            variant={!useMathLive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setUseMathLive(false)}
            className="h-7 text-xs"
          >
            LaTeX
          </Button>
        </div>
      </div>

      {useMathLive ? (
        <MathLiveInput
          value={latexValue}
          onChange={handleValueChange}
          placeholder={props.placeholder}
          className={cn('min-h-[120px]', className)}
          autoFocus
          open={open}
        />
      ) : (
        <EquationInput
          className={cn('max-h-[50vh] grow resize-none p-2 text-sm', className)}
          state={{ isInline, open, onClose }}
          autoFocus
          {...props}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" className="px-3" onClick={onClose}>
          Fertig <CornerDownLeftIcon className="size-3.5" />
        </Button>
      </div>
    </PopoverContent>
  );
};
