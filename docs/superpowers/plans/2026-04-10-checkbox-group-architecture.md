# Checkbox Group Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `allValues` source-of-truth footgun, simplify CheckboxGroup update mechanics, narrow primitive responsibilities, and define a safe path toward stronger grouped-field semantics.

**Architecture:** Keep Grund's engine-first architecture, but replace `allValues` with child-derived registration data instead of Shopify-style DOM mutation coupling. Land the work in phases: first stabilize behavior and introduce internal registration, then simplify update mechanics, then decide whether CheckboxGroup should stay a selection engine or become a full field abstraction with `fieldset` semantics.

**Tech Stack:** Lit, `@lit/context`, TypeScript, Vitest, Storybook

---

## Current Architecture

- `grund-checkbox-group` owns selection state through [src/components/checkbox-group/checkbox-group.ts](/Users/henningloewe/Documents/Git/grund-ui/src/components/checkbox-group/checkbox-group.ts) and [src/components/checkbox-group/checkbox-group.engine.ts](/Users/henningloewe/Documents/Git/grund-ui/src/components/checkbox-group/checkbox-group.engine.ts).
- `grund-checkbox` works both standalone and in-group via [src/components/checkbox/checkbox.ts](/Users/henningloewe/Documents/Git/grund-ui/src/components/checkbox/checkbox.ts).
- Group membership is currently modeled indirectly through the public `allValues` prop instead of actual child registration.
- Disabled propagation uses the shared `disabledContext` pattern that also exists in accordion, tabs, and toggle-group.

## Pattern Inventory

- Good pattern to preserve: pure state engine + explicit controlled/uncontrolled handling.
- Good pattern to reuse: child registration from existing grouped components such as toggle-group and accordion.
- Anti-pattern to remove: duplicate source of truth between rendered children and `allValues`.
- Anti-pattern to reduce: `grund-checkbox` owning aggregate group semantics through `parent`.
- Decision to make separately: whether CheckboxGroup is only a grouping/selection primitive or a full field component with label/details/error semantics.

## File Map

### Core files to modify

- Modify: `src/components/checkbox-group/checkbox-group.ts`
- Modify: `src/components/checkbox-group/checkbox-group.context.ts`
- Modify: `src/components/checkbox-group/checkbox-group.engine.ts`
- Modify: `src/components/checkbox-group/types.ts`
- Modify: `src/components/checkbox/checkbox.ts`
- Modify: `src/components/checkbox-group/tests/checkbox-group.test.ts`
- Modify: `src/components/checkbox-group/tests/checkbox-group.engine.test.ts`
- Modify: `stories/checkbox.stories.ts`

### New files to create

- Create: `src/components/checkbox-group/checkbox-group.registry.ts`
- Create: `src/components/checkbox-group/checkbox-group.registry.test.ts`
- Create: `src/components/checkbox-group/checkbox-group.normalize.ts`
- Create: `src/components/checkbox-group/checkbox-group.normalize.test.ts`

### Optional follow-up files if field semantics are approved

- Modify: `src/components/checkbox-group/checkbox-group.ts`
- Modify: `src/components/checkbox-group/types.ts`
- Modify: `stories/checkbox.stories.ts`
- Create: `src/components/checkbox-group/tests/checkbox-group-fieldset.test.ts`

## Findings (ordered by severity)

1. `allValues` is the highest-risk API because it lets rendered children and group state drift.
2. `grund-checkbox` currently mixes standalone checkbox behavior with group aggregate behavior.
3. Group update mechanics are harder to reason about than necessary because arrays always report changed and controlled-mode toggles still republish context.
4. Field semantics (`fieldset`, `legend`, label/details/error) should be decided explicitly instead of being folded into the refactor accidentally.

## Improvement Plan (phased)

### Task 1: Lock In Current Behavior And Add Target Regression Coverage

**Files:**
- Modify: `src/components/checkbox-group/tests/checkbox-group.test.ts`
- Modify: `src/components/checkbox-group/tests/checkbox-group.engine.test.ts`

- [ ] **Step 1: Add failing tests for the intended child-derived architecture**

