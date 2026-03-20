# Grund UI — Engineering Guidelines

Grund UI is a headless, accessible Web Component library built with Lit. "Headless" means zero visual styles — Shadow DOM is used for `<slot>` and `::part()` support, not removed. The reference implementation is the accordion. When in doubt, follow its structure.

---

## Architecture

Three layers, strictly separated:

1. **Utilities** (`src/utils/`) — pure functions, zero framework dependency
2. **Reactive Controllers** (`src/controllers/`, `src/components/*/controller/`) — `ReactiveController` implementations, reusable across components
3. **Custom Elements** (`src/components/*/`) — Lit elements, compound component pattern

### Compound Component Structure

```
component/
├── root/          → Provider element (@provide, controller, roving focus)
├── item/          → Grouping element — only when a repeating container is needed
├── [sub-parts]/   → Leaf elements (trigger, panel, header, etc.)
├── controller/    → ReactiveController owning all state and actions
├── registry/      → Ordered child tracking and sub-part attachment (omit if unneeded)
├── context/       → Context interfaces and context symbols
├── types.ts       → Public types, event detail types, snapshot interfaces
└── index.ts       → Barrel export
```

**Each layer has one job:**

- **Controller** — owns state, resolves actions, dispatches events through the host. No DOM access.
- **Registry** — ordered child tracking, sub-part attachment (trigger↔panel). No Lit runtime dependency — plain TypeScript class. May import concrete element types for type safety.
- **Context** — carries reactive state down, action callbacks up. Interfaces designed per consumer role.
- **Elements** — read context, render templates, delegate actions via context callbacks.

### Shared Controllers

Use these — don't reinvent:

| Controller | Purpose | Attach to |
|---|---|---|
| `OpenStateController` | `data-state="open"/"closed"` on host | Any element with open/closed state |
| `AriaLinkController` | `ariaControlsElements` / `ariaLabelledByElements` | Trigger↔panel, label↔input |
| `RovingFocusController` | Keyboard-driven roving tabindex | Container element |

### Pattern Extraction

**Extract on second use, flag on first.** Implement inline for the first component that needs a pattern. Extract to a shared utility or controller when a second component needs it. Don't abstract prematurely, don't copy-paste twice.

---

## Component Communication

One canonical mechanism per direction — don't mix paths:

| Direction | Mechanism | Example |
|---|---|---|
| Parent → child | Lit Context (`@provide` / `@consume`) | Root provides expanded state to items |
| Child → parent | Registration callbacks on context | Item calls `ctx.registerItem(this)` |
| Sibling awareness | Registry | Trigger↔panel linked via registry records |
| External API (out) | Custom events on root element | `grund-change`, `grund-open-change` |
| External API (in) | Public properties on root element | `value`, `disabled`, `multiple` |

**Rules:**

- **Discovery:** Registration via context callbacks only. Never `querySelectorAll` to find child components.
- **Show/hide:** `data-state="open"/"closed"` via `OpenStateController`. Never use `hidden` for toggle logic — exception: `hidden="until-found"` for browser-native find-in-page support.
- **Event naming:** `grund-{action}` (e.g. `grund-change`, `grund-open-change`) with `bubbles: true, composed: false`.
- **ARIA linking:** `AriaLinkController` for all cross-element ARIA relationships.
- **Keyboard navigation:** `RovingFocusController` on the container element.
- **No duplicate paths:** A registration or state mutation must happen through exactly one mechanism.

---

## Context Design

Context interfaces are API contracts. Design them by consumer role, not convenience.

- **State flows down, actions flow up.** Don't put query methods on context that can be derived from state already provided.
- **Consumers only see what they need.** A trigger doesn't need `registerPanel`. A panel doesn't need `requestToggle`. Split interfaces if roles diverge significantly.
- **No redundant methods.** Every method must earn its place.
- **Context objects must be stable.** Bind action methods once in the constructor and mutate only the state fields that change — never recreate the whole object each cycle.
- **Use `@consume` as the default.** Use `ContextConsumer` only when you need the callback — and document why.
- **Context subscriptions are always `private`.** Expose derived values via public getters if other code needs them.

---

## Controlled / Uncontrolled Values

Components that own a value (accordion, tabs, select) follow this pattern:

- **Uncontrolled:** `defaultValue` seeds initial state once. Subsequent interactions update internal state.
- **Controlled:** `value` prop drives state entirely. Internal state does not change on interaction — only events fire. The consumer is responsible for updating `value`.

The root element packages its own properties into a plain `HostSnapshot` object and hands it to the controller via `syncFromHost()` in `willUpdate`. The controller does not reach into reactive properties on the host directly — this keeps it decoupled from Lit's property system and independently testable.

---

