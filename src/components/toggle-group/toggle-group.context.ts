import { createContext } from '@lit/context';

import type { GrundToggle } from '../toggle/toggle.js';

export interface ToggleGroupRootContext {
  isPressed: (value: string) => boolean;
  requestToggle: (value: string, itemDisabled: boolean) => boolean | null;
  registerToggle: (toggle: GrundToggle, value: string) => void;
  unregisterToggle: (toggle: GrundToggle) => void;
}

export const toggleGroupRootContext =
  createContext<ToggleGroupRootContext>('toggle-group-root');
