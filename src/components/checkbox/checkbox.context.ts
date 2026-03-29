import { createContext } from '@lit/context';

export interface CheckboxContext {
  /** Effective checked state (false when indeterminate). */
  readonly checked: boolean;
  /** Whether the checkbox is in the indeterminate state. */
  readonly indeterminate: boolean;
}

export const checkboxContext = createContext<CheckboxContext>('checkbox');