Add integration tests that express the new desired contract:

```ts
it('derives selectable child values from registered non-parent checkboxes', async () => {
  const { checkboxes } = await setup(html`
    <grund-checkbox-group>
      <grund-checkbox parent value="all">All</grund-checkbox>
      <grund-checkbox value="a">A</grund-checkbox>
      <grund-checkbox value="b">B</grund-checkbox>
    </grund-checkbox-group>
  `);

  expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('false');
});
```

```ts
it('updates parent state when a child checkbox is added after mount', async () => {
  // mount group, append checkbox, flush, verify group state reflects new child set
});
```

```ts
it('does not republish checkbox group state on controlled toggle without a value prop change', async () => {
  // spy on child updates or context-dependent render count
});
```

- [ ] **Step 2: Run targeted tests to verify the new expectations fail**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts`

Expected: FAIL on the newly added registration-derived expectations.

- [ ] **Step 3: Add gap coverage for migration behavior**

Add tests that define the intended compatibility story:

- `allValues` still works during the migration window, but logs a deprecation warning in dev.
- duplicate child values warn in dev.
- parent/select-all controls are excluded from the derived selectable values.

- [ ] **Step 4: Re-run tests and capture the failing baseline**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts`

Expected: FAIL only on the new tests added in this task.

- [ ] **Step 5: Commit the red test baseline**

```bash
git add src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts
git commit -m "test: lock checkbox-group architecture targets"
```

### Task 2: Introduce Internal Child Registration As The New Source Of Truth

**Files:**
- Create: `src/components/checkbox-group/checkbox-group.registry.ts`
- Create: `src/components/checkbox-group/checkbox-group.registry.test.ts`
- Modify: `src/components/checkbox-group/checkbox-group.context.ts`
- Modify: `src/components/checkbox-group/types.ts`
- Modify: `src/components/checkbox-group/checkbox-group.ts`
- Modify: `src/components/checkbox/checkbox.ts`

- [ ] **Step 1: Write failing unit tests for the registry**

Create tests for a small registry with explicit behavior:

```ts
it('registers and unregisters checkbox records by element', () => {
  const registry = new CheckboxGroupRegistry();
  const el = document.createElement('grund-checkbox');

  registry.register(el, { value: 'a', parent: false });
  registry.unregister(el);

  expect(registry.values()).to.deep.equal([]);
});
```

```ts
it('returns selectable values excluding parent/select-all records', () => {
  // values() => ['a', 'b'], not ['all', 'a', 'b']
});
```

- [ ] **Step 2: Run the new registry tests to verify they fail**

Run: `npx vitest run src/components/checkbox-group/checkbox-group.registry.test.ts`

Expected: FAIL because the registry file does not exist yet.

- [ ] **Step 3: Implement the minimal registry**

Create a focused registry that stores records by element identity:

```ts
export interface CheckboxGroupRegistration {
  value: string;
  parent: boolean;
}

export class CheckboxGroupRegistry {
  private readonly records = new Map<HTMLElement, CheckboxGroupRegistration>();

  register(element: HTMLElement, record: CheckboxGroupRegistration) {
    this.records.set(element, record);
  }

  unregister(element: HTMLElement) {
    this.records.delete(element);
  }

  selectableValues(): string[] {
    return Array.from(this.records.values())
      .filter((record) => !record.parent)
      .map((record) => record.value);
  }
}
```

- [ ] **Step 4: Extend the group context for registration**

Update `CheckboxGroupContext` so child checkboxes can register and unregister:

```ts
readonly registerItem: (element: HTMLElement, record: CheckboxGroupRegistration) => void;
readonly unregisterItem: (element: HTMLElement) => void;
```

- [ ] **Step 5: Wire child lifecycle to the new context API**

In `grund-checkbox`:

- register on connect and whenever `value` or `parent` changes
- unregister on disconnect
- keep standalone behavior unchanged when no group context is present

- [ ] **Step 6: Make the group derive values from the registry**

In `grund-checkbox-group`:

