# Test Patterns

Shared test utilities and recipes. Loaded by the implementation plan and the stories plan step.
All test files use Vitest + `@open-wc/testing-helpers` + Playwright browser mode.

---

## Shared Test Utilities

These utilities live in `src/test-utils/test-utils.ts`. Add new utilities here as patterns emerge.

### `flush(el)`

Settles async context propagation. Context updates require multiple Lit render cycles.
Call after any state change that should propagate through `@provide`/`@consume`.

```ts
import { flush } from '../../test-utils/test-utils.js';

await flush(el); // settles 3 render passes + microtask
```

### `simulateKeyboard(el, key, options?)`

**Add to `src/test-utils/test-utils.ts` when first needed.** Dispatches a `KeyboardEvent` on `el` with correct `key`, `code`, and `bubbles: true`.

```ts
import { simulateKeyboard } from '../../test-utils/test-utils.js';

simulateKeyboard(trigger, 'ArrowDown');
simulateKeyboard(trigger, 'Enter', { shiftKey: true });
```

### `getByPart(el, partName)`

**Add to `src/test-utils/test-utils.ts` when first needed.** Queries the shadow root of `el` for an element with a matching `part` attribute.

```ts
const btn = getByPart(trigger, 'trigger'); // → HTMLButtonElement
```

### `expectAriaRelationship(source, target, type)`

**Add to `src/test-utils/test-utils.ts` when first needed.** Asserts that `source` has the correct ARIA attribute linking it to `target`.

```ts
expectAriaRelationship(trigger, panel, 'controls');
// asserts: trigger.getAttribute('aria-controls') === panel.id
```

---

## Recipes

### Standard Test File Structure

```ts
import { fixture, html, expect } from '@open-wc/testing';
import { flush } from '../../test-utils/test-utils.js';

describe('GrundAccordion', () => {
  describe('initial state', () => {
    it('renders all items collapsed by default', async () => {
      const el = await fixture(html`
        <grund-accordion>
          <grund-accordion-item value="a">...</grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);
      // assertions
    });
  });
});
```

### Cross-Browser Configuration

In `vitest.config.ts`, the `components` project uses Playwright. To run cross-browser:

```bash
# Default (Chromium only)
npm run test:run

# Cross-browser (Chromium + Firefox + WebKit)
npm run test:run -- --project=components-firefox --project=components-webkit
```

Add `firefox` and `webkit` browser projects to `vitest.config.ts` when cross-browser testing is required.

### RTL Test Recipe

```ts
it('reverses arrow key navigation in RTL', async () => {
  const el = await fixture(html`
    <div dir="rtl">
      <grund-toolbar>...</grund-toolbar>
    </div>
  `);
  await flush(el);
  const firstButton = getByPart(el.querySelector('grund-toolbar'), 'button');
  firstButton.focus();
  simulateKeyboard(firstButton, 'ArrowLeft'); // In RTL, ArrowLeft = next item
  await flush(el);
  // assert next item is focused
});
```

### Define-Order Test

Verifies components work regardless of custom element registration order.

```ts
it('works when child elements are defined before parent', async () => {
  // Re-define in reverse order in a separate test file or describe block
  // Note: customElements.define() cannot be undone in the same test runner —
  // test this in a separate browser context (separate Playwright page).
});
```

### Mount/Unmount Memory Test

```ts
it('cleans up event listeners on disconnect', async () => {
  const el = await fixture(html`<grund-accordion>...</grund-accordion>`);
  await flush(el);

  const addSpy = vi.spyOn(EventTarget.prototype, 'addEventListener');
  const removeSpy = vi.spyOn(EventTarget.prototype, 'removeEventListener');

  el.remove(); // triggers disconnectedCallback

  // Verify every add has a corresponding remove
  // Count by event type to verify symmetry
});
```

### axe-core Recipe

```ts
import { fixture, html, expect } from '@open-wc/testing';
// @axe-core/playwright is run via vitest browser mode
// Use the Storybook a11y addon for component-level axe runs during development.
// For CI: add an axe check to /validate-build step.
```

### Event Ordering Verification

```ts
it('fires grund-change before grund-value-change', async () => {
  const el = await fixture(html`<grund-accordion>...</grund-accordion>`);
  await flush(el);

  const events: string[] = [];
  el.addEventListener('grund-change', () => events.push('grund-change'));
  el.addEventListener('grund-value-change', () => events.push('grund-value-change'));

  getTriggerButton(el, 0).click();
  await flush(el);

  expect(events).toEqual(['grund-change', 'grund-value-change']);
});
```

### Reparenting Stress Test

```ts
it('resubscribes to context after reparenting', async () => {
  const parent1 = await fixture(html`
    <grund-accordion>
      <grund-accordion-item value="a"><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-item>
    </grund-accordion>
  `);
  const parent2 = await fixture(html`<grund-accordion></grund-accordion>`);
  await flush(parent1);

  const item = parent1.querySelector('grund-accordion-item')!;
  parent2.appendChild(item); // reparent
  await flush(parent2);

  // item should now be registered with parent2's context
});
```

### Storybook `play` Function Pattern

```ts
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstTrigger = canvas.getByRole('button', { name: /first item/i });
    await userEvent.click(firstTrigger);
    await userEvent.keyboard('{ArrowDown}');
    // assert second trigger is focused
  },
};
```
