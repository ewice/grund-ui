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
- **Context objects must be stable.** Replacing a context object or its method references on every `willUpdate` triggers cascading re-renders across all consumers. Bind action methods once in the constructor and mutate only the state fields that change — never recreate the whole object each cycle.

```ts
// ✅ Stable — bind once in constructor, mutate fields on update
constructor(host: Host) {
  this.ctx = {
    expanded: false,
    requestToggle: this.requestToggle.bind(this), // stable reference
  };
}

syncFromHost(snapshot: HostSnapshot): void {
  this.ctx.expanded = snapshot.expanded; // mutate field, same object
}

// ❌ Unstable — new function references created on every update cycle
willUpdate() {
  this.ctx = {
    expanded: this.expanded,
    requestToggle: () => this.toggle(), // new reference every cycle
  };
}
```

### Context Consumption

Use `@consume` as the default. Use `ContextConsumer` only when you need the callback — and document why.

```ts
// ✅ Default
@consume({ context: accordionItemContext, subscribe: true })
private itemCtx?: AccordionItemContextValue;

// ✅ Exception — ContextConsumer used here because the trigger must unregister
// from the previous item context before registering with the new one.
private itemConsumer = new ContextConsumer(this, { context: accordionItemContext, ... });
```

Context subscriptions are always `private`. Expose derived values via public getters if other code needs them.

---

## Registration Lifecycle

Each step happens in exactly one place:

```
connectedCallback    → call super; minimal one-time setup only
willUpdate           → sync registration (register/unregister on value or disabled change)
                     → derive state from parent context
                     → sync host-level data-* attributes (on `this` — shadow DOM not yet available on first call)
render               → return template only; no mutations, no side effects
updated              → dispatch user-facing events; mutate shadow DOM elements
disconnectedCallback → unregister from parent context; clean up event listeners
```

Sub-part registration (trigger, panel) follows the same discipline: the sub-part registers itself via a context callback. The item never re-attaches sub-parts in its own `willUpdate`.

> **Why `willUpdate` for registration, not `connectedCallback`?** Context may already be available in `connectedCallback` if the element is appended to an existing provider tree. The reason registration is deferred to `willUpdate` is architectural: `changedProperties` is only available there, and it provides a consistent, single entry point for all derived state logic.

---

## Lit Patterns

- **`willUpdate`** — derive state, sync registration, set attributes on the host element (`this.toggleAttribute`, `this.dataset`). Shadow DOM has not yet rendered on the first call — do not access it here.
- **`render`** — return template only. No state mutations, no attribute writes, no side effects.
- **`updated`** — DOM side effects on shadow DOM elements, dispatch user-facing events. Do not set reactive properties here (causes a re-render loop).
- **`@provide` requires a class property**, not a getter. Re-assign the property in `willUpdate` to notify consumers.
- **`useDefineForClassFields: false` + `experimentalDecorators: true`** in tsconfig — required for Lit decorators. Do not migrate to standard decorators until Lit explicitly recommends it.

### Decompose `willUpdate` by Phase

When `willUpdate` handles multiple concerns, extract named methods for each phase:

```ts
// ✅ One entry point, readable phases
public override willUpdate(changedProperties: PropertyValues): void {
  this.syncRegistration(changedProperties);
  this.syncState();
  this.syncAttributes();
}
```

### Minimize Manual Change Tracking

Prefer `changedProperties` over manual previous-value fields. Manual tracking is justified only when context values (not reactive properties) change between renders — document why `changedProperties` wasn't sufficient when you use it.

---

## Controlled / Uncontrolled Values

Components that own a value (accordion, tabs, select) follow this pattern:

- **Uncontrolled:** `defaultValue` seeds initial state once. Subsequent interactions update internal state.
- **Controlled:** `value` prop drives state entirely. Internal state does not change on interaction — only events fire. The consumer is responsible for updating `value`.

The root element packages its own properties into a plain `HostSnapshot` object and hands it to the controller via `syncFromHost()` in `willUpdate`. The controller does not reach into reactive properties on the host directly — this keeps it decoupled from Lit's property system and independently testable.

```ts
// Root in willUpdate — controller stays decoupled from Lit
this.controller.syncFromHost({
  value: this.value,
  defaultValue: this.defaultValue,
  multiple: this.multiple,
  disabled: this.disabled,
});
```

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

## Testing

- Vitest browser mode (Playwright, headless Chromium) — real browser, real Shadow DOM
- Use `@open-wc/testing-helpers/pure`, **not** `@open-wc/testing` (avoids Web Dev Server websocket conflict)
- Shared test utilities live in `src/test-utils/`

**What to test for every component:**

- Every public property and attribute — initial state and dynamic changes at runtime
- Keyboard navigation (Arrow keys, Home/End, Tab, Enter/Space per the APG pattern)
- Event payloads — assert `detail` shape, not just that an event fired
- Controlled and uncontrolled mode separately
- Dynamic registration: add and remove child elements after initial render
- ARIA attribute correctness after state changes

**Mechanics:**

- `flush(el)` awaits Lit's update cycle. Call it after every state-triggering action before asserting.
- Keyboard events must use `{ bubbles: true, composed: true }` to cross Shadow DOM boundaries.
- Test context consumers by mounting a minimal `LitElement` that consumes the relevant context inside the fixture — see `TestAccordionRootState` in the accordion tests as the pattern.

Name tests as plain English sentences that read as specifications.

---

## Storybook

Every component ships with stories that serve as living documentation:

- A `Default` story showing basic usage
- A story per significant variant: `Disabled`, `Controlled`, `Multiple`, plus any component-specific features (e.g. `HiddenUntilFound`)
- Arg types are generated from CEM autodocs — keep `@property` JSDoc descriptions accurate and concise

Stories are the consumer-facing documentation. They must work with zero consumer CSS applied. Use `::part()` selectors in story styles to demonstrate available styling hooks.

---

## Dev-Mode Warnings

Use `import.meta.env.DEV` guards for developer-facing warnings that vanish in production:

```ts
if (import.meta.env.DEV && !this.accordionCtx) {
  console.warn('[grund-ui] <grund-accordion-item> must be a descendant of <grund-accordion>.');
}
```

Warn for: missing required parent context, duplicate item values, structural misuse. Never throw in production — degrade gracefully with `??` fallbacks.

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

## Code Style

Blank lines convey grouping, not spacing:

- Never at the start or end of a block
- Never between a declaration and its first use
- One blank line between logical phases within a method
- One blank line between class members
- Two blank lines between top-level declarations in a file
- Imports: external packages → internal (one blank line between groups)

Always use braces for `if`/`else`. Exception: single-line early-return guards (`if (!x) return;`).

---

## Tooling

| Command | Purpose |
|---|---|
| `npm run build` | `vite build && tsc --emitDeclarationOnly --declarationMap` |
| `npm run test:run` | Vitest (CI) |
| `npm run lint` | ESLint across `src/` and `stories/` |
| `npm run analyze` | Custom Elements Manifest |
| `npm run storybook` | Storybook dev server (port 6006) |
