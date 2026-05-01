import { createContext } from '@lit/context';

import type { CollapsibleOpenChangeReason } from './types';

export interface CollapsibleRootContext {
  open: boolean;
  disabled: boolean;
  requestToggle(reason: CollapsibleOpenChangeReason): void;
  requestOpen(reason: CollapsibleOpenChangeReason): void;
  requestClose(reason: CollapsibleOpenChangeReason): void;
  attachTrigger(trigger: HTMLElement): void;
  detachTrigger(trigger: HTMLElement): void;
  attachPanel(panel: HTMLElement): void;
  detachPanel(panel: HTMLElement): void;
  triggerElement: HTMLElement | null;
  panelElement: HTMLElement | null;
}

export const collapsibleRootContext = createContext<CollapsibleRootContext>('collapsible-root');
