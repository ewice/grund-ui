# Grund UI — Engineering Guidelines

Grund UI is a headless, accessible Web Component library built with Lit. "Headless" means
zero visual styles — Shadow DOM is used for `<slot>` and `::part()` support, not removed.
The reference implementation is the accordion. When in doubt, follow its structure.

Detailed patterns and rules live in `.claude-plugin/refs/`. This file contains the
authoritative architecture and the rules that apply to every change in the codebase.

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
- **Registry** — ordered child tracking, sub-part attachment (trigger↔panel). No Lit runtime dependency.
- **Context** — carries reactive state down, action callbacks up. Interfaces designed per consumer role.
- **Elements** — read context, render templates, delegate actions via context callbacks.

### Shared Controllers

Use these — don't reinvent:

| Controller | Purpose | Attach to |
|---|---|---|
| `RovingFocusController` | Keyboard-driven roving tabindex | Container element |

Extract on second use: `data-open` toggle and ARIA ID linking are one-liners — extract to a shared controller when a second component needs the pattern.

Planned controllers (built when first component of that category is built): see `.claude-plugin/refs/component-shapes.md`.

### Pattern Extraction

**Extract on second use, flag on first.** Implement inline for the first component. Extract to a
shared utility or controller when a second component needs it. Use `/extract-pattern` skill.

---

## Component Communication

One canonical mechanism per direction:

| Direction | Mechanism | Example |
|---|---|---|
| Parent → child | Lit Context (`@provide` / `@consume`) | Root provides expanded state to items |
| Child → parent | Registration callbacks on context | Item calls `ctx.registerItem(this)` |
| Sibling awareness | Registry | Trigger↔panel linked via registry records |
| External API (out) | Custom events on root element | `grund-change`, `grund-open-change` |
| External API (in) | Public properties on root element | `value`, `disabled`, `multiple` |

**Rules:**
- Discovery: registration via context callbacks only. Never `querySelectorAll` to find child components.
- Show/hide: `data-open` boolean attribute set in `willUpdate`. Exception: `hidden="until-found"` for browser-native find-in-page.
- Event naming: `grund-{action}` with `bubbles: true, composed: false`.
- ARIA linking: derive IDs from context, bind in templates (`aria-controls`, `aria-labelledby`).
- Keyboard navigation: `RovingFocusController` on the container element.
- No duplicate paths: a registration or state mutation happens through exactly one mechanism.

---

## Context Design

- **State flows down, actions flow up.** Don't put query methods on context derivable from state.
- **Consumers only see what they need.** Split interfaces if roles diverge significantly.
- **No redundant methods.** Every method must earn its place.
- **Context objects must be stable.** Mutate fields — never recreate the whole object each cycle.
- **Use `@consume` as the default.** Use `ContextConsumer` only when you need the callback — document why.
- **Context subscriptions are always `private`.** Expose derived values via public getters.

---

## Controlled / Uncontrolled Values

- **Uncontrolled:** `defaultValue` seeds initial state once. Interactions update internal state.
- **Controlled:** `value` prop drives state entirely. Internal state does not change — only events fire.

The root element packages its properties into a `HostSnapshot` object and passes it to the
controller via `syncFromHost()` in `willUpdate`. The controller never reads reactive properties
from the host directly.

---

## Data Attributes

Data attributes are part of the public API. Be consistent across all parts of a compound component.

| Attribute | Meaning | Set by |
|---|---|---|
| `data-open` | Element or item is currently open | Host in `willUpdate` |
| `data-disabled` | Element or item is disabled | Host in `willUpdate` |
| `data-orientation` | Layout axis (`vertical`/`horizontal`) | Root and sub-parts in `willUpdate` |
| `data-index` | DOM position within the compound | Item in `willUpdate` |

All styling hooks use `data-*` attributes. Never use bare unprefixed attributes as CSS hooks.

---

## Component Design Rules

- Element prefix: `grund-`
- Each WAI-ARIA role maps to its own custom element — do not merge compound sub-elements for brevity
- Shadow DOM on every element, zero visual styles
- **IDs:** Accept optional `id` prop from consumers. Derive deterministic IDs from `value` prop where possible. Use `crypto.randomUUID().slice(0, 8)` only inside `connectedCallback` or later — never in constructors or field initializers. See `.claude-plugin/refs/ssr-contract.md` for the full strategy.
- Use `ElementInternals` for form-associated components. See `.claude-plugin/refs/form-participation.md`.
- **Dev-mode warnings:** Every compound element that can be structurally misused MUST emit a dev-mode warning. Guard with `if (import.meta.env.DEV)`. Format: `console.warn('[grund-{element}] {problem}. {fix}.')`.
- Wrap `customElements.define()` with a registration guard: `if (!customElements.get('...'))`.

---

## Accessibility

Target: WCAG 2.1 AA. Follow the [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) for each component type.

Every component needs:
- Correct `role` and `aria-*` attributes per the relevant APG pattern
- `RovingFocusController` for composite widgets
- `@csspart` on every interactive and structural shadow element
- Keyboard contract covered by tests and documented in Storybook

See `.claude-plugin/refs/focus-management.md` for focus management patterns.

---

## JSDoc / CEM

JSDoc serves IDE tooltips and the Custom Elements Manifest. Use JSDoc syntax, not TSDoc.

**Required on every custom element:**

```ts
/**
 * One-sentence description.
 *
 * @element grund-{name}
 * @slot - Default slot description
 * @fires {CustomEvent<DetailType>} grund-{action} - When and why
 * @csspart name - What this part wraps
 */
```

**Rules:**
- No `{Type}` in `@param`/`@returns` — TypeScript is canonical
- Document why and constraints, not what. Omit where self-evident.
- First sentence under ~80 chars
- Booleans: "Whether ..." — never "True if ..."
- `@internal` on non-public exports
- `@deprecated` always includes migration path

---

## Skills — Workflow Reference

Skills live in `.claude-plugin/skills/`. Reviewer agents in `.claude-plugin/reviewers/`.
Reference docs in `.claude-plugin/refs/`. Superpowers is the orchestrator.

### New component (complex)
```
superpowers:brainstorming → /component-spec → /scaffold → /build-controller
    → /build-elements → /build-stories → /validate-build
```

### New component (simple, no state)
```
/component-spec → /scaffold → /build-elements → /build-stories → /validate-build
```

### Modify existing (planned)
```
superpowers:brainstorming → superpowers:writing-plans
    → superpowers:executing-plans → /post-plan-review → /validate-build
```

### Modify existing (ad-hoc)
```
/modify-component {name} — {description}
```

### Bug fix
```
/fix-bug {component} — {description}
```

### Rebuild to new standards
```
/rebuild-component {name}
```

### Supporting skills
```
/apg {pattern}              → WAI-ARIA contract
/validate-build             → lint, build, test, CEM, exports, bundle size
/diagnose-failure           → investigate persistent reviewer findings
/extract-pattern            → promote inline pattern to shared controller
/deprecate                  → mark API deprecated with migration path
/audit-cross-component      → check if a bug/pattern affects multiple components
/update-dependency          → safe dependency version bump with migration
/prepare-release            → semver, changelog, publish
/review-system-health       → periodic skill/reviewer quality audit
```