## Data Attributes

Data attributes are part of the public API — consumers build CSS selectors and tests against them. Be consistent across all parts of a compound component.

| Attribute | Meaning | Set by |
|---|---|---|
| `data-state="open"/"closed"` | Visibility state | `OpenStateController` |
| `data-open` | Element or item is currently open | Host in `willUpdate` |
| `data-disabled` | Element or item is disabled | Host in `willUpdate` |
| `data-orientation` | Layout axis (`vertical`/`horizontal`) | Root and sub-parts in `willUpdate` |
| `data-index` | DOM position within the compound | Item in `willUpdate` |

All styling hooks use `data-*` attributes. Never use bare unprefixed attributes (e.g. `expanded`) as CSS hooks.

---

## Component Design Rules

- Element prefix: `grund-`
- Each WAI-ARIA role maps to its own custom element — do not merge compound sub-elements for brevity (e.g. `<grund-accordion-header>` and `<grund-accordion-trigger>` stay separate)
- Shadow DOM on every element, zero visual styles
- IDs generated with `crypto.randomUUID().slice(0, 8)` — never module-level counters
- Use `ElementInternals` for form-associated components (Switch, Checkbox, etc.)

---

## Accessibility

Target: WCAG 2.1 AA. Follow the [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) pattern for each component type.

Every component needs:

- Correct `role` and `aria-*` attributes per the relevant APG pattern
- `RovingFocusController` for composite widgets: Arrow keys move focus within the widget, Tab exits to the next page-level focusable element
- `AriaLinkController` for trigger↔panel and label↔input ARIA relationships
- `@csspart` on every interactive and structural shadow element for consumer styling

The keyboard contract (which keys do what) must be covered by tests and documented in the component's Storybook story.

---

## JSDoc / CEM

JSDoc serves both IDE tooltips and the Custom Elements Manifest (→ Storybook autodocs). Use JSDoc syntax, not TSDoc.

**Required on every custom element:**

```ts
/**
 * One-sentence description of what this element is.
 *
 * @element grund-{name}
 * @slot - Default slot description
 * @fires {CustomEvent<DetailType>} grund-{action} - When this fires and why
 * @csspart name - What this part wraps
 */
```

**Rules:**

- No `{Type}` annotations in `@param`/`@returns` — TypeScript is canonical
- Document _why_ and _constraints_, not _what_. Omit comments where the name and type are self-evident.
- First sentence is the IDE autocomplete summary — keep it under ~80 chars
- Booleans: "Whether ..." — never "True if ..."
- `@internal` on non-public exports (context symbols, internal helpers)
- `@deprecated` always includes a migration path: `@deprecated Use X instead.`

---

## Skills — Workflow Reference

Component development uses skills in `.claude-plugin/skills/`. Superpowers is
the entry point for all design work. Our skill suite provides the quality gate.

### New component

```
1. superpowers:design-review          → design spec  → docs/superpowers/specs/
   /apg {pattern}                     → ARIA contract (feed into Superpowers)

2. /new-component <superpowers-spec>  → API spec     → docs/specs/{name}.spec.md
                                        (pre-filled from design spec, skips Q&A)

3. /implement                         → parallel generation + 6-reviewer gate + build
```

### Modifying an existing component (Superpowers-planned)

```
1. superpowers:design-review          → design spec + plan → docs/superpowers/specs/ + plans/

2. superpowers:executing-plans        → implements plan task-by-task, tests at each step

3. /post-plan-review <plan-file>      → reads File Map, runs relevant reviewers,
                                        patches findings, validates build
```

### Modifying an existing component (ad-hoc)

```
/modify-component {name} — {description}   → scoped edit + targeted reviews + build
```

Use for small, well-understood changes that don't need Superpowers design
reasoning. When in doubt, use the Superpowers path.

### Supporting skills

```
/apg {pattern}        → fetch WAI-ARIA APG contract
/validate-build       → verify build, tests, CEM, lint all pass
/diagnose-failure     → investigate why a reviewer finding persists
```

### Review skills

Invoked by `/implement`, `/modify-component`, and `/post-plan-review`:

```
spec-compliance-reviewer   → Gate 1: spec vs. generated files
guidelines-reviewer        → CLAUDE.md compliance              ← every change
security-reviewer          → XSS, listener hygiene, CSP, Shadow DOM safety  ← every change
performance-reviewer       → render loops, memory leaks, context stability   ← every change
accessibility-reviewer     → APG pattern, ARIA, keyboard
api-surface-reviewer       → types, JSDoc, CEM diff
test-coverage-reviewer     → spec → test mapping
story-reviewer             → story variants, keyboard docs, autodoc annotations
consistency-reviewer       → cross-component patterns
```
