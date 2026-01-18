'use client';

import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';

import {
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButton,
  useCaptionButtonState,
} from '@platejs/caption/react';
import { createPrimitiveComponent } from '@udecode/cn';
import { cva } from 'class-variance-authority';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';

const captionVariants = cva('max-w-full mt-3', {
  defaultVariants: {
    align: 'center',
  },
  variants: {
    align: {
      center: 'mx-auto',
      left: 'mr-auto',
      right: 'ml-auto',
    },
  },
});

export function Caption({
  align,
  className,
  ...props
}: React.ComponentProps<typeof CaptionPrimitive> &
  VariantProps<typeof captionVariants>) {
  return (
    <CaptionPrimitive
      {...props}
      className={cn(captionVariants({ align }), className)}
    />
  );
}

export function CaptionTextarea({
  index,
  type = 'figure',
  ...props
}: React.ComponentProps<typeof CaptionTextareaPrimitive> & {
  index?: number;
  type?: 'figure' | 'table';
}) {
  const { t } = useLanguage();

  const label = type === 'table'
    ? (t('table.table') || 'Tabelle')
    : (t('figure.figure') || 'Abbildung');

  return (
    <div className="flex items-baseline justify-center">
      {index !== undefined && (
        <button
          className="font-semibold text-sm whitespace-nowrap select-none hover:text-brand/80 transition-colors"
          onClick={(e) => {
            const container = e.currentTarget.parentElement;
            const textarea = container?.querySelector('textarea');
            textarea?.focus();
          }}
          type="button"
        >
          {label} {index}:&nbsp;
        </button>
      )}
      <CaptionTextareaPrimitive
        {...props}
        className={cn(
          'w-full resize-none border-none bg-inherit p-0 font-[inherit] text-inherit',
          'focus:outline-none focus:[&::placeholder]:opacity-0',
          'text-left print:placeholder:text-transparent',
          props.className
        )}
      />
    </div>
  );
}

export const CaptionButton = createPrimitiveComponent(Button)({
  propsHook: useCaptionButton,
  stateHook: useCaptionButtonState,
});
