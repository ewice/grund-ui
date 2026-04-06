# Checkbox Group Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use vollgas:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `grund-checkbox-group`, a state coordinator for multiple `grund-checkbox` elements with parent checkbox (toggle-all) support.

**Architecture:** Lightweight container element wrapping `SelectionEngine` (always multi-mode) via a `CheckboxGroupEngine`. Group provides context to child checkboxes. Individual checkboxes detect group context and delegate state to the group. No registry, no roving focus.

**Tech Stack:** Lit 4, `@lit/context`, Vitest, `@open-wc/testing`

**Spec:** `docs/vollgas/specs/2026-04-06-checkbox-group-design.md`

---

### Task 1: Add `requestSet` to SelectionEngine

**Depends on:** None

**Files:**
- Modify: `src/controllers/selection.engine.ts`
- Modify: `src/controllers/selection.engine.test.ts`

The `SelectionEngine` needs a bulk replacement method for checkbox group's toggle-all. This method replaces the entire selected set atomically.

- [ ] **Step 1: Write failing tests for `requestSet`**

Add a new `describe('requestSet')` block at the end of the existing test file `src/controllers/selection.engine.test.ts`:

```typescript
describe('requestSet', () => {
  it('replaces selected values and returns new array', () => {
    const ctrl = create({ multiple: true, defaultValue: ['a'] });
    const result = ctrl.requestSet(['b', 'c']);
    expect(result).to.deep.equal(['b', 'c']);
  });

  it('updates internal state in uncontrolled mode', () => {
    const ctrl = create({ multiple: true, defaultValue: ['a'] });
    ctrl.requestSet(['b', 'c']);
    expect(ctrl.isSelected('a')).to.be.false;
    expect(ctrl.isSelected('b')).to.be.true;
    expect(ctrl.isSelected('c')).to.be.true;
  });

  it('does not update internal state in controlled mode', () => {
    const ctrl = create({ multiple: true, value: ['a'] });
    const result = ctrl.requestSet(['b', 'c']);
    expect(result).to.deep.equal(['b', 'c']);
    // Internal state unchanged — consumer owns the value
    expect(ctrl.isSelected('a')).to.be.true;
    expect(ctrl.isSelected('b')).to.be.false;
  });

  it('returns null when disabled', () => {
    const ctrl = create({ multiple: true, disabled: true });
    const result = ctrl.requestSet(['a', 'b']);
    expect(result).to.be.null;
  });

  it('handles empty array (deselect all)', () => {
    const ctrl = create({ multiple: true, defaultValue: ['a', 'b'] });
    const result = ctrl.requestSet([]);
    expect(result).to.deep.equal([]);
    expect(ctrl.isSelected('a')).to.be.false;
    expect(ctrl.isSelected('b')).to.be.false;
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/controllers/selection.engine.test.ts`
Expected: FAIL — `requestSet` is not a function.

- [ ] **Step 3: Implement `requestSet`**

`src/controllers/selection.engine.ts` — add a `requestSet` method.

Contract:
- `requestSet(values: string[]): string[] | null` — replaces the entire selected set with `values`
- Returns `null` if `this.disabled` is `true`
- In uncontrolled mode (`!this.isControlled`): updates `_selectedValues` to `new Set(values)`
- In controlled mode: returns `Array.from(new Set(values))` without modifying `_selectedValues`
- Same gating pattern as `requestToggle` (check `this.disabled`, branch on `this.isControlled`)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/controllers/selection.engine.test.ts`
Expected: All tests PASS, including existing tests (no regressions).

- [ ] **Step 5: Commit**

```bash
git add src/controllers/selection.engine.ts src/controllers/selection.engine.test.ts
git commit -m "feat(selection-engine): add requestSet for bulk value replacement"
```

---

### Task 2: CheckboxGroupEngine

**Depends on:** Task 1 (`SelectionEngine.requestSet`)

**Files:**
- Create: `src/components/checkbox-group/checkbox-group.engine.ts`
- Create: `src/components/checkbox-group/tests/checkbox-group.engine.test.ts`

- [ ] **Step 1: Write failing engine tests**

Create `src/components/checkbox-group/tests/checkbox-group.engine.test.ts`:

```typescript
import { expect, describe, it } from 'vitest';
import { CheckboxGroupEngine } from '../checkbox-group.engine.js';

