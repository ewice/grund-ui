import { fixture, html, expect } from '@open-wc/testing';
import { describe, it, vi, expect as vitestExpect } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils.js';
import '../checkbox-group.js';
import '../../checkbox/checkbox.js';
import '../../checkbox/checkbox-indicator.js';

import type { GrundCheckboxGroup } from '../checkbox-group.js';
import type { GrundCheckbox } from '../../checkbox/checkbox.js';
import type { CheckboxGroupValueChangeDetail } from '../types.js';

describe('GrundCheckboxGroup', () => {
  // ── Helpers ──────────────────────────────────────────────────────────────

  async function setup(
    template = html`
      <grund-checkbox-group>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
        <grund-checkbox value="c">C</grund-checkbox>
      </grund-checkbox-group>
    `,
  ) {
    const el = await fixture<GrundCheckboxGroup>(template);
    await flush(el);
    // Flush child checkboxes too
    const checkboxes = el.querySelectorAll<GrundCheckbox>('grund-checkbox');
    for (const cb of checkboxes) await flush(cb);
    return { el, checkboxes: Array.from(checkboxes) };
  }

  function clickCheckbox(cb: GrundCheckbox): void {
    const btn = getByPart<HTMLButtonElement>(cb, 'button');
    btn.click();
  }

  // ── Smoke ────────────────────────────────────────────────────────────────

  it('renders a slot', async () => {
    const { el } = await setup();
    expect(el.shadowRoot?.querySelector('slot')).to.exist;
  });

  // ── Uncontrolled mode ──────────────────────────────────────────────────

  it('starts with no checkboxes checked by default', async () => {
    const { checkboxes } = await setup();
    for (const cb of checkboxes) {
      const btn = getByPart<HTMLButtonElement>(cb, 'button');
      expect(btn.getAttribute('aria-checked')).to.equal('false');
    }
  });

  it('seeds from defaultValue', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .defaultValue=${['a', 'c']}>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
        <grund-checkbox value="c">C</grund-checkbox>
      </grund-checkbox-group>
    `);
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('true');
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('false');
    expect(getByPart(checkboxes[2], 'button').getAttribute('aria-checked')).to.equal('true');
  });

  it('clicking a checkbox updates group state', async () => {
    const { el, checkboxes } = await setup();
    clickCheckbox(checkboxes[0]);
    await flush(el);
    for (const cb of checkboxes) await flush(cb);
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('true');
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('false');
  });

  // ── Events ───────────────────────────────────────────────────────────────

  it('fires grund-value-change with correct detail', async () => {
    const { el, checkboxes } = await setup();
    const handler = vi.fn();
    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[1]);
    vitestExpect(handler).toHaveBeenCalledOnce();
    const detail = handler.mock.calls[0][0].detail as CheckboxGroupValueChangeDetail;
    expect(detail.value).to.deep.equal(['b']);
    expect(detail.itemValue).to.equal('b');
    expect(detail.checked).to.equal(true);
  });

  it('fires grund-checked-change from individual checkbox', async () => {
    const { checkboxes } = await setup();
    const handler = vi.fn();
    checkboxes[0].addEventListener('grund-checked-change', handler as EventListener);
    clickCheckbox(checkboxes[0]);
    vitestExpect(handler).toHaveBeenCalledOnce();
  });

  it('fires grund-checked-change before grund-value-change', async () => {
    const { el, checkboxes } = await setup();
    const events: string[] = [];
    checkboxes[0].addEventListener('grund-checked-change', () => events.push('grund-checked-change'));
    el.addEventListener('grund-value-change', () => events.push('grund-value-change'));
    clickCheckbox(checkboxes[0]);
    expect(events).to.deep.equal(['grund-checked-change', 'grund-value-change']);
  });

  // ── Controlled mode ────────────────────────────────────────────────────

  it('reflects controlled value prop', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .value=${['b']}>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('false');
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('true');
  });

  it('does not auto-update in controlled mode', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .value=${[]}>
        <grund-checkbox value="a">A</grund-checkbox>
      </grund-checkbox-group>
    `);
    clickCheckbox(checkboxes[0]);
    await flush(el);
    await flush(checkboxes[0]);
    // State unchanged because consumer didn't update value prop
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('false');
  });

  // ── Disabled ─────────────────────────────────────────────────────────────

  it('group disabled propagates to children', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group disabled>
        <grund-checkbox value="a">A</grund-checkbox>
      </grund-checkbox-group>
    `);
    expect(el.hasAttribute('data-disabled')).to.be.true;
    // Clicking should not fire event
    const handler = vi.fn();
    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[0]);
    vitestExpect(handler).not.toHaveBeenCalled();
  });

  it('individually disabled checkbox still blocked', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group>
        <grund-checkbox value="a" disabled>A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const handler = vi.fn();
    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[0]); // disabled
    vitestExpect(handler).not.toHaveBeenCalled();
    clickCheckbox(checkboxes[1]); // enabled
    vitestExpect(handler).toHaveBeenCalledOnce();
  });

  // ── Parent checkbox ──────────────────────────────────────────────────────

  it('parent checkbox shows checked when all children checked', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .defaultValue=${['a', 'b']} .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
    expect(parentBtn.getAttribute('aria-checked')).to.equal('true');
  });

  it('parent checkbox shows mixed when some children checked', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .defaultValue=${['a']} .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
    expect(parentBtn.getAttribute('aria-checked')).to.equal('mixed');
  });

  it('parent checkbox shows unchecked when no children checked', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
    expect(parentBtn.getAttribute('aria-checked')).to.equal('false');
  });

  it('clicking parent checks all when unchecked', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    clickCheckbox(checkboxes[0]); // parent
    await flush(el);
    for (const cb of checkboxes) await flush(cb);
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('true');
    expect(getByPart(checkboxes[2], 'button').getAttribute('aria-checked')).to.equal('true');
  });

  it('clicking parent unchecks all when all checked', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .defaultValue=${['a', 'b']} .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    clickCheckbox(checkboxes[0]); // parent — all checked → uncheck all
    await flush(el);
    for (const cb of checkboxes) await flush(cb);
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('false');
    expect(getByPart(checkboxes[2], 'button').getAttribute('aria-checked')).to.equal('false');
  });

  it('parent checkbox does not submit a form value', async () => {
    const formEl = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox-group .defaultValue=${['a']} .allValues=${['a', 'b']}>
          <grund-checkbox parent name="select-all" value="all">All</grund-checkbox>
          <grund-checkbox name="proto" value="a">A</grund-checkbox>
          <grund-checkbox name="proto" value="b">B</grund-checkbox>
        </grund-checkbox-group>
      </form>
    `);
    await flush(formEl);
    const checkboxes = formEl.querySelectorAll<GrundCheckbox>('grund-checkbox');
    for (const cb of checkboxes) await flush(cb);

    const data = new FormData(formEl);
    // Parent checkbox (name="select-all") must not appear in FormData
    expect(data.has('select-all')).to.be.false;
    // Regular checked checkbox (value="a") should appear
    expect(data.has('proto')).to.be.true;
  });

  it('grund-value-change detail is correct when parent checks all', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const handler = vi.fn();
    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[0]); // parent — unchecked → check all
    vitestExpect(handler).toHaveBeenCalledOnce();
    const detail = handler.mock.calls[0][0].detail as CheckboxGroupValueChangeDetail;
    expect(detail.itemValue).to.equal('all');
    expect(detail.checked).to.equal(true);
    expect(detail.value).to.include.members(['a', 'b']);
  });

  // ── Standalone checkbox regression ────────────────────────────────────

  it('checkbox outside group works as before', async () => {
    const el = await fixture<GrundCheckbox>(html`<grund-checkbox value="x">X</grund-checkbox>`);
    await flush(el);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    btn.click();
    await flush(el);
    expect(btn.getAttribute('aria-checked')).to.equal('true');
  });

  // ── Form submission ───────────────────────────────────────────────────────

  it('checked checkboxes in a group submit their form values', async () => {
    const formEl = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox-group .defaultValue=${['https']}>
          <grund-checkbox name="proto" value="http">HTTP</grund-checkbox>
          <grund-checkbox name="proto" value="https">HTTPS</grund-checkbox>
          <grund-checkbox name="proto" value="ftp">FTP</grund-checkbox>
        </grund-checkbox-group>
      </form>
    `);
    await flush(formEl);
    const checkboxes = formEl.querySelectorAll<GrundCheckbox>('grund-checkbox');
    for (const cb of checkboxes) await flush(cb);

    const data = new FormData(formEl);
    const values = data.getAll('proto');
    // Only 'https' was in defaultValue — only it should submit
    expect(values).to.deep.equal(['https']);
  });
});
