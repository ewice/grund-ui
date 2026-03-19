import { createContext } from '@lit/context';
import type {
  GrundAccordionItemLike,
  GrundAccordionItemSnapshot,
  GrundAccordionOrientation,
} from '../types';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import type { GrundAccordionPanel } from '../panel/accordion-panel';

export interface AccordionContextValue {
  orientation: GrundAccordionOrientation;
  loopFocus: boolean;
  disabled: boolean;
  keepMounted: boolean;
  hiddenUntilFound: boolean;
  expandedItems: ReadonlySet<string>;
  requestToggle: (value: string) => void;
  requestOpen: (value: string) => void;
  renameExpandedValue: (previousValue: string, nextValue: string) => void;
  registerItem: (item: GrundAccordionItemLike) => void;
  unregisterItem: (item: GrundAccordionItemLike) => void;
  attachTrigger: (item: GrundAccordionItemLike, trigger: GrundAccordionTrigger | null) => void;
  detachTrigger: (item: GrundAccordionItemLike) => void;
  attachPanel: (item: GrundAccordionItemLike, panel: GrundAccordionPanel | null) => void;
  detachPanel: (item: GrundAccordionItemLike) => void;
  getItemState: (item: GrundAccordionItemLike) => GrundAccordionItemSnapshot | undefined;
  getItemIndex: (item: GrundAccordionItemLike) => number;
  toggle: (value: string) => void;
  openItem: (value: string) => void;
}

/** @internal */
export const accordionContext = createContext<AccordionContextValue>('grund-accordion');
