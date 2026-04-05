import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, simulateKeyboard, getByPart } from '../../../test-utils/test-utils.js';

import '../root/accordion.js';
import '../item/accordion.js';
import '../header/accordion.js';
import '../trigger/accordion.js';
import '../panel/accordion.js';

import type { GrundAccordion } from '../root/accordion.js';

function getTriggerButtons(el: GrundAccordion): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll('grund-accordion-trigger')).map(
    (t) => getByPart<HTMLButtonElement>(t, 'trigger'),
  );
}

describe('Accordion Keyboard Navigation', () => {
  async function setup() {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a">
          <grund-accordion-header>
            <grund-accordion-trigger>A</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content A</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="b">
          <grund-accordion-header>
            <grund-accordion-trigger>B</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content B</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="c">
          <grund-accordion-header>
            <grund-accordion-trigger>C</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content C</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    return el;
  }

  /**
   * Returns the focused button inside the active shadow root, or document.activeElement
   * itself if it is already a button. Needed because focusing a button inside a shadow root
   * makes document.activeElement point to the shadow host, not the inner button.
   */
  function getActiveShadowButton(): Element | null {
    const host = document.activeElement;
    if (!host) return null;
    return host.shadowRoot?.activeElement ?? host;
  }

  it('ArrowDown moves focus to next trigger', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[0].focus();
    // Dispatch on the focused button so composedPath()[0] is the button,
    // allowing RovingFocusController to identify the current item correctly.
    simulateKeyboard(buttons[0], 'ArrowDown');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('ArrowUp moves focus to previous trigger', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowUp');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('Home moves focus to first trigger', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'Home');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('End moves focus to last trigger', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'End');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });

  it('loops from last to first (loop-focus default true)', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'ArrowDown');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('skips disabled items', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>A</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="b" disabled>
          <grund-accordion-header><grund-accordion-trigger>B</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>B</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="c">
          <grund-accordion-header><grund-accordion-trigger>C</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>C</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const buttons = getTriggerButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowDown');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });
});
