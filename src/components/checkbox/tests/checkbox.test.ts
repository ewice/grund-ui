import { fixture, html, expect } from '@open-wc/testing';
import { describe, it, vi } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils.js';
import '../checkbox.js';
import '../checkbox-indicator.js';

import type { GrundCheckbox } from '../checkbox.js';
import type { GrundCheckboxIndicator } from '../checkbox-indicator.js';
import type { CheckedChangeDetail } from '../types.js';

describe('GrundCheckbox', () => {
  async function setup(
    template = html`<grund-checkbox>Label</grund-checkbox>`,
  ) {
    const el = await fixture<GrundCheckbox>(template);
    await flush(el);
    return el;
  }

  // ── Smoke test ─────────────────────────────────────────────────────────────

  it('mounts without errors and renders inner button with role=checkbox', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn).to.exist;
    expect(btn.tagName).to.equal('BUTTON');
    expect(btn.getAttribute('role')).to.equal('checkbox');
  });

  // ── Initial state ───────────────────────────────────────────────────────────

  it('is unchecked by default', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(el.checked).to.be.undefined;
    expect(btn.getAttribute('aria-checked')).to.equal('false');
    expect(el.hasAttribute('data-unchecked')).to.be.true;
    expect(el.hasAttribute('data-checked')).to.be.false;
    expect(el.hasAttribute('data-indeterminate')).to.be.false;
  });

  it('applies default-checked on first render', async () => {
    const el = await setup(
      html`<grund-checkbox default-checked>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('true');
    expect(el.hasAttribute('data-checked')).to.be.true;
    expect(el.hasAttribute('data-unchecked')).to.be.false;
  });

  it('is not disabled by default', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.false;
    expect(el.hasAttribute('data-disabled')).to.be.false;
  });

  it('value defaults to "on"', async () => {
    const el = await setup();
    expect(el.value).to.equal('on');
  });

  // ── Uncontrolled mode ───────────────────────────────────────────────────────

  it('toggles checked state on click (uncontrolled)', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    btn.click();
    await flush(el);
    expect(btn.getAttribute('aria-checked')).to.equal('true');
    expect(el.hasAttribute('data-checked')).to.be.true;
    expect(el.hasAttribute('data-unchecked')).to.be.false;
  });

  it('toggles back to unchecked on second click (uncontrolled)', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    btn.click();
    await flush(el);
    btn.click();
    await flush(el);
    expect(btn.getAttribute('aria-checked')).to.equal('false');
    expect(el.hasAttribute('data-unchecked')).to.be.true;
  });

  it('fires grund-checked-change with checked:true on first click', async () => {
    const el = await setup();
    const events: CheckedChangeDetail[] = [];
    el.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(events).to.have.length(1);
    expect(events[0].checked).to.be.true;
  });

  it('fires grund-checked-change with checked:false when toggling off', async () => {
    const el = await setup(
      html`<grund-checkbox default-checked>Label</grund-checkbox>`,
    );
    const events: CheckedChangeDetail[] = [];
    el.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(events[0].checked).to.be.false;
  });

  // ── Controlled mode ─────────────────────────────────────────────────────────

  it('renders aria-checked from controlled checked=true', async () => {
    const el = await setup(
      html`<grund-checkbox .checked=${true}>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('true');
  });

  it('fires event but does not update visual state in controlled mode', async () => {
    const el = await setup(
      html`<grund-checkbox .checked=${false}>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    const events: CheckedChangeDetail[] = [];
    el.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });

    btn.click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].checked).to.be.true;
    // State unchanged — consumer did not update `checked`
    expect(btn.getAttribute('aria-checked')).to.equal('false');
  });

  it('updates display when controlled checked prop changes', async () => {
    const el = await setup(
      html`<grund-checkbox .checked=${false}>Label</grund-checkbox>`,
    );
    el.checked = true;
    await flush(el);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('true');
    expect(el.hasAttribute('data-checked')).to.be.true;
  });

  it('switches to uncontrolled when checked set to undefined', async () => {
    const el = await setup(
      html`<grund-checkbox .checked=${true}>Label</grund-checkbox>`,
    );
    el.checked = undefined;
    await flush(el);
    // Should use _internalChecked (false by default since no defaultChecked)
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('false');
  });

  // ── Indeterminate state ─────────────────────────────────────────────────────

  it('renders aria-checked=mixed when indeterminate=true', async () => {
    const el = await setup(
      html`<grund-checkbox .indeterminate=${true}>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('mixed');
    expect(el.hasAttribute('data-indeterminate')).to.be.true;
    expect(el.hasAttribute('data-checked')).to.be.false;
    expect(el.hasAttribute('data-unchecked')).to.be.false;
  });

  it('clicking indeterminate checkbox fires grund-checked-change with checked:true', async () => {
    const el = await setup(
      html`<grund-checkbox .indeterminate=${true}>Label</grund-checkbox>`,
    );
    const events: CheckedChangeDetail[] = [];
    el.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(events).to.have.length(1);
    expect(events[0].checked).to.be.true;
  });

  it('indeterminate is not cleared automatically on click', async () => {
    const el = await setup(
      html`<grund-checkbox .indeterminate=${true}>Label</grund-checkbox>`,
    );
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    // Consumer must clear indeterminate manually — verify via the observable data attribute.
    expect(el.hasAttribute('data-indeterminate')).to.be.true;
  });

  it('disabled + indeterminate: no event fires and aria-checked=mixed', async () => {
    const el = await setup(
      html`<grund-checkbox disabled .indeterminate=${true}>Label</grund-checkbox>`,
    );
    let callCount = 0;
    el.addEventListener('grund-checked-change', () => { callCount++; });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(callCount).to.equal(0);
    expect(getByPart<HTMLButtonElement>(el, 'button').getAttribute('aria-checked')).to.equal('mixed');
  });

  it('readOnly + indeterminate: no event fires and aria-checked=mixed', async () => {
    const el = await setup(
      html`<grund-checkbox read-only .indeterminate=${true}>Label</grund-checkbox>`,
    );
    let callCount = 0;
    el.addEventListener('grund-checked-change', () => { callCount++; });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(callCount).to.equal(0);
    expect(getByPart<HTMLButtonElement>(el, 'button').getAttribute('aria-checked')).to.equal('mixed');
  });

  // ── Disabled ────────────────────────────────────────────────────────────────

  it('reflects disabled=true to inner button and data-disabled', async () => {
    const el = await setup(
      html`<grund-checkbox disabled>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.true;
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  it('does not fire event when clicked while disabled', async () => {
    const el = await setup(
      html`<grund-checkbox disabled>Label</grund-checkbox>`,
    );
    let callCount = 0;
    el.addEventListener('grund-checked-change', () => {
      callCount++;
    });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(callCount).to.equal(0);
  });

  it('reflects runtime disabled change', async () => {
    const el = await setup();
    el.disabled = true;
    await flush(el);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.true;
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  // ── readOnly ────────────────────────────────────────────────────────────────

  it('sets data-readonly when readOnly=true', async () => {
    const el = await setup(
      html`<grund-checkbox read-only>Label</grund-checkbox>`,
    );
    expect(el.hasAttribute('data-readonly')).to.be.true;
  });

  it('does not fire event when clicked while readOnly', async () => {
    const el = await setup(
      html`<grund-checkbox read-only>Label</grund-checkbox>`,
    );
    let callCount = 0;
    el.addEventListener('grund-checked-change', () => {
      callCount++;
    });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(callCount).to.equal(0);
  });

  // ── required ────────────────────────────────────────────────────────────────

  it('sets data-required when required=true', async () => {
    const el = await setup(
      html`<grund-checkbox required>Label</grund-checkbox>`,
    );
    expect(el.hasAttribute('data-required')).to.be.true;
  });

  // ── Event properties ────────────────────────────────────────────────────────

  it('grund-checked-change bubbles and is not composed', async () => {
    const el = await setup();
    let captured: CustomEvent | null = null;
    el.addEventListener('grund-checked-change', (e) => {
      captured = e as CustomEvent;
    });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(captured).to.not.be.null;
    expect(captured!.bubbles).to.be.true;
    expect(captured!.composed).to.be.false;
  });

  // ── Composition: two instances don't share state ────────────────────────────

  it('two sibling checkboxes have independent state', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <grund-checkbox id="a">A</grund-checkbox>
        <grund-checkbox id="b">B</grund-checkbox>
      </div>
    `);
    const a = container.querySelector<GrundCheckbox>('#a')!;
    const b = container.querySelector<GrundCheckbox>('#b')!;
    await flush(a);
    await flush(b);

    getByPart<HTMLButtonElement>(a, 'button').click();
    await flush(a);

    expect(getByPart<HTMLButtonElement>(a, 'button').getAttribute('aria-checked')).to.equal('true');
    expect(getByPart<HTMLButtonElement>(b, 'button').getAttribute('aria-checked')).to.equal('false');
  });

  // ── Form participation ──────────────────────────────────────────────────────

  it('FormData includes value when checked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="accept" .checked=${true}>Label</grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);
    expect(new FormData(form).get('accept')).to.equal('on');
  });

  it('FormData excludes value when unchecked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="accept">Label</grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);
    expect(new FormData(form).get('accept')).to.be.null;
  });

  it('FormData excludes value when disabled=true', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="accept" default-checked disabled>Label</grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);
    expect(new FormData(form).get('accept')).to.be.null;
  });

  it('FormData includes value when readOnly=true', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="accept" default-checked read-only>Label</grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);
    expect(new FormData(form).get('accept')).to.equal('on');
  });

  it('FormData excludes value when indeterminate=true even if checked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="accept" .checked=${true} .indeterminate=${true}>Label</grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);
    expect(new FormData(form).get('accept')).to.be.null;
  });

  it('formResetCallback resets to defaultChecked state', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="accept" default-checked>Label</grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);
    getByPart<HTMLButtonElement>(cb, 'button').click();
    await flush(cb);
    expect(cb.hasAttribute('data-unchecked')).to.be.true;
    form.reset();
    await flush(cb);
    expect(cb.hasAttribute('data-checked')).to.be.true;
  });

  it('formDisabledCallback propagates disabled from fieldset', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <fieldset disabled>
          <grund-checkbox name="accept">Label</grund-checkbox>
        </fieldset>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);
    expect(cb.hasAttribute('data-disabled')).to.be.true;
    expect(getByPart<HTMLButtonElement>(cb, 'button').disabled).to.be.true;
  });

  it('<label for> association toggles checkbox on label click', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <label for="cb-label-test">Toggle</label>
        <form>
          <grund-checkbox id="cb-label-test" name="accept">Content</grund-checkbox>
        </form>
      </div>
    `);
    const label = container.querySelector<HTMLLabelElement>('label')!;
    const cb = container.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);
    expect(cb.hasAttribute('data-unchecked')).to.be.true;
    label.click();
    await flush(cb);
    expect(cb.hasAttribute('data-checked')).to.be.true;
  });

  // ── Memory: no event listener leaks ────────────────────────────────────────

  it('cleans up host click listener on disconnect', async () => {
    // Spy on EventTarget.prototype before the element connects so both the add (connectedCallback)
    // and remove (disconnectedCallback) are captured. Filter to host-element calls only to avoid
    // counting Lit's internal button listener.
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

    // Symmetry: every click listener added to the host on connect must be removed on disconnect.
    expect(hostClickRemoves).to.equal(hostClickAdds);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe('GrundCheckboxIndicator', () => {
  async function setupWithIndicator(
    template = html`
      <grund-checkbox>
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        Label
      </grund-checkbox>
    `,
  ) {
    const el = await fixture<GrundCheckbox>(template);
    await flush(el);
    const indicator = el.querySelector<GrundCheckboxIndicator>(
      'grund-checkbox-indicator',
    )!;
    return { el, indicator };
  }

  it('indicator has data-unchecked when checkbox is unchecked', async () => {
    const { indicator } = await setupWithIndicator();
    expect(indicator.hasAttribute('data-unchecked')).to.be.true;
    expect(indicator.hasAttribute('data-checked')).to.be.false;
    expect(indicator.hasAttribute('data-indeterminate')).to.be.false;
  });

  it('indicator has data-checked when checkbox is checked', async () => {
    const { el, indicator } = await setupWithIndicator(html`
      <grund-checkbox default-checked>
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        Label
      </grund-checkbox>
    `);
    await flush(el);
    expect(indicator.hasAttribute('data-checked')).to.be.true;
    expect(indicator.hasAttribute('data-unchecked')).to.be.false;
  });

  it('indicator has data-indeterminate when checkbox is indeterminate', async () => {
    const { el, indicator } = await setupWithIndicator(html`
      <grund-checkbox .indeterminate=${true}>
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        Label
      </grund-checkbox>
    `);
    await flush(el);
    expect(indicator.hasAttribute('data-indeterminate')).to.be.true;
    expect(indicator.hasAttribute('data-checked')).to.be.false;
    expect(indicator.hasAttribute('data-unchecked')).to.be.false;
  });

  it('indicator data attributes update when checkbox state changes', async () => {
    const { el, indicator } = await setupWithIndicator();
    const btn = getByPart<HTMLButtonElement>(el, 'button');

    expect(indicator.hasAttribute('data-unchecked')).to.be.true;

    btn.click();
    await flush(el);

    expect(indicator.hasAttribute('data-checked')).to.be.true;
    expect(indicator.hasAttribute('data-unchecked')).to.be.false;
  });

  it('indicator renders part="indicator" span', async () => {
    const { indicator } = await setupWithIndicator();
    const span = getByPart<HTMLElement>(indicator, 'indicator');
    expect(span).to.exist;
  });
});
