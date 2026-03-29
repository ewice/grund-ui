---
name: "build-controller"
description: "Build a shared ReactiveController in src/controllers/. TDD: tests before implementation. Runs lit-reviewer, code-quality-reviewer, security-reviewer. Use when /scaffold reports a missing controller."
---

## Overview

Implements a shared `ReactiveController` that wraps Lit lifecycle hooks and imperative DOM work (event listeners, observers, tabindex management). Unlike Engines (pure state, no DOM), controllers integrate with a host element's lifecycle via `hostConnected` and `hostDisconnected`.

Controllers live in `src/controllers/`, are marked `@internal`, and are not re-exported from the package barrel. Import them by direct path — there is no barrel file in `src/controllers/`.

See `CLAUDE.md` → "Reactive Controllers vs Engines" for the canonical distinction.

## Usage

```
/build-controller focus-trap
```

## Implementation

### Step 1 — Read spec and refs

Read the controller spec from `workflow/refs/component-shapes.md`. Then read the relevant domain reference doc:

| Controller domain | Reference doc |
|---|---|
| Focus (trap, restoration, roving, virtual) | `workflow/refs/focus-management.md` |
| Form (internals, validation) | `workflow/refs/form-participation.md` |
| Overlay (presence, positioning, scroll-lock, outside-click) | `workflow/refs/component-shapes.md` (overlay section) |
| Feedback (live region) | `workflow/refs/component-shapes.md` (feedback section) |

Identify from the spec:
- Options interface shape (what the host passes at construction / via `update()`)
- Required lifecycle hooks (`hostConnected`, `hostDisconnected`, optionally `hostUpdated`)
- DOM interactions (event listeners, attribute manipulation, observers)
- Public methods and their signatures

### Step 2 — Write failing tests (RED)

Write `src/controllers/{name}.controller.test.ts`.

**Test host pattern** (matches `roving-focus.controller.test.ts`):

```ts
import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { LitElement } from 'lit';
import { {Name}Controller } from './{name}.controller.js';

class TestHost extends LitElement {
  controller!: {Name}Controller;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new {Name}Controller(this, {
      // controller-specific options
    });
  }

  override render() {
    return html`<slot></slot>`;
  }
}
if (!customElements.get('test-{name}-host')) {
  customElements.define('test-{name}-host', TestHost);
}
```

**Setup factory:**

```ts
async function setup(opts?: Partial<{Name}Options>) {
  const el = await fixture<TestHost>(html`
    <test-{name}-host>
      <!-- child elements as needed -->
    </test-{name}-host>
  `);
  if (opts) {
    el.controller.update(opts);
  }
  return { el, /* relevant child references */ };
}
```

**Required test categories:**
- Initialization (correct state after `hostConnected`)
- Behavioral contract (keyboard events, DOM mutations, focus movement — whatever the controller manages)
- Edge cases from the spec (disabled items, RTL, empty state)
- Cleanup on disconnect (listeners removed, observers disconnected)

If a test needs `simulateKeyboard`, import from `src/test-utils/index.js` (relative: `'../test-utils/index.js'`).

Run `npm run test:run -- src/controllers/{name}` — confirm tests fail.

### Step 3 — Implement the controller (GREEN)

Write `src/controllers/{name}.controller.ts`:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface {Name}Options {
  // controller-specific options
}

/**
 * One-sentence description.
 * @internal
 */
export class {Name}Controller implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private options: {Name}Options;
  private handleKeydown = this.onKeydown.bind(this); // stable listener reference

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: {Name}Options,
  ) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  public hostConnected(): void {
    // Attach event listeners, observers, initial sync
  }

  public hostDisconnected(): void {
    // Remove all listeners and observers attached in hostConnected
  }
}
```

Rules:
- Every listener attached in `hostConnected` MUST be removed in `hostDisconnected`
- Bound method references (`this.handleX = this.onX.bind(this)`) as class fields for stable listener identity
- Options interface exported alongside the class
- `@internal` JSDoc tag — controllers are not part of the public API
- Host typed as `ReactiveControllerHost & HTMLElement` when the controller accesses the host as a DOM element (the majority case). Controllers that only use lifecycle hooks and never touch the DOM (like `FormController`) can accept plain `ReactiveControllerHost`.
- `update()` method for runtime option changes — include only if the controller's options can change after construction. Omit for controllers with fixed configuration (like `FormController`).
- Controllers must not own application state — that's the Engine's job. Controllers manage DOM concerns (focus, scroll, positioning, event delegation).

**Optional: runtime option updates**

Include only when the controller's configuration can change after construction:

```ts
public update(options: Partial<{Name}Options>): void {
  const defined = Object.fromEntries(
    Object.entries(options).filter(([, v]) => v !== undefined),
  );
  Object.assign(this.options, defined);
}
```

Run tests — confirm they pass.

### Step 4 — Dispatch reviewers

Read `workflow/reviewers/{reviewer}/SKILL.md` for each reviewer. Use its content as the Agent prompt. Dispatch 3 reviewers in parallel as Agent calls:

| Reviewer | Context to inject |
|---|---|
| `lit-reviewer` | Controller file, test file, `workflow/refs/lit-patterns.md`, `workflow/refs/ssr-contract.md` |
| `code-quality-reviewer` | Controller file, test file |
| `security-reviewer` | Controller file, test file |

This matches the "Internal (controller, context, lifecycle)" row in `workflow/refs/reviewer-dispatch.md`.

Fix all blockers. Follow the patch loop rules in `workflow/refs/reviewer-dispatch.md` (max 2 iterations per reviewer, then `/diagnose-failure`).

### Step 5 — Commit

Controllers are shared (not component-scoped), so the commit uses unscoped `feat:` rather than `feat({component}):`.

```bash
git add src/controllers/{name}.controller.ts src/controllers/{name}.controller.test.ts
git commit -m "feat: {Name}Controller — {brief description}"
```

**Next step:** Return to `/scaffold` or `/build-elements`.

## Reference Implementations

- `src/controllers/roving-focus.controller.ts` — full lifecycle, keyboard handling, options interface, `update()` method
- `src/controllers/form.controller.ts` — minimal lifecycle, wraps `ElementInternals`, no `update()`, plain `ReactiveControllerHost`
