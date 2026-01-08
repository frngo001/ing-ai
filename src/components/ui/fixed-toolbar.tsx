'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

type FixedToolbarProps = React.ComponentProps<typeof Toolbar> & {
  position?: 'top' | 'bottom';
};

export function FixedToolbar({
  className,
  position = 'top',
  ...props
}: FixedToolbarProps) {
  const positionClasses =
    position === 'bottom'
      ? 'sticky bottom-0 left-0 right-0 border-t border-t-border border-b-0 z-50'
      : 'sticky top-0 left-0 right-0 border-b border-b-border z-50';

  return (
    <Toolbar
      data-onboarding="fixed-toolbar"
      className={cn(
        'scrollbar-hide z-20 w-full max-w-full justify-between overflow-x-auto bg-background/95 p-1 shadow-sm backdrop-blur-sm supports-backdrop-blur:bg-background/60',
        positionClasses,
        className
      )}
      {...props}
    />
  );
}
