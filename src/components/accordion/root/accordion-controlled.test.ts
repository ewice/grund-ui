import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils.js';

import '../../../components/accordion/root/accordion.js';
import '../../../components/accordion/item/accordion.js';
import '../../../components/accordion/header/accordion.js';
import '../../../components/accordion/trigger/accordion.js';
import '../../../components/accordion/panel/accordion.js';

import type { GrundAccordion } from './accordion.js';

function getTriggerButton(el: GrundAccordion, index: number): HTMLButtonElement {
  const triggers = Array.from(el.querySelectorAll('grund-accordion-trigger'));
  return getByPart<HTMLButtonElement>(triggers[index], 'trigger');
}

describe('Accordion Controlled Mode', () => {
  it('does not update internal state in controlled mode', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion .value=${[]}>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    getTriggerButton(el, 0).click();
    await flush(el);

    // Should NOT be open — controlled mode requires consumer to set value
    const item = el.querySelector('grund-accordion-item')!;
    expect(item.hasAttribute('data-open')).to.be.false;
  });

  it('opens when consumer updates value', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion .value=${[]}>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    el.value = ['a'];
    await flush(el);

    const item = el.querySelector('grund-accordion-item')!;
    expect(item.hasAttribute('data-open')).to.be.true;
  });
});

describe('Accordion Multiple Mode', () => {
  it('allows multiple items open', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion multiple .defaultValue=${['a']}>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>A</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="b">
          <grund-accordion-header><grund-accordion-trigger>B</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>B</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    getTriggerButton(el, 1).click();
    await flush(el);

    const items = el.querySelectorAll('grund-accordion-item');
    expect(items[0].hasAttribute('data-open')).to.be.true;
    expect(items[1].hasAttribute('data-open')).to.be.true;
  });
});
