import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/index.js';
import '../root/index.js';
import '../list/index.js';
import '../tab/index.js';
import '../panel/index.js';
import type { GrundTabs } from './index.js';

describe('<grund-tabs> controlled', () => {
  it('controlled value drives selection', async () => {
    const el = await fixture<GrundTabs>(html`
      <grund-tabs .value=${'b'}>
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    await flush(el);
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('fires event but does not update without consumer updating value', async () => {
    const el = await fixture<GrundTabs>(html`
      <grund-tabs .value=${'a'}>
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    await flush(el);
    const events: CustomEvent[] = [];
    el.addEventListener('grund-value-change', (e) => events.push(e as CustomEvent));
    el.querySelectorAll('grund-tab')[1].shadowRoot!.querySelector('button')!.click();
    await flush(el);
    expect(events).to.have.length(1);
    expect(events[0].detail.value).to.equal('b');
    expect(events[0].detail.previousValue).to.equal('a');
    // Tab A still selected because consumer didn't update value prop
    expect(el.querySelectorAll('grund-tab')[0].hasAttribute('data-selected')).to.be.true;
  });
});
