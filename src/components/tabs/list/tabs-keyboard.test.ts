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

async function setup() {
  const el = await fixture<GrundTabs>(html`
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
  `);
  await flush(el);
  return el;
}

describe('<grund-tabs-list> keyboard', () => {
  it('ArrowRight moves focus to next tab', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('ArrowLeft moves focus to previous tab', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowLeft');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
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

  it('activateOnFocus=true (default): ArrowRight also activates tab', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    await flush(el);
    const tabs = el.querySelectorAll('grund-tab');
    expect(tabs[1].hasAttribute('data-selected')).to.be.true;
  });

  it('activateOnFocus=false: ArrowRight only moves focus, Enter activates', async () => {
    // Use property binding (.activateOnFocus=${false}) not attribute — boolean attributes
    // convert any string value (including "false") to true.
    const el = await fixture<GrundTabs>(html`
      <grund-tabs>
        <grund-tabs-list .activateOnFocus=${false}>
          <grund-tab value="a">A</grund-tab>
          <grund-tab value="b">B</grund-tab>
        </grund-tabs-list>
        <grund-tabs-panel value="a">A</grund-tabs-panel>
        <grund-tabs-panel value="b">B</grund-tabs-panel>
      </grund-tabs>
    `);
    await flush(el);
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    await flush(el);
    // Focus moved but tab A still selected
    expect(el.querySelectorAll('grund-tab')[0].hasAttribute('data-selected')).to.be.true;
    // Now press Enter to activate
    simulateKeyboard(buttons[1], 'Enter');
    await flush(el);
    expect(el.querySelectorAll('grund-tab')[1].hasAttribute('data-selected')).to.be.true;
  });

  it('loops from last to first', async () => {
    const el = await setup();
    const buttons = getTabButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('skips disabled tabs', async () => {
    const el = await fixture<GrundTabs>(html`
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
    await flush(el);
    const buttons = getTabButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });
});
