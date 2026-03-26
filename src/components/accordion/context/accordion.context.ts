import { createContext } from '@lit/context';

export interface AccordionRootContext {
  isExpanded: (value: string) => boolean;
  isEffectivelyDisabled: (itemDisabled: boolean) => boolean;
  orientation: 'vertical' | 'horizontal';
  keepMounted: boolean;
  hiddenUntilFound: boolean;
  requestToggle: (itemValue: string, itemDisabled: boolean) => void;
  registerItem: (item: HTMLElement, value: string) => void;
  unregisterItem: (item: HTMLElement) => void;
  indexOf: (item: HTMLElement) => number;
  attachTrigger: (item: HTMLElement, trigger: HTMLElement) => void;
  detachTrigger: (item: HTMLElement) => void;
  attachPanel: (item: HTMLElement, panel: HTMLElement) => void;
  detachPanel: (item: HTMLElement) => void;
}

export interface AccordionItemContext {
  value: string;
  index: number;
  expanded: boolean;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  keepMounted: boolean;
  hiddenUntilFound: boolean;
  triggerId: string;
  panelId: string;
  toggle: () => void;
  attachTrigger: (el: HTMLElement) => void;
  detachTrigger: (el: HTMLElement) => void;
  attachPanel: (el: HTMLElement) => void;
  detachPanel: (el: HTMLElement) => void;
}

export const accordionRootContext =
  createContext<AccordionRootContext>('accordion-root');

export const accordionItemContext =
  createContext<AccordionItemContext>('accordion-item');
