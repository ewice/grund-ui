import { createContext } from '@lit/context';

export interface TabsRootContext {
  activeValue: string | null;
  activationDirection: 'start' | 'end' | 'none';
  orientation: 'horizontal' | 'vertical';
  registerTab(value: string, tab: HTMLElement): void;
  unregisterTab(value: string): void;
  registerPanel(value: string, panel: HTMLElement): void;
  unregisterPanel(value: string): void;
  setDisabled(value: string, disabled: boolean): void;
  requestActivation(value: string): void;
  getTabElement(value: string): HTMLElement | null;
  getPanelElement(value: string): HTMLElement | null;
  indexOf(value: string): number;
}

export const tabsRootContext = createContext<TabsRootContext>('tabs-root');
