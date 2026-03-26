import { createContext } from '@lit/context';

export interface ToggleGroupRootContext {
  isDisabled: (itemDisabled: boolean) => boolean;
  isPressed: (value: string) => boolean;
  requestToggle: (value: string, itemDisabled: boolean) => boolean | null;
  registerToggle: (toggle: HTMLElement, value: string) => void;
  unregisterToggle: (toggle: HTMLElement) => void;
}

export const toggleGroupRootContext =
  createContext<ToggleGroupRootContext>('toggle-group-root');
