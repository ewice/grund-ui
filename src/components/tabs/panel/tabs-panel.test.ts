import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/index.js';
import '../root/index.js';
import '../list/index.js';
import '../tab/index.js';
import '../panel/index.js';
import type { GrundTabs } from '../root/index.js';

async function setup(template = html`
  <grund-tabs>
    <grund-tabs-list>
      <grund-tab value="a">A</grund-tab>
      <grund-tab value="b">B</grund-tab>
    </grund-tabs-list>
    <grund-tabs-panel value="a">Panel A</grund-tabs-panel>
    <grund-tabs-panel value="b">Panel B</grund-tabs-panel>
  </grund-tabs>
`) {
  const el = await fixture<GrundTabs>(template);
  await flush(el);
  return el;
}

describe('<grund-tabs-panel>', () => {
  it('active panel has role="tabpanel"', async () => {
    const el = await setup();
    const div = getByPart(el.querySelector('grund-tabs-panel')!, 'panel');
    expect(div.getAttribute('role')).to.equal('tabpanel');
  });

  it('active panel has tabindex="0"', async () => {
    const el = await setup();
    const div = getByPart(el.querySelector('grund-tabs-panel')!, 'panel');
    expect(div.getAttribute('tabindex')).to.equal('0');
  });

  it('ariaLabelledByElements points to tab host element', async () => {
    const el = await setup();
    const panel = el.querySelector('grund-tabs-panel')!;
    const panelDiv = getByPart<HTMLElement>(panel, 'panel');
    const tab = el.querySelector('grund-tab')!;
    // Element Reference API — direct element reference, no IDs or cross-shadow
    // IDREF resolution needed.
    expect((panelDiv as any).ariaLabelledByElements).to.deep.equal([tab]);
  });

  it('inactive panel without keepMounted has empty shadow DOM', async () => {
    const el = await setup();
    const panels = el.querySelectorAll('grund-tabs-panel');
    expect(panels[1].shadowRoot!.querySelector('[part="panel"]')).to.be.null;
  });

  it('inactive panel with keepMounted stays in shadow DOM with hidden', async () => {
    const el = await fixture<GrundTabs>(html`
      <grund-tabs>
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a" keep-mounted>A</grund-tabs-panel>
        <grund-tabs-panel value="b" keep-mounted>B</grund-tabs-panel>
      </grund-tabs>
    `);
    await flush(el);
    const panels = el.querySelectorAll('grund-tabs-panel');
    const inactiveDiv = getByPart(panels[1], 'panel');
    expect(inactiveDiv.hasAttribute('hidden')).to.be.true;
    expect(inactiveDiv.getAttribute('role')).to.be.null; // no tabpanel role when hidden
  });

  it('panel host element always stays in light DOM', async () => {
    const el = await setup();
    expect(el.querySelectorAll('grund-tabs-panel')).to.have.length(2);
  });

  it('panel has data-selected when active', async () => {
    const el = await setup();
    const panels = el.querySelectorAll('grund-tabs-panel');
    expect(panels[0].hasAttribute('data-selected')).to.be.true;
    expect(panels[1].hasAttribute('data-selected')).to.be.false;
  });
});
