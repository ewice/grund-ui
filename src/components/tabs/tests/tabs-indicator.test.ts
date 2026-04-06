import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/test-utils.js';

import '../tabs.js';
import '../tabs-list.js';
import '../tab.js';
import '../tabs-panel.js';
import '../tabs-indicator.js';

import type { GrundTabs } from '../tabs.js';

describe('GrundTabsIndicator', () => {
  async function setup() {
    const el = await fixture<GrundTabs>(html`
      <grund-tabs>
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
          <grund-tabs-indicator></grund-tabs-indicator>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    await flush(el);
    return el;
  }

  it('renders an indicator with part="indicator"', async () => {
    const el = await setup();
    const indicator = el.querySelector('grund-tabs-indicator')!;
    const div = indicator.shadowRoot?.querySelector('[part="indicator"]');
    expect(div).to.exist;
  });

  it('sets data-orientation', async () => {
    const el = await setup();
    const indicator = el.querySelector('grund-tabs-indicator')!;
    expect(indicator.dataset.orientation).to.equal('horizontal');
  });

  it('sets data-activation-direction', async () => {
    const el = await setup();
    const indicator = el.querySelector('grund-tabs-indicator')!;
    expect(indicator.dataset.activationDirection).to.equal('none');
  });

  it('sets all 6 CSS custom properties from active tab geometry', async () => {
    const el = await setup();
    const indicator = el.querySelector('grund-tabs-indicator')!;
    const div = indicator.shadowRoot!.querySelector<HTMLElement>('[part="indicator"]')!;
    // Values will be numeric pixel strings (may be "0px" in JSDOM — still truthy)
    const props = [
      '--grund-tabs-indicator-width',
      '--grund-tabs-indicator-height',
      '--grund-tabs-indicator-left',
      '--grund-tabs-indicator-top',
      '--grund-tabs-indicator-right',
      '--grund-tabs-indicator-bottom',
    ];
    for (const prop of props) {
      expect(div.style.getPropertyValue(prop), prop).to.not.equal('');
    }
  });
});
