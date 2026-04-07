import { createContext } from '@lit/context';

/**
 * Context provided by `grund-checkbox-group` to child `grund-checkbox` elements.
 * @internal
 */
export interface CheckboxGroupContext {
  /** Whether a given value is currently checked. */
  readonly isChecked: (value: string) => boolean;
  /** Parent checkbox state derived from checked values vs allValues. */
  readonly getParentState: () => 'checked' | 'unchecked' | 'indeterminate';
  /** Request a toggle from the group. Group decides engine method based on parent flag. */
  readonly requestToggle: (value: string, parent: boolean) => void;
}

export const checkboxGroupContext = createContext<CheckboxGroupContext>('checkbox-group');
