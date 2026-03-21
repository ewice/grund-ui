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
- `.claude-plugin/refs/consumer-dx.md`

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

Run tests — confirm they fail.

### Step 3 — Implement elements (GREEN)

For each element in the spec:
- `@provide` context on root; `@consume` on all consumers
- Attach shared controllers: `OpenStateController`, `AriaLinkController`, `RovingFocusController` (as applicable)
- Category-specific: `FormController` (form), `FocusTrapController` / `FocusRestorationController` (overlay)
- Set `data-*` attributes in `willUpdate` (not in `updated` or event handlers)
- `exportparts` on every compound layer wrapping shadow elements with `part` attributes
- Dev-mode warning in `connectedCallback` when element is used outside its required parent: `if (import.meta.env.DEV) { ... }`
- `customElements.define()` with `if (!customElements.get(...))` registration guard
- `HostSnapshot` packaged in root's `willUpdate`, passed to controller via `syncFromHost()`

Run tests — confirm they pass.

### Step 4 — Run all 6 reviewers in parallel

Read all 6 reviewer SKILL.md files:
- `.claude-plugin/reviewers/accessibility-reviewer/SKILL.md`
- `.claude-plugin/reviewers/lit-reviewer/SKILL.md`
- `.claude-plugin/reviewers/headless-reviewer/SKILL.md`
- `.claude-plugin/reviewers/api-reviewer/SKILL.md`
- `.claude-plugin/reviewers/test-reviewer/SKILL.md`
- `.claude-plugin/reviewers/security-reviewer/SKILL.md`

Use each file's content as the Agent prompt. Dispatch all 6 as simultaneous Agent calls:

| Reviewer | Read and inject as context |
|---|---|
| `accessibility-reviewer` | All element file contents, spec ARIA section content, `.claude-plugin/refs/focus-management.md` content |
| `lit-reviewer` | All element file contents, `.claude-plugin/refs/lit-patterns.md` content, `.claude-plugin/refs/ssr-contract.md` content |
| `headless-reviewer` | All element file contents, `.claude-plugin/refs/headless-contract.md` content, `docs/vocabulary.md` content |
| `api-reviewer` | All element file contents, `types.ts` content, `docs/vocabulary.md` content |
| `test-reviewer` | Test file content, `.claude-plugin/refs/test-patterns.md` content, component spec content |
| `security-reviewer` | All element file contents, controller file content |

Collect all findings. For each reviewer with blockers:
1. Fix the blockers
2. Re-run only that reviewer (not the full fleet)
3. Max 2 patch iterations per reviewer
4. If blockers persist after 2: invoke `/diagnose-failure` and surface to engineer

### Step 5 — Commit

```bash
git add src/components/{name}/
git commit -m "feat({name}): elements — root, item, sub-parts, context, ARIA, lifecycle"
```

**Next step: `/build-stories {name}`.**
