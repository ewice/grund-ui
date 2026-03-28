import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils';
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

  it('mounts without errors and renders inner button', async () => {
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

    // Consumer must clear indeterminate — it stays true
    expect(el.indeterminate).to.be.true;
    expect(el.hasAttribute('data-indeterminate')).to.be.true;
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

  it('readOnly checkbox remains focusable (not disabled)', async () => {
    const el = await setup(
      html`<grund-checkbox read-only>Label</grund-checkbox>`,
    );
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.false;
  });

  // ── Required ─────────────────────────────────────────────────────────────

  it('sets data-required when required', async () => {
    const el = await setup(
      html`<grund-checkbox required>Label</grund-checkbox>`,
    );
    expect(el.hasAttribute('data-required')).to.be.true;
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

  // ── Keyboard: Space (native button) ───────────────────────────────────
  // Space activates native <button> elements via the browser's built-in
  // click synthesis. Verified in Storybook play function with userEvent.

  it('inner button is focusable (keyboard reachable via Tab)', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.tabIndex).to.equal(0);
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

  it('indicator reflects unchecked state', async () => {
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
});
