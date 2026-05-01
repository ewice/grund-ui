import { createContext } from '@lit/context';

import type { CollapsibleOpenChangeReason } from './types';

export interface CollapsibleRootContext {
  open: boolean;
  disabled: boolean;
  requestToggle(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void;
  requestOpen(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void;
  requestClose(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void;
  attachTrigger(trigger: HTMLElement): void;
  detachTrigger(trigger: HTMLElement): void;
  attachPanel(panel: HTMLElement): void;
  detachPanel(panel: HTMLElement): void;
  getTriggerElement(): HTMLElement | null;
  getPanelElement(): HTMLElement | null;
}

export const collapsibleRootContext = createContext<CollapsibleRootContext>('collapsible-root');
