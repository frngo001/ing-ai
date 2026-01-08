'use client';

import * as React from 'react';

import { SuggestionPlugin } from '@platejs/suggestion/react';
import {
  type DropdownMenuProps,
  DropdownMenuItemIndicator,
} from '@radix-ui/react-dropdown-menu';
import { CheckIcon, EyeIcon, PencilLineIcon, PenIcon } from 'lucide-react';
import { useEditorRef, usePlateState, usePluginOption } from 'platejs/react';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';
import { useLanguage } from '@/lib/i18n/use-language';

export function ModeToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [readOnly, setReadOnly] = usePlateState('readOnly');
  const [open, setOpen] = React.useState(false);
  const { t, language } = useLanguage();

  // Check if onboarding is showing suggestions step
  const { isOpen: isOnboardingOpen, getCurrentSubStep } = useOnboardingStore();
  const currentSubStep = getCurrentSubStep();
  const shouldForceOpen = isOnboardingOpen && currentSubStep?.id === 'open-mode';

  // Effect to open dropdown when onboarding reaches mode step
  React.useEffect(() => {
    if (shouldForceOpen && !open) {
      setOpen(true);
    }
  }, [shouldForceOpen, open]);

  // Handle open change - prevent closing during onboarding
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (shouldForceOpen && !newOpen) {
      return; // Prevent closing during onboarding
    }
    setOpen(newOpen);
  }, [shouldForceOpen]);

  const isSuggesting = usePluginOption(SuggestionPlugin, 'isSuggesting');

  let value = 'editing';

  if (readOnly) value = 'viewing';

  if (isSuggesting) value = 'suggestion';

  const item: Record<string, { icon: React.ReactNode; label: string }> = React.useMemo(() => ({
    editing: {
      icon: <PenIcon />,
      label: t('toolbar.editing'),
    },
    suggestion: {
      icon: <PencilLineIcon />,
      label: t('toolbar.suggestion'),
    },
    viewing: {
      icon: <EyeIcon />,
      label: t('toolbar.viewing'),
    },
  }), [t, language]);

  const tooltipText = React.useMemo(() => t('toolbar.mode'), [t, language]);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={tooltipText} isDropdown data-onboarding="mode-btn">
          {item[value].icon}
          <span className="hidden lg:inline">{item[value].label}</span>
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[180px]" align="start" data-onboarding="mode-dropdown">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(newValue) => {
            if (newValue === 'viewing') {
              setReadOnly(true);

              return;
            }
            setReadOnly(false);

            if (newValue === 'suggestion') {
              editor.setOption(SuggestionPlugin, 'isSuggesting', true);

              return;
            }
            editor.setOption(SuggestionPlugin, 'isSuggesting', false);

            if (newValue === 'editing') {
              editor.tf.focus();

              return;
            }
          }}
        >
          <DropdownMenuRadioItem
            className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground"
            value="editing"
          >
            <Indicator />
            {item.editing.icon}
            {item.editing.label}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem
            className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground"
            value="viewing"
          >
            <Indicator />
            {item.viewing.icon}
            {item.viewing.label}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem
            className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground"
            value="suggestion"
          >
            <Indicator />
            {item.suggestion.icon}
            {item.suggestion.label}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Indicator() {
  return (
    <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <CheckIcon />
      </DropdownMenuItemIndicator>
    </span>
  );
}
