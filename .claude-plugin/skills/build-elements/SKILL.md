---
name: "build-elements"
description: "Use after /build-controller to implement all custom elements: root, item, and sub-parts. TDD: integration tests first. Runs all 6 reviewers in parallel after implementation. Next step after /build-controller."
---

## Overview

Implements root, item, and all sub-part elements. Wires context, shared controllers, ARIA relationships, lifecycle, dev-mode warnings, and `exportparts`. All 6 reviewers run in parallel — this is the main quality gate.

## Usage

```
/build-elements accordion
```

## Implementation

### Step 1 — Read spec and refs

Always read:
- `docs/specs/{name}.spec.md`
- `docs/vocabulary.md`
- `.claude-plugin/refs/lit-patterns.md`
- `.claude-plugin/refs/headless-contract.md`
- `.claude-plugin/refs/consumer-dx.md` (implementation guidance only — not passed to reviewers)

Read conditionally based on category:
- Form control: `.claude-plugin/refs/form-participation.md`
- Overlay or show/hide: `.claude-plugin/refs/transition-contract.md` and `.claude-plugin/refs/focus-management.md`
- Composite widget with roving focus: `.claude-plugin/refs/focus-management.md`

### Step 2 — Write failing integration tests (RED)

Write `src/components/{name}/{name}.test.ts` using `simulateKeyboard`, `flush`, `getByPart` from `src/test-utils/index.ts`:
- Every public property: initial default, dynamic change, attribute reflection
- Every event: detail shape, controlled mode (state unchanged), uncontrolled mode (state changes)
- Full keyboard contract from spec
- Dynamic registration: add and remove child after initial render
- Mount/unmount memory test (verify every `addEventListener` has a matching `removeEventListener` after disconnect)
- RTL (if component has `orientation`)
- Composition: two sibling instances of the same component do not interfere with each other's state
- Event ordering: when one interaction fires multiple events, collect them in an `events[]` array and assert sequence
- Reparenting: item moved to a different root resubscribes to the new context
- Define order: children-defined-before-parent scenario (separate Playwright page — see `test-patterns.md`)

Run `npm run test:run -- src/components/{name}/{name}.test.ts` — confirm tests fail.

### Step 3 — Implement elements (GREEN)

For each element in the spec:
- `@provide` context on root; `@consume` on all consumers
- Attach shared controllers: `RovingFocusController` (as applicable)
- Category-specific: `FormController` (form), `FocusTrapController` / `FocusRestorationController` (overlay)
- Set `data-*` attributes in `willUpdate` (not in `updated` or event handlers)
- `exportparts` on every compound layer wrapping shadow elements with `part` attributes
- Dev-mode warning in `connectedCallback` when element is used outside its required parent: `if (import.meta.env.DEV) { ... }`
- `customElements.define()` with `if (!customElements.get(...))` registration guard
- `HostSnapshot` packaged in root's `willUpdate`, passed to controller via `syncFromHost()`

Run tests — confirm they pass.

### Step 4 — Run all 6 reviewers in parallel

Read `.claude-plugin/refs/reviewer-dispatch.md` for the canonical context injection table and patch loop rules.

Read all 6 reviewer SKILL.md files from `.claude-plugin/reviewers/{name}/SKILL.md`. Use each file's content as the Agent prompt. Dispatch all 6 as simultaneous Agent calls, injecting context files per the dispatch table.

Note: Storybook story files do not exist at this step — `test-reviewer` checklist items covering `play` functions and story coverage are deferred to the test-reviewer run inside `/build-stories`.

Collect all findings and follow the patch loop rules from `reviewer-dispatch.md`.

### Step 5 — Commit

```bash
git add src/components/{name}/
git commit -m "feat({name}): elements — root, item, sub-parts, context, ARIA, lifecycle"
```

**Next step: `/build-stories {name}`.**
