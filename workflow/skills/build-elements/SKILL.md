---
name: "build-elements"
description: "Use after /build-controller to implement all custom elements: root, item, and sub-parts. TDD: integration tests first. Runs all 6 reviewers in parallel after implementation. Next step after /build-controller."
---

## Overview

Implements root, item, and all sub-part elements. Wires context, shared controllers, ARIA relationships, lifecycle, dev-mode warnings, and `exportparts`. All 7 reviewers run in parallel — this is the main quality gate.

## Usage

```
/build-elements accordion
```

## Implementation

### Step 1 — Read spec and refs

Always read:
- `docs/specs/{name}.spec.md`
- `docs/vocabulary.md`
- `workflow/refs/lit-patterns.md`
- `workflow/refs/headless-contract.md`
- `workflow/refs/aria-linking.md`
- `workflow/refs/consumer-dx.md` (implementation guidance only — not passed to reviewers)

Read conditionally based on category:
- Form control: `workflow/refs/form-participation.md`
- Overlay or show/hide: `workflow/refs/transition-contract.md` and `workflow/refs/focus-management.md`
- Composite widget with roving focus: `workflow/refs/focus-management.md`

### Step 1.5 — Shared code audit and abstraction fit check

**Shared code audit (required first):** Before writing any code, search for reusable utilities:

```bash
ls src/utils/ src/controllers/
```

For each file found, determine if it applies to this component. Specifically:
- `OrderedRegistry` (`src/utils/ordered-registry.ts`) — use for ANY registry that tracks DOM-ordered children. Do not reimplement this logic inline.
- Any shared controller matching the component's category (see `/scaffold` Step 0 table)

If a relevant utility exists, the component's registry or controller MUST extend or use it. Do not reimplement functionality already in `src/utils/` or `src/controllers/`.

**TypeScript type errors — decision tree (required before any workaround):**

When a TypeScript error appears due to a missing or unknown type, resolve it in this order:

1. **Wrong import / too-broad type** → Fix the import or use `instanceof` narrowing. This is the most common cause.
2. **Standard browser API not yet in TypeScript's DOM lib** → Create `src/types/{api-name}.d.ts` with a `declare global` augmentation. Requirements:
   - The API must be real and shipping in target browsers
   - The file MUST contain a comment citing the spec URL (MDN or W3C) and the TypeScript tracking issue
   - Follow the pattern of `src/types/aria-element-reference.d.ts`
3. **Framework type gap (e.g. `updateComplete`)** → Use a structural duck-type interface (`interface ReactiveElement { readonly updateComplete: Promise<boolean> }`) — never import the full framework class just to satisfy a type.

**Never use `as any` or `as unknown as T` for any of these.** The linter enforces this — `@typescript-eslint/no-explicit-any` is set to `error` in the project. If you hit a type error, apply the decision tree above.

**Abstraction fit check:** For each shared controller the spec requires (e.g., `RovingFocusController`, `FocusTrapController`), run the fit check from `lit-patterns.md` Rule 36:

1. List all behaviors the spec demands from the controller
2. Identify any gaps — behaviors the controller does not cover
3. Classify each gap: **Extend** / **Custom** / **Inline workaround**
4. If any gap is classified **Extend**: add the missing hook/callback to the controller now, before implementing the element

Do not proceed to Step 2 with an unresolved **Extend** gap — working around it produces temporal coupling and global state reads that reviewers will block.

### Step 2 — Write failing integration tests (RED)

**Start with a smoke test (required first).** Before writing any detailed tests, write one test that mounts the full compound structure (root + at least one item + trigger + panel) and asserts that:
1. Context is available (trigger and panel receive item context)
2. A toggle action works end-to-end (click trigger → panel becomes visible)
3. No console errors on mount

Run the smoke test immediately: `npm run test:run -- src/components/{name}/{name}.test.ts`. It must fail (RED) — if it passes, the scaffold is broken or context wiring was already correct.

**Spec-contract mapping (required before remaining tests):** After the smoke test, read the component spec/design doc line by line. Every behavioral statement (e.g., "clicking an indeterminate checkbox fires `checked: true`") becomes a named test before any implementation code is written. This ensures the RED phase locks in the spec contract, not just structural wiring.

**Then write the remaining tests:**
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

Run `npm run test:run -- src/components/{name}/{name}.test.ts` — confirm all tests fail.

### Step 3 — Implement elements (GREEN)

For each element in the spec:
- `@provide` context on root; `@consume` on all consumers
- Attach shared controllers: `RovingFocusController` (as applicable)
- Category-specific: `FormController` (form), `FocusTrapController` / `FocusRestorationController` (overlay)
- Set `data-*` attributes in `willUpdate` (not in `updated` or event handlers)
- `exportparts` on every compound layer wrapping shadow elements with `part` attributes
- Dev-mode warning in `connectedCallback` when element is used outside its required parent: `if (import.meta.env.DEV) { ... }`. Warnings about missing siblings (e.g., "no matching panel") must NOT go in `firstUpdated()` — siblings register asynchronously via context and are not available yet. See `lit-patterns.md` Rules 31–32.
- `customElements.define()` with `if (!customElements.get(...))` registration guard
- `HostSnapshot` packaged in root's `willUpdate`, passed to controller via `syncFromHost()`
- Auto-selection logic (e.g., "select first non-disabled item") belongs in registration callbacks on the context interface — not in `firstUpdated()`. Children register asynchronously after context propagation; the registry is always empty when the parent's `firstUpdated()` fires. See `lit-patterns.md` Rules 31–32.

Run tests — confirm they pass.

### Step 3.3 — Update package.json exports map

Add an entry for the new component in `package.json` `exports`:

```json
"./{name}": "./dist/components/{name}/index.js"
```

Verify the entry was added:

```bash
grep '"\./\{name\}"' package.json
```

---

### Step 3.5 — Smallest diff audit

Run `/smallest-diff` to catch dead code, speculative additions, and diff noise before dispatching reviewers. Fix any blockers — reviewers should focus on correctness and design, not cleanup.

### Step 4 — Run all 6 reviewers in parallel

Read `workflow/refs/reviewer-dispatch.md` for the canonical context injection table and patch loop rules.

Read each of the following reviewer SKILL.md files. Use each file's content as the Agent prompt. Dispatch all 7 as simultaneous Agent calls, injecting context files per the dispatch table:

- `workflow/reviewers/accessibility-reviewer/SKILL.md`
- `workflow/reviewers/api-reviewer/SKILL.md`
- `workflow/reviewers/code-quality-reviewer/SKILL.md`
- `workflow/reviewers/headless-reviewer/SKILL.md`
- `workflow/reviewers/lit-reviewer/SKILL.md`
- `workflow/reviewers/security-reviewer/SKILL.md`
- `workflow/reviewers/test-reviewer/SKILL.md`

Note: Storybook story files do not exist at this step — `test-reviewer` checklist items covering `play` functions and story coverage are deferred to the test-reviewer run inside `/build-stories`.

Collect all findings and follow the patch loop rules from `reviewer-dispatch.md`.

### Step 5 — Commit

```bash
git add src/components/{name}/
git commit -m "feat({name}): elements — root, item, sub-parts, context, ARIA, lifecycle"
```

**Next step: `/build-stories {name}`.**
