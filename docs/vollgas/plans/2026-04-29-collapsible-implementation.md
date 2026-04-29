# Collapsible Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `<grund-collapsible>` compound component (root/trigger/panel) and a reusable `PresenceController` for exit-transition-safe unmounting.

**Architecture:** Stateful Simple Compound component with flat file structure. Root provides context via `@lit/context`; trigger and panel consume it. A shared `PresenceController` handles exit transitions in the panel. A DOM-free engine resolves open/closed state independently of Lit and exposes idempotent set/open/close/toggle requests so browser-driven `beforematch` can open without accidentally closing.

**Tech Stack:** Lit 3, `@lit/context`, Vitest + `@vitest/browser-playwright` + `@open-wc/testing`, Storybook CSF3

**Spec:** `docs/vollgas/specs/2026-04-28-collapsible-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/components/collapsible/types.ts` | Event detail types, host snapshot, reason union |
| `src/components/collapsible/collapsible.engine.ts` | DOM-free open-state resolver (controlled/uncontrolled/disabled) |
| `src/controllers/presence.controller.ts` | Shared reactive controller for exit-transition-safe unmounting |
| `src/components/collapsible/collapsible.context.ts` | Context interface and symbol |
| `src/components/collapsible/collapsible.ts` | Root `<grund-collapsible>` element |
| `src/components/collapsible/collapsible-trigger.ts` | `<grund-collapsible-trigger>` element |
| `src/components/collapsible/collapsible-panel.ts` | `<grund-collapsible-panel>` element (uses PresenceController) |
| `src/components/collapsible/index.ts` | Barrel export |
| `src/components/collapsible/tests/collapsible.engine.test.ts` | Engine unit tests |
| `src/controllers/presence.controller.test.ts` | PresenceController unit tests |
| `src/components/collapsible/tests/collapsible.test.ts` | Root component tests |
| `src/components/collapsible/tests/collapsible-trigger.test.ts` | Trigger component tests |
| `src/components/collapsible/tests/collapsible-panel.test.ts` | Panel component tests |
| `stories/collapsible.stories.ts` | Storybook stories |
| `src/index.ts` | Add collapsible re-export |
| `package.json` | Add `./collapsible` export path |
| `custom-elements.json` | Regenerate Custom Elements Manifest after implementation |
| `docs/vocabulary.md` | Add new terms |

---

## Task 1: Types

**Files:**
- Create: `src/components/collapsible/types.ts`

- [ ] **Step 1: Create the types file**

```ts
export type CollapsibleOpenChangeReason = 'trigger-press' | 'programmatic';

export interface CollapsibleOpenChangeDetail {
  open: boolean;
  reason: CollapsibleOpenChangeReason;
  trigger: HTMLElement | null;
}

export interface CollapsibleHostSnapshot {
  open: boolean | undefined;
  defaultOpen: boolean;
  disabled: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collapsible/types.ts
git commit -m "feat(collapsible): add type definitions"
```

---

## Task 2: Collapsible Engine

**Files:**
- Create: `src/components/collapsible/collapsible.engine.ts`
- Create: `src/components/collapsible/tests/collapsible.engine.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, describe, it } from 'vitest';
import { CollapsibleEngine } from '../collapsible.engine';

import type { CollapsibleHostSnapshot } from '../types';

describe('CollapsibleEngine', () => {
  function create(snapshot?: Partial<CollapsibleHostSnapshot>) {
    const engine = new CollapsibleEngine();
    engine.syncFromHost({
      open: undefined,
      defaultOpen: false,
      disabled: false,
      ...snapshot,
    });
    return engine;
  }

  describe('uncontrolled mode', () => {
    it('starts closed by default', () => {
      const engine = create();
      expect(engine.isOpen).to.be.false;
    });

    it('starts open when defaultOpen is true', () => {
      const engine = create({ defaultOpen: true });
      expect(engine.isOpen).to.be.true;
    });

    it('seeds defaultOpen only once — re-sync with different defaultOpen is ignored', () => {
      const engine = create({ defaultOpen: true });
      engine.syncFromHost({ open: undefined, defaultOpen: false, disabled: false });
      expect(engine.isOpen).to.be.true;
    });

    it('requestToggle opens when closed', () => {
      const engine = create();
      const result = engine.requestToggle();
      expect(result).to.be.true;
      expect(engine.isOpen).to.be.true;
    });

    it('requestToggle closes when open', () => {
      const engine = create({ defaultOpen: true });
      const result = engine.requestToggle();
      expect(result).to.be.false;
      expect(engine.isOpen).to.be.false;
    });

    it('requestOpen opens idempotently', () => {
      const engine = create();
      expect(engine.requestOpen()).to.be.true;
      expect(engine.requestOpen()).to.be.true;
      expect(engine.isOpen).to.be.true;
    });

    it('requestClose closes idempotently', () => {
      const engine = create({ defaultOpen: true });
      expect(engine.requestClose()).to.be.false;
      expect(engine.requestClose()).to.be.false;
      expect(engine.isOpen).to.be.false;
    });
  });

  describe('controlled mode', () => {
    it('reflects externally set open state', () => {
      const engine = create({ open: true });
      expect(engine.isOpen).to.be.true;
    });

    it('does not mutate internal state on requestToggle', () => {
      const engine = create({ open: false });
      const result = engine.requestToggle();
      expect(result).to.be.true;
      expect(engine.isOpen).to.be.false;
    });

    it('updates when controlled value changes', () => {
      const engine = create({ open: false });
      engine.syncFromHost({ open: true, defaultOpen: false, disabled: false });
      expect(engine.isOpen).to.be.true;
    });

    it('requestOpen returns the requested state without mutating controlled state', () => {
      const engine = create({ open: false });
      const result = engine.requestOpen();
      expect(result).to.be.true;
      expect(engine.isOpen).to.be.false;
    });
  });

  describe('disabled', () => {
    it('blocks toggle when disabled', () => {
      const engine = create({ disabled: true });
      const result = engine.requestToggle();
      expect(result).to.be.null;
      expect(engine.isOpen).to.be.false;
    });

    it('blocks toggle when disabled and open', () => {
      const engine = create({ defaultOpen: true, disabled: true });
      const result = engine.requestToggle();
      expect(result).to.be.null;
      expect(engine.isOpen).to.be.true;
    });

    it('allows explicit programmatic open requests to bypass disabled', () => {
      const engine = create({ disabled: true });
      const result = engine.requestOpen({ ignoreDisabled: true });
      expect(result).to.be.true;
      expect(engine.isOpen).to.be.true;
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/collapsible/tests/collapsible.engine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the engine**

```ts
import type { CollapsibleHostSnapshot } from './types';

export class CollapsibleEngine {
  private _isOpen = false;
  private isControlled = false;
  private isSeeded = false;
  private disabled = false;

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public syncFromHost(snapshot: CollapsibleHostSnapshot): void {
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.open !== undefined;

    if (this.isControlled) {
      this._isOpen = snapshot.open!;
    } else if (!this.isSeeded) {
      this.isSeeded = true;
      this._isOpen = snapshot.defaultOpen;
    }
  }

