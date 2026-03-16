import { elementUpdated } from '@open-wc/testing-helpers/pure';


/**
 * Flushes Lit's async update queue and allows microtasks to settle.
 * Use after triggering state changes to ensure Lit re-renders and context
 * propagates before asserting.
 *
 * @param el - The root element to wait on
 */
export async function flush(el: Element): Promise<void> {
  const selector =
    'grund-accordion-item, grund-accordion-trigger, grund-accordion-panel, grund-accordion-header';

  // Three passes: each pass advances one level of async context propagation.
  // Context chains in this library require up to three render cycles to settle:
  //   1. Root renders → provides context to items
  //   2. Items receive context → register trigger/panel → provide item context
  //   3. Triggers/panels receive item context → AriaLinkController hostUpdated fires
  for (let pass = 0; pass < 3; pass++) {
    await elementUpdated(el);
    const children = el.querySelectorAll(selector);
    for (const child of children) {
      await elementUpdated(child);
    }
    await new Promise<void>((r) => setTimeout(r, 0));
  }
}
