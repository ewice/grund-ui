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

---

## Event Names

All events follow `grund-{action}` pattern, `bubbles: true`, `composed: false`.

| Event | Detail type | Meaning |
|---|---|---|
| `grund-value-change` | `{ value: string[], itemValue: string, open: boolean }` | Full expanded values snapshot |
| `grund-open-change` | `{ value: string, open: boolean }` | An item opened or closed |

---

## Part Names

CSS `::part()` names. All lowercase, hyphenated nouns.

| Part | Meaning | Components |
|---|---|---|
| `trigger` | The interactive element that activates an item | Accordion, Disclosure, Tabs |
| `panel` | The collapsible/revealable content region | Accordion, Disclosure |
| `header` | The heading wrapper element | Accordion |
| `content` | Inner content wrapper within a panel | Accordion, Dialog |
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

| Attribute | Values | Set by |
|---|---|---|
| `data-open` | boolean presence | Host element in `willUpdate` |
| `data-disabled` | boolean presence | Host element in `willUpdate` |
| `data-orientation` | `"vertical"` / `"horizontal"` | Root and sub-parts in `willUpdate` |
| `data-index` | string integer | Item element in `willUpdate` |

---

## Context Symbol Naming

Context symbols follow the pattern `{ComponentName}Context` for the root context and
`{ComponentName}ItemContext` for per-item context.

| Symbol | Type |
|---|---|

---

## Component Name Prefixes

All custom elements: `grund-{component-name}[-{sub-element}]`

| Element | Tag |
|---|---|

---

## How to Add New Entries

1. During `/component-spec`: propose new names that don't exist yet, check for conflicts with existing names.
2. If approved: add to the relevant section above before writing any skill or spec that uses the name.
3. During `/review-system-health`: audit for stale entries (names no longer in use) and conflicts.
