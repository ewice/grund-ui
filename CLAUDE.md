# Grund UI — Claude Guidelines

Grund UI is a headless, accessible Web Component library built with Lit. "Headless" means zero visual styles — Shadow DOM is used everywhere for `<slot>` and `::part()` support, not removed.

## Architecture

Three layers, strictly separated:

1. **Utilities** (`src/utils/`) — pure functions, no Lit dependency
2. **Reactive Controllers** (`src/controllers/`, `src/components/*/controller/`) — `ReactiveController` implementations, reusable across elements
3. **Custom Elements** (`src/components/*/`) — Lit elements, compound component pattern

Parent-child communication uses **Lit Context** internally and **custom events** externally (`grund-{component}-{action}`).

### Compound Component Anatomy

Every compound component follows this folder structure. This is the template — not a suggestion:

```
component/
├── root/          → Provider element (@provide, controller, roving focus)
├── item/          → Grouping element (consumes root context, provides item context)
├── [sub-parts]/   → Leaf elements (trigger, panel, content, etc.)
├── controller/    → ReactiveController owning state + actions
├── registry/      → Ordered child tracking + sub-part attachment
├── context/       → Context interfaces + symbols
├── types.ts       → Public types, event details, snapshots
└── index.ts       → Barrel export
```

**Each layer has one job:**

