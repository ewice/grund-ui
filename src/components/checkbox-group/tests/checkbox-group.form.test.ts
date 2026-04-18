import { fixture, html } from '@open-wc/testing';
import { describe, expect, it } from 'vitest';

import { flush } from '../../../test-utils/test-utils';
import './test-helpers';

import type { GrundCheckbox } from '../../checkbox';

describe('GrundCheckboxGroup form submission', () => {
  it('submits the checked checkbox values', async () => {
    const formEl = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox-group .defaultValue=${['https']}>
          <grund-checkbox name="proto" value="http">HTTP</grund-checkbox>
          <grund-checkbox name="proto" value="https">HTTPS</grund-checkbox>
          <grund-checkbox name="proto" value="ftp">FTP</grund-checkbox>
        </grund-checkbox-group>
      </form>
    `);
    const checkboxes = formEl.querySelectorAll<GrundCheckbox>('grund-checkbox');
    for (const checkbox of checkboxes) {
      await flush(checkbox);
    }

    const data = new FormData(formEl);
    expect(data.getAll('proto')).to.deep.equal(['https']);
  });
});
