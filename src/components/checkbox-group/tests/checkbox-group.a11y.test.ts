import { fixture, html } from '@open-wc/testing';
import { describe, expect, it } from 'vitest';

import { flush } from '../../../test-utils/test-utils';
import { setupCheckboxGroup } from './test-helpers';

import type { GrundCheckboxGroup } from '../checkbox-group';

describe('GrundCheckboxGroup accessibility', () => {
  it('renders a slot', async () => {
    const { el } = await setupCheckboxGroup();
    expect(el.shadowRoot?.querySelector('slot')).to.exist;
  });

  it('renders an inner group wrapper with role=group', async () => {
    const { el } = await setupCheckboxGroup();
    const group = el.shadowRoot?.querySelector<HTMLElement>('[part="group"]');

    expect(group).to.exist;
    expect(group?.getAttribute('role')).to.equal('group');
  });

  it('forwards host aria-label to the group wrapper', async () => {
    const { el } = await setupCheckboxGroup(html`
      <grund-checkbox-group aria-label="Protocols">
        <grund-checkbox value="a">A</grund-checkbox>
      </grund-checkbox-group>
    `);
    const group = el.shadowRoot?.querySelector<HTMLElement>('[part="group"]');

    expect(group?.getAttribute('aria-label')).to.equal('Protocols');
  });

  it('forwards host aria-labelledby to the group wrapper via element references', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <span id="group-label">Protocols</span>
        <grund-checkbox-group aria-labelledby="group-label">
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      </div>
    `);
    const el = container.querySelector<GrundCheckboxGroup>('grund-checkbox-group')!;
    await flush(el);

    const group = el.shadowRoot?.querySelector<HTMLElement>('[part="group"]');
    expect(group?.ariaLabelledByElements).to.have.length(1);
    expect(group?.ariaLabelledByElements?.[0]?.id).to.equal('group-label');
  });

  it('forwards host aria-describedby to the group wrapper via element references', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <span id="group-desc">Helpful description</span>
        <grund-checkbox-group aria-describedby="group-desc">
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      </div>
    `);
    const el = container.querySelector<GrundCheckboxGroup>('grund-checkbox-group')!;
    await flush(el);

    const group = el.shadowRoot?.querySelector<HTMLElement>('[part="group"]');
    expect(group?.ariaDescribedByElements).to.have.length(1);
    expect(group?.ariaDescribedByElements?.[0]?.id).to.equal('group-desc');
  });
});
