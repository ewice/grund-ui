import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/index.js';

// Import all elements needed for tests
import '../root/index.js';
import '../list/index.js';
import '../tab/index.js';
import '../panel/index.js';

import type { GrundTabs } from './index.js';

async function setup(template = html`
  <grund-tabs>
    <grund-tabs-list>
      <grund-tab value="a">A</grund-tab>
      <grund-tab value="b">B</grund-tab>
      <grund-tab value="c">C</grund-tab>
    </grund-tabs-list>
    <grund-tabs-panel value="a">Panel A</grund-tabs-panel>
    <grund-tabs-panel value="b">Panel B</grund-tabs-panel>
    <grund-tabs-panel value="c">Panel C</grund-tabs-panel>
  </grund-tabs>
`) {
  const el = await fixture<GrundTabs>(template);
  await flush(el);
  return el;
}

describe('<grund-tabs>', () => {
  it('auto-selects first tab when no defaultValue', async () => {
    const el = await setup();
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[0].hasAttribute('data-selected')).to.be.true;
    expect(tabs[1].hasAttribute('data-selected')).to.be.false;
  });

  it('respects defaultValue', async () => {
    const el = await setup(html`
      <grund-tabs default-value="b">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('sets data-orientation on root', async () => {
    const el = await setup();
    expect(el.dataset.orientation).to.equal('horizontal');
  });

  it('skips disabled tabs for auto-selection', async () => {
    const el = await setup(html`
      <grund-tabs>
        <grund-tabs-list>
          <grund-tab value="a" disabled>A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('fires grund-value-change on activation', async () => {
    const el = await setup();
    const changes: string[] = [];
    el.addEventListener('grund-value-change', (e) => {
      changes.push((e as CustomEvent).detail.value);
    });
    const tabs = el.querySelectorAll('grund-tab');
    tabs[1].shadowRoot!.querySelector('button')!.click();
    await flush(el);
    expect(changes).to.deep.equal(['b']);
  });

  it('panels show/hide based on active tab', async () => {
    const el = await setup();
    const panels = el.querySelectorAll('grund-tabs-panel');
    // Panel A active by default — has shadow content
    expect(panels[0].shadowRoot!.querySelector('[part="panel"]')).to.not.be.null;
    // Panel B inactive — empty shadow
    expect(panels[1].shadowRoot!.querySelector('[part="panel"]')).to.be.null;
  });

  it('tabs get data-index attributes', async () => {
    const el = await setup();
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[0].dataset.index).to.equal('0');
    expect(tabs[1].dataset.index).to.equal('1');
    expect(tabs[2].dataset.index).to.equal('2');
  });
});
