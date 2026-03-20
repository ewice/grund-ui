---
name: "performance-reviewer"
description: "Use when reviewing component files for performance issues specific
  to Lit Web Components. Triggered by the implement skill (Phase 3) or manually
  on any PR before merge."
---

## Overview

Reviews changed files for performance issues in a Lit/Web Component context.
Focuses on unnecessary re-renders, memory leaks, render loop risks, and
expensive operations in hot paths. Does not duplicate CLAUDE.md style rules —
only performance concerns.

## Output Format

Return findings as JSON lines:

```json
{"file": "src/components/{name}/root/{name}-root.ts", "line": 42, "rule": "Context object recreated on every cycle", "finding": "createContextValue() called in willUpdate — returns a new object every render, breaking downstream === checks and triggering unnecessary consumer updates", "confidence": 95, "severity": "blocker", "fix": "Create context object once in constructor; mutate only the fields that change in willUpdate"}
```

Severity levels: `blocker` (causes measurable regressions or render loops),
`warning` (degrades performance under normal usage), `suggestion` (optimisation
opportunity with low risk).

End with `PASS` or `FAIL(blockers=N, warnings=M)`.

## What to check

### Render loop risks

- **`updated()` setting reactive properties** — any `this.foo = ...` inside
  `updated()` triggers another Lit update cycle. Flag unless the assignment is
  guarded by a changed check (`if (this.foo !== next) this.foo = next`).
- **`requestUpdate()` called unconditionally** — flag any `this.requestUpdate()`
  not guarded by a condition. Common cause: ContextConsumer callbacks that call
  `requestUpdate()` even when the context value has not changed.
- **Context subscriptions triggering unbounded updates** — if a context
  consumer's callback runs on every parent render and causes the child to
  re-render, even when its slice of context is unchanged, flag it.

### Context object stability

- **Context object recreated in `willUpdate`** — the entire context value object
  must be created once (in the constructor) and mutated in place. If
  `willUpdate` calls a factory function that returns a new object, every
  consumer receives a new reference and re-renders. This is the most common
  performance issue in compound components.
- **Action methods recreated per cycle** — action methods bound inside
  `willUpdate` (e.g. `this.contextValue.toggle = (v) => this.toggle(v)`)
  produce new function references on every cycle. Bind once in the constructor.

### Memory leaks

- **Event listeners not removed** — imperative `addEventListener` in
  `connectedCallback` or the constructor without matching removal in
  `disconnectedCallback`. Lit template `@event` syntax is safe.
- **`window` / `document` listeners** — especially dangerous. Must be removed
  in `disconnectedCallback`.
- **Controller `hostDisconnected` missing** — any `ReactiveController` that
  holds resources (listeners, timers, observers) must implement
  `hostDisconnected()` to release them. Flag controllers that implement
  `hostConnected` but not `hostDisconnected`.
- **`ContextConsumer` / `ContextProvider` not cleaned up** — if a consumer is
  created imperatively (not via `@consume`), verify it does not hold a reference
  that prevents garbage collection after disconnection.
- **`ResizeObserver` / `IntersectionObserver` / `MutationObserver` not
  disconnected** — flag any observer not disconnected in `disconnectedCallback`.

### Expensive operations in hot paths

- **`querySelectorAll` / `querySelector` in `willUpdate` or `render`** — DOM
  queries in the render hot path are expensive. Flag them. Use `@query` / `@queryAll`
  decorators (cached) or registry-tracked references instead.
- **`getBoundingClientRect` / `offsetWidth` / `scrollHeight` in `willUpdate`**
  — forced synchronous layout. Flag any forced reflow in the Lit update cycle.
- **Array/Set/Map construction in `render`** — constructing new collections
  inside `render()` creates GC pressure on every update. Flag unless the
  collection is trivially small (< 5 items, no loop).
- **Deep clone / JSON.parse in lifecycle methods** — flag any deep copy
  operations in `willUpdate`, `render`, or `updated`.

### Unnecessary re-renders

- **Reactive properties that change more often than needed** — if a `@property`
  or `@state` field is set to the same value it already holds (no change check),
  Lit still schedules an update. Flag `this.foo = value` without an
  `if (this.foo !== value)` guard in cases where the value is likely stable.
- **Controller `hostUpdate` doing heavy work** — `hostUpdate()` on a
  `ReactiveController` runs on every host update cycle. Flag expensive
  synchronous work there.
- **Whole-collection replacement when a partial update suffices** — replacing an
  entire `Map` or `Set` on context when only one entry changed forces all
  consumers to re-render. Flag if a more targeted mutation is possible.
