'use client';

import * as React from 'react';

import type { TDateElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useReadOnly } from 'platejs/react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';

export function DateElement(props: PlateElementProps<TDateElement>) {
  const { editor, element } = props;
  const { t, language } = useLanguage();

  const readOnly = useReadOnly();

  const todayText = React.useMemo(() => t('toolbar.dateToday'), [t, language]);
  const yesterdayText = React.useMemo(() => t('toolbar.dateYesterday'), [t, language]);
  const tomorrowText = React.useMemo(() => t('toolbar.dateTomorrow'), [t, language]);
  const pickADateText = React.useMemo(() => t('toolbar.datePickADate'), [t, language]);

  // Get locale based on current language
  const locale = React.useMemo(() => {
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
    };
    return localeMap[language] || 'en-US';
  }, [language]);

  const trigger = (
    <span
      className={cn(
        'w-fit cursor-pointer rounded-sm bg-muted px-1 text-muted-foreground'
      )}
      contentEditable={false}
      draggable
    >
      {element.date ? (
        (() => {
          const today = new Date();
          const elementDate = new Date(element.date);
          const isToday =
            elementDate.getDate() === today.getDate() &&
            elementDate.getMonth() === today.getMonth() &&
            elementDate.getFullYear() === today.getFullYear();

          const isYesterday =
            new Date(today.setDate(today.getDate() - 1)).toDateString() ===
            elementDate.toDateString();
          const isTomorrow =
            new Date(today.setDate(today.getDate() + 2)).toDateString() ===
            elementDate.toDateString();

          if (isToday) return todayText;
          if (isYesterday) return yesterdayText;
          if (isTomorrow) return tomorrowText;

          return elementDate.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        })()
      ) : (
        <span>{pickADateText}</span>
      )}
    </span>
  );

  if (readOnly) {
    return trigger;
  }

  return (
    <PlateElement
      {...props}
      className="inline-block"
      attributes={{
        ...props.attributes,
        contentEditable: false,
      }}
    >
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            selected={new Date(element.date as string)}
            onSelect={(date) => {
              if (!date) return;

              editor.tf.setNodes(
                { date: date.toDateString() },
                { at: element }
              );
            }}
            mode="single"
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {props.children}
    </PlateElement>
  );
}
