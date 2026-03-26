import { createContext } from '@lit/context';

/**
 * Whether the current subtree is disabled.
 *
 * Any element with a `disabled` property that is also a context provider
 * should consume this context from its ancestor, compose
 * `ancestorDisabled || this.disabled`, and re-provide the result.
 * Leaf elements consume the boolean directly.
 *
 * @internal
 */
export const disabledContext = createContext<boolean>('grund-disabled');
