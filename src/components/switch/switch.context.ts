import { createContext } from '@lit/context';

export interface SwitchContext {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
}

export const switchContext = createContext<SwitchContext>('switch');
