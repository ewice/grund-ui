import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/index.js';

import '../root/accordion.element.js';
import '../item/accordion-item.element.js';
import '../header/accordion-header.element.js';
import '../trigger/accordion-trigger.element.js';
import '../panel/accordion-panel.element.js';

import type { GrundAccordion } from '../root/accordion.element.js';

function getAccordionParts(el: GrundAccordion) {
  const items = Array.from(el.querySelectorAll('grund-accordion-item'));
  return items.map((item) => {
    const trigger = item.querySelector('grund-accordion-trigger')!;
    const panel = item.querySelector('grund-accordion-panel')!;
    const triggerBtn = getByPart<HTMLButtonElement>(trigger, 'trigger');
    return { item, trigger, panel, triggerBtn };
  });
}

describe('Full Accordion Integration', () => {
  async function setup(template = html`
    <grund-accordion>
      <grund-accordion-item value="a">
        <grund-accordion-header>
          <grund-accordion-trigger>Section A</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content A</grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="b">
        <grund-accordion-header>
          <grund-accordion-trigger>Section B</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content B</grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `) {
    const el = await fixture<GrundAccordion>(template);
    await flush(el);
    return el;
  }

  it('renders trigger buttons', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    expect(parts[0].triggerBtn).to.exist;
    expect(parts[0].trigger.textContent?.trim()).to.equal('Section A');
  });

  it('trigger has correct ARIA attributes when closed', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    expect(parts[0].triggerBtn.getAttribute('aria-expanded')).to.equal('false');
    expect(parts[0].triggerBtn.getAttribute('aria-controls')).to.equal('grund-accordion-panel-a');
  });

  it('clicking trigger opens the panel', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    parts[0].triggerBtn.click();
    await flush(el);

    expect(parts[0].triggerBtn.getAttribute('aria-expanded')).to.equal('true');
    expect(parts[0].item.hasAttribute('data-open')).to.be.true;
  });

  it('panel has role="region" and aria-labelledby', async () => {
    const el = await setup(html`
      <grund-accordion .defaultValue=${['a']}>
        <grund-accordion-item value="a">
          <grund-accordion-header>
            <grund-accordion-trigger>A</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = getByPart(panel, 'panel');
    expect(panelDiv.getAttribute('role')).to.equal('region');
    expect(panelDiv.getAttribute('aria-labelledby')).to.equal('grund-accordion-trigger-a');
  });

  it('panel is not rendered when closed (default)', async () => {
    const el = await setup();
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
    expect(panelDiv).to.be.null;
  });

  it('single mode closes other items', async () => {
    const el = await setup(html`
      <grund-accordion .defaultValue=${['a']}>
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
      </grund-accordion>
    `);
    const parts = getAccordionParts(el);
    // Open B
    parts[1].triggerBtn.click();
    await flush(el);

    expect(parts[0].item.hasAttribute('data-open')).to.be.false;
    expect(parts[1].item.hasAttribute('data-open')).to.be.true;
  });

  it('fires grund-value-change event', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    const events: any[] = [];
    el.addEventListener('grund-value-change', (e: Event) => {
      events.push((e as CustomEvent).detail);
    });

    parts[0].triggerBtn.click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].itemValue).to.equal('a');
    expect(events[0].open).to.be.true;
    expect(events[0].value).to.deep.equal(['a']);
  });

  it('fires grund-open-change event on item', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    const events: any[] = [];
    parts[0].item.addEventListener('grund-open-change', (e: Event) => {
      events.push((e as CustomEvent).detail);
    });

    parts[0].triggerBtn.click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].open).to.be.true;
    expect(events[0].value).to.equal('a');
  });

  it('header sets role="heading" and aria-level', async () => {
    const el = await setup();
    const header = el.querySelector('grund-accordion-header')!;
    expect(header.getAttribute('role')).to.equal('heading');
    expect(header.getAttribute('aria-level')).to.equal('3');
  });

  it('disabled root prevents toggle', async () => {
    const el = await setup(html`
      <grund-accordion disabled>
        <grund-accordion-item value="a">
          <grund-accordion-header>
            <grund-accordion-trigger>A</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    const parts = getAccordionParts(el);
    parts[0].triggerBtn.click();
    await flush(el);

    expect(parts[0].item.hasAttribute('data-open')).to.be.false;
  });
});
