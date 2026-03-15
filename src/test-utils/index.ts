import { elementUpdated } from '@open-wc/testing-helpers/pure';

/**
 * Flushes Lit's async update queue and allows microtasks to settle.
 * Use after triggering state changes (clicks, property mutations) to
 * ensure Lit re-renders and context propagates before asserting.
 *
 * @param el - The root element to wait on. Child elements are also awaited.
 */
export async function flush(el: Element): Promise<void> {
  await elementUpdated(el);
  const children = el.querySelectorAll(
    'grund-accordion-item, grund-accordion-trigger, grund-accordion-panel',
  );
  for (const child of children) {
    await elementUpdated(child);
  }
  await new Promise<void>((r) => setTimeout(r, 0));
}
