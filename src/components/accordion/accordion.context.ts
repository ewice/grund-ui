import { createContext } from '@lit/context';
import type {
  GrundAccordionItemLike,
  GrundAccordionItemSnapshot,
  GrundAccordionOrientation,
} from './types';


/** State and actions provided by `<grund-accordion>` to all descendant elements. */
export interface AccordionContextValue {
  /** The visual orientation used for roving focus. */
  orientation: GrundAccordionOrientation;
  /** Whether roving focus wraps around the list boundaries. */
  loopFocus: boolean;
  /** Whether all items in the accordion are disabled. */
  disabled: boolean;
  /** Whether closed panels stay mounted in the DOM. */
  keepMounted: boolean;
  /** Whether closed panels use `hidden="until-found"` for page search. */
  hiddenUntilFound: boolean;
  /** Requests that the item with the given value toggles its expanded state. */
  requestToggle: (value: string) => void;
  /** Requests that the item with the given value opens. */
  requestOpen: (value: string) => void;
  /** Registers an item element with the accordion. */
  registerItem: (item: GrundAccordionItemLike) => void;
  /** Unregisters an item element from the accordion. */
  unregisterItem: (item: GrundAccordionItemLike) => void;
  /** Attaches the trigger element for an item. */
  attachTrigger: (item: GrundAccordionItemLike, trigger: Element | null) => void;
  /** Detaches the trigger element for an item. */
  detachTrigger: (item: GrundAccordionItemLike) => void;
  /** Attaches the panel element for an item. */
  attachPanel: (item: GrundAccordionItemLike, panel: Element | null) => void;
  /** Detaches the panel element for an item. */
  detachPanel: (item: GrundAccordionItemLike) => void;
  /** Returns a readonly snapshot of derived item state. */
  getItemState: (item: GrundAccordionItemLike) => GrundAccordionItemSnapshot | undefined;
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
  orientation: GrundAccordionOrientation;
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
