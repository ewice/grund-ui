---
component_name: checkbox
category: form-control
purpose: A form-associated tri-state toggle control with checked, unchecked, and indeterminate states.
key_decisions:
  - Two elements — grund-checkbox (root with inner <button role="checkbox">) + grund-checkbox-indicator (visual indicator slot).
  - Controlled/uncontrolled via `checked` / `defaultChecked` props.
  - `indeterminate` is always controlled — consumer sets and clears it.
  - Clicking an indeterminate checkbox fires grund-checked-change with checked:true; indeterminate is NOT auto-cleared.
  - Form participation via FormController wrapping ElementInternals (static formAssociated = true).
  - Shadow root uses delegatesFocus: true since the inner <button> is the focusable element.
  - Indicator visibility is consumer-controlled via CSS on data-checked / data-unchecked / data-indeterminate — the component does NOT set display:none.
  - No engine — state is a single boolean + controlled indeterminate flag; managed inline.
  - No RovingFocusController — standalone form control, not a composite widget.
open_questions: []
---

# Checkbox — Component Spec

## Component Overview

`<grund-checkbox>` is a headless form-associated checkbox. It renders an inner `<button role="checkbox">`
with `aria-checked` reflecting checked / unchecked / indeterminate state. `<grund-checkbox-indicator>`
is a companion element consumers place inside the checkbox to slot in a custom checkmark or dash icon;
its visibility is driven by data attributes.

Checkbox is the first form control in Grund UI and is built alongside `FormController`.

---

## APG Contract: Checkbox

Source: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/

### Elements and Roles

- Checkbox element: `role="checkbox"` (on the inner `<button>`)
- Optional group container: `role="group"` (when multiple related checkboxes share a group label)

### Required ARIA Attributes

- `aria-checked`: `"true"` | `"false"` | `"mixed"` on the inner `<button>`
- An accessible label — via slotted text, `aria-label`, or `aria-labelledby`

### Keyboard Interactions

| Key | Effect | Condition |
|-----|--------|-----------|
| `Space` | Toggle checked state | Focus on inner `<button>` |

Native `<button>` handles this; no custom keyboard handler needed.

### Notes

- Tri-state (`aria-checked="mixed"`) is the indeterminate state — used for parent "select all" checkboxes.
- `<input type="checkbox">` is the native equivalent — APG pattern is for cases where native input is insufficient.

---

## Elements

### `<grund-checkbox>` — Root

Form-associated element. Renders `<button part="button" role="checkbox">` in its shadow DOM.
Slotted content (label text + indicator child) flows into the button via `<slot>`.

Provides `checkboxContext` to child elements so `<grund-checkbox-indicator>` can read state.

**Shadow template:**
```html
<button part="button" role="checkbox" aria-checked="...">
  <slot></slot>
</button>
```

### `<grund-checkbox-indicator>` — Indicator

No state. Consumes `checkboxContext` to receive the current checked/indeterminate state and
reflects it as `data-checked`, `data-unchecked`, `data-indeterminate` on its host.

**Shadow template:**
```html
<span part="indicator">
  <slot></slot>
</span>
```

---

## Context

### `checkboxContext` (root → indicator)

```ts
interface CheckboxContext {
  checked: boolean;        // effective checked state
  indeterminate: boolean;  // indeterminate state
}
```

State flows down only. No actions — indicator is read-only.

---

## Properties

### `<grund-checkbox>`

| Property | Type | Default | Attribute | Notes |
|---|---|---|---|---|
| `checked` | `boolean \| undefined` | `undefined` | — | `undefined` → uncontrolled; `boolean` → controlled |
| `defaultChecked` | `boolean` | `false` | `default-checked` | Seeds uncontrolled state on first render only |
| `indeterminate` | `boolean` | `false` | — | Always controlled; consumer sets and clears |
| `name` | `string` | `''` | `name` | Form field name |
| `value` | `string` | `'on'` | `value` | Form submission value when checked |
| `disabled` | `boolean` | `false` | `disabled` | Disables the button |
| `required` | `boolean` | `false` | `required` | Sets valueMissing validity when unchecked |
| `readOnly` | `boolean` | `false` | `read-only` | Prevents user interaction without disabling |

### Property Lifecycle Table

| Property | Set before `connectedCallback` | Changed at runtime | Set to `undefined`/`null` | Reflected? |
|---|---|---|---|---|
| `checked` | Stored; applied on first render as controlled value | Updates aria-checked + data attrs; fires no event | Switches to uncontrolled, resumes `_internalChecked` | No |
| `defaultChecked` | Seeds `_internalChecked` on first render only | Ignored after first render | Treated as `false` | No |
| `indeterminate` | Stored; applied on first render | Updates aria-checked to `"mixed"`; updates data attrs | Treated as `false` | No |
| `name` | Stored | Updates form data | Treated as `''` | No |
| `value` | Stored | Updates form value submitted when checked | Treated as `'on'` | No |
| `disabled` | Stored; applied to inner button | Updates disabled on inner button; updates data-disabled | Treated as `false` | No |
| `required` | Stored; updates validity | Re-runs validity check | Treated as `false` | No |
| `readOnly` | Stored; applied to data attr | Updates data-readonly; blocks click handler | Treated as `false` | No |

