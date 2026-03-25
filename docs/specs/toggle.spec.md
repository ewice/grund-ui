---
component_name: toggle
category: simple
purpose: A standalone pressable button with aria-pressed state; also the primitive element inside <grund-toggle-group>.
key_decisions:
  - Single element only — no compound structure.
  - Controlled/uncontrolled via `pressed` / `defaultPressed` props.
  - `value` is stored but has no effect on the standalone toggle; reserved for <grund-toggle-group>.
  - No form participation — not form-associated.
  - Keyboard is native <button> behaviour (Space / Enter).
open_questions: []
---

# Toggle — Component Spec

## Component Overview

`<grund-toggle>` is a headless pressable button. It renders one inner `<button>` with `aria-pressed`
reflecting the current pressed state. It is the primitive element used inside `<grund-toggle-group>`.

---

## Elements

### `<grund-toggle>` — Root and only element

Renders an inner `<button part="button">` in its shadow DOM. Slotted content becomes the button label.

---

## Properties

| Property | Type | Default | Attribute | Notes |
|---|---|---|---|---|
| `pressed` | `boolean \| undefined` | `undefined` | — | Setting enables controlled mode |
| `defaultPressed` | `boolean` | `false` | `default-pressed` | Seeds uncontrolled state on first render |
| `value` | `string` | `''` | `value` | No effect standalone; used by `<grund-toggle-group>` |
| `disabled` | `boolean` | `false` | `disabled` | Disables the button |

### Property Lifecycle Table

| Property | Set before `connectedCallback` | Changed at runtime | Set to `undefined` | Reflected? |
|---|---|---|---|---|
| `pressed` | Stored; applied on first render as controlled value | Updates rendered `aria-pressed`; fires no event | Switches to uncontrolled, resumes `_internalPressed` | No |
| `defaultPressed` | Seeds `_internalPressed` on first render only | Ignored after first render | Treated as `false` | No |
| `value` | Stored | Stored | Treated as `''` | No |
| `disabled` | Stored; applied to inner button | Updates `disabled` on inner button; updates `data-disabled` | Treated as `false` | No |

---

## Events

| Event | Detail type | Cancelable | When fired |
|---|---|---|---|
| `grund-pressed-change` | `{ pressed: boolean }` | No | Whenever pressed state changes (both controlled and uncontrolled modes) |

The event fires with the **new** pressed value. In controlled mode the host state does not change —
the consumer is responsible for updating `pressed`.

---

## Keyboard Contract

| Key | Action |
|---|---|
| `Space` | Toggle pressed state (native `<button>`) |
| `Enter` | Toggle pressed state (native `<button>`) |

No custom keyboard handling is required — native `<button>` click semantics apply.

---

## ARIA Contract

No APG pattern for toggle buttons specifically — the standard Button pattern applies with `aria-pressed`.

| Attribute | Where | Value |
|---|---|---|
| `aria-pressed` | Inner `<button>` | `"true"` or `"false"` |
| `disabled` | Inner `<button>` | boolean attribute |

---

## Parts and Slots

| Part / Slot | Name | Description |
|---|---|---|
| `@csspart` | `button` | The inner `<button>` element |
| `@slot` | (default) | Button label content |

---

## Data Attributes

| Attribute | Values | Set by | When |
|---|---|---|---|
| `data-pressed` | boolean presence | Host in `willUpdate` | Reflects effective pressed state |
| `data-disabled` | boolean presence | Host in `willUpdate` | Reflects disabled state |

---

## Controlled vs Uncontrolled

- **Uncontrolled:** `pressed` is `undefined`. `defaultPressed` seeds `_internalPressed` on first render.
  Clicking toggles `_internalPressed` and fires `grund-pressed-change`.
- **Controlled:** `pressed` is `boolean`. Clicking fires `grund-pressed-change` but does NOT update
  internal state. The consumer must update the `pressed` property to change the displayed state.
- **Transition:** switching `pressed` from `boolean` to `undefined` at runtime resumes uncontrolled
  mode using the last `_internalPressed` value.

---

## Edge Cases and Constraints

- `defaultPressed` is only read on first render. Changes after initial render are ignored.
- `value` has no semantic effect on the standalone toggle. It is stored and may be read by a
  parent `<grund-toggle-group>`.
- Clicking a disabled toggle does nothing and fires no event.
