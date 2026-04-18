import { html } from '@open-wc/testing';
import { describe, expect, it, vi } from 'vitest';

import { flush } from '../../../test-utils/test-utils';
import {
  clickCheckbox,
  flushCheckboxes,
  getCheckboxButton,
  setupCheckboxGroup,
} from './test-helpers';

import type { CheckboxGroupValueChangeDetail } from '../types';

describe('GrundCheckboxGroup state', () => {
  describe('uncontrolled mode', () => {
    it('starts with no checkboxes checked by default', async () => {
      const { checkboxes } = await setupCheckboxGroup();

      for (const checkbox of checkboxes) {
        expect(getCheckboxButton(checkbox).getAttribute('aria-checked')).to.equal('false');
      }
    });

    it('seeds from defaultValue', async () => {
      const { checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group .defaultValue=${['a', 'c']}>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
          <grund-checkbox value="c">C</grund-checkbox>
        </grund-checkbox-group>
      `);

      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('true');
      expect(getCheckboxButton(checkboxes[1]).getAttribute('aria-checked')).to.equal('false');
      expect(getCheckboxButton(checkboxes[2]).getAttribute('aria-checked')).to.equal('true');
    });

    it('clicking a checkbox updates group state', async () => {
      const { el, checkboxes } = await setupCheckboxGroup();

      clickCheckbox(checkboxes[0]);
      await flush(el);
      await flushCheckboxes(checkboxes);

      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('true');
      expect(getCheckboxButton(checkboxes[1]).getAttribute('aria-checked')).to.equal('false');
    });
  });

  describe('events', () => {
    it('fires grund-value-change with correct detail', async () => {
      const { el, checkboxes } = await setupCheckboxGroup();
      const handler = vi.fn();

      el.addEventListener('grund-value-change', handler as EventListener);
      clickCheckbox(checkboxes[1]);

      expect(handler).toHaveBeenCalledOnce();
      const detail = handler.mock.calls[0][0].detail as CheckboxGroupValueChangeDetail;
      expect(detail.value).to.deep.equal(['b']);
      expect(detail.itemValue).to.equal('b');
      expect(detail.checked).to.equal(true);
    });

    it('fires grund-checked-change from individual checkbox', async () => {
      const { checkboxes } = await setupCheckboxGroup();
      const handler = vi.fn();

      checkboxes[0].addEventListener('grund-checked-change', handler as EventListener);
      clickCheckbox(checkboxes[0]);

      expect(handler).toHaveBeenCalledOnce();
    });

    it('fires grund-checked-change before grund-value-change', async () => {
      const { el, checkboxes } = await setupCheckboxGroup();
      const events: string[] = [];

      checkboxes[0].addEventListener('grund-checked-change', () => {
        events.push('grund-checked-change');
      });
      el.addEventListener('grund-value-change', () => {
        events.push('grund-value-change');
      });

      clickCheckbox(checkboxes[0]);

      expect(events).to.deep.equal(['grund-checked-change', 'grund-value-change']);
    });
  });

  describe('controlled mode', () => {
    it('reflects controlled value prop', async () => {
      const { checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group .value=${['b']}>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);

      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('false');
      expect(getCheckboxButton(checkboxes[1]).getAttribute('aria-checked')).to.equal('true');
    });

    it('does not auto-update in controlled mode', async () => {
      const { el, checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group .value=${[]}>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);

      clickCheckbox(checkboxes[0]);
      await flush(el);
      await flush(checkboxes[0]);

      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('false');
    });

    it('fires grund-value-change in controlled mode without mutating rendered state', async () => {
      const { el, checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group .value=${[]}>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);
      const handler = vi.fn();

      el.addEventListener('grund-value-change', handler as EventListener);
      clickCheckbox(checkboxes[0]);
      await flush(el);
      await flush(checkboxes[0]);

      expect(handler.mock.calls).to.have.length(1);
      const detail = handler.mock.calls[0][0].detail as CheckboxGroupValueChangeDetail;
      expect(detail.value).to.deep.equal(['a']);
      expect(detail.itemValue).to.equal('a');
      expect(detail.checked).to.equal(true);
      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('false');
    });

    it('updates rendered checkbox state when the controlled value prop changes after mount', async () => {
      const { el, checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group .value=${['a']}>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);

      el.value = ['b'];
      await flush(el);
      await flushCheckboxes(checkboxes);

      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('false');
      expect(getCheckboxButton(checkboxes[1]).getAttribute('aria-checked')).to.equal('true');
    });

    it('re-renders when switching from controlled empty array to uncontrolled', async () => {
      const { el, checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group .value=${[]}>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);

      clickCheckbox(checkboxes[0]);
      await flush(el);
      await flush(checkboxes[0]);
      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('false');

      el.value = undefined;
      await flush(el);
      await flush(checkboxes[0]);

      clickCheckbox(checkboxes[0]);
      await flush(el);
      await flush(checkboxes[0]);

      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('true');
    });

    it('does not change the checked state of checkboxes when the consumer does not update value', async () => {
      const { el, checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group .value=${['a']}>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);

      clickCheckbox(checkboxes[1]);
      await flush(el);
      await flushCheckboxes(checkboxes);

      expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('true');
      expect(getCheckboxButton(checkboxes[1]).getAttribute('aria-checked')).to.equal('false');
    });
  });

  describe('disabled state', () => {
    it('group disabled propagates to children', async () => {
      const { el, checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group disabled>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);
      const handler = vi.fn();

      expect(el.hasAttribute('data-disabled')).to.be.true;
      el.addEventListener('grund-value-change', handler as EventListener);
      clickCheckbox(checkboxes[0]);

      expect(handler).not.toHaveBeenCalled();
    });

    it('individually disabled checkbox still blocked', async () => {
      const { el, checkboxes } = await setupCheckboxGroup(html`
        <grund-checkbox-group>
          <grund-checkbox value="a" disabled>A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);
      const handler = vi.fn();

      el.addEventListener('grund-value-change', handler as EventListener);
      clickCheckbox(checkboxes[0]);
      expect(handler.mock.calls).to.have.length(0);

      clickCheckbox(checkboxes[1]);
      expect(handler.mock.calls).to.have.length(1);
    });
  });
});
