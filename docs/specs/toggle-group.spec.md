# Toggle Group — Component Design

High-level design reference for implementing the toggle-group component.

---

## Component Structure

```
<grund-toggle-group>      → Root, provides context, RovingFocusController
  <grund-toggle>           → Existing toggle element, consumes group context
```

Toggle Group is a composite widget that manages shared pressed state across a set of
`<grund-toggle>` children. No `item/` layer — each `<grund-toggle>` is the item directly.

---

## Elements & Public API

### `<grund-toggle-group>` — Root

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string[] \| undefined` | `undefined` | — |
| `defaultValue` | `string[]` | `[]` | — |
| `multiple` | `boolean` | `false` | `multiple` |
| `disabled` | `boolean` | `false` | `disabled` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | `orientation` |
| `loop` | `boolean` | `true` | `loop` |

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-value-change` | `{ value: string[] }` | Set of pressed toggles changes |

**CSS parts:** `group`

**ARIA:** `role="group"` on the inner container

**Data attributes:** `data-orientation`, `data-disabled`, `data-multiple`

**Keyboard:** Arrow keys move focus between toggles via `RovingFocusController`.
`orientation` determines which arrow keys apply. `loop` controls wrap-around.

### `<grund-toggle>` — Child (existing element, behavior changes inside group)

When placed inside `<grund-toggle-group>`, a toggle's pressed state is **owned by the group**.
The toggle's own `pressed` / `defaultPressed` props are ignored — the group's `value` /
`defaultValue` determines which toggles are pressed, matched by `value` prop.

---

## Controlled vs Uncontrolled

- **Uncontrolled:** `defaultValue` seeds once → internal state updates on interaction
- **Controlled:** `value` drives state → only event fires, consumer must update `value`

---

## Selection Behavior

- **Single** (`multiple=false`): pressing a toggle unpresses the previously pressed one.
  Pressing the already-pressed toggle deselects it (no enforced minimum).
- **Multiple** (`multiple=true`): any combination of toggles can be pressed independently.

---

## Group ↔ Toggle Communication

| Direction | Mechanism |
|---|---|
| Group → Toggle | Lit Context — root provides selection state + callbacks |
| Toggle → Group | Registration callback on context |
| External API (out) | `grund-value-change` on root |
| External API (in) | `value`, `disabled`, `multiple` properties on root |

When a toggle is inside a group, it calls a context callback instead of managing its own
pressed state. The group controller resolves the new value set and dispatches the event.

Group `disabled` overrides individual toggle `disabled` — if the group is disabled,
all toggles are disabled regardless of their own `disabled` prop.

---

## Internal Layers

| Layer | Responsibility |
|---|---|
| **Engine** | Owns `pressedValues` set, resolves toggle actions (single/multiple logic), controlled/uncontrolled. Delegates to `SelectionEngine`. |
| **Registry** | Ordered child tracking for `RovingFocusController` focus targets |
| **Context** | Single context interface (no item context needed — toggles consume root context directly) |

---

## Notes

- Each `<grund-toggle>` must have a unique `value` prop inside a group. Emit a dev-mode
  warning for missing or duplicate values.
- The toggle's `grund-pressed-change` event should still fire for individual toggle state
  changes, in addition to the group's `grund-value-change`.