- own a `CheckboxGroupRegistry`
- derive the engine's selectable values from the registry
- keep `allValues` only as a temporary fallback for migration

- [ ] **Step 7: Run tests for the new registration layer**

Run: `npx vitest run src/components/checkbox-group/checkbox-group.registry.test.ts src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts`

Expected: PASS for registry tests, remaining failures limited to normalization/update-mechanics work.

- [ ] **Step 8: Commit the registration refactor**

```bash
git add src/components/checkbox-group/checkbox-group.registry.ts src/components/checkbox-group/checkbox-group.registry.test.ts src/components/checkbox-group/checkbox-group.context.ts src/components/checkbox-group/types.ts src/components/checkbox-group/checkbox-group.ts src/components/checkbox/checkbox.ts
git commit -m "refactor: derive checkbox-group membership from children"
```

### Task 3: Normalize Group Inputs And Replace Always-Changed Array Props

**Files:**
- Create: `src/components/checkbox-group/checkbox-group.normalize.ts`
- Create: `src/components/checkbox-group/checkbox-group.normalize.test.ts`
- Modify: `src/components/checkbox-group/checkbox-group.ts`
- Modify: `src/components/checkbox-group/types.ts`

- [ ] **Step 1: Write failing tests for normalization and equality**

Create tests for canonical array handling:

```ts
it('normalizes non-array input to an empty string array', () => {
  expect(normalizeCheckboxGroupValues(null)).to.deep.equal([]);
});
```

```ts
it('stringifies values and removes nullish entries', () => {
  expect(normalizeCheckboxGroupValues(['a', 2, null])).to.deep.equal(['a', '2']);
});
```

```ts
it('compares normalized arrays by value and order', () => {
  expect(checkboxGroupValuesEqual(['a'], ['a'])).to.equal(true);
});
```

- [ ] **Step 2: Run normalization tests to verify they fail**

Run: `npx vitest run src/components/checkbox-group/checkbox-group.normalize.test.ts`

Expected: FAIL because the normalization module does not exist yet.

- [ ] **Step 3: Implement normalization helpers**

Create one small utility module:

```ts
export function normalizeCheckboxGroupValues(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((value) => value != null)
    .map((value) => String(value));
}

export function checkboxGroupValuesEqual(a: unknown, b: unknown): boolean {
  const left = normalizeCheckboxGroupValues(a);
  const right = normalizeCheckboxGroupValues(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
```

- [ ] **Step 4: Apply normalization at the component boundary**

Update `grund-checkbox-group` so:

- `value`
- `defaultValue`
- deprecated `allValues`

are normalized before reaching the engine or registry fallback.

- [ ] **Step 5: Replace `hasChanged: () => true` with precise array comparison**

Use the normalization/equality helper so Lit only reacts when effective values changed.

- [ ] **Step 6: Run the affected tests**

Run: `npx vitest run src/components/checkbox-group/checkbox-group.normalize.test.ts src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts`

Expected: PASS for normalization behavior and no regressions in existing controlled/uncontrolled behavior.

- [ ] **Step 7: Commit the normalization cleanup**

```bash
git add src/components/checkbox-group/checkbox-group.normalize.ts src/components/checkbox-group/checkbox-group.normalize.test.ts src/components/checkbox-group/checkbox-group.ts src/components/checkbox-group/types.ts
git commit -m "refactor: normalize checkbox-group value inputs"
```

### Task 4: Simplify Controlled-Mode Updates And Reduce Context Churn

**Files:**
- Modify: `src/components/checkbox-group/checkbox-group.ts`
- Modify: `src/components/checkbox-group/checkbox-group.engine.ts`
- Modify: `src/components/checkbox-group/tests/checkbox-group.test.ts`
- Modify: `src/components/checkbox-group/tests/checkbox-group.engine.test.ts`

- [ ] **Step 1: Add a failing regression test for controlled toggles**

Add a test that proves children do not get a synthetic state refresh when the controlled `value` prop has not changed yet.

```ts
it('does not force a context refresh after controlled toggle proposals', async () => {
  // mount controlled group, click checkbox, assert render output stays stable until prop update
});
```

