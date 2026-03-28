import { createContext } from '@lit/context';

export interface CheckboxContext {
  checked: boolean;
  indeterminate: boolean;
}

/**
 * Carries checkbox state to the indicator element.
 *
 * @internal
 */
export const checkboxContext = createContext<CheckboxContext>('grund-checkbox');
