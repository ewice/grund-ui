import { fixture, html, expect } from '@open-wc/testing';
import { describe, it, vi } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils.js';
import '../toggle';

import type { GrundToggle } from '../toggle/toggle.js';
import type { PressedChangeDetail } from '../types.js';

describe('GrundToggle', () => {
  async function setup(template = html`<grund-toggle>Label</grund-toggle>`) {
    const el = await fixture<GrundToggle>(template);
    await flush(el);
    return el;
  }

  // ── Smoke test ──────────────────────────────────────────────────────────

  it('mounts without errors and renders inner button', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn).to.exist;
    expect(btn.tagName).to.equal('BUTTON');
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('renders unpressed by default', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(el.pressed).to.be.undefined;
    expect(el.defaultPressed).to.be.false;
    expect(btn.getAttribute('aria-pressed')).to.equal('false');
    expect(el.hasAttribute('data-pressed')).to.be.false;
  });

  it('applies defaultPressed=true on first render', async () => {
    const el = await setup(html`<grund-toggle default-pressed>Label</grund-toggle>`);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-pressed')).to.equal('true');
    expect(el.hasAttribute('data-pressed')).to.be.true;
  });

  it('is not disabled by default', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.false;
    expect(el.hasAttribute('data-disabled')).to.be.false;
  });

  it('reflects disabled=true to inner button and data-disabled', async () => {
    const el = await setup(html`<grund-toggle disabled>Label</grund-toggle>`);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.true;
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  // ── Uncontrolled mode ────────────────────────────────────────────────────

  it('toggles pressed state on click (uncontrolled)', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    btn.click();
    await flush(el);
    expect(btn.getAttribute('aria-pressed')).to.equal('true');
    expect(el.hasAttribute('data-pressed')).to.be.true;
  });

  it('toggles back to unpressed on second click (uncontrolled)', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    btn.click();
    await flush(el);
    btn.click();
    await flush(el);
    expect(btn.getAttribute('aria-pressed')).to.equal('false');
    expect(el.hasAttribute('data-pressed')).to.be.false;
  });

  it('fires grund-pressed-change with correct detail (uncontrolled)', async () => {
    const el = await setup();
    const events: PressedChangeDetail[] = [];
    el.addEventListener('grund-pressed-change', (e) => {
      events.push((e as CustomEvent<PressedChangeDetail>).detail);
    });

    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].pressed).to.be.true;
  });

  it('fires grund-pressed-change with pressed=false when toggling off', async () => {
    const el = await setup(html`<grund-toggle default-pressed>Label</grund-toggle>`);
    const events: PressedChangeDetail[] = [];
    el.addEventListener('grund-pressed-change', (e) => {
      events.push((e as CustomEvent<PressedChangeDetail>).detail);
    });

    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);

    expect(events[0].pressed).to.be.false;
  });

  // ── Controlled mode ──────────────────────────────────────────────────────

  it('renders aria-pressed from controlled pressed=true', async () => {
    const el = await setup(html`<grund-toggle .pressed=${true}>Label</grund-toggle>`);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-pressed')).to.equal('true');
  });

  it('fires event but does not update visual state in controlled mode', async () => {
    // Both conditions must hold: event fires with correct detail AND state stays unchanged.
    const el = await setup(html`<grund-toggle .pressed=${false}>Label</grund-toggle>`);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    const events: PressedChangeDetail[] = [];
    el.addEventListener('grund-pressed-change', (e) => {
      events.push((e as CustomEvent<PressedChangeDetail>).detail);
    });

    btn.click();
    await flush(el);

    // (a) event fired with correct detail
    expect(events).to.have.length(1);
    expect(events[0].pressed).to.be.true;
    // (b) internal state unchanged — consumer did not update `pressed`
    expect(btn.getAttribute('aria-pressed')).to.equal('false');
  });

  it('updates display when controlled pressed prop changes', async () => {
    const el = await setup(html`<grund-toggle .pressed=${false}>Label</grund-toggle>`);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-pressed')).to.equal('false');

    el.pressed = true;
    await flush(el);
    expect(btn.getAttribute('aria-pressed')).to.equal('true');
    expect(el.hasAttribute('data-pressed')).to.be.true;
  });

  // ── Controlled → uncontrolled transition ────────────────────────────────

  it('switches to uncontrolled when pressed set to undefined', async () => {
    const el = await setup(html`<grund-toggle .pressed=${true}>Label</grund-toggle>`);
    el.pressed = undefined;
    await flush(el);
    // Should use _internalPressed (false by default)
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.getAttribute('aria-pressed')).to.equal('false');
  });

  // ── Disabled ─────────────────────────────────────────────────────────────

  it('does not fire event when clicked while disabled', async () => {
    const el = await setup(html`<grund-toggle disabled>Label</grund-toggle>`);
    let callCount = 0;
    el.addEventListener('grund-pressed-change', () => { callCount++; });
    getByPart<HTMLButtonElement>(el, 'button').click();
    await flush(el);
    expect(callCount).to.equal(0);
  });

  it('disabled button is not clickable via native disabled', async () => {
    const el = await setup(html`<grund-toggle disabled>Label</grund-toggle>`);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    expect(btn.disabled).to.be.true;
  });

  // ── Event properties ─────────────────────────────────────────────────────

  it('grund-pressed-change bubbles and is not composed', async () => {
    const el = await setup();
    let capturedEvent: CustomEvent | null = null;
    el.addEventListener('grund-pressed-change', (e) => {
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

  it('two sibling toggles have independent state', async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div>
        <grund-toggle id="a">A</grund-toggle>
        <grund-toggle id="b">B</grund-toggle>
      </div>
    `);
    const a = container.querySelector<GrundToggle>('#a')!;
    const b = container.querySelector<GrundToggle>('#b')!;
    await flush(a);
    await flush(b);

    getByPart<HTMLButtonElement>(a, 'button').click();
    await flush(a);

    expect(getByPart<HTMLButtonElement>(a, 'button').getAttribute('aria-pressed')).to.equal('true');
    expect(getByPart<HTMLButtonElement>(b, 'button').getAttribute('aria-pressed')).to.equal('false');
  });

  // ── value property ───────────────────────────────────────────────────────

  it('value defaults to empty string', async () => {
    const el = await setup();
    expect(el.value).to.equal('');
  });

  it('value is stored and readable at runtime', async () => {
    const el = await setup(html`<grund-toggle value="bold">Label</grund-toggle>`);
    expect(el.value).to.equal('bold');
    el.value = 'italic';
    await flush(el);
    expect(el.value).to.equal('italic');
  });

  // ── Keyboard: Space / Enter (native button) ───────────────────────────────
  // Space and Enter activate native <button> elements via the browser's built-in
  // click synthesis. This behavior is not testable with bare synthetic keydown events;
  // it is verified by the Storybook play function using userEvent.keyboard.

  it('inner button is focusable (keyboard reachable via Tab)', async () => {
    const el = await setup();
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    // tabIndex 0 means the button is in the natural tab order
    expect(btn.tabIndex).to.equal(0);
  });

  // ── Memory: event listeners cleaned up on disconnect ────────────────────

  it('cleans up event listeners on disconnect', async () => {
    const el = await setup();
    await flush(el);

    const addSpy = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const removeSpy = vi.spyOn(EventTarget.prototype, 'removeEventListener');

    el.remove();

    const addCount = addSpy.mock.calls.length;
    const removeCount = removeSpy.mock.calls.length;

    // Toggle adds no imperative listeners — both counts must be 0 (Lit @event is template-managed).
    // This verifies no rogue addEventListener was introduced.
    expect(addCount).to.equal(0);
    expect(removeCount).to.equal(0);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
