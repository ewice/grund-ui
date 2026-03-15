import { createContext } from '@lit/context';

/** State and actions provided by `<grund-accordion>` to all descendant elements. */
export interface AccordionContextValue {
  /** Whether one or multiple items can be open at a time. */
  type: 'single' | 'multiple';
  /** Whether all items in the accordion are disabled. */
  disabled: boolean;
  /** Whether the open item can be collapsed by clicking it again (single mode only). */
  collapsible: boolean;
  /** The set of currently expanded item values. */
  expandedItems: Set<string>;
  /** Toggles the expanded state of the item with the given value. */
  toggle: (value: string) => void;
}

/** @internal */
export const accordionContext = createContext<AccordionContextValue>('grund-accordion');

/** Per-item state provided by `<grund-accordion-item>` to its trigger and panel children. */
export interface AccordionItemContextValue {
  /** The unique value identifying this item within the accordion. */
  value: string;
  /** Whether this item is disabled (either directly or via parent accordion). */
  disabled: boolean;
  /** Whether this item is currently expanded. */
  expanded: boolean;
  /** DOM ID for the trigger button — used by the panel's `aria-labelledby`. */
  triggerId: string;
  /** DOM ID for the panel region — used by the trigger's `aria-controls`. */
  panelId: string;
}

/** @internal */
export const accordionItemContext =
  createContext<AccordionItemContextValue>('grund-accordion-item');
