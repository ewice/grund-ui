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

  // ── Child registration ────────────────────────────────────────────────────

  describe('child registration', () => {
    it('derives parent state from registered non-parent checkboxes without allValues', async () => {
      // When all non-parent children are checked, parent should be 'checked'
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
      // Appending a new child should update the engine's selectable set via registration,
      // so parent state reflects the new aggregate.
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

    it('does not change the checked state of checkboxes in controlled mode when the consumer does not update value', async () => {
      const { el, checkboxes } = await setup(html`
        <grund-checkbox-group .value=${['a']}>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);

      clickCheckbox(checkboxes[1]); // controlled mode — consumer does not update value prop
      await flush(el);
      await flush(checkboxes[0]);
      await flush(checkboxes[1]);

      // In controlled mode, the checked state must not change (consumer owns the state)
      expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('true');
      expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('false');
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

  // ── Migration behavior ────────────────────────────────────────────────────

  describe('migration behavior', () => {
    it('logs a deprecation warning in dev when allValues prop is used', async () => {
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
      // With registration, derived selectable set excludes the parent, so only {a, b} toggle.
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

  // ── Memory and lifecycle ──────────────────────────────────────────────────

  describe('memory and lifecycle', () => {
    it('removes the click listener on disconnect', async () => {
      const { el, checkboxes } = await setup(html`
        <grund-checkbox-group>
          <grund-checkbox value="a">A</grund-checkbox>
        </grund-checkbox-group>
      `);
      await flush(el);

      const removeSpy = vi.spyOn(checkboxes[0], 'removeEventListener');

      el.remove();

      vitestExpect(removeSpy).toHaveBeenCalledWith('click', vitestExpect.any(Function));
      removeSpy.mockRestore();
    });
  });

  // ── Sibling-group isolation ───────────────────────────────────────────────

  describe('sibling-group isolation', () => {
    it('two sibling checkbox groups do not share state', async () => {
      const container = await fixture<HTMLDivElement>(html`
        <div>
          <grund-checkbox-group id="group-a">
            <grund-checkbox value="x">X</grund-checkbox>
          </grund-checkbox-group>
          <grund-checkbox-group id="group-b">
            <grund-checkbox value="x">X</grund-checkbox>
          </grund-checkbox-group>
        </div>
      `);

      const groupA = container.querySelector<GrundCheckboxGroup>('#group-a')!;
      const groupB = container.querySelector<GrundCheckboxGroup>('#group-b')!;
      const [cbA] = Array.from(groupA.querySelectorAll<GrundCheckbox>('grund-checkbox'));
      const [cbB] = Array.from(groupB.querySelectorAll<GrundCheckbox>('grund-checkbox'));

      await flush(groupA);
      await flush(groupB);
      await flush(cbA);
      await flush(cbB);

      const handlerB = vi.fn();
      groupB.addEventListener('grund-value-change', handlerB as EventListener);

      // Click checkbox in group A
      clickCheckbox(cbA);
      await flush(groupA);
      await flush(groupB);
      await flush(cbA);
      await flush(cbB);

      // Group A's checkbox should be checked
      expect(getByPart(cbA, 'button').getAttribute('aria-checked')).to.equal('true');
      // Group B's checkbox must remain unchecked
      expect(getByPart(cbB, 'button').getAttribute('aria-checked')).to.equal('false');
      // Group B must NOT have fired an event
      vitestExpect(handlerB).not.toHaveBeenCalled();
    });
  });

  // ── Dynamic registration ──────────────────────────────────────────────────

  describe('dynamic registration', () => {
    it('unregisters a child checkbox when it is removed from the DOM', async () => {
      const el = await fixture<GrundCheckboxGroup>(html`
        <grund-checkbox-group .defaultValue=${['a']}>
          <grund-checkbox parent value="all">All</grund-checkbox>
          <grund-checkbox value="a">A</grund-checkbox>
          <grund-checkbox value="b">B</grund-checkbox>
        </grund-checkbox-group>
      `);
      await flush(el);
      const checkboxes = el.querySelectorAll<GrundCheckbox>('grund-checkbox');
      for (const cb of checkboxes) await flush(cb);

      // Both a and b registered: a is checked → indeterminate parent
      const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
      expect(parentBtn.getAttribute('aria-checked')).to.equal('mixed');

      // Remove checkbox b — derived set becomes {a}, a is checked → parent = checked
      checkboxes[2].remove();
      await flush(el);
      for (const cb of el.querySelectorAll<GrundCheckbox>('grund-checkbox')) {
        await flush(cb);
      }

      expect(parentBtn.getAttribute('aria-checked')).to.equal('true');
    });

    it('resubscribes to a new group after reparenting', async () => {
      const container = await fixture<HTMLDivElement>(html`
        <div>
          <grund-checkbox-group id="group-a">
            <grund-checkbox value="x">X</grund-checkbox>
          </grund-checkbox-group>
          <grund-checkbox-group id="group-b">
            <grund-checkbox value="y">Y</grund-checkbox>
          </grund-checkbox-group>
        </div>
      `);

      const groupA = container.querySelector<GrundCheckboxGroup>('#group-a')!;
      const groupB = container.querySelector<GrundCheckboxGroup>('#group-b')!;
      const cbX = groupA.querySelector<GrundCheckbox>('grund-checkbox')!;

      await flush(groupA);
      await flush(groupB);
      await flush(cbX);

      // Move cbX from group A to group B
      groupB.appendChild(cbX);
      await flush(groupA);
      await flush(groupB);
      await flush(cbX);

      const handlerA = vi.fn();
      const handlerB = vi.fn();
      groupA.addEventListener('grund-value-change', handlerA as EventListener);
      groupB.addEventListener('grund-value-change', handlerB as EventListener);

      clickCheckbox(cbX);
      await flush(groupA);
      await flush(groupB);
      await flush(cbX);

      // Event must fire on group B (the new home), not group A
      vitestExpect(handlerB).toHaveBeenCalledOnce();
      vitestExpect(handlerA).not.toHaveBeenCalled();
    });

    it('registers children that are appended after the group has already mounted', async () => {
      const el = await fixture<GrundCheckboxGroup>(html`
        <grund-checkbox-group .defaultValue=${['a', 'b']}>
        </grund-checkbox-group>
      `);
      await flush(el);

      // Append children after the group has already mounted
      const cbA = document.createElement('grund-checkbox') as GrundCheckbox;
      const cbB = document.createElement('grund-checkbox') as GrundCheckbox;
      const cbParent = document.createElement('grund-checkbox') as GrundCheckbox;
      (cbA as any).value = 'a';
      cbA.textContent = 'A';
      (cbB as any).value = 'b';
      cbB.textContent = 'B';
      (cbParent as any).parent = true;
      (cbParent as any).value = 'all';
      cbParent.textContent = 'All';

      el.appendChild(cbParent);
      el.appendChild(cbA);
      el.appendChild(cbB);

      await flush(el);
      for (const cb of el.querySelectorAll<GrundCheckbox>('grund-checkbox')) {
        await flush(cb);
      }

      // All three should be registered; a and b are checked → parent = 'checked'
      const parentBtn = getByPart<HTMLButtonElement>(cbParent, 'button');
      expect(parentBtn.getAttribute('aria-checked')).to.equal('true');
    });
  });

});
