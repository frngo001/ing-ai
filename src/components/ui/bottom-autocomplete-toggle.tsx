'use client';

import * as React from 'react';

import { CopilotPlugin } from '@platejs/ai/react';
import { KEYS, NodeApi } from 'platejs';
import { useEditorRef } from 'platejs/react';

import { useEditorSettingsStore } from '@/lib/stores/editor-settings-store';
import { useLanguage } from '@/lib/i18n/use-language';

import { Switch } from './switch';
import { ToolbarGroup } from './toolbar';

export function BottomAutocompleteToggle() {
  const editor = useEditorRef();
  const { autocompleteEnabled, setAutocompleteEnabled } = useEditorSettingsStore();
  const { t, language } = useLanguage();

  type CopilotTrigger = (options: { editor: any }) => boolean;

  const defaultAutoTrigger: CopilotTrigger = React.useCallback(({ editor }) => {
    if (!editor) return false;

    const options = editor.getOptions({ key: KEYS.copilot });
    if (options?.suggestionText) return false;
    if (editor.api.isEmpty(editor.selection, { block: true })) return false;

    const blockAbove = editor.api.block();
    if (!blockAbove) return false;

    return NodeApi.string(blockAbove[0]).at(-1) === ' ';
  }, []);

  const defaultTriggerQuery: CopilotTrigger = React.useCallback(({ editor }) => {
    if (!editor) return false;
    if (editor.api.isExpanded()) return false;
    if (!editor.api.isAt({ end: true })) return false;
    return true;
  }, []);

  React.useEffect(() => {
    if (!editor) return;

    const safeAutoTrigger: CopilotTrigger = (context) =>
      autocompleteEnabled && defaultAutoTrigger(context);
    const safeTriggerQuery: CopilotTrigger = (context) =>
      autocompleteEnabled && defaultTriggerQuery(context);

    editor.setOption(
      CopilotPlugin,
      'autoTriggerQuery',
      safeAutoTrigger as unknown as (options: { editor: any }) => boolean
    );
    editor.setOption(
      CopilotPlugin,
      'triggerQuery',
      safeTriggerQuery as unknown as (options: { editor: any }) => boolean
    );

    if (!autocompleteEnabled) {
      editor.getApi(CopilotPlugin).copilot.stop();
      editor.setOption(CopilotPlugin, 'suggestionText', null);
      editor.setOption(CopilotPlugin, 'suggestionNodeId', null);
      editor.setOption(CopilotPlugin, 'completion', null);
    }
  }, [autocompleteEnabled, defaultAutoTrigger, defaultTriggerQuery, editor]);

  const handleToggle = React.useCallback(() => {
    setAutocompleteEnabled(!autocompleteEnabled);
  }, [autocompleteEnabled, setAutocompleteEnabled]);

  const autocompleteText = React.useMemo(() => t('toolbar.autocomplete'), [t, language]);
  const ariaLabelText = React.useMemo(() => t('toolbar.toggleAutocomplete'), [t, language]);

  return (
    <ToolbarGroup className="flex">
      <div className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground">
        <span>{autocompleteText}</span>
        <Switch
          checked={autocompleteEnabled}
          onCheckedChange={handleToggle}
          aria-label={ariaLabelText}
          className="data-[state=checked]:!bg-emerald-500 dark:data-[state=checked]:!bg-emerald-500"
        />
      </div>
    </ToolbarGroup>
  );
}
