---
name: "build-engine"
description: "Use after /scaffold to implement the Engine (pure state machine), registry (if needed), and shared engine delegation. TDD: tests written before implementation. Runs lit-reviewer. Next step after /scaffold."
---

## Overview

Implements all state logic before touching the DOM. The Engine is a plain class — **not** a `ReactiveController`, no Lit dependency, no DOM access. It is independently testable with `new EngineClass()` and plain assertions; no mock host required.

See `CLAUDE.md` → "Reactive Controllers vs Engines" for the canonical distinction.

## Usage

```
/build-engine accordion
```

## Implementation

### Step 1 — Read spec and patterns

Read `docs/specs/{name}.spec.md` and `workflow/refs/lit-patterns.md`. Identify from the spec:
- State shape (what the Engine owns)
- Actions and their names (must match `docs/vocabulary.md` — `requestToggle`, `requestActivation`, etc.)
- Whether the component manages a set of selected values → if yes, delegate to `SelectionEngine` (see Rule 36 in `refs/lit-patterns.md`)
- Resolution logic: pure resolver functions (composite-widget, form-control, simple) OR explicit state machine (overlay, multi-step). See `refs/lit-patterns.md` Rules 34–35.

### Step 2 — Write failing unit tests (RED)

Write `src/components/{name}/engine/{name}.engine.test.ts`:
- Each action: assert state transitions correctly
- Controlled mode: `syncFromHost()` with a `HostSnapshot` that has `value` set — state does not change on action
- Uncontrolled mode: state changes on action
- Edge cases from the spec (e.g., `multiple: false` closes other items when one opens)

**No mock host needed.** Engines have no Lit dependency:

```ts
// ✅ Correct — plain instantiation, zero setup
const engine = new AccordionEngine();
engine.syncFromHost({ value: undefined, defaultValue: ['a'], multiple: false, disabled: false });
expect(engine.isExpanded('a')).to.be.true;

// ❌ Wrong — engines are NOT ReactiveControllers; never create a mock host for an Engine
const mockHost = { addController: vi.fn(), ... };
```

See `src/components/accordion/engine/accordion.engine.test.ts` as a reference.

Test helper pattern:

```ts
function create(overrides?: Partial<AccordionHostSnapshot>): AccordionEngine {
  const engine = new AccordionEngine();
  engine.syncFromHost({ value: undefined, defaultValue: undefined, multiple: false, disabled: false, ...overrides });
  return engine;
}
```

Run `npm run test:run -- src/components/{name}/engine/` — confirm tests fail.

### Step 3 — Implement the Engine (GREEN)

Write `src/components/{name}/engine/{name}.engine.ts`:

```ts
import { SelectionEngine } from '../../../controllers/selection.engine.js'; // if managing a value set
import type { {Name}HostSnapshot } from '../types.js';

/**
 * Pure state and action resolution for {name}.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class {Name}Engine {
  private readonly selection = new SelectionEngine(); // if applicable

  public syncFromHost(snapshot: {Name}HostSnapshot): void {
    this.selection.syncFromHost({ ... });
  }

  public requestToggle(value: string, itemDisabled: boolean): string[] | null {
    return this.selection.requestToggle(value, itemDisabled);
  }

  public isExpanded(value: string): boolean {
    return this.selection.isSelected(value);
  }
}
```

Rules:
- All state as private fields (or delegated to `SelectionEngine`)
- `syncFromHost(snapshot: HostSnapshot): void` — called by the host element in `willUpdate`
- Actions return results — they do **not** dispatch events. The root element dispatches events after calling the engine.
- No DOM access — must be testable without a browser
- Use `SelectionEngine` for any set-based selection state (Rule 36 in `refs/lit-patterns.md`)
- **Disabled composition (Rule 38):** if `HostSnapshot` includes `disabled: boolean`, expose `isEffectivelyDisabled(itemDisabled: boolean): boolean`. Delegate to `SelectionEngine.isEffectivelyDisabled` when `SelectionEngine` is used. Add 4 tests: both-false → false, group-only → true, item-only → true, both → true.

If the spec requires a registry: write `src/components/{name}/registry/{name}.registry.ts` for ordered child tracking.

Run tests — confirm they pass.

### Step 4 — Dispatch `lit-reviewer`

Read `workflow/reviewers/lit-reviewer/SKILL.md`. Use its content as the Agent prompt. Dispatch as Agent call. Read and inject as context: engine file(s) content, registry file content (if exists), component spec content, `workflow/refs/lit-patterns.md` content, `workflow/refs/ssr-contract.md` content.

Fix all blockers. Follow the patch loop rules in `workflow/refs/reviewer-dispatch.md`.

### Step 5 — Commit

```bash
git add src/components/{name}/engine/ src/components/{name}/registry/
git commit -m "feat({name}): engine — state machine, actions, resolver logic"
```

**Next step: `/build-elements {name}`.**
