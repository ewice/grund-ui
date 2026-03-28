import { fixture, html, expect } from '@open-wc/testing';
import { describe, it, vi } from 'vitest';
import { flush, getByPart, simulateKeyboard } from '../../../test-utils';
import '../checkbox';
import '../indicator';

import type { GrundCheckbox } from '../checkbox';
import type { GrundCheckboxIndicator } from '../indicator';
import type { CheckedChangeDetail } from '../types.js';

describe('GrundCheckbox', () => {
  async function setup(
    template = html`<grund-checkbox>Label</grund-checkbox>`,
  ) {
    const el = await fixture<GrundCheckbox>(template);
    await flush(el);
    return el;
  }

  // ── Smoke test ──────────────────────────────────────────────────────────

  it('mounts and renders inner button with role="checkbox"', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn).to.exist;
    expect(btn.tagName).to.equal('BUTTON');
    expect(btn.getAttribute('role')).to.equal('checkbox');
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('renders unchecked by default', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(el.checked).to.be.undefined;
    expect(el.defaultChecked).to.be.false;
    expect(btn.getAttribute('aria-checked')).to.equal('false');
    expect(el.hasAttribute('data-checked')).to.be.false;
    expect(el.hasAttribute('data-unchecked')).to.be.true;
  });

  it('applies defaultChecked=true on first render', async () => {
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

  it('reflects disabled=true to inner button and data-disabled', async () => {
    const el = await setup(
      html`<grund-checkbox disabled>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.true;
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  it('value defaults to "on"', async () => {
    const el = await setup();
    expect(el.value).to.equal('on');
  });

  // ── Attribute reflection ─────────────────────────────────────────────────

  it('reads name from attribute', async () => {
    const el = await setup(
      html`<grund-checkbox name="agree">Label</grund-checkbox>`,
    );
    expect(el.name).to.equal('agree');
  });

  it('reads value from attribute', async () => {
    const el = await setup(
      html`<grund-checkbox value="yes">Label</grund-checkbox>`,
    );
    expect(el.value).to.equal('yes');
  });

  it('reads required from attribute', async () => {
    const el = await setup(
      html`<grund-checkbox required>Label</grund-checkbox>`,
    );
    expect(el.required).to.be.true;
  });

  it('reads read-only from attribute', async () => {
    const el = await setup(
      html`<grund-checkbox read-only>Label</grund-checkbox>`,
    );
    expect(el.readOnly).to.be.true;
  });

  // ── Uncontrolled mode ────────────────────────────────────────────────────

  it('toggles checked state on click (uncontrolled)', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    btn.click();
    await flush(el);
    expect(btn.getAttribute('aria-checked')).to.equal('true');
    expect(el.hasAttribute('data-checked')).to.be.true;
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

  it('fires grund-checked-change with correct detail (uncontrolled)', async () => {
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

  it('fires grund-checked-change with checked=false when toggling off', async () => {
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

  // ── Controlled mode ──────────────────────────────────────────────────────

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
    expect(btn.getAttribute('aria-checked')).to.equal('false');
  });

  it('updates display when controlled checked prop changes', async () => {
    const el = await setup(
      html`<grund-checkbox .checked=${false}>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('false');

    el.checked = true;
    await flush(el);
    expect(btn.getAttribute('aria-checked')).to.equal('true');
    expect(el.hasAttribute('data-checked')).to.be.true;
  });

  // ── Controlled → uncontrolled transition ────────────────────────────────

  it('switches to uncontrolled when checked set to undefined', async () => {
    const el = await setup(
      html`<grund-checkbox .checked=${true}>Label</grund-checkbox>`,
    );
    el.checked = undefined;
    await flush(el);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('false');
  });

  // ── Indeterminate ────────────────────────────────────────────────────────

  it('renders aria-checked="mixed" when indeterminate', async () => {
    const el = await setup(
      html`<grund-checkbox .indeterminate=${true}>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('mixed');
    expect(el.hasAttribute('data-indeterminate')).to.be.true;
  });

  it('clicking indeterminate checkbox fires checked=true', async () => {
    const el = await setup(
      html`<grund-checkbox .indeterminate=${true}>Label</grund-checkbox>`,
    );
    const events: CheckedChangeDetail[] = [];
    el.addEventListener('grund-checked-change', (e) => {
      events.push((e as CustomEvent<CheckedChangeDetail>).detail);
    });

    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);

    expect(events[0].checked).to.be.true;
  });

  it('indeterminate is not automatically cleared on click', async () => {
    const el = await setup(
      html`<grund-checkbox .indeterminate=${true}>Label</grund-checkbox>`,
    );
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);

    expect(el.indeterminate).to.be.true;
    expect(el.hasAttribute('data-indeterminate')).to.be.true;
  });

  it('toggling indeterminate at runtime updates aria-checked and data attr', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-checked')).to.equal('false');

    el.indeterminate = true;
    await flush(el);
    expect(btn.getAttribute('aria-checked')).to.equal('mixed');
    expect(el.hasAttribute('data-indeterminate')).to.be.true;

    el.indeterminate = false;
    await flush(el);
    expect(btn.getAttribute('aria-checked')).to.equal('false');
    expect(el.hasAttribute('data-indeterminate')).to.be.false;
  });

  // ── Disabled ─────────────────────────────────────────────────────────────

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

  // ── Read-only ────────────────────────────────────────────────────────────

  it('does not toggle when readOnly', async () => {
    const el = await setup(
      html`<grund-checkbox read-only default-checked>Label</grund-checkbox>`,
    );
    let callCount = 0;
    el.addEventListener('grund-checked-change', () => {
      callCount++;
    });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(callCount).to.equal(0);
    expect(el.hasAttribute('data-readonly')).to.be.true;
  });

  it('readOnly checkbox remains focusable (not native disabled)', async () => {
    const el = await setup(
      html`<grund-checkbox read-only>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.false;
  });

  it('toggling readOnly at runtime updates data-readonly and click behavior', async () => {
    const el = await setup();
    el.readOnly = true;
    await flush(el);
    expect(el.hasAttribute('data-readonly')).to.be.true;

    let callCount = 0;
    el.addEventListener('grund-checked-change', () => { callCount++; });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(callCount).to.equal(0);

    el.readOnly = false;
    await flush(el);
    expect(el.hasAttribute('data-readonly')).to.be.false;
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(callCount).to.equal(1);
  });

  // ── Required ─────────────────────────────────────────────────────────────

  it('sets data-required and aria-required when required', async () => {
    const el = await setup(
      html`<grund-checkbox required>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(el.hasAttribute('data-required')).to.be.true;
    expect(btn.getAttribute('aria-required')).to.equal('true');
  });

  it('toggling required at runtime updates data-required', async () => {
    const el = await setup();
    el.required = true;
    await flush(el);
    expect(el.hasAttribute('data-required')).to.be.true;
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-required')).to.equal('true');

    el.required = false;
    await flush(el);
    expect(el.hasAttribute('data-required')).to.be.false;
    expect(btn.hasAttribute('aria-required')).to.be.false;
  });

  // ── Event properties ─────────────────────────────────────────────────────

  it('grund-checked-change bubbles and is not composed', async () => {
    const el = await setup();
    let capturedEvent: CustomEvent | null = null;
    el.addEventListener('grund-checked-change', (e) => {
      capturedEvent = e as CustomEvent;
    });

    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);

    expect(capturedEvent).to.not.be.null;
    expect(capturedEvent!.bubbles).to.be.true;
    expect(capturedEvent!.composed).to.be.false;
  });

  // ── Dynamic property changes ─────────────────────────────────────────────

  it('reflects disabled change at runtime', async () => {
    const el = await setup();
    el.disabled = true;
    await flush(el);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.true;
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  it('reflects name change at runtime', async () => {
    const el = await setup();
    el.name = 'newsletter';
    await flush(el);
    expect(el.name).to.equal('newsletter');
  });

  it('reflects value change at runtime', async () => {
    const el = await setup();
    el.value = 'yes';
    await flush(el);
    expect(el.value).to.equal('yes');
  });

  // ── Composition: two instances don't share state ─────────────────────────

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

    expect(
      getByPart<HTMLButtonElement>(a, 'button').getAttribute('aria-checked'),
    ).to.equal('true');
    expect(
      getByPart<HTMLButtonElement>(b, 'button').getAttribute('aria-checked'),
    ).to.equal('false');
  });

  // ── Keyboard ──────────────────────────────────────────────────────────────

  it('inner button is focusable (keyboard reachable via Tab)', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.tabIndex).to.equal(0);
  });

  // ── Memory: no rogue event listeners ─────────────────────────────────────

  it('no imperative listeners added during lifecycle', async () => {
    const addSpy = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const removeSpy = vi.spyOn(EventTarget.prototype, 'removeEventListener');

    const el = await fixture<GrundCheckbox>(
      html`<grund-checkbox>Label</grund-checkbox>`,
    );
    await flush(el);

    const addsBefore = addSpy.mock.calls.length;
    const removesBefore = removeSpy.mock.calls.length;

    el.remove();

    // Lit template-managed @event bindings are not visible to addEventListener spy.
    // Any imperative adds during lifecycle must have matching removes on disconnect.
    const addsAfterDisconnect = addSpy.mock.calls.length - addsBefore;
    const removesAfterDisconnect = removeSpy.mock.calls.length - removesBefore;
    expect(addsAfterDisconnect).to.equal(removesAfterDisconnect);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  // ── Form participation ──────────────────────────────────────────────────

  it('submits value in FormData when checked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="agree" value="yes" default-checked>
          Label
        </grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);

    const data = new FormData(form);
    expect(data.get('agree')).to.equal('yes');
  });

  it('does not submit value in FormData when unchecked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="agree" value="yes">Label</grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);

    const data = new FormData(form);
    expect(data.has('agree')).to.be.false;
  });

  it('formResetCallback restores defaultChecked', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <grund-checkbox name="agree" default-checked>Label</grund-checkbox>
      </form>
    `);
    const cb = form.querySelector<GrundCheckbox>('grund-checkbox')!;
    await flush(cb);

    // Uncheck it
    getByPart<HTMLButtonElement>(cb, 'button').click();
    await flush(cb);
    expect(
      getByPart<HTMLButtonElement>(cb, 'button').getAttribute('aria-checked'),
    ).to.equal('false');

    // Reset form
    form.reset();
    await flush(cb);
    expect(
      getByPart<HTMLButtonElement>(cb, 'button').getAttribute('aria-checked'),
    ).to.equal('true');
  });
});

describe('GrundCheckboxIndicator', () => {
  async function setup(
    template = html`
      <grund-checkbox>
        <grund-checkbox-indicator>✓</grund-checkbox-indicator>
        Label
      </grund-checkbox>
    `,
  ) {
    const el = await fixture<GrundCheckbox>(template);
    await flush(el);
    return el;
  }

  it('renders indicator with part attribute', async () => {
    const el = await setup();
    const indicator = el.querySelector<GrundCheckboxIndicator>(
      'grund-checkbox-indicator',
    )!;
    const part = getByPart(indicator, 'indicator');
    expect(part).to.exist;
  });

  it('indicator has aria-hidden="true"', async () => {
    const el = await setup();
    const indicator = el.querySelector<GrundCheckboxIndicator>(
      'grund-checkbox-indicator',
    )!;
    await flush(indicator);
    expect(indicator.getAttribute('aria-hidden')).to.equal('true');
  });

  it('indicator reflects unchecked state via data attributes', async () => {
    const el = await setup();
    const indicator = el.querySelector<GrundCheckboxIndicator>(
      'grund-checkbox-indicator',
    )!;
    await flush(indicator);
    expect(indicator.hasAttribute('data-unchecked')).to.be.true;
    expect(indicator.hasAttribute('data-checked')).to.be.false;
  });

  it('indicator reflects checked state after click', async () => {
    const el = await setup();
    const indicator = el.querySelector<GrundCheckboxIndicator>(
      'grund-checkbox-indicator',
    )!;

    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    await flush(indicator);

    expect(indicator.hasAttribute('data-checked')).to.be.true;
    expect(indicator.hasAttribute('data-unchecked')).to.be.false;
  });

  it('indicator reflects indeterminate state', async () => {
    const el = await setup(html`
      <grund-checkbox .indeterminate=${true}>
        <grund-checkbox-indicator>—</grund-checkbox-indicator>
        Label
      </grund-checkbox>
    `);
    const indicator = el.querySelector<GrundCheckboxIndicator>(
      'grund-checkbox-indicator',
    )!;
    await flush(indicator);

    expect(indicator.hasAttribute('data-indeterminate')).to.be.true;
    expect(indicator.hasAttribute('data-checked')).to.be.false;
    expect(indicator.hasAttribute('data-unchecked')).to.be.false;
  });

  it('indicator added after mount picks up checked state', async () => {
    const el = await fixture<GrundCheckbox>(
      html`<grund-checkbox>Label</grund-checkbox>`,
    );
    await flush(el);

    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);

    const indicator = document.createElement(
      'grund-checkbox-indicator',
    ) as GrundCheckboxIndicator;
    indicator.textContent = '✓';
    el.appendChild(indicator);
    await flush(el);
    await flush(indicator);

    expect(indicator.hasAttribute('data-checked')).to.be.true;
  });
});
