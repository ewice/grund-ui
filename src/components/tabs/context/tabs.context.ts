import { createContext } from '@lit/context';
import type { TabsRegistry } from '../registry/tabs.registry.js';

/**
 * Context provided by `<grund-tabs>` and consumed by all descendant tab elements.
 * @internal
 */
export interface TabsRootContext {
  activeValue: string | null;
  activationDirection: 'start' | 'end' | 'none';
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;

  /** Caller passes `this`; root reads tab.value before forwarding to registry. */
  registerTab: (tab: HTMLElement) => void;
  unregisterTab: (value: string) => void;
  /** Caller passes `this`; root reads panel.value before forwarding to registry. */
  registerPanel: (panel: HTMLElement) => void;
  unregisterPanel: (value: string) => void;
  activateTab: (value: string) => void;
  getRegistry: () => TabsRegistry;
}

export const tabsRootContext = createContext<TabsRootContext>('tabs-root');
