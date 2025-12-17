'use client';

import * as React from 'react';
import { MathfieldElement } from 'mathlive';
import { cn } from '@/lib/utils';

// Registriere das Custom Element (wird nur einmal ausgeführt)
if (typeof window !== 'undefined' && !customElements.get('math-field')) {
  customElements.define('math-field', MathfieldElement);
  
  // Setze die deutsche Lokalisierung für alle MathfieldElement-Instanzen
  MathfieldElement.locale = 'de';
  
  // Konfiguriere die virtuelle Tastatur mit deutschen Labels
  if ((window as any).mathVirtualKeyboard) {
    (window as any).mathVirtualKeyboard.options = {
      ...((window as any).mathVirtualKeyboard.options || {}),
      locale: 'de',
    };
  }
  
  // Unterdrücke Warnungen für Keybindings
  const originalWarn = console.warn;
  const keybindingWarningPattern = /Invalid keybindings for current keyboard layout|Ambiguous key binding.*IntlBackslash/i;
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!keybindingWarningPattern.test(message)) {
      originalWarn.apply(console, args);
    }
  };
  setTimeout(() => {
    console.warn = originalWarn;
  }, 2000);
}

// TypeScript-Deklarationen für MathField
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement> & {
          value?: string;
          'read-only'?: boolean;
          class?: string;
        },
        MathfieldElement
      >;
    }
  }
}

interface MathLiveInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  open?: boolean;
}

export function MathLiveInput({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  autoFocus,
  readOnly = false,
  open = true,
}: MathLiveInputProps) {
  const mathFieldRef = React.useRef<MathfieldElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current || !mathFieldRef.current) return;

    const mathField = mathFieldRef.current;

    // Konfiguriere MathLive über Attribute
    mathField.defaultMode = 'math';
    mathField.smartFence = true;
    mathField.smartSuperscript = true;
    mathField.removeExtraneousParentheses = true;
    
    // Die Locale wird bereits global auf MathfieldElement.locale gesetzt
    // Keine Instanz-spezifische Locale-Einstellung nötig

    // Setze den Wert nur wenn er sich geändert hat (verhindert Loops)
    const currentValue = mathField.getValue('latex');
    if (value !== currentValue && value !== undefined) {
      mathField.setValue(value);
    }

    // Event-Handler für Änderungen
    const handleInput = () => {
      const newValue = mathField.getValue('latex');
      if (newValue !== value) {
        onChange(newValue);
      }
    };

    mathField.addEventListener('input', handleInput);

    let handleBlurFn: (() => void) | undefined;
    if (onBlur) {
      handleBlurFn = () => {
        onBlur();
      };
      mathField.addEventListener('blur', handleBlurFn);
    }

    // Auto-Focus
    if (autoFocus && open !== false) {
      const timeoutId = setTimeout(() => {
        try {
          mathField.focus();
        } catch (e) {
          // Ignoriere Focus-Fehler
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        mathField.removeEventListener('input', handleInput);
        if (handleBlurFn) {
          mathField.removeEventListener('blur', handleBlurFn);
        }
      };
    }

    return () => {
      mathField.removeEventListener('input', handleInput);
      if (handleBlurFn) {
        mathField.removeEventListener('blur', handleBlurFn);
      }
    };
  }, [value, onChange, onBlur, autoFocus, open]);

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      {/* @ts-ignore - MathField ist ein Custom Element */}
      <math-field
        ref={mathFieldRef}
        value={value}
        placeholder={placeholder}
        read-only={readOnly}
        className={cn(
          'w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        style={{
          '--selection-background-color': 'hsl(var(--accent))',
          '--selection-color': 'hsl(var(--accent-foreground))',
        } as React.CSSProperties}
      />
    </div>
  );
}

