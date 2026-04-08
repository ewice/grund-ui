import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils.js';

import '../accordion.js';
import '../accordion-item.js';
import '../accordion-header.js';
import '../accordion-trigger.js';
import '../accordion-panel.js';

import type { GrundAccordion } from '../accordion.js';
import type { AccordionOpenChangeDetail } from '../types.js';

describe('Accordion Panel Visibility', () => {
  it('removes panel from DOM when closed (default)', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a">
          <grund-accordion-header
            ><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header
          >
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    expect(panel.shadowRoot?.querySelector('[part="panel"]')).to.be.null;
  });

  it('keeps panel in DOM with hidden attribute when keepMounted', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion keep-mounted>
        <grund-accordion-item value="a">
          <grund-accordion-header
            ><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header
          >
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
    expect(panelDiv).to.exist;
    expect(panelDiv?.hasAttribute('hidden')).to.be.true;
  });

  it('uses hidden="until-found" when hiddenUntilFound', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion hidden-until-found>
        <grund-accordion-item value="a">
          <grund-accordion-header
            ><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header
          >
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
    expect(panelDiv).to.exist;
    expect(panelDiv?.getAttribute('hidden')).to.equal('until-found');
  });

  it('panel-level keepMounted overrides root default', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a">
          <grund-accordion-header
            ><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header
          >
          <grund-accordion-panel keep-mounted>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
    expect(panelDiv).to.exist;
    expect(panelDiv?.hasAttribute('hidden')).to.be.true;
  });
});

describe('Accordion Event Suppression', () => {
  it('does NOT fire grund-open-change on initial render with defaultValue', async () => {
    const events: AccordionOpenChangeDetail[] = [];
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion .defaultValue=${['a']}>
        <grund-accordion-item
          value="a"
          @grund-open-change=${(e: CustomEvent) => events.push(e.detail)}
        >
          <grund-accordion-header
            ><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header
          >
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    // Should not have fired during initial mount
    expect(events).to.have.length(0);
  });

  it('fires grund-open-change after initial render on user interaction', async () => {
    const events: AccordionOpenChangeDetail[] = [];
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item
          value="a"
          @grund-open-change=${(e: CustomEvent) => events.push(e.detail)}
        >
          <grund-accordion-header
            ><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header
          >
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    const trigger = el.querySelector('grund-accordion-trigger')!;
    getByPart<HTMLButtonElement>(trigger, 'trigger').click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].open).to.be.true;
  });
});