  /**
   * Returns the requested open state, or `null` if disabled.
   * In uncontrolled mode, mutates internal state.
   * In controlled mode, returns the requested state without mutating.
   */
  public requestOpen(options?: { ignoreDisabled?: boolean }): boolean | null {
    return this.requestSetOpen(true, options);
  }

  public requestClose(options?: { ignoreDisabled?: boolean }): boolean | null {
    return this.requestSetOpen(false, options);
  }

  public requestToggle(options?: { ignoreDisabled?: boolean }): boolean | null {
    return this.requestSetOpen(!this._isOpen, options);
  }

  private requestSetOpen(
    nextOpen: boolean,
    options: { ignoreDisabled?: boolean } = {},
  ): boolean | null {
    if (this.disabled && !options.ignoreDisabled) {
      return null;
    }

    if (!this.isControlled) {
      this._isOpen = nextOpen;
    }

    return nextOpen;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/collapsible/tests/collapsible.engine.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/collapsible/collapsible.engine.ts src/components/collapsible/tests/collapsible.engine.test.ts
git commit -m "feat(collapsible): add DOM-free open-state engine with tests"
```

---

## Task 3: PresenceController

**Files:**
- Create: `src/controllers/presence.controller.ts`
- Create: `src/controllers/presence.controller.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { fixture, html, aTimeout } from '@open-wc/testing';
import { describe, expect, it, vi } from 'vitest';
import { LitElement, css } from 'lit';
import { property } from 'lit/decorators.js';
import { PresenceController } from './presence.controller';

import type { PresenceStatus } from './presence.controller';

class TestPresenceHost extends LitElement {
  static override styles = css`
    :host { display: block; }
    #target { transition: opacity 50ms; }
    #target.hidden { opacity: 0; }
  `;

  @property({ type: Boolean }) show = false;

  presence = new PresenceController(this, {
    isPresent: () => this.show,
    getTransitionElement: () => this.shadowRoot?.getElementById('target') ?? null,
  });

  override render() {
    return html`<div id="target" class="${this.show ? '' : 'hidden'}">content</div>`;
  }
}

if (!customElements.get('test-presence-host')) {
  customElements.define('test-presence-host', TestPresenceHost);
}

class TestPresenceNoTransition extends LitElement {
  @property({ type: Boolean }) show = false;

  presence = new PresenceController(this, {
    isPresent: () => this.show,
  });

  override render() {
    return html`<div>content</div>`;
  }
}

if (!customElements.get('test-presence-no-transition')) {
  customElements.define('test-presence-no-transition', TestPresenceNoTransition);
}

class TestPresenceAnimationHost extends LitElement {
  static override styles = css`
    @keyframes fade { from { opacity: 1; } to { opacity: 0; } }
    :host { display: block; }
    #target.hidden { animation: fade 50ms; }
  `;

  @property({ type: Boolean }) show = false;

  presence = new PresenceController(this, {
    isPresent: () => this.show,
    getTransitionElement: () => this.shadowRoot?.getElementById('target') ?? null,
  });

  override render() {
    return html`<div id="target" class="${this.show ? '' : 'hidden'}">content</div>`;
  }
}

if (!customElements.get('test-presence-animation-host')) {
  customElements.define('test-presence-animation-host', TestPresenceAnimationHost);
}

describe('PresenceController', () => {
  describe('entering', () => {
    it('present becomes true immediately when isPresent returns true', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host></test-presence-host>`,
      );
      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');

      el.show = true;
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('starting');
    });

    it('status transitions from starting to idle after a microtask', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host></test-presence-host>`,
      );
      el.show = true;
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(el.presence.status).to.equal('idle');
    });
  });

  describe('exiting without transition', () => {
    it('completes exit after a microtask when no transition is active', async () => {
      const el = await fixture<TestPresenceNoTransition>(
        html`<test-presence-no-transition .show=${true}></test-presence-no-transition>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('idle');

      el.show = false;
      await el.updateComplete;

      expect(el.presence.status).to.equal('ending');

      await aTimeout(0);
      await el.updateComplete;

      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');
    });
  });

  describe('exiting with transition', () => {
    it('stays present during ending until transitionend fires', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host .show=${true}></test-presence-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('ending');

      // Fire transitionend on the target element
      const target = el.shadowRoot!.getElementById('target')!;
      target.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }));
      await el.updateComplete;

      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');
    });

    it('stays present during ending until animationend fires', async () => {
      const el = await fixture<TestPresenceAnimationHost>(
        html`<test-presence-animation-host .show=${true}></test-presence-animation-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;

      const target = el.shadowRoot!.getElementById('target')!;
      target.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'fade' }));
      await el.updateComplete;

      expect(el.presence.present).to.be.false;
    });
  });

  describe('cancel exit on reopen', () => {
    it('cancels pending exit when reopened', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host .show=${true}></test-presence-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      // Start exit
      el.show = false;
      await el.updateComplete;
      expect(el.presence.status).to.equal('ending');

      // Reopen before exit completes
      el.show = true;
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('starting');
    });

    it('does not complete a no-transition exit after reopening before the microtask', async () => {
      const el = await fixture<TestPresenceNoTransition>(
        html`<test-presence-no-transition .show=${true}></test-presence-no-transition>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;
      expect(el.presence.status).to.equal('ending');

      el.show = true;
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(el.presence.present).to.be.true;
      expect(el.presence.status).to.equal('idle');
    });
  });

  describe('fallback completion', () => {
    it('completes exit if transition events never fire', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host .show=${true}></test-presence-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;
      await aTimeout(140);
      await el.updateComplete;

      expect(el.presence.present).to.be.false;
      expect(el.presence.status).to.equal('idle');
    });
  });

  describe('callbacks', () => {
    it('calls onExitComplete when exit finishes', async () => {
      const onExitComplete = vi.fn();

      class TestCallbackHost extends LitElement {
        @property({ type: Boolean }) show = true;
        presence = new PresenceController(this, {
          isPresent: () => this.show,
          onExitComplete,
        });
        override render() { return html`<div>content</div>`; }
      }
      if (!customElements.get('test-callback-host')) {
        customElements.define('test-callback-host', TestCallbackHost);
      }

      const el = await fixture<TestCallbackHost>(
        html`<test-callback-host></test-callback-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(onExitComplete).toHaveBeenCalledOnce();
    });

    it('calls onStatusChange on each transition', async () => {
      const statuses: PresenceStatus[] = [];

      class TestStatusHost extends LitElement {
        @property({ type: Boolean }) show = false;
        presence = new PresenceController(this, {
          isPresent: () => this.show,
          onStatusChange: (s) => statuses.push(s),
        });
        override render() { return html`<div>content</div>`; }
      }
      if (!customElements.get('test-status-host')) {
        customElements.define('test-status-host', TestStatusHost);
      }

      const el = await fixture<TestStatusHost>(
        html`<test-status-host></test-status-host>`,
      );
      await el.updateComplete;

      el.show = true;
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      expect(statuses).to.include('starting');
      expect(statuses).to.include('idle');
    });
  });

  describe('disconnect cleanup', () => {
    it('removes listeners on disconnect', async () => {
      const el = await fixture<TestPresenceHost>(
        html`<test-presence-host .show=${true}></test-presence-host>`,
      );
      await el.updateComplete;
      await aTimeout(0);
      await el.updateComplete;

      el.show = false;
      await el.updateComplete;

      // Disconnect while exit is pending
      el.remove();

      // Should not throw or leak
      const target = el.shadowRoot!.getElementById('target')!;
      target.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true }));
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/controllers/presence.controller.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the controller**

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type PresenceStatus = 'idle' | 'starting' | 'ending';

export interface PresenceControllerOptions {
  isPresent: () => boolean;
  getTransitionElement?: () => HTMLElement | null;
  onExitComplete?: () => void;
  onStatusChange?: (status: PresenceStatus) => void;
}

/**
 * Reactive controller for exit-transition-safe presence management.
 *
 * Keeps `present` true during exit transitions so consumer CSS can animate
 * the exit before DOM is removed.
 */
export class PresenceController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly options: PresenceControllerOptions;

  private _present = false;
  private _status: PresenceStatus = 'idle';
  private prevIsPresent = false;
  private isConnected = false;
  private exitCleanup: (() => void) | null = null;
  private startTimeoutId: number | null = null;
  private exitVersion = 0;

  constructor(host: ReactiveControllerHost & HTMLElement, options: PresenceControllerOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  public get present(): boolean {
    return this._present;
  }

  public get status(): PresenceStatus {
    return this._status;
  }

  public hostConnected(): void {
    this.isConnected = true;
    this.sync();
  }

  public hostDisconnected(): void {
    this.isConnected = false;
    this.exitVersion++;
    this.clearStartTimeout();
    this.cleanupExit();
    this.prevIsPresent = this.options.isPresent();
    this._present = this.prevIsPresent;
    this.setStatus('idle');
  }

  public hostUpdated(): void {
    this.sync();
  }

  private sync(): void {
    const isPresent = this.options.isPresent();

    if (isPresent === this.prevIsPresent) return;

    this.prevIsPresent = isPresent;

    if (isPresent) {
      this.enter();
    } else {
      this.exit();
    }
  }

  private enter(): void {
    const version = ++this.exitVersion;
    this.clearStartTimeout();
    this.cleanupExit();

    this._present = true;
    this.setStatus('starting');
    this.host.requestUpdate();

    // Keep the starting status observable for one render turn.
    this.startTimeoutId = window.setTimeout(() => {
      this.startTimeoutId = null;
      if (!this.isConnected) return;
      if (version !== this.exitVersion) return;
      if (!this.options.isPresent()) return;
      if (this._status !== 'starting') return;
      this.setStatus('idle');
      this.host.requestUpdate();
    }, 0);
  }

  private exit(): void {
    const version = ++this.exitVersion;
    this.clearStartTimeout();
    this.setStatus('ending');
    this.host.requestUpdate();

    const transitionEl = this.options.getTransitionElement?.() ?? this.host;
    if (!transitionEl) {
      this.completeExitAfterDelay(version);
      return;
    }

    const computedStyle = getComputedStyle(transitionEl);
    const exitDuration = Math.max(
      getMaxCssTime(computedStyle.transitionDuration, computedStyle.transitionDelay),
      getMaxCssTime(computedStyle.animationDuration, computedStyle.animationDelay),
    );

    if (exitDuration <= 0) {
      this.completeExitAfterDelay(version);
      return;
    }

    const pendingEvents = getPendingEndEvents(computedStyle);

    const handleEnd = (e: Event): void => {
      if (e.target !== transitionEl) return;

      const key = getEndEventKey(e);
      if (pendingEvents.size > 0) {
        if (!key || !pendingEvents.has(key)) return;
        pendingEvents.delete(key);
        if (pendingEvents.size > 0) return;
      }

      this.completeExit(version);
    };

    transitionEl.addEventListener('transitionend', handleEnd);
    transitionEl.addEventListener('animationend', handleEnd);
    transitionEl.addEventListener('transitioncancel', handleEnd);
    transitionEl.addEventListener('animationcancel', handleEnd);

    const timeoutId = window.setTimeout(() => {
      this.completeExit(version);
    }, exitDuration + 50);

    this.exitCleanup = () => {
      window.clearTimeout(timeoutId);
      transitionEl.removeEventListener('transitionend', handleEnd);
      transitionEl.removeEventListener('animationend', handleEnd);
      transitionEl.removeEventListener('transitioncancel', handleEnd);
      transitionEl.removeEventListener('animationcancel', handleEnd);
    };
  }

  private completeExitAfterDelay(version: number): void {
    const timeoutId = window.setTimeout(() => {
      this.completeExit(version);
    }, 0);

    this.exitCleanup = () => {
      window.clearTimeout(timeoutId);
    };
  }

  private completeExit(version: number): void {
    if (!this.isConnected) return;
    if (version !== this.exitVersion) return;
    if (this.options.isPresent()) return;
    if (this._status !== 'ending') return;

    this.cleanupExit();
    this._present = false;
    this.setStatus('idle');
    this.options.onExitComplete?.();
    this.host.requestUpdate();
  }

  private cleanupExit(): void {
    if (this.exitCleanup) {
      this.exitCleanup();
      this.exitCleanup = null;
    }
  }

  private clearStartTimeout(): void {
    if (this.startTimeoutId !== null) {
      window.clearTimeout(this.startTimeoutId);
      this.startTimeoutId = null;
    }
  }

  private setStatus(status: PresenceStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.options.onStatusChange?.(status);
  }
}

function getPendingEndEvents(style: CSSStyleDeclaration): Set<string> {
  const events = new Set<string>();
  const transitionProperties = style.transitionProperty
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const transitionDurations = parseCssTimeList(style.transitionDuration);
  const transitionDelays = parseCssTimeList(style.transitionDelay);

  for (let i = 0; i < transitionProperties.length; i++) {
    const duration = transitionDurations[i] ?? transitionDurations[transitionDurations.length - 1] ?? 0;
    const delay = transitionDelays[i] ?? transitionDelays[transitionDelays.length - 1] ?? 0;
    if (duration + delay > 0 && transitionProperties[i] !== 'all') {
      events.add(`transition:${transitionProperties[i]}`);
    }
  }

  const animationNames = style.animationName
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== 'none');
  const animationDurations = parseCssTimeList(style.animationDuration);
  const animationDelays = parseCssTimeList(style.animationDelay);

  for (let i = 0; i < animationNames.length; i++) {
    const duration = animationDurations[i] ?? animationDurations[animationDurations.length - 1] ?? 0;
    const delay = animationDelays[i] ?? animationDelays[animationDelays.length - 1] ?? 0;
    if (duration + delay > 0) {
      events.add(`animation:${animationNames[i]}`);
    }
  }

  return events;
}

