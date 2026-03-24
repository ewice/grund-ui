import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, simulateKeyboard, getByPart } from '../../../test-utils/index.js';

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

function getActiveShadowButton(): Element | null {
  const host = document.activeElement;
  if (!host) return null;
  return host.shadowRoot?.activeElement ?? host;
}

describe('Tabs Keyboard Navigation', () => {
  async function setup(template = html`
    <grund-tabs>
      <grund-tabs-list>
        <grund-tab value="a">A</grund-tab>
        <grund-tab value="b">B</grund-tab>
        <grund-tab value="c">C</grund-tab>
      </grund-tabs-list>
      <grund-tabs-panel value="a">A</grund-tabs-panel>
      <grund-tabs-panel value="b">B</grund-tabs-panel>
      <grund-tabs-panel value="c">C</grund-tabs-panel>
    </grund-tabs>
  `) {
    const el = await fixture<GrundTabs>(template);
    await flush(el);
    return el;
  }

  it('ArrowRight moves focus to next tab (horizontal)', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('ArrowLeft moves focus to previous tab (horizontal)', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowLeft');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('ArrowDown moves focus in vertical orientation', async () => {
    const el = await setup(html`
      <grund-tabs orientation="vertical">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowDown');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('Home moves focus to first tab', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'Home');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('End moves focus to last tab', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'End');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });

  it('loops from last to first (loop-focus default true)', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('does not loop when loop-focus is false', async () => {
    const el = await setup(html`
      <grund-tabs>
        <grund-tabs-list .loopFocus=${false}>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);

    const buttons = getTabButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('skips disabled tabs in navigation', async () => {
    const el = await setup(html`
      <grund-tabs>
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b" disabled>B</grund-tab>
          <grund-tab value="c">C</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
        <grund-tabs-panel value="c">C</grund-tabs-panel>
      </grund-tabs>
    `);
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });

  it('activate-on-focus=true activates tab on arrow key focus', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[0].focus();
    await flush(el);

    simulateKeyboard(buttons[0], 'ArrowRight');
    await flush(el);

    // Tab B should now be active (not just focused)
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('activate-on-focus=false does not activate on arrow key focus', async () => {
    const el = await setup(html`
      <grund-tabs>
        <grund-tabs-list .activateOnFocus=${false}>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);

    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    await flush(el);

    // Tab A should still be active — arrow only moved focus
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[0].hasAttribute('data-selected')).to.be.true;
  });

  it('activate-on-focus=false activates with Enter key', async () => {
    const el = await setup(html`
      <grund-tabs>
        <grund-tabs-list .activateOnFocus=${false}>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);

    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    await flush(el);

    // Native <button> fires click on Enter/Space — .click() faithfully reproduces this
    // without emitting a synthetic keydown, which is correct for this test.
    buttons[1].click();
    await flush(el);

    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('activate-on-focus=false activates with Space key', async () => {
    const el = await setup(html`
      <grund-tabs>
        <grund-tabs-list .activateOnFocus=${false}>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);

    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    await flush(el);

    // Native <button> fires click on Space — .click() reproduces this in jsdom
    buttons[1].click();
    await flush(el);

    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('ArrowUp moves focus in vertical orientation', async () => {
    const el = await setup(html`
      <grund-tabs orientation="vertical">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    const buttons = getTabButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowUp');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('RTL: ArrowLeft moves focus to next tab (forward in visual order)', async () => {
    const el = await setup(html`
      <grund-tabs dir="rtl">
        <grund-tabs-list>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
          <grund-tab value="c">C</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
        <grund-tabs-panel value="c">C</grund-tabs-panel>
      </grund-tabs>
    `);
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowLeft');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });
});
