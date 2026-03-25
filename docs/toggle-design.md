# Toggle — Component Design

High-level design reference for implementing the toggle component.

---

## Component Structure

```
<grund-toggle>         → Single element, renders an inner <button>
```

Toggle is a standalone pressable button with `aria-pressed` state. It is also the
primitive used inside `<grund-toggle-group>`.

---

## Elements & Public API

### `<grund-toggle>` — Root & only element

| Property | Type | Default | Attribute |
|---|---|---|---|
| `pressed` | `boolean \| undefined` | `undefined` | — |
| `defaultPressed` | `boolean` | `false` | `default-pressed` |
| `value` | `string` | `''` | `value` |
| `disabled` | `boolean` | `false` | `disabled` |

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-pressed-change` | `{ pressed: boolean }` | Pressed state changes |

**CSS parts:** `button`

**ARIA:** `aria-pressed` on the inner `<button>`

**Data attributes:** `data-pressed`, `data-disabled`

**Keyboard:** `Space` / `Enter` toggles pressed state (native `<button>` behavior)

---

## Controlled vs Uncontrolled

- **Uncontrolled:** `defaultPressed` seeds once → internal state updates on interaction
- **Controlled:** `pressed` drives state → only event fires, consumer must update `pressed`

---

## Notes

- `value` has no effect on the standalone Toggle; it is reserved for use inside `<grund-toggle-group>` to identify which item is pressed.
