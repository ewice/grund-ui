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
    for (const cb of checkboxes) {
      await flush(cb);
    }
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

  it('renders an inner group wrapper with role=group', async () => {
    const { el } = await setup();
    const group = el.shadowRoot?.querySelector<HTMLElement>('[part="group"]');
    expect(group).to.exist;
    expect(group?.getAttribute('role')).to.equal('group');
  });

  it('forwards host aria-label to the group wrapper', async () => {
    const { el } = await setup(html`
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
    for (const cb of checkboxes) {
      await flush(cb);
    }
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
    expect(handler.mock.calls).to.have.length(1);
  });

  it('fires grund-checked-change before grund-value-change', async () => {
    const { el, checkboxes } = await setup();
    const events: string[] = [];
    checkboxes[0].addEventListener('grund-checked-change', () =>
      events.push('grund-checked-change'),
    );
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

  it('fires grund-value-change in controlled mode without mutating rendered state', async () => {
    const { el, checkboxes } = await setup(html`
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
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('false');
  });

  it('updates rendered checkbox state when the controlled value prop changes after mount', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .value=${['a']}>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);

    el.value = ['b'];
    await flush(el);
    for (const cb of checkboxes) {
      await flush(cb);
    }

    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('false');
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('true');
  });

  it('re-renders when switching from controlled empty array to uncontrolled', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .value=${[]}>
        <grund-checkbox value="a">A</grund-checkbox>
      </grund-checkbox-group>
    `);
    // Currently controlled, clicking should not change state
    clickCheckbox(checkboxes[0]);
    await flush(el);
    await flush(checkboxes[0]);
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('false');

    // Switch to uncontrolled
    el.value = undefined;
    await flush(el);
    await flush(checkboxes[0]);

    // Now clicking should update state
    clickCheckbox(checkboxes[0]);
    await flush(el);
    await flush(checkboxes[0]);
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('true');
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
    expect(handler.mock.calls).to.have.length(0);
    clickCheckbox(checkboxes[1]); // enabled
    expect(handler.mock.calls).to.have.length(1);
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
    for (const cb of checkboxes) {
      await flush(cb);
    }
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
    for (const cb of checkboxes) {
      await flush(cb);
    }
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
    const checkboxes = formEl.querySelectorAll<GrundCheckbox>('grund-checkbox');
    for (const cb of checkboxes) {
      await flush(cb);
    }

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

  // ── Child registration (target architecture) ─────────────────────────────
  // These tests describe the intended behavior AFTER the allValues refactor.
  // They are expected to FAIL until the registration-based architecture is implemented.

  describe('child registration (target architecture)', () => {
    it('derives parent state from registered non-parent checkboxes without allValues', async () => {
      // When all non-parent children are checked, parent should be 'checked'
      // Currently FAILS: without allValues, engine._allValues is [], getParentState() returns 'unchecked'
      const { checkboxes } = await setup(html`
        <grund-checkbox-group .defaultValue=${['a', 'b']}>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);
      const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
      expect(parentBtn.getAttribute('aria-checked')).to.equal('true');
    });

    it('updates parent state when a child checkbox is added after mount', async () => {
      // Currently FAILS: no registration mechanism exists, so appending a new child
      // does not update the engine's selectable set and parent state stays stale.
      const el = await fixture<GrundCheckboxGroup>(html`
        <grund-checkbox-group .defaultValue=${['a']}>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);
      await flush(el);
      const initialCheckboxes = el.querySelectorAll<GrundCheckbox>('grund-checkbox');
      for (const cb of initialCheckboxes) {
        await flush(cb);
      }

      // Append a new unchecked checkbox 'b' — derived set becomes {a, b}, 'a' is checked → indeterminate
      const newCb = document.createElement('grund-checkbox') as GrundCheckbox;
      (newCb as any).value = 'b';
      newCb.textContent = 'B';
      el.appendChild(newCb);
      await flush(newCb);
      await flush(el);
      for (const cb of el.querySelectorAll<GrundCheckbox>('grund-checkbox')) {
        await flush(cb);
      }

      const parentBtn = getByPart<HTMLButtonElement>(initialCheckboxes[0], 'button');
      expect(parentBtn.getAttribute('aria-checked')).to.equal('mixed');
    });

    it('does not republish checkbox group state on controlled toggle without a value prop change', async () => {
      // Currently FAILS: _handleToggle() always calls _publishGroupContext(), which replaces
      // the groupCtx object reference even in controlled mode where no state change occurred.
      const { el, checkboxes } = await setup(html`
        <grund-checkbox-group .value=${['a']}>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);

      // Capture the groupCtx reference before the click
      const ctxBefore = (el as any).groupCtx;
      clickCheckbox(checkboxes[1]); // controlled mode — consumer does not update value prop
      await flush(el);
      await flush(checkboxes[0]);
      await flush(checkboxes[1]);

      // In controlled mode, without a value prop change, context should NOT have been republished
      const ctxAfter = (el as any).groupCtx;
      expect(ctxBefore).to.equal(ctxAfter); // same object reference = no republish
    });
  });

  // ── Select-all ownership boundary ────────────────────────────────────────

  describe('select-all ownership boundary', () => {
    it('parent checkbox aggregate state is driven by the group, not the primitive', async () => {
      // Parent checkbox reflects aggregate group state — checked only when all non-parent are checked
      const { checkboxes } = await setup(html`
        <grund-checkbox-group .defaultValue=${['a', 'b']}>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);
      const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
      expect(parentBtn.getAttribute('aria-checked')).to.equal('true');
    });

    it('non-parent checkboxes remain simple value items unaffected by aggregate logic', async () => {
      // Individual item checkboxes are not affected by parent/aggregate logic
      const { checkboxes } = await setup(html`
        <grund-checkbox-group .defaultValue=${['a']}>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);
      expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('true');
      expect(getByPart(checkboxes[2], 'button').getAttribute('aria-checked')).to.equal('false');
    });

    it('parent checkbox never contributes a submitted form value', async () => {
      const formEl = await fixture<HTMLFormElement>(html`
        <form>
          <grund-checkbox-group .defaultValue=${['a', 'b']}>
            <grund-checkbox parent name="select-all" value="all">All</grund-checkbox>
            <grund-checkbox name="item" value="a">A</grund-checkbox>
            <grund-checkbox name="item" value="b">B</grund-checkbox>
          </grund-checkbox-group>
        </form>
      `);
      const checkboxes = formEl.querySelectorAll<GrundCheckbox>('grund-checkbox');
      for (const cb of checkboxes) {
        await flush(cb);
      }
      const data = new FormData(formEl);
      expect(data.has('select-all')).to.be.false;
      expect(data.getAll('item')).to.deep.equal(['a', 'b']);
    });

    it('emits a dev warning when parent=true is used outside a group', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      const el = await fixture<GrundCheckbox>(html`
        <grund-checkbox parent value="all">All</grund-checkbox>
      `);
      await flush(el);
      vitestExpect(warnSpy).toHaveBeenCalledWith(
        vitestExpect.stringContaining('[grund-checkbox] parent=true has no effect outside'),
      );
      warnSpy.mockRestore();
    });

    it('emits a dev warning when multiple parent checkboxes are registered in the same group', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      await setup(html`
        <grund-checkbox-group>
          <grund-checkbox parent value="all1">All 1</grund-checkbox>
          <grund-checkbox parent value="all2">All 2</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);
      vitestExpect(warnSpy).toHaveBeenCalledWith(
        vitestExpect.stringContaining('[grund-checkbox-group]'),
        vitestExpect.stringContaining('Multiple parent checkboxes'),
      );
      warnSpy.mockRestore();
    });
  });

  // ── Migration behavior (target architecture) ──────────────────────────────
  // These tests describe compatibility behavior during/after the allValues migration.
  // They are expected to FAIL until the deprecation warnings are implemented.

  describe('migration behavior (target architecture)', () => {
    it('logs a deprecation warning in dev when allValues prop is used', async () => {
      // Currently FAILS: no deprecation warning is emitted for allValues usage
      const warnSpy = vi.spyOn(console, 'warn');
      await setup(html`
        <grund-checkbox-group .allValues=${['a', 'b']}>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);
      vitestExpect(warnSpy).toHaveBeenCalledWith(
        vitestExpect.stringContaining('[grund-checkbox-group]'),
        vitestExpect.stringContaining('allValues'),
      );
      warnSpy.mockRestore();
    });

    it('logs a dev warning when duplicate child values are registered', async () => {
      // Currently FAILS: no duplicate-value warning exists in the registration path
      const warnSpy = vi.spyOn(console, 'warn');
      await setup(html`
        <grund-checkbox-group>
          <grund-checkbox value="a">A1</grund-checkbox>
          <grund-checkbox value="a">A2</grund-checkbox>
        </grund-checkbox-group>
      `);
      vitestExpect(warnSpy).toHaveBeenCalledWith(
        vitestExpect.stringContaining('[grund-checkbox-group]'),
        vitestExpect.stringContaining('duplicate'),
      );
      warnSpy.mockRestore();
    });

    it('excludes parent checkboxes from the derived selectable values used by toggleAll', async () => {
      // Currently FAILS: requestToggleAll uses _allValues (empty without allValues prop),
      // so it has no children to toggle. With registration, derived set should be {a, b} only.
      const { el, checkboxes } = await setup(html`
        <grund-checkbox-group>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);
      const handler = vi.fn();
      el.addEventListener('grund-value-change', handler as EventListener);
      clickCheckbox(checkboxes[0]); // parent — should check a and b, not 'all'
      await flush(el);
      for (const cb of checkboxes) {
        await flush(cb);
      }
      // 'all' (parent) must not appear in the new value set
      const detail = handler.mock.calls[0]?.[0]?.detail as CheckboxGroupValueChangeDetail;
      expect(detail).to.exist;
      expect(detail.value).to.include('a');
      expect(detail.value).to.include('b');
      expect(detail.value).to.not.include('all');
    });
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
    const checkboxes = formEl.querySelectorAll<GrundCheckbox>('grund-checkbox');
    for (const cb of checkboxes) {
      await flush(cb);
    }

    const data = new FormData(formEl);
    const values = data.getAll('proto');
    // Only 'https' was in defaultValue — only it should submit
    expect(values).to.deep.equal(['https']);
  });

});
