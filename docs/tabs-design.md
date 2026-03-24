# Tabs — Component Design

High-level design reference for implementing the tabs component.

---

## Component Structure

```
<grund-tabs>                         ← Root: value, orientation, disabled
  <grund-tabs-list>                  ← Tablist: activateOnFocus, loopFocus
    <grund-tab value="a">            ← Individual tab button
    <grund-tab value="b">
    <grund-tabs-indicator>           ← Optional animated position tracker
  </grund-tabs-list>
  <grund-tabs-panel value="a">       ← Content panel (linked by value)
  <grund-tabs-panel value="b">
</grund-tabs>
```

Panels are siblings of the list, not nested inside items. There is no `item` wrapper
element — tab↔panel association is resolved by matching `value` attributes, not DOM
nesting.

---

## Elements & Public API

### `<grund-tabs>` — Root

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string \| null \| undefined` | `undefined` | — |
| `defaultValue` | `string \| null` | first non-disabled tab | `default-value` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | `orientation` |
| `disabled` | `boolean` | `false` | `disabled` |

`value = undefined` → uncontrolled. `value = null` → controlled, nothing selected.
Value type is `string` only — HTML attributes are strings by nature. Consumers migrating
from React libraries (where value can be `any`) should convert identifiers to strings.

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-value-change` | `{ value: string \| null, previousValue: string \| null }` | Active tab changed |

**Data attributes:** `data-orientation`, `data-activation-direction`

---

### `<grund-tabs-list>` — List

| Property | Type | Default | Attribute |
|---|---|---|---|
| `activateOnFocus` | `boolean` | `true` | `activate-on-focus` |
| `loopFocus` | `boolean` | `true` | `loop-focus` |

`activateOnFocus = true` — arrow keys both move focus and activate the focused tab
immediately. `activateOnFocus = false` — arrow keys only move focus; Enter/Space is
required to activate.

**CSS parts:** `list`
**ARIA:** `role="tablist"`, `aria-orientation`
**Data attributes:** `data-orientation`, `data-disabled`, `data-activation-direction`

---

### `<grund-tab>` — Tab

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string` | required | `value` |
| `disabled` | `boolean` | `false` | `disabled` |

Renders an inner `<button role="tab">`. The `value` must match exactly one
`<grund-tabs-panel value="…">`.

**CSS parts:** `tab`
**ARIA:** `role="tab"`, `aria-selected`, `aria-controls`, `aria-disabled`
**Data attributes:** `data-selected`, `data-disabled`, `data-orientation`, `data-index`, `data-activation-direction`

---

### `<grund-tabs-panel>` — Panel

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string` | required | `value` |
| `keepMounted` | `boolean` | `false` | `keep-mounted` |

Inactive panels are removed from the DOM unless `keepMounted`. When mounted but
inactive, `hidden` is set and `tabindex` is removed.

**CSS parts:** `panel`
**ARIA:** `role="tabpanel"`, `aria-labelledby`, `tabindex="0"` (active only)
**Data attributes:** `data-selected`, `data-orientation`, `data-activation-direction`

---

### `<grund-tabs-indicator>` — Indicator

No public properties. Positioned inside `<grund-tabs-list>`. Exposes the active tab's
geometry as CSS custom properties so consumers can animate an underline or background.

**CSS parts:** `indicator`
**Data attributes:** `data-orientation`, `data-activation-direction`
**CSS custom properties (set as inline styles):**

| Property | Description |
|---|---|
| `--grund-tabs-indicator-width` | Width of the active tab |
| `--grund-tabs-indicator-height` | Height of the active tab |
| `--grund-tabs-indicator-left` | Distance from list left edge |
| `--grund-tabs-indicator-top` | Distance from list top edge |
| `--grund-tabs-indicator-right` | Distance from list right edge |
| `--grund-tabs-indicator-bottom` | Distance from list bottom edge |

CSS custom property names are physical (not logical) because the values are physical
pixel measurements from `getBoundingClientRect()`. Exposing all four sides lets consumers
use either physical (`left`) or logical (`inset-inline-start`) CSS positioning.

---

## Data Attributes

### `data-activation-direction`

Values: `'start' | 'end' | 'none'`. Set on **every element** (root, list, tab, panel,
indicator). Whether the newly active tab is earlier (`start`) or later (`end`) in the
list than the previously active tab. `none` on initial activation. Logical values;
consumers combine with `data-orientation` to derive the physical translation direction.

Register in `docs/vocabulary.md` alongside existing entries.

### `data-selected`

Boolean presence attribute. Set on `<grund-tab>` and `<grund-tabs-panel>` when active.
Distinct from `data-open` — `data-selected` is the standard for selection-based
components (tabs, radio group, listbox, combobox, select, toggle group, menu).
`data-open` is for disclosure/expand patterns (accordion, collapsible, dialog, popover).

Register in `docs/vocabulary.md` with this distinction documented.

---

## Controlled vs Uncontrolled

- **Uncontrolled:** `defaultValue` seeds once → internal state updates on interaction.
  If omitted, the first non-disabled tab is activated.
- **Controlled:** `value` drives state → only `grund-value-change` fires; consumer
  must update `value`.
- `value = null` (controlled, no selection) is valid for consumers that want a blank
  initial state before the user has acted.

---

## Keyboard Contract

| Key | `activateOnFocus = true` | `activateOnFocus = false` |
|---|---|---|
| `Arrow Left / Up` | Focus + activate previous tab | Focus previous tab only |
| `Arrow Right / Down` | Focus + activate next tab | Focus next tab only |
| `Home` | Focus + activate first tab | Focus first tab only |
| `End` | Focus + activate last tab | Focus last tab only |
| `Enter` / `Space` | — | Activate focused tab |
| `Tab` | Move focus to active panel | Move focus to active panel |

Arrow axis follows `orientation`: Left/Right for `horizontal`, Up/Down for `vertical`.
`loopFocus` on `<grund-tabs-list>` controls whether focus wraps at the ends.

---

## Internal Architecture

### Auto-selection

If no `value` or `defaultValue` is set, the first non-disabled tab is activated
automatically. This applies on initial render and when tabs are added programmatically
after first render.

### Indicator Measurement

The indicator element owns its measurement — the controller has no DOM access.
`ResizeObserver` on the parent list and the active tab element. Both call the same
`measure()` method. On activation change, the tab-level observer swaps to the new
active tab. If no active tab exists, `measure()` is a no-op.
