import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/index.js';

import '../root/index.js';
import '../list/index.js';
import '../tab/index.js';
import '../panel/index.js';

import type { GrundTabs } from '../root/index.js';

describe('Tabs Panel Visibility', () => {
  async function setup(template: ReturnType<typeof html>) {
    const el = await fixture<GrundTabs>(template);
    await flush(el);
    return el;
  }

  it('active panel is rendered, inactive panels are removed from DOM', async () => {
    const el = await setup(html`
      <grund-tabs default-value="a">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">Panel A</grund-tabs-panel>
        <grund-tabs-panel value="b">Panel B</grund-tabs-panel>
      </grund-tabs>
    `);
    const panels = el.querySelectorAll('grund-tabs-panel');
    expect(panels[0].shadowRoot?.querySelector('[part="panel"]')).to.exist;
    expect(panels[1].shadowRoot?.querySelector('[part="panel"]')).to.be.null;
  });

  it('active panel has role="tabpanel" and tabindex="0"', async () => {
    const el = await setup(html`
      <grund-tabs default-value="a">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">Panel A</grund-tabs-panel>
      </grund-tabs>
    `);
    const panel = el.querySelector('grund-tabs-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]')!;
    expect(panelDiv.getAttribute('role')).to.equal('tabpanel');
    expect(panelDiv.getAttribute('tabindex')).to.equal('0');
  });

  it('keepMounted panel stays in DOM with hidden attribute', async () => {
    const el = await setup(html`
      <grund-tabs default-value="a">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b" keep-mounted>B</grund-tabs-panel>
      </grund-tabs>
    `);
    const panels = el.querySelectorAll('grund-tabs-panel');
    const inactiveDiv = panels[1].shadowRoot?.querySelector('[part="panel"]');
    expect(inactiveDiv).to.exist;
    expect(inactiveDiv?.hasAttribute('hidden')).to.be.true;
    expect(inactiveDiv?.hasAttribute('tabindex')).to.be.false;
  });

  it('hiddenUntilFound uses hidden="until-found"', async () => {
    const el = await setup(html`
      <grund-tabs default-value="a">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b" hidden-until-found>B</grund-tabs-panel>
      </grund-tabs>
    `);
    const panels = el.querySelectorAll('grund-tabs-panel');
    const inactiveDiv = panels[1].shadowRoot?.querySelector('[part="panel"]');
    expect(inactiveDiv).to.exist;
    expect(inactiveDiv?.getAttribute('hidden')).to.equal('until-found');
  });

  it('data-selected is set on active panel', async () => {
    const el = await setup(html`
      <grund-tabs default-value="a">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    const panels = el.querySelectorAll('grund-tabs-panel');
    expect(panels[0].hasAttribute('data-selected')).to.be.true;
    expect(panels[1].hasAttribute('data-selected')).to.be.false;
  });

  it('data-orientation and data-activation-direction are set on panel host', async () => {
    const el = await setup(html`
      <grund-tabs default-value="a" orientation="vertical">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
      </grund-tabs>
    `);
    const panel = el.querySelector('grund-tabs-panel')!;
    expect(panel.dataset.orientation).to.equal('vertical');
    expect(panel.dataset.activationDirection).to.equal('none');
  });
});
