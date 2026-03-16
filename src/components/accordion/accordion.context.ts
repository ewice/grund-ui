import { createContext } from '@lit/context';


/** State and actions provided by `<grund-accordion>` to all descendant elements. */
export interface AccordionContextValue {
  /** Whether one or multiple items can be open at a time. */
  type: 'single' | 'multiple';
  /** The visual orientation used for roving focus. */
  orientation: 'vertical' | 'horizontal';
  /** Whether roving focus wraps around the list boundaries. */
  loopFocus: boolean;
  /** Whether all items in the accordion are disabled. */
  disabled: boolean;
  /** Whether the open item can be collapsed by clicking it again (single mode only). */
  collapsible: boolean;
  /** Whether closed panels stay mounted in the DOM. */
  keepMounted: boolean;
  /** Whether closed panels use `hidden="until-found"` for page search. */
  hiddenUntilFound: boolean;
  /** The set of currently expanded item values. */
  expandedItems: ReadonlySet<string>;
  /** Toggles the expanded state of the item with the given value. */
  toggle: (value: string) => void;
  /** Opens the item with the given value if it is currently closed. */
  openItem: (value: string) => void;
  /** Registers an item element with the accordion. */
  registerItem: (item: Element) => void;
  /** Unregisters an item element from the accordion. */
  unregisterItem: (item: Element) => void;
  /** Returns the current DOM index of an item. */
  getItemIndex: (item: Element) => number;
}


/** @internal */
export const accordionContext = createContext<AccordionContextValue>('grund-accordion');


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
  orientation: 'vertical' | 'horizontal';
  /** Whether closed panels stay mounted in the DOM. */
  keepMounted: boolean;
  /** Whether closed panels use `hidden="until-found"` for page search. */
  hiddenUntilFound: boolean;
  /** Requests that this item be opened. */
  open: () => void;
  /** Registers a trigger element with this item. */
  registerTrigger: (trigger: Element) => void;
  /** Unregisters the trigger element from this item. */
  unregisterTrigger: () => void;
  /** Registers a panel element with this item. */
  registerPanel: (panel: Element) => void;
  /** Unregisters the panel element from this item. */
  unregisterPanel: () => void;
  /** The currently registered trigger element, if any. */
  registeredTrigger: Element | null;
  /** The currently registered panel element, if any. */
  registeredPanel: Element | null;
}


/** @internal */
export const accordionItemContext =
  createContext<AccordionItemContextValue>('grund-accordion-item');