- **Controller** — owns state, resolves actions, dispatches events through the host. Does not touch the DOM directly.
- **Registry** — tracks registered children in DOM order, stores sub-part attachments (trigger↔panel). Pure bookkeeping, no Lit dependency beyond types.
- **Context** — carries state down and callbacks up. Interfaces are designed per consumer role (see [Context Design](#context-design)).
- **Elements** — read context, render templates, delegate actions to context callbacks. `willUpdate` for derived state, `render` for templates, `updated` for DOM side effects.

### Shared Controllers

Reusable controllers in `src/controllers/` solve cross-cutting concerns. Use them — don't reinvent:

| Controller | Purpose | Attach to |
|---|---|---|
| `OpenStateController` | `data-state="open"` / `"closed"` on host | Any element with open/closed state |
| `AriaLinkController` | `ariaControlsElements` / `ariaLabelledByElements` | Trigger↔panel, label↔input pairs |
| `RovingFocusController` | Keyboard-driven roving tabindex | Container element (`@keydown`) |

### Pattern Extraction Policy

**Extract on second use, flag on first.** When you build the first component that needs a pattern (controlled/uncontrolled value, ordered child registry), implement it inline. When the second component needs it, extract to a shared utility or controller. Don't abstract prematurely, don't copy-paste twice.

## Component Communication Patterns

Each communication direction has **one canonical mechanism**. Don't mix paths:

| Direction | Mechanism | Example |
|---|---|---|
| Parent → child | Lit Context (`@provide` / `@consume`) | Root provides expanded state to items |
| Child → parent | Registration callbacks on consumed context | Item calls `ctx.registerItem(this)` |
| Sibling awareness | Registry (queried by controller) | Trigger↔panel linked via registry records |
| External API (out) | Custom events on root element | `grund-change`, `grund-value-change` |
| External API (in) | Public properties on root element | `value`, `disabled`, `multiple` |

**Rules:**

- **Component discovery:** Registration via context (`registerItem`/`unregisterItem`). Never use `querySelectorAll` to find child components.
- **Show/hide:** `data-state="open"` / `data-state="closed"` via `OpenStateController`. Never use the `hidden` attribute.
- **Event naming:** `grund-{action}` (e.g., `grund-change`, `grund-toggle`) with `bubbles: true, composed: false`.
- **ARIA linking:** `AriaLinkController` for `ariaControlsElements` / `ariaLabelledByElements`.
- **Keyboard navigation:** `RovingFocusController` on the container element with `getItems` callback.
- **No duplicate paths:** A registration or state mutation must happen through exactly one mechanism. If a child registers itself via a context callback, the parent must not also re-register it in `willUpdate`.

### Context Design

Context interfaces are API contracts — design them by consumer, not by convenience:

- **No redundant methods.** If `requestToggle` and `toggle` do the same thing, keep one. Every method on a context interface must earn its place.
- **Consumers should only see what they need.** A trigger doesn't need `registerPanel`. A panel doesn't need `requestToggle`. If a single context must serve multiple consumers, document which fields serve which role.
- **State flows down, actions flow up.** Context carries reactive state (expanded, disabled, orientation) downward and action callbacks (requestToggle, registerItem) upward. Don't put query methods on context that could be derived from the state already provided.
- **Keep context objects stable.** Rebuilding a context object with new method references on every `willUpdate` triggers re-renders in every consumer. Prefer stable method references (bound in constructor) over inline arrow functions rebuilt each cycle.

### Registration Lifecycle

Every compound component follows this sequence. Each step happens in **exactly one place**:

```
connectedCallback  → (framework handles, no manual work needed)
willUpdate         → register with parent context (if not registered)
                   → sync registration if value/disabled changed (unregister + re-register)
                   → derive expanded state from parent context
                   → rebuild item context for children
render             → template only, no side effects
updated            → dispatch user-facing events (e.g. grund-open-change)
disconnectedCallback → unregister from parent context
```

**Sub-part attachment** (trigger, panel) follows the same discipline: the sub-part registers itself via its consumed item context callback. The item does not re-attach sub-parts in its own `willUpdate`.

### Context Consumption

Use the `@consume` decorator as the default. Use `ContextConsumer` class only when you need the callback for a specific reason (e.g., cleanup on context switch). Document why:

```ts
// ✅ Default — @consume decorator
@consume({ context: accordionItemContext, subscribe: true })
private itemCtx?: AccordionItemContextValue;

// ✅ Exception — ContextConsumer when callback logic is needed
// ContextConsumer used here because the trigger must unregister from the
// previous item context before registering with the new one.
private itemConsumer = new ContextConsumer(this, { ... });
```

When using `ContextConsumer`, add a comment explaining why `@consume` wasn't sufficient.

## Component Design Rules

- Element prefix: `grund-`
- Each WAI-ARIA role maps to its own custom element — **do not merge compound sub-elements for brevity**
  - e.g. `<grund-accordion-header>` and `<grund-accordion-trigger>` stay separate
- Shadow DOM on every element, zero visual styles
- IDs generated with `crypto.randomUUID().slice(0, 8)` — never module-level counters
- Use `ElementInternals` for form-associated components (Switch, Checkbox, etc.)
- Context subscriptions (`@consume`) are `private` — if sibling elements or controllers need a derived value (e.g. `disabled`), expose it as a public getter rather than making the context object public

## Lit Patterns

- `willUpdate()` for derived state and context re-assignment (not `render()`)
- `updated()` for DOM side effects like `setAttribute`/`removeAttribute` — do **not** set reactive properties inside `updated()` as it triggers extra re-renders
- `@provide` requires a class property, not a getter — re-assign in `willUpdate()`
- Keep builder methods pure (no `this.x = ...` side effects inside them)
- `useDefineForClassFields: false` + `experimentalDecorators: true` in tsconfig — required for Lit decorators; Lit explicitly recommends against migrating to standard decorators yet (suboptimal compiler output)

### Lifecycle Hook Responsibilities

Each hook has a single purpose. Don't mix them:

| Hook | Does | Does NOT |
|---|---|---|
| `willUpdate()` | Derive state, sync registration, rebuild context, set `data-*` attributes | Dispatch events, read DOM layout |
| `render()` | Return templates | Mutate state, set attributes, dispatch events |
| `updated()` | Dispatch user-facing events, DOM side effects that must happen post-render | Set reactive properties (causes re-render loop) |
| `connectedCallback()` | Call `super`, one-time DOM setup if needed | Register with parent (context isn't available yet) |
| `disconnectedCallback()` | Unregister from parent, clean up event listeners | — |

### Decompose `willUpdate` by Phase

When `willUpdate` handles multiple concerns, extract named methods for each phase. The method stays as the single entry point, but each phase is readable and testable in isolation:

```ts
// ✅ Named phases — each method does one thing
public override willUpdate() {
  this.syncRegistration();
  this.syncExpandedState();
  this.syncAttributes();
}

// ❌ Interleaved concerns in a single method body
public override willUpdate() {
  const valueChanged = this.lastValue !== this.value;
  // ... 50 lines mixing registration, state, and attributes
}
```

### Minimize Manual Change Tracking

Prefer Lit's `changedProperties` over manual previous-value fields (`lastValue`, `lastDisabled`). Manual tracking is justified only when `changedProperties` doesn't cover the case (e.g., tracking changes to context values that aren't reactive properties). When you do use manual tracking, keep the bookkeeping fields together and document why `changedProperties` wasn't sufficient.

## Testing

- Vitest browser mode (Playwright, headless Chromium) — real browser, real Shadow DOM
- Use `@open-wc/testing-helpers/pure`, **not** `@open-wc/testing` (avoids Web Dev Server websocket conflict)
- Extract shared test utilities (e.g. `flush()`) to `src/test-utils/`
- Each public behaviour needs a test; test dynamic property changes, not just initial state

## Tooling

| Tool                | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `npm run build`     | `vite build && tsc --emitDeclarationOnly --declarationMap` |
| `npm run test:run`  | Vitest run (CI)                                            |
| `npm run lint`      | ESLint across `src/` and `stories/`                        |
| `npm run analyze`   | Custom Elements Manifest                                   |
| `npm run storybook` | Storybook dev server (port 6006)                           |

## Accessibility

Target: WCAG 2.1 AA, WAI-ARIA Authoring Practices. Every component needs:

- Correct `role`, `aria-*` attributes
- Full keyboard navigation (Arrow keys, Home/End, Tab, Enter/Space)
- `RovingFocusController` for roving tabindex patterns

## Developer Experience

### Dev-Mode Warnings

Use `import.meta.env.DEV` guards for developer-facing warnings that disappear in production:

```ts
if (import.meta.env.DEV && !this.accordionCtx) {
  console.warn('[grund-ui] <grund-accordion-item> rendered outside <grund-accordion>.');
}
```

Warn for: missing parent context, duplicate item values, structural misuse. Don't throw in production — degrade gracefully with `??` fallbacks, but tell developers what's wrong during development.

## Code Style

Blank lines convey **grouping**, not spacing. A blank line means "separate concern."

- **Never** between a declaration and its first use — they are one unit
- **Never** at the start or end of a block
- **One** blank line between logical phases within a method (setup → action → result)
- **One** blank line between class members
- **Two** blank lines between top-level declarations in a file
- Group imports: Node built-ins → external packages → internal (one blank line between groups)

Always use braces for `if`/`else` blocks — even single-statement bodies. Exception: bare early-return guards (`if (!x) return;`) read as a single thought and are fine on one line.

```ts
// ✅ declaration + its loop + its consumer grouped — blank line only at phase boundary
const disabledValues = new Set<string>();
this.querySelectorAll('item').forEach((item) => { … });
this.controller.setDisabledItems(disabledValues);

this.controller.updateOptions(…); // ← new phase: context rebuild
this.ctx = this._buildCtx();
```

## JSDoc

JSDoc serves two consumers: **humans** (IDE tooltips) and **machines** (CEM analyzer → Storybook autodocs). Use JSDoc syntax, not TSDoc — CEM only understands JSDoc.

**Core rules:**

- Never duplicate types — no `{Type}` in `@param`/`@returns`. TypeScript is canonical
- Don't over-document — if the name + type says it all, skip the comment. Document _why_ and _constraints_, not _what_
- First sentence = summary (shown in autocomplete, Storybook argstable). Keep under ~80 chars

**Phrasing conventions:**

- Classes: what it _is_ — `"Root accordion container."`
- Methods: imperative verb — `"Toggle the expanded state."`
- Properties: what it _controls_ — `"Controls whether multiple items can be open."`
- Booleans: `"Whether ..."` — never `"True if ..."`
- `@param name -` Description (dash convention). Omit when name + type is self-evident
- `@returns` — omit for void and obvious returns. Noun phrase, not `"Returns ..."`

**CEM tags (required on every custom element):**

- `@element grund-{name}`
- `@slot - Default content` / `@slot name - Description`
- `@fires {CustomEvent<{key: type}>} grund-{component}-{action} - Description`
- `@csspart name - Description`
- `@cssproperty --grund-{component}-{property} - Description`

**Selective use:**

- `@example` — controllers and utilities only; stories cover element usage
- `@internal` — on non-public exports (context symbols, internal helpers)
- `@deprecated` — always include migration: `@deprecated Use X instead.`
