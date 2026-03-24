import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/index.js';

import '../root/index.js';
import '../list/index.js';
import '../tab/index.js';
import '../panel/index.js';

import type { GrundTabs } from '../root/index.js';

function getTabButtons(el: GrundTabs): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll('grund-tab')).map(
    (t) => getByPart<HTMLButtonElement>(t, 'tab'),
  );
}

describe('Tabs Controlled Mode', () => {
  it('does not update internal state in controlled mode', async () => {
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

    const buttons = getTabButtons(el);
    buttons[1].click();
    await flush(el);

    // Should still show tab A as active — controlled mode
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[0].hasAttribute('data-selected')).to.be.true;
    expect(tabs[1].hasAttribute('data-selected')).to.be.false;
  });

  it('opens when consumer updates value', async () => {
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

    el.value = 'b';
    await flush(el);

    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[0].hasAttribute('data-selected')).to.be.false;
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('value=null means no tab selected', async () => {
    const el = await fixture<GrundTabs>(html`
      <grund-tabs .value=${null}>
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
    expect(tabs[0].hasAttribute('data-selected')).to.be.false;
    expect(tabs[1].hasAttribute('data-selected')).to.be.false;
  });
});
