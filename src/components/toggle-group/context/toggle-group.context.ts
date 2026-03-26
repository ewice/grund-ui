import { createContext } from '@lit/context';

export interface ToggleGroupRootContext {
  isPressed: (value: string) => boolean;
  isEffectivelyDisabled: (toggleDisabled: boolean) => boolean;
  /** Returns the resolved new pressed state for the calling toggle, or null if blocked. */
  requestToggle: (value: string, toggleDisabled: boolean) => boolean | null;
  registerToggle: (toggle: HTMLElement, value: string) => void;
  unregisterToggle: (toggle: HTMLElement) => void;
}

export const toggleGroupRootContext =
  createContext<ToggleGroupRootContext>('toggle-group-root');
