import { fixture, html } from '@open-wc/testing';
import { describe, expect, it, vi } from 'vitest';

import { flush } from '../../../test-utils/test-utils';
import {
  clickCheckbox,
  flushCheckboxGroup,
  getCheckboxButton,
  setupCheckboxGroup,
} from './test-helpers';

import type { GrundCheckbox } from '../../checkbox';
import type { CheckboxGroupValueChangeDetail } from '../types';

describe('GrundCheckboxGroup parent checkbox behavior', () => {
  it('shows checked when all children are checked', async () => {
    const { checkboxes } = await setupCheckboxGroup(html`
      <grund-checkbox-group .defaultValue=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);

    expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('true');
  });

  it('shows mixed when some children are checked', async () => {
    const { checkboxes } = await setupCheckboxGroup(html`
      <grund-checkbox-group .defaultValue=${['a']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);

    expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('mixed');
  });

  it('shows unchecked when no children are checked', async () => {
    const { checkboxes } = await setupCheckboxGroup(html`
      <grund-checkbox-group>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);

    expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('false');
  });

  it('checks all when clicked from the unchecked state', async () => {
    const { el, checkboxes } = await setupCheckboxGroup(html`
      <grund-checkbox-group>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);

    clickCheckbox(checkboxes[0]);
    await flushCheckboxGroup(el);

    expect(getCheckboxButton(checkboxes[1]).getAttribute('aria-checked')).to.equal('true');
    expect(getCheckboxButton(checkboxes[2]).getAttribute('aria-checked')).to.equal('true');
  });

  it('unchecks all when clicked from the checked state', async () => {
    const { el, checkboxes } = await setupCheckboxGroup(html`
      <grund-checkbox-group .defaultValue=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);

    clickCheckbox(checkboxes[0]);
    await flushCheckboxGroup(el);

    expect(getCheckboxButton(checkboxes[1]).getAttribute('aria-checked')).to.equal('false');
    expect(getCheckboxButton(checkboxes[2]).getAttribute('aria-checked')).to.equal('false');
  });

  it('does not submit a parent checkbox form value', async () => {
    const formEl = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox-group .defaultValue=${['a']}>
          <grund-checkbox parent name="select-all" value="all">All</grund-checkbox>
          <grund-checkbox name="proto" value="a">A</grund-checkbox>
          <grund-checkbox name="proto" value="b">B</grund-checkbox>
        </grund-checkbox-group>
      </form>
    `);
    const checkboxes = formEl.querySelectorAll<GrundCheckbox>('grund-checkbox');
    for (const checkbox of checkboxes) {
      await flush(checkbox);
    }

    const data = new FormData(formEl);
    expect(data.has('select-all')).to.be.false;
    expect(data.has('proto')).to.be.true;
  });

  it('emits the aggregate value detail when the parent checks all', async () => {
    const { el, checkboxes } = await setupCheckboxGroup(html`
      <grund-checkbox-group>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const handler = vi.fn();

    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[0]);

    expect(handler).toHaveBeenCalledOnce();
    const detail = handler.mock.calls[0][0].detail as CheckboxGroupValueChangeDetail;
    expect(detail.itemValue).to.equal('all');
    expect(detail.checked).to.equal(true);
    expect(detail.value).to.include.members(['a', 'b']);
  });

  it('fires the aggregate event in controlled mode without mutating rendered state', async () => {
    const { el, checkboxes } = await setupCheckboxGroup(html`
      <grund-checkbox-group .value=${['a']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const handler = vi.fn();

    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[0]);
    await flushCheckboxGroup(el);

    expect(handler).toHaveBeenCalledOnce();
    const detail = handler.mock.calls[0][0].detail as CheckboxGroupValueChangeDetail;
    expect(detail.itemValue).to.equal('all');
    expect(detail.checked).to.equal(true);
    expect(detail.value).to.include.members(['a', 'b']);
    expect(getCheckboxButton(checkboxes[0]).getAttribute('aria-checked')).to.equal('mixed');
    expect(getCheckboxButton(checkboxes[1]).getAttribute('aria-checked')).to.equal('true');
    expect(getCheckboxButton(checkboxes[2]).getAttribute('aria-checked')).to.equal('false');
  });

  it('excludes the parent checkbox value from toggle-all results', async () => {
    const { el, checkboxes } = await setupCheckboxGroup(html`
      <grund-checkbox-group>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const handler = vi.fn();

    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[0]);
    await flushCheckboxGroup(el);

    const detail = handler.mock.calls[0]?.[0]?.detail as CheckboxGroupValueChangeDetail;
    expect(detail).to.exist;
    expect(detail.value).to.include('a');
    expect(detail.value).to.include('b');
    expect(detail.value).to.not.include('all');
  });

  it('keeps the checkbox primitive working outside a group', async () => {
    const el = await fixture<GrundCheckbox>(html`<grund-checkbox value="x">X</grund-checkbox>`);
    await flush(el);

    const button = getCheckboxButton(el);
    button.click();
    await flush(el);

    expect(button.getAttribute('aria-checked')).to.equal('true');
  });

  it('warns when parent=true is used outside a group', async () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const el = await fixture<GrundCheckbox>(html`
      <grund-checkbox parent value="all">All</grund-checkbox>
    `);
    await flush(el);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[grund-checkbox] parent=true has no effect outside'),
    );
    warnSpy.mockRestore();
  });
});
