# Grund UI — Vocabulary Registry

Cross-component naming consistency registry. Updated by `/component-spec` (new names),
`/extract-pattern` (new shared patterns), and `/review-system-health` (audits).

Validated by `api-reviewer` during every component review.

---

## Action Verbs (Context Methods)

Methods on context objects that trigger state changes. Use these names — do not invent new ones
for the same semantic action.

| Verb | Meaning | Example |
|---|---|---|
| `requestToggle` | Request a state toggle (may be rejected by controlled mode) | `ctx.requestToggle(itemValue, itemDisabled)` |
| `toggle` | Unconditional toggle action (item-scoped) | `itemCtx.toggle()` |
| `registerItem` / `unregisterItem` | Add/remove a child from the parent registry | `ctx.registerItem(this, value)` |
| `attachTrigger` / `detachTrigger` | Link/unlink a trigger sub-part to its item | `itemCtx.attachTrigger(this)` |
| `attachPanel` / `detachPanel` | Link/unlink a panel sub-part to its item | `itemCtx.attachPanel(this)` |

---

## Event Names

All events follow `grund-{action}` pattern, `bubbles: true`, `composed: false`.

| Event | Detail type | Meaning |
|---|---|---|
| `grund-value-change` | `{ value: string[], itemValue: string, open: boolean }` | Full expanded values snapshot |
| `grund-open-change` | `{ value: string, open: boolean, index: number }` | An item opened or closed |

---

## Part Names

CSS `::part()` names. All lowercase, hyphenated nouns.

| Part | Meaning | Components |
|---|---|---|
| `trigger` | The interactive element that activates an item | Accordion, Disclosure, Tabs |
| `panel` | The collapsible/revealable content region | Accordion, Disclosure, Tabs |
| `header` | The heading wrapper element | (reserved — no component uses it yet) |
| `content` | Inner content wrapper within a panel | Dialog |
| `indicator` | Visual expand/collapse chevron or icon | Accordion, Select |
| `label` | A text label element | Switch, Checkbox |
| `input` | The underlying native or custom input | Switch, Checkbox, Input |
| `close-button` | Button that closes an overlay | Dialog, Sheet, Toast |
| `overlay` | The backdrop/scrim behind a modal | Dialog, Sheet |

---

## Slot Names

| Slot | Meaning |
|---|---|
| (default) | Primary content — always unnamed |
| `indicator` | Custom expand/collapse icon |
| `prefix` | Content before the main label |
| `suffix` | Content after the main label (badges, icons) |
| `close` | Custom close button content |

---

## Data Attributes

Standard data attributes set by controllers or elements as public API.

| Attribute | Values | Set by | Semantics |
|---|---|---|---|
| `data-open` | boolean presence | Host element in `willUpdate` | — |
| `data-disabled` | boolean presence | Host element in `willUpdate` | — |
| `data-orientation` | `"vertical"` / `"horizontal"` | Root and sub-parts in `willUpdate` | — |
| `data-index` | string integer | Item element in `willUpdate` | — |
| `data-selected` | boolean presence | Host in `willUpdate` | Active in a selection group. Standard for single- and multi-select components (tabs, radio group, listbox, combobox, select, toggle group, menu). Distinct from `data-open` — use `data-open` for disclosure/expand patterns (accordion, collapsible, dialog, popover). |
| `data-activation-direction` | `'start'` / `'end'` / `'none'` | Root + all sub-elements in `willUpdate` | Direction of the last activation relative to list order. Logical, not physical — consumers combine with `data-orientation` to derive the physical direction for animations. `none` on the initial activation. |

---

## Context Symbol Naming

Context symbols follow the pattern `{ComponentName}Context` for the root context and
`{ComponentName}ItemContext` for per-item context.

| Symbol | Type |
|---|---|
| `accordionRootContext` | Root-level context for accordion |
| `accordionItemContext` | Per-item context for accordion |

---

## Component Name Prefixes

All custom elements: `grund-{component-name}[-{sub-element}]`

| Element | Tag |
|---|---|
| Accordion root | `grund-accordion` |
| Accordion item | `grund-accordion-item` |
| Accordion header | `grund-accordion-header` |
| Accordion trigger | `grund-accordion-trigger` |
| Accordion panel | `grund-accordion-panel` |

---

## How to Add New Entries

1. During `/component-spec`: propose new names that don't exist yet, check for conflicts with existing names.
2. If approved: add to the relevant section above before writing any skill or spec that uses the name.
3. During `/review-system-health`: audit for stale entries (names no longer in use) and conflicts.
