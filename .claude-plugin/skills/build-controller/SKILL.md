---
name: "build-controller"
description: "Use after /scaffold to implement the ReactiveController, registry (if needed), and pure utility functions. TDD: tests written before implementation. Runs lit-reviewer. Next step after /scaffold."
---

## Overview

Implements all state logic before touching the DOM. The controller is independently testable — no elements needed. Unit tests cover every action and state transition.

## Usage

```
/build-controller accordion
```

## Implementation

### Step 1 — Read spec and patterns

Read `docs/specs/{name}.spec.md` and `.claude-plugin/refs/lit-patterns.md`. Identify from the spec:
- State shape (what the controller owns)
- Actions and their names (must match `docs/vocabulary.md` — `requestToggle`, `requestOpen`, etc.)
- Resolution logic pattern: pure resolver functions (composite-widget, form-control, simple) OR explicit state machine (overlay, multi-step components). See `refs/lit-patterns.md` for both patterns.

### Step 2 — Write failing unit tests (RED)

Write `src/components/{name}/controller/{name}.test.ts`:
- Each action: assert state transitions correctly
- Controlled mode: `syncFromHost()` with a `HostSnapshot` that has `value` set — state does not change on action, event fires
- Uncontrolled mode: state changes on action, event fires
- Edge cases from the spec (e.g., `multiple: false` closes other items when one opens)

Run `npm run test:run -- src/components/{name}/controller/` — confirm tests fail.

### Step 3 — Implement the controller (GREEN)

Write `src/components/{name}/controller/index.ts`:
- Implements `ReactiveController`
- All state as private fields
- `syncFromHost(snapshot: HostSnapshot): void` — called in host's `willUpdate`
- Actions dispatch `CustomEvent` through `this.host`
- No DOM access — controller must be testable without a browser
- Use pure resolver functions (composite/simple) or explicit `states`/`transition()` (overlays)

If the spec requires a registry: write `src/components/{name}/registry/index.ts` for ordered child tracking. Use `WeakRef<T>` for stored element references.

Run tests — confirm they pass.

### Step 4 — Dispatch `lit-reviewer`

Read `.claude-plugin/reviewers/lit-reviewer/SKILL.md`. Use its content as the Agent prompt. Dispatch as Agent call. Read and inject as context: controller file(s) content, registry file content (if exists), component spec content, `.claude-plugin/refs/lit-patterns.md` content.

Fix all blockers. Re-review if any fixes were made. Max 2 iterations. Escalate to `/diagnose-failure` if stuck after 2.

### Step 5 — Commit

```bash
git add src/components/{name}/controller/ src/components/{name}/registry/
git commit -m "feat({name}): controller — state machine, actions, resolver logic"
```

**Next step: `/build-elements {name}`.**
