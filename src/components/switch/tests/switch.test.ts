import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils';
import '../switch';
import type { GrundSwitch } from '../switch';

describe('GrundSwitch', () => {
  async function setup(template = html`<grund-switch></grund-switch>`) {
    const el = await fixture<GrundSwitch>(template);
    await flush(el);
    return el;
  }

  it('mounts without errors and renders inner input with type=checkbox role=switch', async () => {
    const el = await setup();
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input).to.exist;
    expect(input.type).to.equal('checkbox');
    expect(input.getAttribute('role')).to.equal('switch');
  });
});
