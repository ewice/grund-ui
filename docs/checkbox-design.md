# Checkbox — Component Design

High-level design reference for implementing the checkbox component.

---

## Component Structure

```
<grund-checkbox>           → Root element, renders an inner <button role="checkbox">
  <grund-checkbox-indicator>  → Visual indicator slot (checkmark, dash, etc.)
</grund-checkbox>
```

Checkbox is a form-associated toggle control with three states: checked, unchecked, and
indeterminate. Unlike Toggle (which uses `aria-pressed`), Checkbox uses `role="checkbox"`
with `aria-checked`. The indicator is a separate element so consumers can slot in custom
check/dash icons and style them independently via `::part()`.

Checkbox Group is handled separately as `<grund-checkbox-group>` (see below).

---

## Elements & Public API

### `<grund-checkbox>` — Root

| Property | Type | Default | Attribute |
|---|---|---|---|
| `checked` | `boolean \| undefined` | `undefined` | — |
| `defaultChecked` | `boolean` | `false` | `default-checked` |
| `indeterminate` | `boolean` | `false` | — |
| `name` | `string` | `''` | `name` |
| `value` | `string` | `'on'` | `value` |
| `disabled` | `boolean` | `false` | `disabled` |
| `required` | `boolean` | `false` | `required` |

`checked = undefined` → uncontrolled. `checked = true/false` → controlled.

`indeterminate` is always controlled — there is no `defaultIndeterminate`. The parent
"select all" checkbox is the canonical use case: the consumer sets `indeterminate` based
on whether all, some, or no children are checked. On click, `indeterminate` is not
automatically cleared — the consumer must update it.

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-checked-change` | `{ checked: boolean, indeterminate: boolean }` | Checked state changes on interaction |

**CSS parts:** `button`

**ARIA:** `role="checkbox"`, `aria-checked` (`true`, `false`, or `mixed`) on the inner `<button>`

**Data attributes:** `data-checked`, `data-unchecked`, `data-indeterminate`, `data-disabled`, `data-required`

**Keyboard:** `Space` toggles checked state (native `<button>` behavior)

---

### `<grund-checkbox-indicator>` — Indicator

No public properties. Placed inside `<grund-checkbox>` as a slotted child. The indicator
is visible when the checkbox is checked or indeterminate, hidden when unchecked.

Consumers slot their own checkmark/dash content inside:
```html
<grund-checkbox>
  <grund-checkbox-indicator>
    <svg><!-- checkmark icon --></svg>
  </grund-checkbox-indicator>
  Label text
</grund-checkbox>
```

**CSS parts:** `indicator`

**Data attributes:** `data-checked`, `data-unchecked`, `data-indeterminate`

**Visibility:** The indicator reads checkbox state from context and sets `data-checked`,
`data-unchecked`, or `data-indeterminate` so consumers can style visibility via CSS.
The component does not enforce `display: none` — consumers control visibility through
data attribute selectors.

---

## Controlled vs Uncontrolled

- **Uncontrolled:** `defaultChecked` seeds once → internal state updates on interaction
- **Controlled:** `checked` drives state → only `grund-checked-change` fires; consumer
  must update `checked`
- **Indeterminate:** Always controlled. Consumer sets and clears `indeterminate` manually.
  Clicking an indeterminate checkbox fires `grund-checked-change` with `checked: true`.

---

## Form Participation

Checkbox is a form control (`static formAssociated = true`). Uses `FormController` wrapping
`ElementInternals`.

- **Form value:** Submits `value` (default `'on'`) when checked; submits nothing when unchecked.
- **Validation:** `required` sets `valueMissing` when unchecked.
- **Reset:** `formResetCallback` restores `defaultChecked`.
- **Restore:** `formStateRestoreCallback` restores checked state from browser autofill / bfcache.
- **Label:** Consumers use `<label for="id">` pointing to the component's `id`.
- **Fieldset disabled:** `formDisabledCallback` propagates `<fieldset disabled>`.

---

## Keyboard Contract

| Key | Action |
|---|---|
| `Space` | Toggle checked state |

Native `<button>` behavior — no custom keyboard handling needed.

---

## Checkbox Group

### `<grund-checkbox-group>` — Group container

A grouping element that provides a labeled group of checkboxes with shared `name` and
optional "select all" wiring.

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string[] \| undefined` | `undefined` | — |
| `defaultValue` | `string[]` | `[]` | — |
| `disabled` | `boolean` | `false` | `disabled` |
| `name` | `string` | `''` | `name` |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `orientation` |
| `allValues` | `string[]` | `[]` | — |

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-value-change` | `{ value: string[] }` | Set of checked values changes |

**CSS parts:** `group`

**ARIA:** `role="group"` on the inner container. Consumers provide a label via
`aria-label` or `aria-labelledby`.

**Data attributes:** `data-orientation`, `data-disabled`

### Group ↔ Checkbox Communication

| Direction | Mechanism |
|---|---|
| Group → Checkbox | Lit Context — root provides checked values + callbacks |
| Checkbox → Group | Registration callback on context |
| External API (out) | `grund-value-change` on root |
| External API (in) | `value`, `disabled` properties on root |

When a checkbox is inside a group, its checked state is **owned by the group**. The
checkbox's own `checked` / `defaultChecked` props are ignored — the group's `value` /
`defaultValue` determines which checkboxes are checked, matched by `value` prop.

The group provides its `name` to child checkboxes via context, so child checkboxes do
not need their own `name` when inside a group.

### `allValues` and Indeterminate

`allValues` enables the "select all" pattern. Consumers set `allValues` to the full list
of checkbox values. The group exposes a reactive `allSelected` and `noneSelected` read-only
state that a parent checkbox can bind to for its `checked` and `indeterminate` props:

```html
<grund-checkbox
  .checked=${group.allSelected}
  .indeterminate=${!group.allSelected && !group.noneSelected}
