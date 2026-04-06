# Checkbox Group — Design Spec

**Date:** 2026-04-06
**Reference:** [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)

## Overview

`grund-checkbox-group` is a lightweight container that coordinates checked state across child `grund-checkbox` elements. It manages a `string[]` of checked values (controlled or uncontrolled), propagates disabled state, and supports a parent checkbox pattern for "toggle all" behavior.

The group is not a composite widget — there is no roving focus, no registry, and no compound sub-elements beyond the root. Individual checkboxes retain their own form participation.

## Decisions

| Question | Decision | Rationale |
|---|---|---|
| Parent checkbox support | Included in initial scope | Influences engine design (`allValues`); retrofitting later would revisit the engine |
| Form participation | Individual checkboxes own it (option B) | Matches native HTML semantics and Base UI; group is purely a state coordinator |
| State ownership inside group | Group owns completely (option A) | Checkbox `checked`/`defaultChecked` ignored when inside group; avoids conflicting state |
| Parent checkbox designation | `parent` boolean prop on `grund-checkbox` (option A) | Single prop, no new element, matches Base UI |
| `allValues` discovery | Explicit `allValues` prop on group (option A) | Predictable; handles conditional rendering; matches Base UI |
| Architecture | Lightweight container, no registry (option A) | No document-order tracking needed; no sibling awareness; no roving focus |

## File Structure

```
src/components/checkbox-group/
  checkbox-group.ts          Root element (@provide, engine)
  checkbox-group.context.ts  Context interface and symbol
  checkbox-group.engine.ts   Wraps SelectionEngine (multi-mode) + parent state derivation
  types.ts                   Event detail types
  index.ts                   Barrel export
  tests/
    checkbox-group.test.ts
    checkbox-group.engine.test.ts

src/controllers/
  selection.engine.ts        Modified: add requestSet() bulk method

src/components/checkbox/
  checkbox.ts                Modified: consume group context, parent prop, skip form value when parent in group
  (all other files unchanged)
```

## Public API — `grund-checkbox-group`

### Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `value` | `string[] \| undefined` | `undefined` | Controlled: which checkbox values are checked. `undefined` = uncontrolled mode |
| `defaultValue` | `string[]` | `[]` | Seeds uncontrolled state on first render only |
| `allValues` | `string[]` | `[]` | All possible checkbox values. Required for parent checkbox to derive its state |
| `disabled` | `boolean` | `false` | Disables all checkboxes in the group |

### Events

| Event | Detail | Description |
|---|---|---|
| `grund-value-change` | `{ value: string[], itemValue: string, checked: boolean }` | Fires when any child checkbox toggles. `value` is the new full array, `itemValue` is the checkbox that triggered the change, `checked` is its new state. When a parent checkbox toggles all, a single event fires with `itemValue` set to the parent's value (e.g. `"all"`) and `checked` reflecting the parent's new checked state |

### Data Attributes

| Attribute | When |
|---|---|
| `data-disabled` | Group is disabled |

### Rendering

Shadow DOM with a single `<slot>`. No roles, no ARIA on the group element itself — consumers use `<fieldset>` or `aria-labelledby` externally for accessible labeling.

## Checkbox Modifications

### New Property

| Property | Type | Default | Description |
|---|---|---|---|
| `parent` | `boolean` | `false` | Marks this checkbox as the "toggle all" control. Only meaningful inside a group with `allValues` set |

### Behavior Inside a Group

- **Checked state:** derived from `groupCtx.isChecked(this.value)` — own `checked`/`defaultChecked` props are ignored.
- **Toggle action:** calls `groupCtx.requestToggle(this.value, this.parent)` which delegates to the group engine.
- **Parent checkbox:** when `parent === true`, checked state is derived from `groupCtx.getParentState()` returning `'checked' | 'unchecked' | 'indeterminate'`. Toggling a parent checks all (if unchecked/indeterminate) or unchecks all.
- **Parent value exclusion:** the parent checkbox's `value` is never included in the group's value array. The `parent` flag tells the group to treat it as a controller, not a member.
- **Disabled:** merged via `disabledContext` (group disabled OR own disabled).
- **Form participation:** unchanged for regular checkboxes — each still owns its `name`/`value` for form submission. **Exception:** when `parent === true` and inside a group, the checkbox does not submit a form value (skips `FormController.setValue()`). The parent is a UI control, not a data value. Consumers should also omit `name` from parent checkboxes.
- **`grund-checked-change`:** still fires from the individual checkbox so consumers can listen per-checkbox. See Event Flow below for exact sequencing.

### Behavior Outside a Group

No `checkboxGroupContext` available — everything works exactly as today. Zero breaking changes.

## Group Context Interface

```ts
interface CheckboxGroupContext {
  isChecked: (value: string) => boolean;
  getParentState: () => 'checked' | 'unchecked' | 'indeterminate';
  requestToggle: (value: string, parent: boolean) => void;
  disabled: boolean;
}
```

Provided by `grund-checkbox-group` via `@provide`. Consumed by `grund-checkbox` via `@consume`.

## SelectionEngine Update

`SelectionEngine` gains one new method to support bulk operations:

```ts
// Existing API unchanged
requestToggle(value: string, itemDisabled: boolean): string[] | null;

// New method
requestSet(values: string[]): string[] | null;
```

`requestSet` replaces the entire selected set with the provided values array. Returns the new array, or `null` if disabled. In uncontrolled mode, updates internal state. In controlled mode, returns the computed array without updating internal state (same contract as `requestToggle`). This is a natural extension of set-based selection semantics — other components (e.g., future listbox with "select all") will benefit from it.

