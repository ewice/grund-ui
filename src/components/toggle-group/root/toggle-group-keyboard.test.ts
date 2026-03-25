import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, simulateKeyboard, getByPart } from '../../../test-utils/index.js';

import '../../../components/toggle-group/root/index.js';
import '../../../components/toggle/root/index.js';

import type { GrundToggleGroup } from './index.js';
import type { GrundToggle } from '../../toggle/root/index.js';

function getToggleButtons(el: GrundToggleGroup): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll<GrundToggle>('grund-toggle')).map((t) =>
    getByPart<HTMLButtonElement>(t, 'button'),
  );
}

function getActiveShadowButton(): Element | null {
  const host = document.activeElement;
  if (!host) return null;
  return host.shadowRoot?.activeElement ?? host;
}

describe('ToggleGroup Keyboard Navigation (horizontal)', () => {
  async function setup() {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
        <grund-toggle value="c">C</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);
    return el;
  }

  it('ArrowRight moves focus to next toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('ArrowLeft moves focus to previous toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowLeft');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('Home moves focus to first toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'Home');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('End moves focus to last toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'End');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });

  it('loops from last to first', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('skips disabled toggles', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b" disabled>B</grund-toggle>
        <grund-toggle value="c">C</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);
    const buttons = getToggleButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });
});

describe('ToggleGroup Keyboard Navigation (vertical)', () => {
  async function setup() {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group orientation="vertical">
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);
    return el;
  }

  it('ArrowDown moves focus to next toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowDown');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('ArrowUp moves focus to previous toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowUp');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });
});
