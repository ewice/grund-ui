# Grund UI — Claude Guidelines

Grund UI is a headless, accessible Web Component library built with Lit. "Headless" means zero visual styles — Shadow DOM is used everywhere for `<slot>` and `::part()` support, not removed.

## Architecture

Three layers, strictly separated:

1. **Utilities** (`src/utils/`) — pure functions, no Lit dependency
2. **Reactive Controllers** (`src/components/*/`) — `ReactiveController` implementations, reusable across elements
3. **Custom Elements** (`src/components/*/`) — Lit elements, compound component pattern

Parent-child communication uses **Lit Context** internally and **custom events** externally (`grund-{component}-{action}`).

## Component Communication Patterns

- **Component discovery:** Registration via context (`registerItem`/`unregisterItem`). Never use `querySelectorAll` to find child components.
- **Show/hide:** `data-state="open"` / `data-state="closed"` via `OpenStateController`. Never use the `hidden` attribute.
- **Event naming:** `grund-{action}` (e.g., `grund-change`, `grund-toggle`) with `bubbles: true, composed: false`.
- **ARIA linking:** `AriaLinkController` for `ariaControlsElements` / `ariaLabelledByElements`.
- **Keyboard navigation:** `RovingFocusController` on the container element with `getItems` callback.

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
