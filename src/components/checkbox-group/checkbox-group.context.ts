import { createContext } from '@lit/context';

export interface CheckboxGroupContext {
  /** Whether a given value is currently checked. */
  readonly isChecked: (value: string) => boolean;
  /** Parent checkbox state derived from checked values vs allValues. */
  readonly getParentState: () => 'checked' | 'unchecked' | 'indeterminate';
  /** Request a toggle from the group. Group decides engine method based on parent flag. */
  readonly requestToggle: (value: string, parent: boolean) => void;
  /** Whether the group is disabled. */
  readonly disabled: boolean;
}

export const checkboxGroupContext =
  createContext<CheckboxGroupContext>('checkbox-group');