- [ ] **Step 2: Run the controlled-mode test to verify it fails**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts -t "controlled"`

Expected: FAIL on the new regression.

- [ ] **Step 3: Make engine/group updates explicit**

Refactor `_handleToggle()` so it distinguishes:

- uncontrolled toggle accepted and internal engine state changed
- controlled toggle proposed and only event emission is needed

Minimal target shape:

```ts
const result = parent ? this.engine.requestToggleAll() : this.engine.requestToggle(itemValue);
if (result === null) return;

this.emitValueChange(result);

if (result.persisted) {
  this._publishGroupContext();
}
```

If the current engine contract does not expose this cleanly, extend it to return a small metadata flag rather than inferring from the host in the component.

- [ ] **Step 4: Ensure child updates still occur when the controlled value prop changes**

Keep the existing contract tested in `updates rendered checkbox state when the controlled value prop changes after mount`.

- [ ] **Step 5: Run the affected suite**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts`

Expected: PASS with fewer unnecessary group-context republishes.

- [ ] **Step 6: Commit the update-mechanics cleanup**

```bash
git add src/components/checkbox-group/checkbox-group.ts src/components/checkbox-group/checkbox-group.engine.ts src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts
git commit -m "refactor: reduce checkbox-group controlled update churn"
```

### Task 5: Narrow Checkbox Primitive Responsibilities And Define The Select-All Contract

**Files:**
- Modify: `src/components/checkbox/checkbox.ts`
- Modify: `src/components/checkbox-group/checkbox-group.context.ts`
- Modify: `src/components/checkbox-group/types.ts`
- Modify: `src/components/checkbox-group/tests/checkbox-group.test.ts`
- Modify: `stories/checkbox.stories.ts`

- [ ] **Step 1: Write failing tests around the desired select-all ownership**

Add tests that clarify the intended boundary:

- parent/select-all checkboxes participate in group aggregate behavior
- non-parent checkboxes remain simple value items
- select-all controls never contribute a submitted form value

If the team wants to keep `parent` temporarily, write the tests against that compatibility API first.

- [ ] **Step 2: Run the select-all tests to verify the baseline**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts -t "parent|select-all"`

Expected: Some tests pass already; the new ownership-specific expectations fail.

- [ ] **Step 3: Move aggregate responsibility out of the primitive where possible**

Refactor toward this boundary:

- checkbox primitive owns checked/disabled/form behavior
- group owns aggregate derivation and select-all orchestration
- checkbox exposes only the metadata the group needs for registration

Do not introduce a new public component in this task unless the API decision has already been made. Keep this task focused on internal separation first.

- [ ] **Step 4: Add migration warnings if `parent` remains public temporarily**

In dev mode:

- warn if multiple parent/select-all checkboxes exist in one group
- warn if `parent` is used outside a group
- warn if duplicate values are registered

Reuse the DX style already present in `toggle-group`.

- [ ] **Step 5: Update Storybook examples**

Add or update stories that show:

- normal checkbox group usage without `allValues`
- current select-all pattern
- controlled group usage

- [ ] **Step 6: Run tests and stories-related validation**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts`

Run: `npm run build`

Expected: PASS and no type/build regressions.

- [ ] **Step 7: Commit the responsibility split**

```bash
git add src/components/checkbox/checkbox.ts src/components/checkbox-group/checkbox-group.context.ts src/components/checkbox-group/types.ts src/components/checkbox-group/tests/checkbox-group.test.ts stories/checkbox.stories.ts
git commit -m "refactor: narrow checkbox-group select-all responsibilities"
```

### Task 6: Decide And Implement Grouped-Field Semantics As A Separate API Step

**Files:**
- Modify: `src/components/checkbox-group/checkbox-group.ts`
- Modify: `src/components/checkbox-group/types.ts`
- Modify: `src/components/checkbox-group/tests/checkbox-group.test.ts`
- Create: `src/components/checkbox-group/tests/checkbox-group-fieldset.test.ts`
- Modify: `stories/checkbox.stories.ts`

- [ ] **Step 1: Make the API decision before writing code**

