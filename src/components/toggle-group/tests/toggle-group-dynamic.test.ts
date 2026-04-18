import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/test-utils';

import '../toggle-group';
import '../../toggle/toggle';

import type { GrundToggleGroup } from '../toggle-group/toggle-group';
import type { GrundToggle } from '../../toggle';

describe('ToggleGroup Dynamic Children', () => {
  it('registers a toggle added after initial render', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    const newToggle = document.createElement('grund-toggle') as GrundToggle;
    newToggle.value = 'b';
    newToggle.textContent = 'B';
    el.appendChild(newToggle);
    await flush(el);

    // Clicking the newly added toggle should fire the group event
    const events: CustomEvent[] = [];
    el.addEventListener('grund-value-change', (e) => events.push(e as CustomEvent));

    newToggle.shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(events).to.have.lengthOf(1);
    expect(events[0].detail.value).to.deep.equal(['b']);
  });

  it('unregisters a toggle removed from the DOM', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    const toggleB = el.querySelector<GrundToggle>('grund-toggle[value="b"]')!;
    el.removeChild(toggleB);
    await flush(el);

    // Only toggle A should remain — pressing it fires with just ['a']
    const events: CustomEvent[] = [];
    el.addEventListener('grund-value-change', (e) => events.push(e as CustomEvent));

    el.querySelector<GrundToggle>('grund-toggle')!.shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(events).to.have.lengthOf(1);
    expect(events[0].detail.value).to.deep.equal(['a']);
  });

  it('re-registers correctly when a toggle value prop changes', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    const toggle = el.querySelector<GrundToggle>('grund-toggle')!;
    toggle.value = 'renamed';
    await flush(el);

    const events: CustomEvent[] = [];
    el.addEventListener('grund-value-change', (e) => events.push(e as CustomEvent));

    toggle.shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(events).to.have.lengthOf(1);
    // The event detail should use the updated value, not the old one
    expect(events[0].detail.value).to.deep.equal(['renamed']);
  });
});
