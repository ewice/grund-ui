import { createContext } from '@lit/context';

export interface SwitchContext {
  /** Whether the switch is currently active. False when neither checked nor defaultChecked. */
  readonly checked: boolean;
  /** Whether the switch or an ancestor is disabled. */
  readonly disabled: boolean;
  /** Whether the switch is read-only (prevents toggling but still submits). */
  readonly readOnly: boolean;
  /** Whether the switch is required for form validation. */
  readonly required: boolean;
}

export const switchContext = createContext<SwitchContext>('switch');