**Form reset in controlled mode:** `formResetCallback` restores `_internalChecked` to `defaultChecked`
and clears the `checked` property (switches to uncontrolled).

---

## Events

| Event | Detail type | Cancelable | When fired |
|---|---|---|---|
| `grund-checked-change` | `{ checked: boolean }` | No | Whenever checked state changes via user interaction |

The event fires with the **new** checked value. In controlled mode the displayed state does not
change — the consumer must update `checked`. Clicking an indeterminate checkbox fires the event
with `checked: true`; the consumer must also clear `indeterminate`.

---

## Keyboard Contract

| Key | Action |
|---|---|
| `Space` | Toggle checked state |

Native `<button>` click semantics apply — no custom keyboard handling.

---

## ARIA Contract

| Attribute | Where | Value |
|---|---|---|
| `role` | Inner `<button>` | `"checkbox"` |
| `aria-checked` | Inner `<button>` | `"true"` \| `"false"` \| `"mixed"` |
| `disabled` | Inner `<button>` | boolean attribute (when disabled) |

`aria-checked="mixed"` maps to the indeterminate state.

---

## Parts and Slots

| Kind | Name | Description |
|---|---|---|
| `@csspart` | `button` | The inner `<button role="checkbox">` on `<grund-checkbox>` |
| `@csspart` | `indicator` | The `<span>` wrapper on `<grund-checkbox-indicator>` |
| `@slot` | (default) | Label text and `<grund-checkbox-indicator>` children of `<grund-checkbox>` |
| `@slot` | (default) | Custom checkmark/dash icon inside `<grund-checkbox-indicator>` |

---

## Data Attributes

### `<grund-checkbox>`

| Attribute | Values | Set by | When |
|---|---|---|---|
| `data-checked` | boolean presence | Host in `willUpdate` | Effective checked state is `true` and not indeterminate |
| `data-unchecked` | boolean presence | Host in `willUpdate` | Effective checked state is `false` and not indeterminate |
| `data-indeterminate` | boolean presence | Host in `willUpdate` | `indeterminate` is `true` |
| `data-disabled` | boolean presence | Host in `willUpdate` | `disabled` is `true` |
| `data-required` | boolean presence | Host in `willUpdate` | `required` is `true` |
| `data-readonly` | boolean presence | Host in `willUpdate` | `readOnly` is `true` |

### `<grund-checkbox-indicator>`

| Attribute | Values | Set by | When |
|---|---|---|---|
| `data-checked` | boolean presence | Host in `willUpdate` (via context) | Parent checkbox is checked and not indeterminate |
| `data-unchecked` | boolean presence | Host in `willUpdate` (via context) | Parent checkbox is unchecked and not indeterminate |
| `data-indeterminate` | boolean presence | Host in `willUpdate` (via context) | Parent checkbox is indeterminate |

---

## Form Participation

- `static formAssociated = true`
- Uses `FormController` wrapping `ElementInternals`
- Shadow root: `delegatesFocus: true`
- **Form value:** submits `value` (default `'on'`) when checked; submits nothing when unchecked or indeterminate
- **Validation:** `required` sets `valueMissing` when unchecked (indeterminate also counts as unchecked for validity)
- **Reset:** `formResetCallback` restores `_internalChecked` to `defaultChecked`
- **Restore:** `formStateRestoreCallback` restores checked state from browser autofill / bfcache
- **Fieldset disabled:** `formDisabledCallback` propagates `<fieldset disabled>` to component

---

## Controlled vs Uncontrolled

- **Uncontrolled:** `checked` is `undefined`. `defaultChecked` seeds `_internalChecked` on first render.
  Clicking toggles `_internalChecked` and fires `grund-checked-change`.
- **Controlled:** `checked` is `boolean`. Clicking fires `grund-checked-change` but does NOT update
  internal state. The consumer must update `checked`.
- **Indeterminate:** Always controlled. Consumer sets `indeterminate = true` to show mixed state.
  Clicking fires `grund-checked-change` with `checked: true`; the consumer must also set
  `indeterminate = false` if desired.
- **Transition:** switching `checked` from `boolean` to `undefined` resumes uncontrolled mode
  using the last `_internalChecked` value.

---

## Edge Cases and Constraints

- `defaultChecked` is only read on first render. Changes after initial render are ignored.
- Clicking a disabled or readOnly checkbox does nothing and fires no event.
- `indeterminate` takes visual precedence over `checked` — when `indeterminate` is `true`,
  `aria-checked="mixed"` regardless of `checked` value, and `data-indeterminate` is set exclusively.
- `required` validation: unchecked AND indeterminate both fail `valueMissing`.
- `<grund-checkbox-indicator>` outside a `<grund-checkbox>` should emit a dev-mode warning and
  render as a no-op.
