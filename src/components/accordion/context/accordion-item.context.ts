import { createContext } from '@lit/context';
import type { GrundAccordionPanel } from '../panel/accordion-panel';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import type { GrundAccordionOrientation } from '../types';

/** Per-item state provided by `<grund-accordion-item>` to its trigger and panel children. */
export interface AccordionItemContextValue {
  /** The unique value identifying this item within the accordion. */
  value: string;
  /** The current DOM index of this item within the accordion. */
  index: number;
  /** Whether this item is disabled (either directly or via parent accordion). */
  disabled: boolean;
  /** Whether this item is currently expanded. */
  expanded: boolean;
  /** The accordion orientation inherited from the root. */
  orientation: GrundAccordionOrientation;
  /** Whether closed panels stay mounted in the DOM. */
  keepMounted: boolean;
  /** Whether closed panels use `hidden="until-found"` for page search. */
  hiddenUntilFound: boolean;
  /** Requests that this item be opened. */
  open: () => void;
  /** Registers a trigger element with this item. */
  registerTrigger: (trigger: GrundAccordionTrigger) => void;
  /** Unregisters the trigger element from this item. */
  unregisterTrigger: () => void;
  /** Registers a panel element with this item. */
  registerPanel: (panel: GrundAccordionPanel) => void;
  /** Unregisters the panel element from this item. */
  unregisterPanel: () => void;
  /** The currently registered trigger element, if any. */
  registeredTrigger: GrundAccordionTrigger | null;
  /** The currently registered panel element, if any. */
  registeredPanel: GrundAccordionPanel | null;
}

/** @internal */
export const accordionItemContext =
  createContext<AccordionItemContextValue>('grund-accordion-item');