>
  Select all
</grund-checkbox>

<grund-checkbox-group .allValues=${['a', 'b', 'c']}>
  <grund-checkbox value="a">Option A</grund-checkbox>
  <grund-checkbox value="b">Option B</grund-checkbox>
  <grund-checkbox value="c">Option C</grund-checkbox>
</grund-checkbox-group>
```

---

## Internal Architecture

### Engine

No compound state machine needed for standalone checkbox — state is a single boolean
(`checked`) plus a controlled `indeterminate` flag. The checkbox element manages this
inline (like Toggle).

For `<grund-checkbox-group>`, a `CheckboxGroupEngine` wraps `SelectionEngine` with
`multiple: true` always. It exposes:
- `toggle(value)` — add or remove a value from the set
- `getSnapshot()` — returns `{ value: string[], allSelected: boolean, noneSelected: boolean }`

### No Roving Focus

Unlike Toggle Group, Checkbox Group does **not** use `RovingFocusController`. Each
checkbox is independently focusable via Tab. This matches the WAI-ARIA checkbox group
pattern — checkboxes are not a composite widget.

---

## Usage Examples

### Standalone

```html
<grund-checkbox default-checked>
  <grund-checkbox-indicator>✓</grund-checkbox-indicator>
  Accept terms
</grund-checkbox>
```

### Controlled

```html
<grund-checkbox
  .checked=${this.agreed}
  @grund-checked-change=${(e) => this.agreed = e.detail.checked}
>
  <grund-checkbox-indicator>✓</grund-checkbox-indicator>
  I agree
</grund-checkbox>
```

### Indeterminate (select all)

```html
<grund-checkbox
  .checked=${this.allSelected}
  .indeterminate=${this.someSelected}
  @grund-checked-change=${this.handleSelectAll}
>
  <grund-checkbox-indicator>
    ${this.someSelected ? '—' : '✓'}
  </grund-checkbox-indicator>
  Select all
</grund-checkbox>
```

### In a form

```html
<form>
  <grund-checkbox name="newsletter" value="yes" required>
    <grund-checkbox-indicator>✓</grund-checkbox-indicator>
    Subscribe to newsletter
  </grund-checkbox>
  <button type="submit">Submit</button>
</form>
```

### Checkbox Group

```html
<grund-checkbox-group name="toppings" .defaultValue=${['cheese']}>
  <grund-checkbox value="cheese">
    <grund-checkbox-indicator>✓</grund-checkbox-indicator>
    Cheese
  </grund-checkbox>
  <grund-checkbox value="pepperoni">
    <grund-checkbox-indicator>✓</grund-checkbox-indicator>
    Pepperoni
  </grund-checkbox>
  <grund-checkbox value="mushrooms">
    <grund-checkbox-indicator>✓</grund-checkbox-indicator>
    Mushrooms
  </grund-checkbox>
</grund-checkbox-group>
```

---

## Notes

- Checkbox uses `role="checkbox"` + `aria-checked`, not `aria-pressed`. This is the
  semantic distinction from Toggle (`aria-pressed`).
- `aria-checked="mixed"` maps to the indeterminate state.
- `value` defaults to `'on'` (matching native `<input type="checkbox">` behavior).
- The indicator element is optional — consumers who don't need a styled indicator
  can omit it entirely.
