import { aTimeout } from '@open-wc/testing';
import { expect } from '@open-wc/testing';

/**
 * Settles async context propagation across multiple Lit render cycles.
 * Call after any state change that should propagate through @provide/@consume.
 */
export async function flush(el: Element): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await (el as any).updateComplete;
    await aTimeout(0);
  }
}

/**
 * Dispatches a KeyboardEvent on an element.
 */
export function simulateKeyboard(
  el: Element,
  key: string,
  options?: Partial<KeyboardEventInit>,
): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      code: key,
      bubbles: true,
      composed: true,
      cancelable: true,
      ...options,
    }),
  );
}

/**
 * Queries the shadow root of an element for a matching CSS part.
 */
export function getByPart<T extends Element = HTMLElement>(
  el: Element,
  partName: string,
): T {
  const result = el.shadowRoot?.querySelector(`[part="${partName}"]`);
  if (!result) {
    throw new Error(`No element with part="${partName}" found in ${el.tagName}`);
  }
  return result as T;
}

/**
 * Asserts an ARIA relationship between two elements.
 */
export function expectAriaRelationship(
  source: Element,
  target: Element,
  type: 'controls' | 'labelledby',
): void {
  const attr = type === 'controls' ? 'aria-controls' : 'aria-labelledby';
  expect(source.getAttribute(attr)).to.equal(target.id);
}
