import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/test-utils';

import '../toggle-group';
import '../../toggle/toggle';

import type { GrundToggleGroup } from '../toggle-group/toggle-group';
import type { GrundToggle } from '../../toggle';

describe('GrundToggleGroup', () => {
  async function setup(
    template = html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
        <grund-toggle value="c">C</grund-toggle>
      </grund-toggle-group>
    `,
  ) {
    const el = await fixture<GrundToggleGroup>(template);
    await flush(el);
    return el;
  }

  it('renders with default properties', async () => {
    const el = await setup();
    expect(el.multiple).to.be.false;
    expect(el.disabled).to.be.false;
    expect(el.orientation).to.equal('horizontal');
    expect(el.loop).to.be.true;
  });

  it('sets data-orientation attribute', async () => {
    const el = await setup();
    expect(el.dataset.orientation).to.equal('horizontal');
  });

  it('sets data-orientation for vertical', async () => {
    const el = await setup(html`
      <grund-toggle-group orientation="vertical">
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    expect(el.dataset.orientation).to.equal('vertical');
  });

  it('sets data-disabled when disabled', async () => {
    const el = await setup(html`
      <grund-toggle-group disabled>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  it('sets data-multiple when multiple', async () => {
    const el = await setup(html`
      <grund-toggle-group multiple>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    expect(el.hasAttribute('data-multiple')).to.be.true;
  });

  it('reflects defaultValue on children via data-pressed', async () => {
    const el = await setup(html`
      <grund-toggle-group .defaultValue=${['a']}>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    expect(toggles[0].hasAttribute('data-pressed')).to.be.true;
    expect(toggles[1].hasAttribute('data-pressed')).to.be.false;
  });

  it('pressing a toggle fires grund-value-change', async () => {
    const el = await setup();
    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    const events: CustomEvent[] = [];
    el.addEventListener('grund-value-change', (e) => events.push(e as CustomEvent));

    toggles[0].shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(events).to.have.lengthOf(1);
    expect(events[0].detail.value).to.deep.equal(['a']);
  });

  it('group disabled overrides toggle disabled state', async () => {
    const el = await setup(html`
      <grund-toggle-group disabled>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    const toggle = el.querySelector<GrundToggle>('grund-toggle')!;
    await flush(el);
    expect(toggle.hasAttribute('data-disabled')).to.be.true;
  });

  it('pressing a toggle fires grund-pressed-change on the toggle', async () => {
    const el = await setup();
    const toggle = el.querySelector<GrundToggle>('grund-toggle[value="a"]')!;
    const events: CustomEvent[] = [];
    toggle.addEventListener('grund-pressed-change', (e) => events.push(e as CustomEvent));

    toggle.shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(events).to.have.lengthOf(1);
    expect(events[0].detail.pressed).to.be.true;
  });

  it('in single mode pressing a new toggle unpresses the old one', async () => {
    const el = await setup(html`
      <grund-toggle-group .defaultValue=${['a']}>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    await flush(el);

    toggles[1].shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(toggles[0].hasAttribute('data-pressed')).to.be.false;
    expect(toggles[1].hasAttribute('data-pressed')).to.be.true;
  });

  it('pressing the already-pressed toggle deselects it in single mode', async () => {
    const el = await setup(html`
      <grund-toggle-group .defaultValue=${['a']}>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    await flush(el);

    toggles[0].shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(toggles[0].hasAttribute('data-pressed')).to.be.false;
  });

  it('omits aria-label when label is empty', async () => {
    const el = await setup();
    const group = el.shadowRoot!.querySelector('[part="group"]')!;
    expect(group.hasAttribute('aria-label')).to.be.false;
  });

  it('warns in dev mode when a child toggle has no value', async () => {
    const warns: unknown[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warns.push(args);
    try {
      await fixture<GrundToggleGroup>(html`
        <grund-toggle-group>
          <grund-toggle>No value</grund-toggle>
        </grund-toggle-group>
      `);
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      console.warn = orig;
    }
    // Dev-mode warning should have been emitted
    expect(warns.some((w) => String(w).includes('grund-toggle'))).to.be.true;
  });

  it('warns in dev mode when two child toggles share the same value', async () => {
    const warns: unknown[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warns.push(args);
    try {
      await fixture<GrundToggleGroup>(html`
        <grund-toggle-group>
          <grund-toggle value="a">A</grund-toggle>
          <grund-toggle value="a">A dup</grund-toggle>
        </grund-toggle-group>
      `);
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      console.warn = orig;
    }
    expect(warns.some((w) => String(w).includes('Duplicate'))).to.be.true;
  });
});