function getEndEventKey(event: Event): string | null {
  if (event instanceof TransitionEvent && event.propertyName) {
    return `transition:${event.propertyName}`;
  }

  if (event instanceof AnimationEvent && event.animationName) {
    return `animation:${event.animationName}`;
  }

  return null;
}

function getMaxCssTime(durations: string, delays: string): number {
  const durationList = parseCssTimeList(durations);
  const delayList = parseCssTimeList(delays);
  const itemCount = Math.max(durationList.length, delayList.length);

  let max = 0;
  for (let i = 0; i < itemCount; i++) {
    const duration = durationList[i] ?? durationList[durationList.length - 1] ?? 0;
    const delay = delayList[i] ?? delayList[delayList.length - 1] ?? 0;
    max = Math.max(max, duration + delay);
  }

  return max;
}

function parseCssTimeList(value: string): number[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.endsWith('ms')) return Number.parseFloat(part);
      if (part.endsWith('s')) return Number.parseFloat(part) * 1000;
      return 0;
    });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/controllers/presence.controller.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/controllers/presence.controller.ts src/controllers/presence.controller.test.ts
git commit -m "feat(controllers): add PresenceController for exit-transition-safe unmounting"
```

---

## Task 4: Context Contract

**Files:**
- Create: `src/components/collapsible/collapsible.context.ts`

- [ ] **Step 1: Create the context file**

```ts
import { createContext } from '@lit/context';

