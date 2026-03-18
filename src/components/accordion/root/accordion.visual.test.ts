import { describe, it, expect } from 'vitest';
import { fixture } from '@open-wc/testing-helpers/pure';
import { html } from 'lit';
import { page } from 'vitest/browser';
import '../index.js';
import type { GrundAccordion } from '../root/accordion';
import { flush } from '../../../test-utils';

/**
 * Visual regression tests for structural rendering.
 *
 * These tests verify that key states produce consistent DOM output across
 * builds — not aesthetics (Grund UI is headless), but visibility and layout.
 *
 * Update baselines intentionally: `vitest --update`
 */

async function createVisualAccordion() {
  const el = await fixture<GrundAccordion>(html`
    <grund-accordion style="font-family: monospace; width: 300px;">
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>Item 1</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content 1</grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2">
        <grund-accordion-header>
          <grund-accordion-trigger>Item 2</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content 2</grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-3" disabled>
        <grund-accordion-header>
          <grund-accordion-trigger>Item 3 (disabled)</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content 3</grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `);
  await flush(el);
  return el;
}

describe('grund-accordion visual', () => {
  it('all items collapsed', async () => {
    const el = await createVisualAccordion();
    await expect(page.elementLocator(el)).toMatchScreenshot('accordion-all-collapsed');
  });

  it('first item expanded', async () => {
    const el = await createVisualAccordion();
    el.querySelectorAll('grund-accordion-trigger')[0]?.shadowRoot?.querySelector('button')?.click();
    await flush(el);
    await expect(page.elementLocator(el)).toMatchScreenshot('accordion-first-expanded');
  });

  it('disabled item appearance', async () => {
    const el = await createVisualAccordion();
    const disabledItem = el.querySelector('grund-accordion-item[disabled]')!;
    await expect(page.elementLocator(disabledItem)).toMatchScreenshot('accordion-disabled-item');
  });

  it('multiple mode — two items expanded', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion multiple style="font-family: monospace; width: 300px;">
        <grund-accordion-item value="item-1">
          <grund-accordion-header>
            <grund-accordion-trigger>Item 1</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content 1</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="item-2">
          <grund-accordion-header>
            <grund-accordion-trigger>Item 2</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content 2</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    const triggers = el.querySelectorAll('grund-accordion-trigger');
    triggers[0]?.shadowRoot?.querySelector('button')?.click();
    await flush(el);
    triggers[1]?.shadowRoot?.querySelector('button')?.click();
    await flush(el);

    await expect(page.elementLocator(el)).toMatchScreenshot('accordion-multiple-expanded');
  });
});
