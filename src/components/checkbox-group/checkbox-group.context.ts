import { createContext } from '@lit/context';
import type { CheckboxGroupRegistration } from './types';

export interface CheckboxGroupContext {
  readonly isChecked: (value: string) => boolean;
  readonly getParentState: () => 'checked' | 'unchecked' | 'indeterminate';
  readonly requestToggle: (value: string, parent: boolean) => void;
  readonly registerItem: (element: HTMLElement, record: CheckboxGroupRegistration) => void;
  readonly unregisterItem: (element: HTMLElement) => void;
}

export const checkboxGroupContext = createContext<CheckboxGroupContext>('checkbox-group');