import type { CollapsibleOpenChangeReason } from './types';

export interface CollapsibleRootContext {
  open: boolean;
  disabled: boolean;
  requestToggle(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void;
  requestOpen(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void;
  registerTrigger(trigger: HTMLElement): void;
  unregisterTrigger(trigger: HTMLElement): void;
  registerPanel(panel: HTMLElement): void;
  unregisterPanel(panel: HTMLElement): void;
  getTriggerElement(): HTMLElement | null;
  getPanelElement(): HTMLElement | null;
}

export const collapsibleRootContext = createContext<CollapsibleRootContext>('collapsible-root');
```

- [ ] **Step 2: Commit**

```bash
git add src/components/collapsible/collapsible.context.ts
git commit -m "feat(collapsible): add context contract"
```

---

## Task 5: Root Component `<grund-collapsible>`

**Files:**
- Create: `src/components/collapsible/collapsible.ts`
- Create: `src/components/collapsible/tests/collapsible.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { fixture, html, expect } from '@open-wc/testing';
import { LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/test-utils';

import '../collapsible';
import { collapsibleRootContext } from '../collapsible.context';

import type { GrundCollapsible } from '../collapsible';
import type { CollapsibleRootContext } from '../collapsible.context';
import type { CollapsibleOpenChangeDetail } from '../types';

class TestCollapsibleConsumer extends LitElement {
  @consume({ context: collapsibleRootContext, subscribe: true })
  @state()
  private rootCtx?: CollapsibleRootContext;

  private handleClick = (): void => {
    this.rootCtx?.requestToggle('trigger-press', this);
  };

  override render() {
    return html`<button type="button" @click=${this.handleClick}>Toggle</button>`;
  }
}

if (!customElements.get('test-collapsible-consumer')) {
  customElements.define('test-collapsible-consumer', TestCollapsibleConsumer);
}

describe('GrundCollapsible', () => {
  async function setup(
    template = html`
      <grund-collapsible>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>Content</grund-collapsible-panel>
      </grund-collapsible>
    `,
  ) {
    const el = await fixture<GrundCollapsible>(template);
    await flush(el);
    return el;
  }

  it('renders with default properties', async () => {
    const el = await setup();
    expect(el.disabled).to.be.false;
    expect(el.defaultOpen).to.be.false;
    expect(el.open).to.be.undefined;
  });

  it('reflects data-open when defaultOpen is true', async () => {
    const el = await setup(html`
      <grund-collapsible default-open>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>Content</grund-collapsible-panel>
      </grund-collapsible>
    `);
    expect(el.hasAttribute('data-open')).to.be.true;
  });

  it('reflects data-disabled when disabled', async () => {
    const el = await setup(html`
      <grund-collapsible disabled>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  describe('uncontrolled mode', () => {
    it('mutates state and emits grund-open-change on trigger click', async () => {
      const events: CollapsibleOpenChangeDetail[] = [];
      const el = await setup(html`
        <grund-collapsible
          @grund-open-change=${(e: CustomEvent<CollapsibleOpenChangeDetail>) => events.push(e.detail)}
        >
          <test-collapsible-consumer></test-collapsible-consumer>
        </grund-collapsible>
      `);

      const consumer = el.querySelector('test-collapsible-consumer')!;
      consumer.shadowRoot!.querySelector('button')!.click();
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.true;
      expect(events).to.have.length(1);
      expect(events[0].open).to.be.true;
      expect(events[0].reason).to.equal('trigger-press');
      expect(events[0].trigger).to.equal(consumer);
    });
  });

  describe('controlled mode', () => {
    it('emits grund-open-change without mutating internal state', async () => {
      const events: CollapsibleOpenChangeDetail[] = [];
      const el = await setup(html`
        <grund-collapsible
          .open=${false}
          @grund-open-change=${(e: CustomEvent<CollapsibleOpenChangeDetail>) => events.push(e.detail)}
        >
          <test-collapsible-consumer></test-collapsible-consumer>
        </grund-collapsible>
      `);

      const consumer = el.querySelector('test-collapsible-consumer')!;
      consumer.shadowRoot!.querySelector('button')!.click();
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.false;
      expect(events).to.have.length(1);
      expect(events[0].open).to.be.true;
    });

    it('opens when controlled open property is set to true', async () => {
      const el = await setup(html`
        <grund-collapsible .open=${false}>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);

      expect(el.hasAttribute('data-open')).to.be.false;

      el.open = true;
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.true;
    });
  });

  describe('disabled', () => {
    it('does not toggle when disabled', async () => {
      const events: CollapsibleOpenChangeDetail[] = [];
      const el = await setup(html`
        <grund-collapsible
          disabled
          @grund-open-change=${(e: CustomEvent<CollapsibleOpenChangeDetail>) => events.push(e.detail)}
        >
          <test-collapsible-consumer></test-collapsible-consumer>
        </grund-collapsible>
      `);

      const consumer = el.querySelector('test-collapsible-consumer')!;
      consumer.shadowRoot!.querySelector('button')!.click();
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.false;
      expect(events).to.have.length(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/collapsible/tests/collapsible.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the root component**

```ts
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { CollapsibleEngine } from './collapsible.engine';
import { collapsibleRootContext } from './collapsible.context';

import type { CollapsibleRootContext } from './collapsible.context';
import type { CollapsibleHostSnapshot, CollapsibleOpenChangeDetail, CollapsibleOpenChangeReason } from './types';

export class GrundCollapsible extends LitElement {
  public static override readonly styles = css`
    /* Headless — only display mode for layout participation */
    :host { display: block; }
  `;

  @property({ type: Boolean, reflect: false }) public open: boolean | undefined = undefined;
  @property({ type: Boolean, attribute: 'default-open' }) public defaultOpen = false;
  @property({ type: Boolean }) public disabled = false;

  @provide({ context: collapsibleRootContext })
  @state()
  protected rootCtx!: CollapsibleRootContext;

  private readonly engine = new CollapsibleEngine();
  private triggerElement: HTMLElement | null = null;
  private panelElement: HTMLElement | null = null;

  // Stable callback references
  private readonly _requestToggle = (reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void => {
    this.handleToggle(reason, trigger);
  };
  private readonly _requestOpen = (reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void => {
    this.handleOpen(reason, trigger);
  };
  private readonly _registerTrigger = (el: HTMLElement): void => {
    if (this.triggerElement === el) return;
    this.triggerElement = el;
    this.rootCtx = this.createRootContext();
  };
  private readonly _unregisterTrigger = (el: HTMLElement): void => {
    if (this.triggerElement !== el) return;
    this.triggerElement = null;
    this.rootCtx = this.createRootContext();
  };
  private readonly _registerPanel = (el: HTMLElement): void => {
    if (this.panelElement === el) return;
    this.panelElement = el;
    this.rootCtx = this.createRootContext();
  };
  private readonly _unregisterPanel = (el: HTMLElement): void => {
    if (this.panelElement !== el) return;
    this.panelElement = null;
    this.rootCtx = this.createRootContext();
  };
  private readonly _getTriggerElement = (): HTMLElement | null => this.triggerElement;
  private readonly _getPanelElement = (): HTMLElement | null => this.panelElement;

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: CollapsibleHostSnapshot = {
      open: this.open,
      defaultOpen: this.defaultOpen,
      disabled: this.disabled,
    };
    this.engine.syncFromHost(snapshot);

    this.toggleAttribute('data-open', this.engine.isOpen);
    this.toggleAttribute('data-disabled', this.disabled);

    if (!this.hasUpdated || changed.has('open') || changed.has('defaultOpen') || changed.has('disabled')) {
      this.rootCtx = this.createRootContext();
    }
  }

  private createRootContext(): CollapsibleRootContext {
    return {
      open: this.engine.isOpen,
      disabled: this.disabled,
      requestToggle: this._requestToggle,
      requestOpen: this._requestOpen,
      registerTrigger: this._registerTrigger,
      unregisterTrigger: this._unregisterTrigger,
      registerPanel: this._registerPanel,
      unregisterPanel: this._unregisterPanel,
      getTriggerElement: this._getTriggerElement,
      getPanelElement: this._getPanelElement,
    };
  }

  private handleToggle(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void {
    const result = this.engine.requestToggle();
    if (result === null) return;

    this.emitOpenChange(result, reason, trigger);
  }

  private handleOpen(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void {
    if (this.engine.isOpen) return;

    const result = this.engine.requestOpen({ ignoreDisabled: reason === 'programmatic' });
    if (result === null) return;

    this.emitOpenChange(result, reason, trigger);
  }

  private emitOpenChange(
    open: boolean,
    reason: CollapsibleOpenChangeReason,
    trigger: HTMLElement | null,
  ): void {
    this.dispatchEvent(
      new CustomEvent<CollapsibleOpenChangeDetail>('grund-open-change', {
        detail: { open, reason, trigger },
        bubbles: true,
        composed: false,
      }),
    );

    // Re-provide context so children re-render
    this.rootCtx = this.createRootContext();
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-collapsible')) {
  customElements.define('grund-collapsible', GrundCollapsible);
}
```

- [ ] **Step 3b: Do not create trigger or panel stubs**

The root tests use a local test-only context consumer instead of importing incomplete trigger/panel elements. This keeps Task 5 focused on root behavior and avoids committing placeholder component files that would be immediately replaced in Tasks 6 and 7.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/collapsible/tests/collapsible.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/collapsible/collapsible.ts src/components/collapsible/tests/collapsible.test.ts
git commit -m "feat(collapsible): add root component with controlled/uncontrolled state"
```

---

## Task 6: Trigger Component `<grund-collapsible-trigger>`

**Files:**
- Create: `src/components/collapsible/collapsible-trigger.ts`
- Create: `src/components/collapsible/tests/collapsible-trigger.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils';

import '../collapsible';
import '../collapsible-trigger';

import type { GrundCollapsible } from '../collapsible';

describe('GrundCollapsibleTrigger', () => {
  async function setup(
    template = html`
      <grund-collapsible>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `,
  ) {
    const el = await fixture<GrundCollapsible>(template);
    await flush(el);
    return el;
  }

  it('renders native button with part="trigger" and type="button"', async () => {
    const el = await setup();
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    expect(button.tagName).to.equal('BUTTON');
    expect(button.type).to.equal('button');
  });

  it('reflects data-open on trigger host when open', async () => {
    const el = await setup(html`
      <grund-collapsible default-open>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    expect(trigger.hasAttribute('data-open')).to.be.true;
  });

  it('reflects data-disabled on trigger host when disabled', async () => {
    const el = await setup(html`
      <grund-collapsible disabled>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    expect(trigger.hasAttribute('data-disabled')).to.be.true;
  });

  it('sets aria-expanded matching open state', async () => {
    const el = await setup();
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    expect(button.getAttribute('aria-expanded')).to.equal('false');

    button.click();
    await flush(el);

    expect(button.getAttribute('aria-expanded')).to.equal('true');
  });

  it('sets aria-disabled when root is disabled', async () => {
    const el = await setup(html`
      <grund-collapsible disabled>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>Content</grund-collapsible-panel>
      </grund-collapsible>
    `);
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    expect(button.getAttribute('aria-disabled')).to.equal('true');
  });

  it('click does nothing when disabled', async () => {
    const el = await setup(html`
      <grund-collapsible disabled>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
      </grund-collapsible>
    `);
    const trigger = el.querySelector('grund-collapsible-trigger')!;
    const button = getByPart<HTMLButtonElement>(trigger, 'trigger');
    button.click();
    await flush(el);
    expect(el.hasAttribute('data-open')).to.be.false;
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/collapsible/tests/collapsible-trigger.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the trigger**

```ts
import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { collapsibleRootContext } from './collapsible.context';

import type { CollapsibleRootContext } from './collapsible.context';

export class GrundCollapsibleTrigger extends LitElement {
  public static override readonly styles = css`
    /* Headless — only display mode for layout participation */
    :host { display: block; }
  `;

  @consume({ context: collapsibleRootContext, subscribe: true })
  @state()
  private rootCtx?: CollapsibleRootContext;

  private isTriggerRegistered = false;

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isTriggerRegistered) {
      this.rootCtx?.unregisterTrigger(this);
      this.isTriggerRegistered = false;
    }
  }

  protected override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.rootCtx) {
        console.warn(
          '[grund-collapsible-trigger] Must be used inside <grund-collapsible>.',
        );
      }
    }

    if (this.rootCtx && !this.isTriggerRegistered) {
      this.rootCtx.registerTrigger(this);
      this.isTriggerRegistered = true;
    }

    if (this.rootCtx) {
      this.toggleAttribute('data-open', this.rootCtx.open);
      this.toggleAttribute('data-disabled', this.rootCtx.disabled);
    }
  }

  private handleClick(): void {
    if (this.rootCtx?.disabled) return;
    this.rootCtx?.requestToggle('trigger-press', this);
  }

  protected override render() {
    const ctx = this.rootCtx;
    const panelEl = ctx?.getPanelElement() ?? null;

    return html`
      <button
        part="trigger"
        type="button"
        aria-expanded="${ctx?.open ? 'true' : 'false'}"
        aria-disabled="${ctx?.disabled ? 'true' : 'false'}"
        .ariaControlsElements=${panelEl ? [panelEl] : []}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-collapsible-trigger')) {
  customElements.define('grund-collapsible-trigger', GrundCollapsibleTrigger);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/collapsible/tests/collapsible-trigger.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/collapsible/collapsible-trigger.ts src/components/collapsible/tests/collapsible-trigger.test.ts
git commit -m "feat(collapsible): add trigger component with ARIA and context consumption"
```

---

## Task 7: Panel Component `<grund-collapsible-panel>`

**Files:**
- Create: `src/components/collapsible/collapsible-panel.ts`
- Create: `src/components/collapsible/tests/collapsible-panel.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/test-utils';

import '../collapsible';
import '../collapsible-trigger';
import '../collapsible-panel';

import type { GrundCollapsible } from '../collapsible';

describe('GrundCollapsiblePanel', () => {
  async function setup(
    template = html`
      <grund-collapsible default-open>
        <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>Content</grund-collapsible-panel>
      </grund-collapsible>
    `,
  ) {
    const el = await fixture<GrundCollapsible>(template);
    await flush(el);
    return el;
  }

  describe('visibility', () => {
    it('renders panel content when open', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv).to.exist;
      expect(panelDiv?.hasAttribute('hidden')).to.be.false;
    });

    it('removes panel from DOM when closed (default)', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      // Wait for presence exit to complete
      await aTimeout(0);
      await el.updateComplete;
      await flush(el);
      expect(panel.shadowRoot?.querySelector('[part="panel"]')).to.be.null;
    });

    it('keeps panel in DOM with hidden when keepMounted', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel keep-mounted>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv).to.exist;
      expect(panelDiv?.hasAttribute('hidden')).to.be.true;
    });

    it('uses hidden="until-found" when hiddenUntilFound', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel hidden-until-found>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv).to.exist;
      expect(panelDiv?.getAttribute('hidden')).to.equal('until-found');
    });

    it('hiddenUntilFound takes precedence over keepMounted', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel keep-mounted hidden-until-found>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv?.getAttribute('hidden')).to.equal('until-found');
    });
  });

  describe('beforematch', () => {
    it('requests open on beforematch event', async () => {
      const el = await setup(html`
        <grund-collapsible>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel hidden-until-found>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot!.querySelector('[part="panel"]')!;

      panelDiv.dispatchEvent(new Event('beforematch', { bubbles: true }));
      await flush(el);

      expect(el.hasAttribute('data-open')).to.be.true;
    });
  });

  describe('accessibility', () => {
    it('panel div has role="region"', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
      expect(panelDiv?.getAttribute('role')).to.equal('region');
    });

    it('ariaLabelledByElements links to trigger host', async () => {
      const el = await setup();
      const trigger = el.querySelector('grund-collapsible-trigger')!;
      const panel = el.querySelector('grund-collapsible-panel')!;
      const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]') as HTMLElement;
      expect(panelDiv.ariaLabelledByElements).to.include(trigger);
    });

    it('trigger ariaControlsElements links to panel host', async () => {
      const el = await setup();
      const trigger = el.querySelector('grund-collapsible-trigger')!;
      const panel = el.querySelector('grund-collapsible-panel')!;
      const button = trigger.shadowRoot?.querySelector('[part="trigger"]') as HTMLButtonElement;
      expect(button.ariaControlsElements).to.include(panel);
    });
  });

  describe('data attributes', () => {
    it('reflects data-open on panel host when open', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      expect(panel.hasAttribute('data-open')).to.be.true;
    });

    it('reflects data-disabled on panel host when disabled', async () => {
      const el = await setup(html`
        <grund-collapsible disabled default-open>
          <grund-collapsible-trigger>Toggle</grund-collapsible-trigger>
          <grund-collapsible-panel>Content</grund-collapsible-panel>
        </grund-collapsible>
      `);
      const panel = el.querySelector('grund-collapsible-panel')!;
      expect(panel.hasAttribute('data-disabled')).to.be.true;
    });
  });

  describe('CSS custom properties', () => {
    it('sets --grund-collapsible-panel-height when open', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      const height = getComputedStyle(panel).getPropertyValue('--grund-collapsible-panel-height');
      expect(height).to.not.equal('');
    });

    it('sets --grund-collapsible-panel-width when open', async () => {
      const el = await setup();
      const panel = el.querySelector('grund-collapsible-panel')!;
      const width = getComputedStyle(panel).getPropertyValue('--grund-collapsible-panel-width');
      expect(width).to.not.equal('');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/collapsible/tests/collapsible-panel.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the panel**

```ts
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ifDefined } from 'lit/directives/if-defined.js';
import { PresenceController } from '../../controllers/presence.controller';
import { collapsibleRootContext } from './collapsible.context';

import type { CollapsibleRootContext } from './collapsible.context';

export class GrundCollapsiblePanel extends LitElement {
  public static override readonly styles = css`
    /* Headless — only display mode for layout participation */
    :host { display: block; }
  `;

  @property({ type: Boolean, attribute: 'keep-mounted' }) public keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) public hiddenUntilFound = false;

  @consume({ context: collapsibleRootContext, subscribe: true })
  @state()
  private rootCtx?: CollapsibleRootContext;

  private isPanelRegistered = false;
  private hasMeasuredOpen = false;
  private beforematchTarget: HTMLElement | null = null;

  private readonly presence = new PresenceController(this, {
    isPresent: () => this.rootCtx?.open ?? false,
    getTransitionElement: () => this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null,
    onStatusChange: () => {
      this.syncPresenceAttributes();
      this.requestUpdate();
    },
  });

  private handleBeforematch = (): void => {
    this.rootCtx?.requestOpen('programmatic', null);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isPanelRegistered) {
      this.rootCtx?.unregisterPanel(this);
      this.isPanelRegistered = false;
    }
    this.clearBeforematchListener();
  }

  protected override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.rootCtx) {
        console.warn('[grund-collapsible-panel] Must be used inside <grund-collapsible>.');
      }
    }

    if (this.rootCtx && !this.isPanelRegistered) {
      this.rootCtx.registerPanel(this);
      this.isPanelRegistered = true;
    }

    if (this.rootCtx) {
      this.toggleAttribute('data-open', this.rootCtx.open);
      this.toggleAttribute('data-disabled', this.rootCtx.disabled);
    }

    this.syncPresenceAttributes();
  }

  private syncPresenceAttributes(): void {
    this.toggleAttribute('data-starting-style', this.presence.status === 'starting');
    this.toggleAttribute('data-ending-style', this.presence.status === 'ending');
  }

  protected override updated(): void {
    this.updateBeforematchListener();

    if (!this.rootCtx?.open) {
      this.hasMeasuredOpen = false;
      return;
    }

    // Measure panel dimensions once per open for CSS variable animations.
    if (!this.hasMeasuredOpen) {
      const panelEl = this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]');
      if (panelEl) {
        this.style.setProperty('--grund-collapsible-panel-height', `${panelEl.scrollHeight}px`);
        this.style.setProperty('--grund-collapsible-panel-width', `${panelEl.scrollWidth}px`);
        this.hasMeasuredOpen = true;
      }
    }
  }

  private updateBeforematchListener(): void {
    const nextTarget = this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null;
    if (this.beforematchTarget === nextTarget) return;

    this.clearBeforematchListener();
    this.beforematchTarget = nextTarget;
    this.beforematchTarget?.addEventListener('beforematch', this.handleBeforematch);
  }

  private clearBeforematchListener(): void {
    this.beforematchTarget?.removeEventListener('beforematch', this.handleBeforematch);
    this.beforematchTarget = null;
  }

  protected override render() {
    const ctx = this.rootCtx;
    if (!ctx) return nothing;

    const isOpen = ctx.open;

    // Determine whether to render the panel
    if (!isOpen && !this.presence.present) {
      if (!this.keepMounted && !this.hiddenUntilFound) return nothing;
    }

    let hidden: string | undefined;
    if (!isOpen && !this.presence.present) {
      if (this.hiddenUntilFound) {
        hidden = 'until-found';
      } else if (this.keepMounted) {
        hidden = '';
      }
    }

    const triggerEl = ctx.getTriggerElement();

    return html`
      <div
        part="panel"
        role="region"
        .ariaLabelledByElements=${triggerEl ? [triggerEl] : []}
        hidden="${ifDefined(hidden !== undefined ? hidden : undefined)}"
      >
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-collapsible-panel')) {
  customElements.define('grund-collapsible-panel', GrundCollapsiblePanel);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/collapsible/tests/collapsible-panel.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/collapsible/collapsible-panel.ts src/components/collapsible/tests/collapsible-panel.test.ts
git commit -m "feat(collapsible): add panel component with presence, visibility modes, and ARIA"
```

---

## Task 8: Barrel Export and Package Configuration

**Files:**
- Create: `src/components/collapsible/index.ts`
- Modify: `src/index.ts`
- Modify: `package.json` (exports field)
- Modify: `custom-elements.json` (generated)

- [ ] **Step 1: Create the barrel export**

```ts
export { GrundCollapsible } from './collapsible';
export { GrundCollapsibleTrigger } from './collapsible-trigger';
export { GrundCollapsiblePanel } from './collapsible-panel';

export type { CollapsibleOpenChangeDetail, CollapsibleOpenChangeReason } from './types';
```

- [ ] **Step 2: Add collapsible to root barrel**

Add to `src/index.ts`:

```ts
export * from './components/collapsible';
```

- [ ] **Step 3: Add package.json export path**

Add to `package.json` `exports` field:

```json
"./collapsible": "./dist/components/collapsible/index.js"
```

- [ ] **Step 4: Regenerate Custom Elements Manifest**

Run: `npm run analyze`
Expected: `custom-elements.json` updates with the collapsible elements.

- [ ] **Step 5: Verify build works**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add src/components/collapsible/index.ts src/index.ts package.json custom-elements.json
git commit -m "feat(collapsible): add barrel exports and package entry point"
```

---

## Task 9: Vocabulary Update

**Files:**
- Modify: `docs/vocabulary.md`

- [ ] **Step 1: Add new vocabulary entries**

Add to the appropriate sections in `docs/vocabulary.md`:

Under **Context Symbols:**
- `collapsibleRootContext`

Under **Component Tags:**
- `grund-collapsible`
- `grund-collapsible-trigger`
- `grund-collapsible-panel`

Under **Part Names** (if not already listed):
- `trigger`
- `panel`

Under **Data Attributes** (if not already listed):
- `data-starting-style`
- `data-ending-style`

Under **CSS Custom Properties** (add section if needed):
- `--grund-collapsible-panel-height`
- `--grund-collapsible-panel-width`

Under **Event Names** (add detail shape note):
- `grund-open-change` — note the Collapsible detail shape (`CollapsibleOpenChangeDetail`)

- [ ] **Step 2: Commit**

```bash
git add docs/vocabulary.md
git commit -m "docs: add collapsible vocabulary entries"
```

---

## Task 10: Storybook Stories

**Files:**
- Create: `stories/collapsible.stories.ts`

- [ ] **Step 1: Create stories file**

```ts
import { html } from 'lit';
import { action } from 'storybook/actions';

import type { Meta, StoryObj } from '@storybook/web-components';

import '../src/components/collapsible';

import type { GrundCollapsible } from '../src/components/collapsible';

const meta: Meta<GrundCollapsible> = {
  title: 'Components/Collapsible',
  component: 'grund-collapsible',
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<GrundCollapsible>;

export const Default: Story = {
  render: (args) => html`
    <grund-collapsible
      ?disabled=${args.disabled}
      ?default-open=${args.defaultOpen}
      @grund-open-change=${action('grund-open-change')}
    >
      <grund-collapsible-trigger>Toggle content</grund-collapsible-trigger>
      <grund-collapsible-panel>
        <p>This is the collapsible content panel.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const DefaultOpen: Story = {
  render: () => html`
    <grund-collapsible default-open @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Toggle content</grund-collapsible-trigger>
      <grund-collapsible-panel>
        <p>This panel starts open.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const Controlled: Story = {
  render: () => {
    const handleChange = (e: CustomEvent) => {
      const target = e.currentTarget as GrundCollapsible;
      target.open = e.detail.open;
      action('grund-open-change')(e);
    };
    return html`
      <grund-collapsible .open=${false} @grund-open-change=${handleChange}>
        <grund-collapsible-trigger>Controlled toggle</grund-collapsible-trigger>
        <grund-collapsible-panel>
          <p>Controlled panel — consumer manages open state.</p>
        </grund-collapsible-panel>
      </grund-collapsible>
    `;
  },
};

export const Disabled: Story = {
  render: () => html`
    <grund-collapsible disabled>
      <grund-collapsible-trigger>Cannot toggle (disabled)</grund-collapsible-trigger>
      <grund-collapsible-panel>
        <p>This panel cannot be opened.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const KeepMounted: Story = {
  render: () => html`
    <grund-collapsible @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Toggle (keep mounted)</grund-collapsible-trigger>
      <grund-collapsible-panel keep-mounted>
        <p>Panel stays in DOM when closed (hidden attribute applied).</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const HiddenUntilFound: Story = {
  render: () => html`
    <grund-collapsible @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Toggle (hidden until found)</grund-collapsible-trigger>
      <grund-collapsible-panel hidden-until-found>
        <p>This content is searchable via Ctrl+F even when collapsed.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const AnimatedHeight: Story = {
  render: () => html`
    <style>
      .animated-collapsible grund-collapsible-panel::part(panel) {
        overflow: hidden;
        transition: height 300ms ease, opacity 300ms ease;
      }
      .animated-collapsible grund-collapsible-panel[data-open]::part(panel) {
        height: var(--grund-collapsible-panel-height);
        opacity: 1;
      }
      .animated-collapsible grund-collapsible-panel:not([data-open])::part(panel) {
        height: 0;
        opacity: 0;
      }
      .animated-collapsible grund-collapsible-panel[data-starting-style]::part(panel) {
        height: 0;
        opacity: 0;
      }
      .animated-collapsible grund-collapsible-panel[data-ending-style]::part(panel) {
        height: 0;
        opacity: 0;
      }
    </style>
    <grund-collapsible class="animated-collapsible" @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Animated toggle</grund-collapsible-trigger>
      <grund-collapsible-panel keep-mounted>
        <p>This panel animates its height using CSS transitions and the exposed CSS variables.</p>
        <p>The component measures scrollHeight and exposes it as --grund-collapsible-panel-height.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};

export const ReducedMotion: Story = {
  render: () => html`
    <style>
      .reduced-motion-collapsible grund-collapsible-panel::part(panel) {
        overflow: hidden;
        transition: height 300ms ease, opacity 300ms ease;
      }
      .reduced-motion-collapsible grund-collapsible-panel[data-open]::part(panel) {
        height: var(--grund-collapsible-panel-height);
        opacity: 1;
      }
      .reduced-motion-collapsible grund-collapsible-panel:not([data-open])::part(panel) {
        height: 0;
        opacity: 0;
      }
      .reduced-motion-collapsible grund-collapsible-panel[data-starting-style]::part(panel),
      .reduced-motion-collapsible grund-collapsible-panel[data-ending-style]::part(panel) {
        height: 0;
        opacity: 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .reduced-motion-collapsible grund-collapsible-panel::part(panel) {
          transition: none;
        }
      }
    </style>
    <grund-collapsible class="reduced-motion-collapsible" @grund-open-change=${action('grund-open-change')}>
      <grund-collapsible-trigger>Respects reduced motion</grund-collapsible-trigger>
      <grund-collapsible-panel keep-mounted>
        <p>Animations disabled when prefers-reduced-motion: reduce is active.</p>
      </grund-collapsible-panel>
    </grund-collapsible>
  `,
};
```

- [ ] **Step 2: Verify Storybook renders**

Run: `npm run build-storybook`
Expected: Storybook builds without compilation errors and includes Components/Collapsible.

- [ ] **Step 3: Commit**

```bash
git add stories/collapsible.stories.ts
git commit -m "docs(storybook): add collapsible component stories"
```

---

## Task 11: Run Full Test Suite

- [ ] **Step 1: Run all component tests**

Run: `npm run test:run`
Expected: All tests PASS including existing accordion/tabs tests (no regressions)

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run package build**

Run: `npm run build`
Expected: Vite build and declaration emit complete successfully.

- [ ] **Step 4: Fix any failures**

If any tests, type checks, or build steps fail, fix them before proceeding.

---

## Task 12: Update Controller Registry

**Files:**
- Modify: `vollgas/refs/component-shapes.md`

- [ ] **Step 1: Mark PresenceController as existing**

Find the `PresenceController` entry in the planned controllers section and mark it as implemented/existing.

- [ ] **Step 2: Commit**

```bash
git add vollgas/refs/component-shapes.md
git commit -m "docs: mark PresenceController as implemented in controller registry"
```

---

## Implementation Notes

### Reference Decisions

- Base UI is the behavior reference for Root/Trigger/Panel anatomy, controlled/uncontrolled state, `hiddenUntilFound` precedence over `keepMounted`, `data-starting-style`/`data-ending-style`, and panel dimension CSS variables.
- Grund UI keeps its local naming conventions (`data-open`, `--grund-collapsible-panel-height`, `--grund-collapsible-panel-width`) instead of copying Base UI's exact attribute/variable names.
- Polaris Web Components does not provide a direct collapsible primitive. Its useful lesson is command-style extensibility (`commandFor`, `--show`, `--hide`, `--toggle`) and lifecycle event discipline, but external commands remain out of scope for v1. The engine/root still use idempotent open/close/toggle requests so a future command adapter can be added without rewriting state resolution.

### Ordering Dependencies

```
Task 1 (types) ← Task 2 (engine) ← Task 5 (root) ← Task 6 (trigger) ← Task 7 (panel)
Task 3 (PresenceController) ←——————————————————————————————— Task 7 (panel)
Task 4 (context) ←—————————————————————— Task 5, 6, 7
Task 5, 6, 7 ← Task 8 (exports + CEM) ← Task 9 (vocabulary) ← Task 10 (stories)
All ← Task 11 (full suite) ← Task 12 (registry)
```

Tasks 1, 3, and 4 have no inter-dependencies and can be done in parallel.
Tasks 5, 6, and 7 should be implemented sequentially. Task 5 root tests use a test-only context consumer, Task 6 trigger tests avoid importing the panel, and Task 7 verifies the full trigger/panel ARIA relationship once both real elements exist.

### Testing Approach

- Engine tests (Task 2): Pure unit tests, no DOM, no Lit — just vitest assertions
- PresenceController tests (Task 3): Browser tests with test host elements
- Component tests (Tasks 5-7): Integration tests with full compound component tree
- All use `@open-wc/testing` fixtures + the project's `flush()` helper

### Key Patterns to Follow (from Accordion reference)

- `@provide`/`@consume` with `subscribe: true` for reactive context
- Stable arrow-function callback references in context objects
- `willUpdate` for data attribute syncing and registration
- Guarded `customElements.define` at file bottom
- `flush()` helper in tests for multi-cycle context propagation
- `getByPart()` helper for shadow DOM part queries