Choose one of these directions and document it in the PR description:

- keep CheckboxGroup as a selection/grouping primitive with external labeling
- evolve CheckboxGroup into a full field component with label/details/error semantics

Do not mix both models in the same API.

- [ ] **Step 2: If field semantics are approved, write failing tests first**

Add tests for:

- `fieldset` / `legend` rendering
- disabled group semantics
- label/details/error rendering
- compatibility with existing external `aria-label*` props if they remain supported

- [ ] **Step 3: Implement the semantic wrapper**

Only if the field direction is approved:

```ts
return html`
  <fieldset part="group" ?disabled=${this.disabled}>
    ${this.label ? html`<legend part="label">${this.label}</legend>` : nothing}
    <slot></slot>
    ${this.error ? html`<div part="error">${this.error}</div>` : nothing}
  </fieldset>
`;
```

Preserve the registration/engine architecture from earlier tasks. Do not reintroduce DOM-derived business logic here.

- [ ] **Step 4: If field semantics are not approved, explicitly close this task without code changes**

Document in the PR that CheckboxGroup remains a grouping primitive and that `role="group"` plus external labeling is intentional.

- [ ] **Step 5: Run the relevant suite**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group-fieldset.test.ts`

Expected: PASS for the chosen API direction.

- [ ] **Step 6: Commit the semantic decision**

```bash
git add src/components/checkbox-group/checkbox-group.ts src/components/checkbox-group/types.ts src/components/checkbox-group/tests/checkbox-group.test.ts src/components/checkbox-group/tests/checkbox-group-fieldset.test.ts stories/checkbox.stories.ts
git commit -m "feat: define checkbox-group field semantics"
```

### Task 7: Remove The `allValues` Escape Hatch And Finalize Migration

**Files:**
- Modify: `src/components/checkbox-group/checkbox-group.ts`
- Modify: `src/components/checkbox-group/types.ts`
- Modify: `src/components/checkbox-group/tests/checkbox-group.test.ts`
- Modify: `stories/checkbox.stories.ts`

- [ ] **Step 1: Write the final failing test that rejects `allValues` as required API**

Add tests that prove group behavior is correct without `allValues` and that legacy behavior is no longer documented as primary.

- [ ] **Step 2: Remove deprecated fallback paths**

Delete:

- deprecated `allValues` fallback behavior
- dev deprecation warnings tied to the migration period
- compatibility-only code that kept the old source-of-truth model alive

- [ ] **Step 3: Run the full checkbox-related suite**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.registry.test.ts src/components/checkbox-group/checkbox-group.normalize.test.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts src/components/checkbox-group/tests/checkbox-group.test.ts`

Expected: PASS

- [ ] **Step 4: Run broader regression checks**

Run: `npx vitest run src/controllers/selection.engine.test.ts`

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Commit the API cleanup**

```bash
git add src/components/checkbox-group/checkbox-group.ts src/components/checkbox-group/types.ts src/components/checkbox-group/tests/checkbox-group.test.ts stories/checkbox.stories.ts
git commit -m "refactor: remove checkbox-group allValues API"
```

## Final Verification Checklist

- [ ] `grund-checkbox-group` derives child membership from rendered checkboxes instead of `allValues`.
- [ ] Controlled and uncontrolled behavior still matches the existing event contract.
- [ ] Select-all behavior is preserved, but its ownership is clearer and more testable.
- [ ] Group updates no longer rely on `hasChanged: () => true` for every array prop.
- [ ] Duplicate/misconfigured child values warn in dev.
- [ ] Storybook shows the new recommended usage.
- [ ] `allValues` is either deprecated with warnings or fully removed, depending on the release target.

## Notes For The Implementer

- Do not copy Shopify's MutationObserver-heavy approach. Keep Grund's pure engine architecture.
- Reuse the registration style already established in grouped components instead of introducing a one-off pattern.
- Treat field semantics as a separate product/API decision, not an incidental refactor detail.
- If release pressure is high, Tasks 1 through 5 are the minimum high-value slice. Tasks 6 and 7 can follow in a second PR.
