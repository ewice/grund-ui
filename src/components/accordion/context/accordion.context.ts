import { createContext } from '@lit/context';
import type {
  GrundAccordionItemLike,
  GrundAccordionItemSnapshot,
  GrundAccordionOrientation,
} from '../types';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import type { GrundAccordionPanel } from '../panel/accordion-panel';

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
  /** The set of currently expanded item values. */
  expandedItems: ReadonlySet<string>;
  /** Requests that the item with the given value toggles its expanded state. */
  requestToggle: (value: string) => void;
  /** Requests that the item with the given value opens. */
  requestOpen: (value: string) => void;
  /** Registers an item element with the accordion. */
  registerItem: (item: GrundAccordionItemLike) => void;
  /** Unregisters an item element from the accordion. */
  unregisterItem: (item: GrundAccordionItemLike) => void;
  /** Updates the expanded set when an item changes value at runtime. */
  renameExpandedValue: (previousValue: string, nextValue: string) => void;
  /** Attaches the trigger element for an item. */
  attachTrigger: (item: GrundAccordionItemLike, trigger: GrundAccordionTrigger | null) => void;
  /** Detaches the trigger element for an item. */
  detachTrigger: (item: GrundAccordionItemLike) => void;
  /** Attaches the panel element for an item. */
  attachPanel: (item: GrundAccordionItemLike, panel: GrundAccordionPanel | null) => void;
  /** Detaches the panel element for an item. */
  detachPanel: (item: GrundAccordionItemLike) => void;
  /** Returns a readonly snapshot of derived item state. */
  getItemState: (item: GrundAccordionItemLike) => GrundAccordionItemSnapshot | undefined;
  /** Returns the current DOM index of an item. */
  getItemIndex: (item: GrundAccordionItemLike) => number;
  /** Backward-compatible toggle alias used by current descendants. */
  toggle: (value: string) => void;
  /** Backward-compatible open alias used by current descendants. */
  openItem: (value: string) => void;
}

/** @internal */
export const accordionContext = createContext<AccordionContextValue>('grund-accordion');
