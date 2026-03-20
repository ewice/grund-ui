---
name: "guidelines-reviewer"
description: "Use when reviewing component files for compliance with CLAUDE.md
  engineering guidelines. Triggered by the implement skill (Phase 3) or manually
  on any PR before merge."
---

## Overview

Reads every changed file and checks it against the rules in CLAUDE.md. Returns
a structured findings list. This skill does not duplicate CLAUDE.md — it tells
you what to check and how to report findings.

## Output Format

Return findings as JSON lines. Each finding:

```json
{"file": "src/components/{name}/root/index.ts", "line": 42, "rule": "Context stability", "finding": "ctx object reassigned with new function references in willUpdate", "confidence": 95, "severity": "blocker", "fix": "Bind action methods once in constructor; mutate only changed fields"}
```

Severity levels: `blocker` (must fix), `warning` (should fix), `suggestion` (consider).

End with one of:
- `PASS` — no findings with severity `blocker` or `warning`
- `FAIL(blockers=N, warnings=M)` — count of each

## What to check

Read CLAUDE.md and verify every changed file against each applicable section.
The sections and what to look for:

### Architecture (CLAUDE.md § Architecture)
- Three layers respected: utilities have no framework deps, controllers have no
  DOM access, elements delegate via context
- Each layer has exactly one job
- Shared controllers used where applicable (OpenStateController, AriaLinkController,
  RovingFocusController) — not reinvented

### Component Communication (CLAUDE.md § Component Communication)
- Discovery via registration callbacks only (no querySelectorAll)
- Show/hide via OpenStateController data-state (not hidden attribute, except hidden="until-found")
- Events named `grund-{action}` with `bubbles: true, composed: false`
- No duplicate paths for the same state mutation

### Context Design (CLAUDE.md § Context Design)
- Context object stable — action methods bound in constructor, state fields
  mutated in place
- @consume used by default; ContextConsumer only with documented reason
- Context subscriptions are private

### Lit lifecycle discipline
These rules were derived from the accordion reference implementation. Verify
each element follows them:

- **connectedCallback**: call super; minimal one-time setup only
- **willUpdate**: sync registration, derive state, set host-level data-*
  attributes. Shadow DOM not available on first call — do not access it.
  Decompose into named phases: `syncRegistration`, `syncState`, `syncAttributes`.
- **render**: return template only — no state mutations, no attribute writes,
  no side effects
- **updated**: DOM side effects on shadow DOM elements, dispatch user-facing
  events. Do not set reactive properties here (re-render loop).
- **disconnectedCallback**: unregister from parent context, clean up listeners
- **@provide** on a class property, not a getter. Re-assign in willUpdate.
- Prefer `changedProperties` over manual previous-value fields

### Controlled / Uncontrolled (CLAUDE.md § Controlled / Uncontrolled Values)
- HostSnapshot pattern: root packages properties into a plain object, passes
  to controller via syncFromHost() in willUpdate
- Controller does not reach into reactive properties on the host

### Data Attributes (CLAUDE.md § Data Attributes)
- data-state, data-open, data-disabled, data-orientation, data-index all correct
- No bare unprefixed attributes as CSS hooks

### Component Design (CLAUDE.md § Component Design Rules)
- Element prefix is `grund-`
- Each WAI-ARIA role is its own element
- IDs use `crypto.randomUUID().slice(0, 8)` (no module-level counters)

### Dev-Mode Warnings
- Missing required parent context warned with `import.meta.env.DEV` guard
- No throws in production code — graceful degradation with `??` fallbacks

### JSDoc / CEM (CLAUDE.md § JSDoc / CEM)
- @element, @slot, @fires, @csspart on every element
- No {Type} annotations in @param/@returns
- First sentence under 80 chars
- Booleans: "Whether ..." not "True if ..."

### Code Style
- No blank lines at start/end of blocks
- One blank line between logical phases within a method
- One blank line between class members
- Two blank lines between top-level declarations
- Imports: external packages → internal (one blank line between groups)
- Braces on all if/else (except single-line early-return guards)
