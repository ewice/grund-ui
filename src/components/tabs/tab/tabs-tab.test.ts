import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/index.js';
import '../root/index.js';
import '../list/index.js';
import '../tab/index.js';
import '../panel/index.js';
import type { GrundTabs } from '../root/index.js';

async function setup() {
  const el = await fixture<GrundTabs>(html`
    <grund-tabs>
      <grund-tabs-list>
        <grund-tab value="a">A</grund-tab>
        <grund-tab value="b">B</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="a">A</grund-tabs-panel>
      <grund-tabs-panel value="b">B</grund-tabs-panel>
    </grund-tabs>
  `);
  await flush(el);
  return el;
}

describe('<grund-tab>', () => {
  it('active tab has aria-selected="true"', async () => {
    const el = await setup();
    const btn = getByPart(el.querySelector('grund-tab')!, 'tab');
    expect(btn.getAttribute('aria-selected')).to.equal('true');
  });

  it('inactive tab has aria-selected="false"', async () => {
    const el = await setup();
    const tabs = el.querySelectorAll('grund-tab');
    const btn = getByPart(tabs[1], 'tab');
    expect(btn.getAttribute('aria-selected')).to.equal('false');
  });

  it('ariaControlsElements points to panel host element', async () => {
    const el = await setup();
    const tab = el.querySelector('grund-tab')!;
    const panel = el.querySelector('grund-tabs-panel')!;
    const btn = getByPart<HTMLElement>(tab, 'tab');
    // Element Reference API — direct element reference, no IDs needed.
    expect((btn as any).ariaControlsElements).to.deep.equal([panel]);
  });

  it('disabled tab has aria-disabled="true"', async () => {
    const el = await fixture<GrundTabs>(html`
      <grund-tabs>
        <grund-tabs-list>
          <grund-tab value="a" disabled>A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    await flush(el);
    const btn = getByPart(el.querySelector('grund-tab')!, 'tab');
    expect(btn.getAttribute('aria-disabled')).to.equal('true');
  });

  it('data-activation-direction set after activation', async () => {
    const el = await setup();
    el.querySelectorAll('grund-tab')[1].shadowRoot!.querySelector('button')!.click();
    await flush(el);
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[1].dataset.activationDirection).to.equal('end');
  });
});
