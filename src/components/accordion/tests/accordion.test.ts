import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/test-utils.js';
import '../accordion.js';
import '../accordion-item.js';

import type { GrundAccordion } from '../accordion.js';

describe('GrundAccordion + GrundAccordionItem', () => {
  async function setup(
    template = html`
      <grund-accordion>
        <grund-accordion-item value="a"></grund-accordion-item>
        <grund-accordion-item value="b"></grund-accordion-item>
      </grund-accordion>
    `,
  ) {
    const el = await fixture<GrundAccordion>(template);
    await flush(el);
    return el;
  }

  it('renders with default properties', async () => {
    const el = await setup();
    expect(el.multiple).to.be.false;
    expect(el.disabled).to.be.false;
    expect(el.orientation).to.equal('vertical');
  });

  it('items get data-index attributes', async () => {
    const el = await setup();
    const items = el.querySelectorAll('grund-accordion-item');
    expect(items[0].dataset.index).to.equal('0');
    expect(items[1].dataset.index).to.equal('1');
  });

  it('items reflect data-open when expanded via defaultValue', async () => {
    const el = await setup(html`
      <grund-accordion .defaultValue=${['a']}>
        <grund-accordion-item value="a"></grund-accordion-item>
        <grund-accordion-item value="b"></grund-accordion-item>
      </grund-accordion>
    `);
    const items = el.querySelectorAll('grund-accordion-item');
    expect(items[0].hasAttribute('data-open')).to.be.true;
    expect(items[1].hasAttribute('data-open')).to.be.false;
  });

  it('items reflect data-disabled when root is disabled', async () => {
    const el = await setup(html`
      <grund-accordion disabled>
        <grund-accordion-item value="a"></grund-accordion-item>
      </grund-accordion>
    `);
    const items = el.querySelectorAll('grund-accordion-item');
    expect(items[0].hasAttribute('data-disabled')).to.be.true;
  });
});
