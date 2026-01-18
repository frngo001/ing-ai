'use client';

import * as React from 'react';

import type { TAudioElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';
import { MediaToolbar } from './media-toolbar';
import { AudioPlugin } from '@platejs/media/react';
import { useFigureIndex } from './figure-toc';

import { useLanguage } from '@/lib/i18n/use-language';

import { Caption, CaptionTextarea } from './caption';

export const AudioElement = withHOC(
  ResizableProvider,
  function AudioElement(props: PlateElementProps<TAudioElement>) {
    const { t } = useLanguage();
    const { align = 'center', readOnly, unsafeUrl } = useMediaState();

    const index = useFigureIndex(props.element.id);

    return (
      <MediaToolbar plugin={AudioPlugin}>
        <PlateElement {...props} className="mb-1">
          <figure
            className="group relative cursor-default"
            contentEditable={false}
          >
            <div className="h-16">
              <audio className="size-full" src={unsafeUrl} controls />
            </div>

            <Caption style={{ width: '100%' }} align={align}>
              <CaptionTextarea
                index={index}
                className="h-20"
                readOnly={readOnly}
                placeholder={t('toolbar.mediaWriteCaption')}
              />
            </Caption>
          </figure>
          {props.children}
        </PlateElement>
      </MediaToolbar>
    );
  }
);