## Engine Design

`CheckboxGroupEngine` wraps `SelectionEngine` in multi-mode (same pattern as `AccordionEngine`) with parent state derivation.

```ts
class CheckboxGroupEngine {
  private selection: SelectionEngine;

  syncFromHost(snapshot: {
    value: string[] | undefined;
    defaultValue: string[];
    disabled: boolean;
    allValues: string[];
  }): void;

  requestToggle(itemValue: string): string[] | null;
  requestToggleAll(): string[] | null;

  isChecked(value: string): boolean;
  get checkedValues(): ReadonlySet<string>;
  getParentState(): 'checked' | 'unchecked' | 'indeterminate';
}
```

`requestToggle` delegates to `SelectionEngine.requestToggle`. `requestToggleAll` computes the target set and delegates to `SelectionEngine.requestSet`:
- If parent state is `'checked'`: remove all `allValues` from the current set, pass result to `requestSet`
- If `'unchecked'` or `'indeterminate'`: add all `allValues` to the current set, pass result to `requestSet`
- Values not in `allValues` are preserved in both cases

### Parent State Logic

- `allValues` empty: `'unchecked'`
- Every value in `allValues` is checked: `'checked'`
- No value in `allValues` is checked: `'unchecked'`
- Some but not all: `'indeterminate'`

## Event Flow

When a checkbox is clicked inside a group, the following sequence occurs:

1. User clicks checkbox (or presses Space)
2. Checkbox detects group context is present
3. Checkbox does **not** update `_internalChecked` (group owns state)
4. Checkbox fires `grund-checked-change` with the *intended* new state — this is a request signal, not a state-change confirmation (same semantics as standalone controlled mode)
5. Checkbox calls `groupCtx.requestToggle(this.value, this.parent)`
6. Group element receives the call, delegates to engine (`requestToggle` or `requestToggleAll` based on `parent` flag)
7. Engine returns new value array (or `null` if disabled)
8. If not `null`: group fires `grund-value-change` with `{ value, itemValue, checked }`
9. **Uncontrolled mode:** group updates internal state → context object recreated → checkbox re-renders with new checked state from `groupCtx.isChecked()`
10. **Controlled mode:** consumer handles `grund-value-change`, updates group's `value` prop → context updates → checkbox re-renders

When a checkbox is clicked outside a group, behavior is unchanged from today.

## Consumer Usage

### Basic Group

```html
<grund-checkbox-group
  .defaultValue=${['http']}
  @grund-value-change=${(e) => console.log(e.detail.value)}
>
  <fieldset>
    <legend>Allowed protocols</legend>
    <label><grund-checkbox value="http">HTTP</grund-checkbox></label>
    <label><grund-checkbox value="https">HTTPS</grund-checkbox></label>
    <label><grund-checkbox value="ftp">FTP</grund-checkbox></label>
  </fieldset>
</grund-checkbox-group>
```

### With Parent Checkbox

```html
<grund-checkbox-group
  .value=${this.protocols}
  .allValues=${['http', 'https', 'ftp']}
  @grund-value-change=${(e) => this.protocols = e.detail.value}
>
  <fieldset>
    <legend>Allowed protocols</legend>
    <label><grund-checkbox parent value="all">Select all</grund-checkbox></label>
    <label><grund-checkbox value="http">HTTP</grund-checkbox></label>
    <label><grund-checkbox value="https">HTTPS</grund-checkbox></label>
    <label><grund-checkbox value="ftp">FTP</grund-checkbox></label>
  </fieldset>
</grund-checkbox-group>
```

### Disabled Group

```html
<grund-checkbox-group disabled .defaultValue=${['https']}>
  <label><grund-checkbox value="http">HTTP</grund-checkbox></label>
  <label><grund-checkbox value="https">HTTPS</grund-checkbox></label>
</grund-checkbox-group>
```

## Testing Strategy

### SelectionEngine Tests (additions to existing test file)

- `requestSet` replaces selected values and returns new array
- `requestSet` returns `null` when disabled
- `requestSet` updates internal state in uncontrolled mode
- `requestSet` does not update internal state in controlled mode

### Engine Tests (`checkbox-group.engine.test.ts`)

- Controlled/uncontrolled mode via `syncFromHost`
- `requestToggle` adds/removes values, returns new array
- `requestToggle` returns `null` when disabled
- `requestToggleAll` checks all when unchecked/indeterminate, unchecks all when all checked
- `requestToggleAll` delegates to `SelectionEngine.requestSet`
- `getParentState` returns correct state for all/some/none/empty-allValues
- Toggle-all preserves values not in `allValues`
- Default value seeded once only

### Integration Tests (`checkbox-group.test.ts`)

- Clicking a checkbox updates group value
- Controlled mode: group reflects `value` prop, doesn't auto-update
- Uncontrolled mode: group manages internal state from `defaultValue`
- `grund-value-change` fires with correct detail (`value`, `itemValue`, `checked`)
- `grund-checked-change` fires from individual checkbox before `grund-value-change` fires from group
- Parent checkbox reflects indeterminate/checked/unchecked state correctly
- Clicking parent checkbox toggles all children
- Parent checkbox does not submit a form value when inside a group
- Group `disabled` propagates to all children via `disabledContext`
- Individual checkbox `disabled` still works independently within a group
- Checkbox outside a group works exactly as before (no regression)
- Form submission: each regular checkbox submits independently with its own `name`
