import { createContext } from '@lit/context';

/**
 * Read-only state projected from `<grund-checkbox>` to `<grund-checkbox-indicator>`.
 *
 * @internal
 */
export interface CheckboxContext {
  readonly checked: boolean;
  readonly indeterminate: boolean;
}

/**
 * Carries checkbox state to the indicator element.
 *
 * @internal
 */
export const checkboxContext = createContext<CheckboxContext>('grund-checkbox');
