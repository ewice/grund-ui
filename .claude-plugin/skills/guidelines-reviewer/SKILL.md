---
name: "guidelines-reviewer"
description: "Use when reviewing component files for compliance with CLAUDE.md
  engineering guidelines. Triggered by the implement skill (Phase 3) or manually
  on any PR before merge."
---

## Overview

Reads every changed file and checks it against CLAUDE.md. Returns a structured
findings list with file path, line number, rule violated, and confidence score.

## Output Format

Return findings as a list. Each finding:

```
FILE: src/components/{name}/root/index.ts
LINE: 42
RULE: Context objects must be stable — never recreate in willUpdate
FINDING: ctx object is reassigned with new function references on every willUpdate cycle
CONFIDENCE: 95
FIX: Bind action methods once in constructor; mutate only changed fields in willUpdate
```

End with one of:
- `PASS` — no findings above confidence 80
- `FAIL` — list of findings above confidence 80

## Checklist

Work through CLAUDE.md sections in order:

**Architecture**
- [ ] Three layers respected: utilities have no framework deps, controllers have no DOM access, elements delegate via context
- [ ] Each layer has exactly one job

**Shared Controllers**
- [ ] `OpenStateController` used for open/closed state (not manual data-state writes)
- [ ] `AriaLinkController` used for all cross-element ARIA relationships
- [ ] `RovingFocusController` used for keyboard navigation in container elements

**Context Design**
- [ ] Context object created once in constructor, not recreated in willUpdate
- [ ] Action methods bound in constructor (stable references)
- [ ] State fields mutated in place, not replaced
- [ ] Consumers only see what their role needs

**Registration Lifecycle**
- [ ] connectedCallback: minimal one-time setup only
- [ ] willUpdate: registration, state derivation, host data-* attributes
- [ ] render: template only — no mutations, no side effects
- [ ] updated: DOM side effects, event dispatch
- [ ] disconnectedCallback: unregister, clean up listeners

**Lit Patterns**
- [ ] willUpdate decomposed into named phase methods (syncRegistration, syncState, syncAttributes)
- [ ] changedProperties used for change tracking (not manual prev-value fields, unless documented)
- [ ] @provide on class property, not getter

**Component Communication**
- [ ] Discovery via registration callbacks only (no querySelectorAll)
- [ ] Show/hide via OpenStateController data-state (not hidden attribute, except hidden="until-found")
- [ ] Events named `grund-{action}` with `bubbles: true, composed: false`

**Data Attributes**
- [ ] data-state, data-open, data-disabled, data-orientation, data-index all set correctly
- [ ] No bare unprefixed attributes used as CSS hooks

**Component Design**
- [ ] Element prefix is `grund-`
- [ ] Each WAI-ARIA role is its own element (no merged compound sub-elements)
- [ ] IDs use `crypto.randomUUID().slice(0, 8)` (no module-level counters)

**Dev-Mode Warnings**
- [ ] Missing required parent context warned with `import.meta.env.DEV` guard
- [ ] No throws in production code — graceful degradation with `??` fallbacks

**JSDoc / CEM**
- [ ] @element, @slot, @fires, @csspart on every element
- [ ] No {Type} annotations in @param/@returns
- [ ] First sentence under 80 chars

**Code Style**
- [ ] No blank lines at start/end of blocks
- [ ] Braces on all if/else (except single-line early-return guards)