interface Snapshot {
  value: string[] | undefined;
  defaultValue: string[];
  disabled: boolean;
  allValues: string[];
}

describe('CheckboxGroupEngine', () => {
  function create(overrides?: Partial<Snapshot>): CheckboxGroupEngine {
    const engine = new CheckboxGroupEngine();
    engine.syncFromHost({
      value: undefined,
      defaultValue: [],
      disabled: false,
      allValues: [],
      ...overrides,
    });
    return engine;
  }

  describe('uncontrolled mode', () => {
    it('starts with no items checked', () => {
      const engine = create();
      expect(engine.isChecked('a')).to.be.false;
      expect(engine.checkedValues.size).to.equal(0);
    });

    it('seeds from defaultValue', () => {
      const engine = create({ defaultValue: ['a', 'b'] });
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
    });

    it('seeds defaultValue only once', () => {
      const engine = create({ defaultValue: ['a'] });
      engine.syncFromHost({
        value: undefined,
        defaultValue: ['b'],
        disabled: false,
        allValues: [],
      });
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.false;
    });

    it('requestToggle adds a value', () => {
      const engine = create();
      const result = engine.requestToggle('a');
      expect(result).to.deep.equal(['a']);
      expect(engine.isChecked('a')).to.be.true;
    });

    it('requestToggle removes a checked value', () => {
      const engine = create({ defaultValue: ['a', 'b'] });
      const result = engine.requestToggle('a');
      expect(result).to.include('b');
      expect(result).to.not.include('a');
      expect(engine.isChecked('a')).to.be.false;
      expect(engine.isChecked('b')).to.be.true;
    });

    it('requestToggle persists state across calls (multi-mode)', () => {
      const engine = create();
      engine.requestToggle('a');
      engine.requestToggle('b');
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
    });
  });

  describe('controlled mode', () => {
    it('reflects the provided value array', () => {
      const engine = create({ value: ['a', 'b'] });
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
      expect(engine.isChecked('c')).to.be.false;
    });

    it('requestToggle returns new value without persisting state', () => {
      const engine = create({ value: ['a'] });
      const result = engine.requestToggle('b');
      expect(result).to.deep.equal(expect.arrayContaining(['a', 'b']));
      expect(engine.isChecked('b')).to.be.false;
    });
  });

  describe('disabled', () => {
    it('requestToggle returns null when disabled', () => {
      const engine = create({ disabled: true });
      expect(engine.requestToggle('a')).to.be.null;
    });

    it('requestToggleAll returns null when disabled', () => {
      const engine = create({ disabled: true, allValues: ['a', 'b'] });
      expect(engine.requestToggleAll()).to.be.null;
    });
  });

  describe('getParentState', () => {
    it('returns "unchecked" when allValues is empty', () => {
      const engine = create({ allValues: [] });
      expect(engine.getParentState()).to.equal('unchecked');
    });

    it('returns "unchecked" when no allValues are checked', () => {
      const engine = create({ allValues: ['a', 'b', 'c'] });
      expect(engine.getParentState()).to.equal('unchecked');
    });

    it('returns "checked" when all allValues are checked', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'c'],
        allValues: ['a', 'b', 'c'],
      });
      expect(engine.getParentState()).to.equal('checked');
    });

    it('returns "indeterminate" when some allValues are checked', () => {
      const engine = create({
        defaultValue: ['a'],
        allValues: ['a', 'b', 'c'],
      });
      expect(engine.getParentState()).to.equal('indeterminate');
    });

    it('ignores checked values not in allValues', () => {
      const engine = create({
        defaultValue: ['a', 'extra'],
        allValues: ['a', 'b'],
      });
      // Only 'a' of ['a','b'] is checked → indeterminate
      expect(engine.getParentState()).to.equal('indeterminate');
    });
  });

  describe('requestToggleAll', () => {
    it('checks all when parent state is unchecked', () => {
      const engine = create({ allValues: ['a', 'b', 'c'] });
      const result = engine.requestToggleAll();
      expect(result).to.deep.equal(expect.arrayContaining(['a', 'b', 'c']));
      expect(engine.isChecked('a')).to.be.true;
      expect(engine.isChecked('b')).to.be.true;
      expect(engine.isChecked('c')).to.be.true;
    });

    it('checks all when parent state is indeterminate', () => {
      const engine = create({
        defaultValue: ['a'],
        allValues: ['a', 'b', 'c'],
      });
      const result = engine.requestToggleAll();
      expect(result).to.deep.equal(expect.arrayContaining(['a', 'b', 'c']));
    });

    it('unchecks all when parent state is checked', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'c'],
        allValues: ['a', 'b', 'c'],
      });
      const result = engine.requestToggleAll();
      expect(result).to.deep.equal([]);
    });

    it('preserves values not in allValues when checking all', () => {
      const engine = create({
        defaultValue: ['extra'],
        allValues: ['a', 'b'],
      });
      const result = engine.requestToggleAll();
      expect(result).to.include('extra');
      expect(result).to.include('a');
      expect(result).to.include('b');
    });

    it('preserves values not in allValues when unchecking all', () => {
      const engine = create({
        defaultValue: ['a', 'b', 'extra'],
        allValues: ['a', 'b'],
      });
      const result = engine.requestToggleAll();
      expect(result).to.deep.equal(['extra']);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.engine.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement CheckboxGroupEngine**

`src/components/checkbox-group/checkbox-group.engine.ts` — pure state machine wrapping `SelectionEngine` in multi-mode.

Contract:
- Holds a private `SelectionEngine` instance, always synced with `multiple: true`
- `syncFromHost(snapshot)` — maps to `SelectionSnapshot` with `multiple: true`, stores `allValues` locally
- `requestToggle(itemValue: string): string[] | null` — delegates to `selection.requestToggle(itemValue, false)`. Disabled gating handled by `SelectionEngine` (group disabled passed via `syncFromHost`)
- `requestToggleAll(): string[] | null` — computes target set based on `getParentState()`:
  - If `'checked'`: new set = current values minus all `allValues`
  - If `'unchecked'` or `'indeterminate'`: new set = current values union all `allValues`
  - Delegates to `selection.requestSet(targetArray)`
- `isChecked(value: string): boolean` — delegates to `selection.isSelected(value)`
- `get checkedValues(): ReadonlySet<string>` — delegates to `selection.selectedValues`
- `getParentState(): 'checked' | 'unchecked' | 'indeterminate'` — compares `allValues` against `checkedValues`:
  - Empty `allValues` → `'unchecked'`
  - All in set → `'checked'`
  - None in set → `'unchecked'`
  - Otherwise → `'indeterminate'`

Follow the pattern in `src/components/accordion/accordion.engine.ts` — thin wrapper, delegates to `SelectionEngine`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.engine.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/checkbox-group/checkbox-group.engine.ts src/components/checkbox-group/tests/checkbox-group.engine.test.ts
git commit -m "feat(checkbox-group): add CheckboxGroupEngine with toggle-all support"
```

---

### Task 3: Types and Context

**Depends on:** None (parallel with Task 1 and Task 2)

**Files:**
- Create: `src/components/checkbox-group/types.ts`
- Create: `src/components/checkbox-group/checkbox-group.context.ts`

- [ ] **Step 1: Create types**

`src/components/checkbox-group/types.ts`:

```typescript
/** Detail for `grund-value-change` event on the checkbox group element. */
export interface CheckboxGroupValueChangeDetail {
  /** The new complete array of checked values. */
  value: string[];
  /** The checkbox value that triggered the change. */
  itemValue: string;
  /** The new checked state of the triggering checkbox. */
  checked: boolean;
}

/**
 * Snapshot of host properties passed to CheckboxGroupEngine.syncFromHost().
 * @internal
 */
export interface CheckboxGroupHostSnapshot {
  value: string[] | undefined;
  defaultValue: string[];
  disabled: boolean;
  allValues: string[];
}
```

- [ ] **Step 2: Create context**

`src/components/checkbox-group/checkbox-group.context.ts`:

```typescript
import { createContext } from '@lit/context';

export interface CheckboxGroupContext {
  /** Whether a given value is currently checked. */
  readonly isChecked: (value: string) => boolean;
  /** Parent checkbox state derived from checked values vs allValues. */
  readonly getParentState: () => 'checked' | 'unchecked' | 'indeterminate';
  /** Request a toggle from the group. Group decides engine method based on parent flag. */
  readonly requestToggle: (value: string, parent: boolean) => void;
  /** Whether the group is disabled. */
  readonly disabled: boolean;
}

export const checkboxGroupContext =
  createContext<CheckboxGroupContext>('checkbox-group');
```

- [ ] **Step 3: Commit**

```bash
git add src/components/checkbox-group/types.ts src/components/checkbox-group/checkbox-group.context.ts
git commit -m "feat(checkbox-group): add types and context definitions"
```

---

### Task 4: `grund-checkbox-group` Element

**Depends on:** Task 2 (CheckboxGroupEngine), Task 3 (types and context)

**Files:**
- Create: `src/components/checkbox-group/checkbox-group.ts`

- [ ] **Step 1: Implement the group element**

`src/components/checkbox-group/checkbox-group.ts` — root container element that coordinates checkbox state.

Contract:
- Extends `LitElement` with Shadow DOM (`<slot>` only), `display: block`
- JSDoc: `@element grund-checkbox-group`, `@slot -`, `@fires {CustomEvent<CheckboxGroupValueChangeDetail>} grund-value-change`
- Public properties (all `@property`):
  - `value: string[] | undefined = undefined` — controlled mode. Use `{ type: Array, hasChanged: () => true }`
  - `defaultValue: string[] = []` — uncontrolled seed. Attribute: `default-value`. Use `{ type: Array, attribute: 'default-value', hasChanged: () => true }`
  - `allValues: string[] = []` — all possible values for parent derivation. Attribute: `all-values`. Use `{ type: Array, attribute: 'all-values', hasChanged: () => true }`
  - `disabled: boolean = false`
- Registration guard: `if (!customElements.get('grund-checkbox-group'))`
- Provides two contexts via `@provide` + `@state`:
  - `checkboxGroupContext` — the `CheckboxGroupContext` interface
  - `disabledContext` — boolean, from `src/context/disabled.context.ts`
- Owns a `CheckboxGroupEngine` instance (class field)
- Stable bound callbacks (arrow function class fields) for context methods — same pattern as `GrundAccordion`:
  - `_isChecked` → delegates to `engine.isChecked`
  - `_getParentState` → delegates to `engine.getParentState`
  - `_requestToggle(value, parent)` → calls `handleToggle(value, parent)`
- `willUpdate`:
  - Calls `engine.syncFromHost(snapshot)` with current property values
  - Sets `data-disabled` attribute
  - Sets `disabledCtx = this.disabled`
  - Recreates `checkboxGroupContext` reference when state-bearing properties change (same guard pattern as `GrundAccordion.willUpdate`)
- `handleToggle(itemValue: string, parent: boolean)`:
  - If `parent`: calls `engine.requestToggleAll()`; checked = result includes all `allValues`
  - Else: calls `engine.requestToggle(itemValue)`; checked = result includes `itemValue`
  - If result is `null`: return (disabled)
  - Dispatches `grund-value-change` CustomEvent with `{ value: result, itemValue, checked }`, `bubbles: true, composed: false`
  - Recreates context reference (same reason as accordion — internal engine state changed without reactive prop change)
- `render()`: `html\`<slot></slot>\``

Follow the exact wiring pattern in `src/components/accordion/accordion.ts` (engine sync in willUpdate, stable callbacks, context recreation after toggle, event dispatch).

- [ ] **Step 2: Commit**

```bash
git add src/components/checkbox-group/checkbox-group.ts
git commit -m "feat(checkbox-group): implement grund-checkbox-group element"
```

---

### Task 5: Modify `grund-checkbox` for Group Awareness

**Depends on:** Task 3 (context definition), Task 4 (group element)

**Files:**
- Modify: `src/components/checkbox/checkbox.ts`

- [ ] **Step 1: Write failing integration tests**

Add tests to `src/components/checkbox-group/tests/checkbox-group.test.ts` (created in this step). These tests exercise the checkbox-inside-group behavior.

```typescript
import { fixture, html, expect } from '@open-wc/testing';
import { describe, it, vi } from 'vitest';
import { flush, getByPart } from '../../../test-utils/test-utils.js';
import '../checkbox-group.js';
import '../../checkbox/checkbox.js';
import '../../checkbox/checkbox-indicator.js';

import type { GrundCheckboxGroup } from '../checkbox-group.js';
import type { GrundCheckbox } from '../../checkbox/checkbox.js';
import type { CheckboxGroupValueChangeDetail } from '../types.js';

describe('GrundCheckboxGroup', () => {
  // ── Helpers ──────────────────────────────────────────────────────────────

  async function setup(
    template = html`
      <grund-checkbox-group>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
        <grund-checkbox value="c">C</grund-checkbox>
      </grund-checkbox-group>
    `,
  ) {
    const el = await fixture<GrundCheckboxGroup>(template);
    await flush(el);
    // Flush child checkboxes too
    const checkboxes = el.querySelectorAll<GrundCheckbox>('grund-checkbox');
    for (const cb of checkboxes) await flush(cb);
    return { el, checkboxes: Array.from(checkboxes) };
  }

  function clickCheckbox(cb: GrundCheckbox): void {
    const btn = getByPart<HTMLButtonElement>(cb, 'button');
    btn.click();
  }

  // ── Smoke ────────────────────────────────────────────────────────────────

  it('renders a slot', async () => {
    const { el } = await setup();
    expect(el.shadowRoot?.querySelector('slot')).to.exist;
  });

  // ── Uncontrolled mode ──────────────────────────────────────────────────

  it('starts with no checkboxes checked by default', async () => {
    const { checkboxes } = await setup();
    for (const cb of checkboxes) {
      const btn = getByPart<HTMLButtonElement>(cb, 'button');
      expect(btn.getAttribute('aria-checked')).to.equal('false');
    }
  });

  it('seeds from defaultValue', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .defaultValue=${['a', 'c']}>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
        <grund-checkbox value="c">C</grund-checkbox>
      </grund-checkbox-group>
    `);
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('true');
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('false');
    expect(getByPart(checkboxes[2], 'button').getAttribute('aria-checked')).to.equal('true');
  });

  it('clicking a checkbox updates group state', async () => {
    const { el, checkboxes } = await setup();
    clickCheckbox(checkboxes[0]);
    await flush(el);
    for (const cb of checkboxes) await flush(cb);
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('true');
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('false');
  });

  // ── Events ───────────────────────────────────────────────────────────────

  it('fires grund-value-change with correct detail', async () => {
    const { el, checkboxes } = await setup();
    const handler = vi.fn();
    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[1]);
    expect(handler).toHaveBeenCalledOnce();
    const detail = handler.mock.calls[0][0].detail as CheckboxGroupValueChangeDetail;
    expect(detail.value).to.deep.equal(['b']);
    expect(detail.itemValue).to.equal('b');
    expect(detail.checked).to.equal(true);
  });

  it('fires grund-checked-change from individual checkbox', async () => {
    const { checkboxes } = await setup();
    const handler = vi.fn();
    checkboxes[0].addEventListener('grund-checked-change', handler as EventListener);
    clickCheckbox(checkboxes[0]);
    expect(handler).toHaveBeenCalledOnce();
  });

  // ── Controlled mode ────────────────────────────────────────────────────

  it('reflects controlled value prop', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .value=${['b']}>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('false');
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('true');
  });

  it('does not auto-update in controlled mode', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .value=${[]}>
        <grund-checkbox value="a">A</grund-checkbox>
      </grund-checkbox-group>
    `);
    clickCheckbox(checkboxes[0]);
    await flush(el);
    await flush(checkboxes[0]);
    // State unchanged because consumer didn't update value prop
    expect(getByPart(checkboxes[0], 'button').getAttribute('aria-checked')).to.equal('false');
  });

  // ── Disabled ─────────────────────────────────────────────────────────────

  it('group disabled propagates to children', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group disabled>
        <grund-checkbox value="a">A</grund-checkbox>
      </grund-checkbox-group>
    `);
    expect(el.hasAttribute('data-disabled')).to.be.true;
    // Clicking should not fire event
    const handler = vi.fn();
    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[0]);
    expect(handler).not.toHaveBeenCalled();
  });

  it('individually disabled checkbox still blocked', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group>
        <grund-checkbox value="a" disabled>A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const handler = vi.fn();
    el.addEventListener('grund-value-change', handler as EventListener);
    clickCheckbox(checkboxes[0]); // disabled
    expect(handler).not.toHaveBeenCalled();
    clickCheckbox(checkboxes[1]); // enabled
    expect(handler).toHaveBeenCalledOnce();
  });

  // ── Parent checkbox ──────────────────────────────────────────────────────

  it('parent checkbox shows checked when all children checked', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .defaultValue=${['a', 'b']} .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
    expect(parentBtn.getAttribute('aria-checked')).to.equal('true');
  });

  it('parent checkbox shows mixed when some children checked', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .defaultValue=${['a']} .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
    expect(parentBtn.getAttribute('aria-checked')).to.equal('mixed');
  });

  it('parent checkbox shows unchecked when no children checked', async () => {
    const { checkboxes } = await setup(html`
      <grund-checkbox-group .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    const parentBtn = getByPart<HTMLButtonElement>(checkboxes[0], 'button');
    expect(parentBtn.getAttribute('aria-checked')).to.equal('false');
  });

  it('clicking parent checks all when unchecked', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    clickCheckbox(checkboxes[0]); // parent
    await flush(el);
    for (const cb of checkboxes) await flush(cb);
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('true');
    expect(getByPart(checkboxes[2], 'button').getAttribute('aria-checked')).to.equal('true');
  });

  it('clicking parent unchecks all when all checked', async () => {
    const { el, checkboxes } = await setup(html`
      <grund-checkbox-group .defaultValue=${['a', 'b']} .allValues=${['a', 'b']}>
        <grund-checkbox parent value="all">All</grund-checkbox>
        <grund-checkbox value="a">A</grund-checkbox>
        <grund-checkbox value="b">B</grund-checkbox>
      </grund-checkbox-group>
    `);
    clickCheckbox(checkboxes[0]); // parent — all checked → uncheck all
    await flush(el);
    for (const cb of checkboxes) await flush(cb);
    expect(getByPart(checkboxes[1], 'button').getAttribute('aria-checked')).to.equal('false');
    expect(getByPart(checkboxes[2], 'button').getAttribute('aria-checked')).to.equal('false');
  });

  // ── Standalone checkbox regression ────────────────────────────────────

  it('checkbox outside group works as before', async () => {
    const el = await fixture<GrundCheckbox>(html`<grund-checkbox value="x">X</grund-checkbox>`);
    await flush(el);
    const btn = getByPart<HTMLButtonElement>(el, 'button');
    btn.click();
    await flush(el);
    expect(btn.getAttribute('aria-checked')).to.equal('true');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts`
Expected: FAIL — tests fail because `grund-checkbox` doesn't consume group context yet.

- [ ] **Step 3: Modify `grund-checkbox` for group awareness**

`src/components/checkbox/checkbox.ts` — add group context consumption and `parent` prop.

Contract:
- New import: `consume` from `@lit/context`, `checkboxGroupContext` and `CheckboxGroupContext` from the checkbox-group context module
- New property: `@property({ type: Boolean }) parent = false`
- New consumed context: `@consume({ context: checkboxGroupContext, subscribe: true }) groupCtx?: CheckboxGroupContext` (optional — undefined when outside a group)
- `_effectiveChecked` getter modification:
  - If `this.groupCtx` exists and `this.parent === true`: return `this.groupCtx.getParentState() === 'checked'`
  - If `this.groupCtx` exists and `this.parent === false`: return `this.groupCtx.isChecked(this.value)`
  - Else: existing behavior (`this.checked ?? this._internalChecked`)
- New getter `_effectiveIndeterminate`:
  - If `this.groupCtx` exists and `this.parent === true`: return `this.groupCtx.getParentState() === 'indeterminate'`
  - Else: return `this.indeterminate`
- `_handleClick` modification:
  - Existing disabled/readOnly guard stays
  - If `this.groupCtx` exists:
    - Compute `newChecked`: for parent, it's `this.groupCtx.getParentState() !== 'checked'`; for regular, it's `!this.groupCtx.isChecked(this.value)`
    - Fire `grund-checked-change` with `{ checked: newChecked }`
    - Call `this.groupCtx.requestToggle(this.value, this.parent)`
    - Return (do NOT update `_internalChecked`)
  - Else: existing behavior unchanged
- `willUpdate` modification:
  - Use `_effectiveIndeterminate` instead of `this.indeterminate` for data attributes and form value
  - Form value: skip `FormController.setValue()` when `this.parent && this.groupCtx` (parent checkbox in group should not submit form value)
  - Context recreation: also trigger when `groupCtx` changes
- `render` modification:
  - Use `_effectiveIndeterminate` for `aria-checked` computation (if indeterminate, `'mixed'`; else `String(this._effectiveChecked)`)

Key invariants:
- When `groupCtx` is undefined, behavior is identical to current implementation (zero regression)
- When `groupCtx` is present, the checkbox delegates all state to the group
- `grund-checked-change` fires before `groupCtx.requestToggle` (request signal, not confirmation)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/checkbox-group/tests/checkbox-group.test.ts`
Expected: All integration tests PASS.

- [ ] **Step 5: Run existing checkbox tests for regression**

Run: `npx vitest run src/components/checkbox/tests/checkbox.test.ts`
Expected: All existing tests PASS (no regressions).

- [ ] **Step 6: Commit**

```bash
git add src/components/checkbox/checkbox.ts src/components/checkbox-group/tests/checkbox-group.test.ts
git commit -m "feat(checkbox): add group context awareness and parent prop"
```

---

### Task 6: Barrel Export and Registration

**Depends on:** Task 4 (group element), Task 5 (checkbox modifications)

**Files:**
- Create: `src/components/checkbox-group/index.ts`
- Modify: main entry point (if applicable — check for `src/index.ts` or similar)

- [ ] **Step 1: Create barrel export**

`src/components/checkbox-group/index.ts`:

```typescript
export { GrundCheckboxGroup } from './checkbox-group';
export type { CheckboxGroupValueChangeDetail } from './types';
```

- [ ] **Step 2: Check if a top-level barrel exists and add re-export**

Check if `src/index.ts` exists. If it re-exports other components, add:

```typescript
export { GrundCheckboxGroup } from './components/checkbox-group';
export type { CheckboxGroupValueChangeDetail } from './components/checkbox-group/types';
```

If no top-level barrel exists, skip this step.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS across the entire project.

- [ ] **Step 4: Commit**

```bash
git add src/components/checkbox-group/index.ts
git commit -m "feat(checkbox-group): add barrel export"
```
