// src/components/toggle-group/root/toggle-group-controlled.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils';

import '../toggle-group';
import '../../toggle/toggle';

import type { GrundToggleGroup } from '../toggle-group';
import type { GrundToggle } from '../../toggle';

describe('ToggleGroup Controlled Mode', () => {
  it('does not update pressed state without consumer updating value', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group .value=${[]}>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    el.querySelector<GrundToggle>('grund-toggle')!.shadowRoot!.querySelector('button')!.click();
    await flush(el);

    const toggle = el.querySelector<GrundToggle>('grund-toggle')!;
    expect(toggle.hasAttribute('data-pressed')).to.be.false;
  });

  it('reflects value when consumer updates it', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group .value=${[]}>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    el.value = ['a'];
    await flush(el);

    const toggle = el.querySelector<GrundToggle>('grund-toggle')!;
    expect(toggle.hasAttribute('data-pressed')).to.be.true;
  });
});

describe('ToggleGroup Multiple Mode', () => {
  it('allows multiple toggles pressed simultaneously', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group multiple .defaultValue=${['a']}>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    toggles[1].shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(toggles[0].hasAttribute('data-pressed')).to.be.true;
    expect(toggles[1].hasAttribute('data-pressed')).to.be.true;
  });
});
