import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/index.js';

import '../root/index.js';
import '../list/index.js';
import '../tab/index.js';
import '../panel/index.js';

import type { GrundTabs } from './index.js';

function getTabButtons(el: GrundTabs): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll('grund-tab')).map(
    (t) => getByPart<HTMLButtonElement>(t, 'tab'),
  );
}

describe('GrundTabs', () => {
  async function setup(template = html`
    <grund-tabs>
      <grund-tabs-list>
        <grund-tab value="a">Tab A</grund-tab>
        <grund-tab value="b">Tab B</grund-tab>
        <grund-tab value="c">Tab C</grund-tab>
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

  it('renders with default properties', async () => {
    const el = await setup();
    expect(el.disabled).to.be.false;
    expect(el.orientation).to.equal('horizontal');
  });

  it('auto-selects first tab when uncontrolled with no defaultValue', async () => {
    const el = await setup();
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[0].hasAttribute('data-selected')).to.be.true;
    expect(tabs[1].hasAttribute('data-selected')).to.be.false;
  });

  it('sets data-orientation on root', async () => {
    const el = await setup();
    expect(el.dataset.orientation).to.equal('horizontal');
  });

  it('clicking a tab activates it', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[1].click();
    await flush(el);

    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[0].hasAttribute('data-selected')).to.be.false;
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('fires grund-value-change event on activation', async () => {
    const el = await setup();
    const events: any[] = [];
    el.addEventListener('grund-value-change', (e: Event) => {
      events.push((e as CustomEvent).detail);
    });

    const buttons = getTabButtons(el);
    buttons[1].click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].value).to.equal('b');
    expect(events[0].previousValue).to.equal('a');
  });

  it('sets data-activation-direction on root', async () => {
    const el = await setup();
    expect(el.dataset.activationDirection).to.equal('none');

    const buttons = getTabButtons(el);
    buttons[2].click();
    await flush(el);
    expect(el.dataset.activationDirection).to.equal('end');

    buttons[0].click();
    await flush(el);
    expect(el.dataset.activationDirection).to.equal('start');
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

  it('disabled root prevents activation', async () => {
    const el = await setup(html`
      <grund-tabs disabled>
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    const buttons = getTabButtons(el);
    buttons[1].click();
    await flush(el);

    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[0].hasAttribute('data-selected')).to.be.true;
    expect(tabs[1].hasAttribute('data-selected')).to.be.false;
  });

  it('dynamically added tab integrates correctly', async () => {
    const el = await setup();
    const list = el.querySelector('grund-tabs-list')!;

    const newTab = document.createElement('grund-tab');
    newTab.setAttribute('value', 'd');
    newTab.textContent = 'Tab D';
    list.appendChild(newTab);

    const newPanel = document.createElement('grund-tabs-panel');
    newPanel.setAttribute('value', 'd');
    newPanel.innerHTML = '<p>Panel D</p>';
    el.appendChild(newPanel);

    await flush(el);

    const buttons = getTabButtons(el);
    const newButton = buttons[buttons.length - 1];
    newButton.click();
    await flush(el);

    expect(newTab.hasAttribute('data-selected')).to.be.true;
  });
});
