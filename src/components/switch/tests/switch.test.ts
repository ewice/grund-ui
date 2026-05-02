import { fixture, html, expect } from '@open-wc/testing';
import { describe, it, vi } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils';
import '../switch';
import '../switch-thumb';

import type { GrundSwitch } from '../switch';
import type { GrundSwitchThumb } from '../switch-thumb';
import type { CheckedChangeDetail } from '../types';

describe('GrundSwitch', () => {
  async function setup(template = html`<grund-switch></grund-switch>`) {
    const el = await fixture<GrundSwitch>(template);
    await flush(el);
    return el;
  }

  // ── Smoke test ─────────────────────────────────────────────────────────────

  it('mounts without errors and renders inner input with type=checkbox role=switch', async () => {
    const el = await setup();
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input).to.exist;
    expect(input.type).to.equal('checkbox');
    expect(input.getAttribute('role')).to.equal('switch');
  });

  // ── Initial state ───────────────────────────────────────────────────────────

  it('is unchecked by default', async () => {
    const el = await setup();
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(el.checked).to.be.undefined;
    expect(input.checked).to.be.false;
    expect(el.hasAttribute('data-unchecked')).to.be.true;
    expect(el.hasAttribute('data-checked')).to.be.false;
  });

  it('applies default-checked on first render', async () => {
    const el = await setup(html`<grund-switch default-checked></grund-switch>`);
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.checked).to.be.true;
    expect(el.hasAttribute('data-checked')).to.be.true;
    expect(el.hasAttribute('data-unchecked')).to.be.false;
  });

  it('is not disabled by default', async () => {
    const el = await setup();
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.disabled).to.be.false;
    expect(el.hasAttribute('data-disabled')).to.be.false;
  });

  it('value defaults to "on"', async () => {
    const el = await setup();
    expect(el.value).to.equal('on');
  });

  it('forwards host aria-label to the inner input', async () => {
    const el = await setup(html`<grund-switch aria-label="Enable notifications"></grund-switch>`);
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.getAttribute('aria-label')).to.equal('Enable notifications');
  });

  it('forwards host aria-labelledby to the inner input via element references', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <span id="sw-label">External label</span>
        <grund-switch aria-labelledby="sw-label"></grund-switch>
      </div>
    `);
    const el = container.querySelector<GrundSwitch>('grund-switch')!;
    await flush(el);
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.ariaLabelledByElements).to.have.length(1);
    expect(input.ariaLabelledByElements?.[0]?.id).to.equal('sw-label');
  });

  it('forwards host aria-describedby to the inner input via element references', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <span id="sw-desc">Helpful description</span>
        <grund-switch aria-describedby="sw-desc"></grund-switch>
      </div>
    `);
    const el = container.querySelector<GrundSwitch>('grund-switch')!;
    await flush(el);
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.ariaDescribedByElements).to.have.length(1);
    expect(input.ariaDescribedByElements?.[0]?.id).to.equal('sw-desc');
  });

  // ── Uncontrolled mode ───────────────────────────────────────────────────────

  it('toggles checked state on click (uncontrolled)', async () => {
    const el = await setup();
    const input = getByPart<HTMLInputElement>(el, 'input');
    el.click();
    await flush(el);
    expect(input.checked).to.be.true;
    expect(el.hasAttribute('data-checked')).to.be.true;
    expect(el.hasAttribute('data-unchecked')).to.be.false;
  });

  it('toggles back to unchecked on second click (uncontrolled)', async () => {
    const el = await setup();
    const input = getByPart<HTMLInputElement>(el, 'input');
    el.click();
    await flush(el);
    el.click();
    await flush(el);
    expect(input.checked).to.be.false;
    expect(el.hasAttribute('data-unchecked')).to.be.true;
  });

  it('fires grund-checked-change with checked:true on first click', async () => {
    const el = await setup();
    const events: CheckedChangeDetail[] = [];
    el.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });
    el.click();
    await flush(el);
    expect(events).to.have.length(1);
    expect(events[0].checked).to.be.true;
  });

  it('fires grund-checked-change with checked:false when toggling off', async () => {
    const el = await setup(html`<grund-switch default-checked></grund-switch>`);
    const events: CheckedChangeDetail[] = [];
    el.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });
    el.click();
    await flush(el);
    expect(events[0].checked).to.be.false;
  });

  // ── Controlled mode ─────────────────────────────────────────────────────────

  it('renders input.checked from controlled checked=true', async () => {
    const el = await setup(html`<grund-switch .checked=${true}></grund-switch>`);
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.checked).to.be.true;
  });

  it('fires event but does not update visual state in controlled mode', async () => {
    const el = await setup(html`<grund-switch .checked=${false}></grund-switch>`);
    const input = getByPart<HTMLInputElement>(el, 'input');
    const events: CheckedChangeDetail[] = [];
    el.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });

    el.click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].checked).to.be.true;
    // State unchanged — consumer did not update `checked`
    expect(input.checked).to.be.false;
  });

  it('updates display when controlled checked prop changes', async () => {
    const el = await setup(html`<grund-switch .checked=${false}></grund-switch>`);
    el.checked = true;
    await flush(el);
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.checked).to.be.true;
    expect(el.hasAttribute('data-checked')).to.be.true;
  });

  it('switches to uncontrolled when checked set to undefined', async () => {
    const el = await setup(html`<grund-switch .checked=${true}></grund-switch>`);
    el.checked = undefined;
    await flush(el);
    // Should use _internalChecked (false by default since no defaultChecked)
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.checked).to.be.false;
  });

  // ── Disabled ────────────────────────────────────────────────────────────────

  it('reflects disabled=true to inner input and data-disabled', async () => {
    const el = await setup(html`<grund-switch disabled></grund-switch>`);
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.disabled).to.be.true;
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  it('does not fire event when clicked while disabled', async () => {
    const el = await setup(html`<grund-switch disabled></grund-switch>`);
    let callCount = 0;
    el.addEventListener('grund-checked-change', () => {
      callCount++;
    });
    el.click();
    await flush(el);
    expect(callCount).to.equal(0);
  });

  it('reflects runtime disabled change', async () => {
    const el = await setup();
    el.disabled = true;
    await flush(el);
    const input = getByPart<HTMLInputElement>(el, 'input');
    expect(input.disabled).to.be.true;
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  // ── readOnly ────────────────────────────────────────────────────────────────

  it('sets data-readonly when readOnly=true', async () => {
    const el = await setup(html`<grund-switch read-only></grund-switch>`);
    expect(el.hasAttribute('data-readonly')).to.be.true;
  });

  it('does not fire event when clicked while readOnly', async () => {
    const el = await setup(html`<grund-switch read-only></grund-switch>`);
    let callCount = 0;
    el.addEventListener('grund-checked-change', () => {
      callCount++;
    });
    el.click();
    await flush(el);
    expect(callCount).to.equal(0);
  });

  // ── required ────────────────────────────────────────────────────────────────

  it('sets data-required when required=true', async () => {
    const el = await setup(html`<grund-switch required></grund-switch>`);
    expect(el.hasAttribute('data-required')).to.be.true;
  });

  // ── Event properties ────────────────────────────────────────────────────────

  it('grund-checked-change bubbles and is not composed', async () => {
    const el = await setup();
    let captured: CustomEvent | null = null;
    el.addEventListener('grund-checked-change', (e) => {
      captured = e as CustomEvent;
    });
    el.click();
    await flush(el);
    expect(captured).to.not.be.null;
    expect(captured!.bubbles).to.be.true;
    expect(captured!.composed).to.be.false;
  });

  // ── Independence ────────────────────────────────────────────────────────────

  it('two sibling switches have independent state', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <grund-switch id="a"></grund-switch>
        <grund-switch id="b"></grund-switch>
      </div>
    `);
    const a = container.querySelector<GrundSwitch>('#a')!;
    const b = container.querySelector<GrundSwitch>('#b')!;
    await flush(a);
    await flush(b);

    a.click();
    await flush(a);

    expect(getByPart<HTMLInputElement>(a, 'input').checked).to.be.true;
    expect(getByPart<HTMLInputElement>(b, 'input').checked).to.be.false;
  });

  // ── Form participation ──────────────────────────────────────────────────────

  it('FormData includes value when checked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-switch name="notif" .checked=${true}></grund-switch>
      </form>
    `);
    const sw = form.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    expect(new FormData(form).get('notif')).to.equal('on');
  });

  it('FormData excludes value when unchecked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-switch name="notif"></grund-switch>
      </form>
    `);
    const sw = form.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    expect(new FormData(form).get('notif')).to.be.null;
  });

  it('FormData excludes value when disabled=true', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-switch name="notif" default-checked disabled></grund-switch>
      </form>
    `);
    const sw = form.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    expect(new FormData(form).get('notif')).to.be.null;
  });

  it('FormData includes value when readOnly=true', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-switch name="notif" default-checked read-only></grund-switch>
      </form>
    `);
    const sw = form.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    expect(new FormData(form).get('notif')).to.equal('on');
  });

  it('formResetCallback resets to defaultChecked state', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-switch name="notif" default-checked></grund-switch>
      </form>
    `);
    const sw = form.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    sw.click();
    await flush(sw);
    expect(sw.hasAttribute('data-unchecked')).to.be.true;
    form.reset();
    await flush(sw);
    expect(sw.hasAttribute('data-checked')).to.be.true;
  });

  it('formDisabledCallback propagates disabled from fieldset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <grund-switch name="notif"></grund-switch>
        </fieldset>
      </form>
    `);
    const sw = form.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    expect(sw.hasAttribute('data-disabled')).to.be.true;
    expect(getByPart<HTMLInputElement>(sw, 'input').disabled).to.be.true;
  });

  // ── Label association ───────────────────────────────────────────────────────

  it('<label for> association toggles switch on label click', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <label for="sw-label-fwd">Toggle</label>
        <grund-switch id="sw-label-fwd"></grund-switch>
      </div>
    `);
    const label = container.querySelector<HTMLLabelElement>('label')!;
    const sw = container.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    expect(sw.hasAttribute('data-unchecked')).to.be.true;
    label.click();
    await flush(sw);
    expect(sw.hasAttribute('data-checked')).to.be.true;
  });

  it('uses external label-for association as the input accessible name', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <label for="sw-name-only">Notifications</label>
        <grund-switch id="sw-name-only"></grund-switch>
      </div>
    `);
    const sw = container.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    const input = getByPart<HTMLInputElement>(sw, 'input');
    expect(input.ariaLabelledByElements).to.have.length(1);
    expect(input.ariaLabelledByElements?.[0]?.tagName).to.equal('LABEL');
  });

  it('wrapping label click fires grund-checked-change exactly once', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <label>
        <grund-switch id="sw-wrap"></grund-switch>
        Enable
      </label>
    `);
    const sw = container.querySelector<GrundSwitch>('grund-switch')!;
    await flush(sw);
    const events: CheckedChangeDetail[] = [];
    sw.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });
    container.click();
    await flush(sw);
    expect(events).to.have.length(1);
    expect(events[0].checked).to.be.true;
  });

  // ── Memory ─────────────────────────────────────────────────────────────────

  it('cleans up host click listener on disconnect', async () => {
    const addSpy = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const removeSpy = vi.spyOn(EventTarget.prototype, 'removeEventListener');

    const el = await setup();
    await flush(el);
    const hostClickAdds = addSpy.mock.calls.filter(
      (args, i) => addSpy.mock.contexts[i] === el && args[0] === 'click',
    ).length;

    el.remove();
    const hostClickRemoves = removeSpy.mock.calls.filter(
      (args, i) => removeSpy.mock.contexts[i] === el && args[0] === 'click',
    ).length;

    expect(hostClickRemoves).to.equal(hostClickAdds);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe('GrundSwitchThumb', () => {
  async function setupWithThumb(
    template = html`
      <grund-switch>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
    `,
  ) {
    const el = await fixture<GrundSwitch>(template);
    await flush(el);
    const thumb = el.querySelector<GrundSwitchThumb>('grund-switch-thumb')!;
    return { el, thumb };
  }

  it('renders part="thumb" span', async () => {
    const { thumb } = await setupWithThumb();
    const span = getByPart<HTMLElement>(thumb, 'thumb');
    expect(span).to.exist;
  });

  it('thumb has data-unchecked when switch is unchecked', async () => {
    const { thumb } = await setupWithThumb();
    expect(thumb.hasAttribute('data-unchecked')).to.be.true;
    expect(thumb.hasAttribute('data-checked')).to.be.false;
  });

  it('thumb has data-checked when switch is checked', async () => {
    const { el, thumb } = await setupWithThumb(html`
      <grund-switch default-checked>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
    `);
    await flush(el);
    expect(thumb.hasAttribute('data-checked')).to.be.true;
    expect(thumb.hasAttribute('data-unchecked')).to.be.false;
  });

  it('thumb data attributes update when switch state changes', async () => {
    const { el, thumb } = await setupWithThumb();

    expect(thumb.hasAttribute('data-unchecked')).to.be.true;

    el.click();
    await flush(el);

    expect(thumb.hasAttribute('data-checked')).to.be.true;
    expect(thumb.hasAttribute('data-unchecked')).to.be.false;
  });

  it('thumb reflects data-disabled from switch', async () => {
    const { el, thumb } = await setupWithThumb(html`
      <grund-switch disabled>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
    `);
    await flush(el);
    expect(thumb.hasAttribute('data-disabled')).to.be.true;
  });

  it('thumb reflects data-readonly from switch', async () => {
    const { el, thumb } = await setupWithThumb(html`
      <grund-switch read-only>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
    `);
    await flush(el);
    expect(thumb.hasAttribute('data-readonly')).to.be.true;
  });

  it('thumb reflects data-required from switch', async () => {
    const { el, thumb } = await setupWithThumb(html`
      <grund-switch required>
        <grund-switch-thumb></grund-switch-thumb>
      </grund-switch>
    `);
    await flush(el);
    expect(thumb.hasAttribute('data-required')).to.be.true;
  });
});
