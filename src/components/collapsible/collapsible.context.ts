import { createContext } from '@lit/context';

import type { CollapsibleOpenChangeReason } from './types';

export interface CollapsibleRootContext {
  open: boolean;
  disabled: boolean;
  requestToggle(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void;
  requestOpen(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void;
  registerTrigger(trigger: HTMLElement): void;
  unregisterTrigger(trigger: HTMLElement): void;
  registerPanel(panel: HTMLElement): void;
  unregisterPanel(panel: HTMLElement): void;
  getTriggerElement(): HTMLElement | null;
  getPanelElement(): HTMLElement | null;
}

export const collapsibleRootContext = createContext<CollapsibleRootContext>('collapsible-root');
