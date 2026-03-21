# Skill & Workflow Redesign — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the reference infrastructure (directory structure, 10 reference docs, vocabulary registry, restructured CLAUDE.md) that all skills and reviewers in Plans 2–4 depend on.

**Architecture:** Two new directories added to `.claude-plugin/` — `reviewers/` for programmatic agent prompts (built in Plan 2), `refs/` for reference documents loaded by skills at runtime. Reference documents encode engineering rules as numbered, testable statements with concrete TypeScript examples. CLAUDE.md is restructured: content now covered by reference docs moves out, changed rules are updated (ID strategy, dev-mode warnings), workflow reference points to the new pipeline.

**Tech Stack:** Markdown, YAML, TypeScript code examples (illustrative — not compiled)

**Spec:** `docs/superpowers/specs/2026-03-20-skill-workflow-redesign-design.md`

---

## File Map

**Create:**
- `.claude-plugin/reviewers/.gitkeep`
- `.claude-plugin/refs/lit-patterns.md`
- `.claude-plugin/refs/headless-contract.md`
- `.claude-plugin/refs/ssr-contract.md`
- `.claude-plugin/refs/component-shapes.md`
- `.claude-plugin/refs/test-patterns.md`
- `.claude-plugin/refs/consumer-dx.md`
- `.claude-plugin/refs/form-participation.md`
- `.claude-plugin/refs/transition-contract.md`
- `.claude-plugin/refs/focus-management.md`
- `.claude-plugin/refs/positioning-strategy.md`
- `docs/vocabulary.md`

**Modify:**
- `CLAUDE.md`

---

### Task 1: Create Directory Structure

**Files:**
- Create: `.claude-plugin/reviewers/.gitkeep`

- [ ] **Step 1: Create the reviewers directory**

```bash
mkdir -p .claude-plugin/reviewers
touch .claude-plugin/reviewers/.gitkeep
```

- [ ] **Step 2: Verify**

```bash
ls .claude-plugin/
```
Expected output includes: `reviewers/  skills/`

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/reviewers/.gitkeep
git commit -m "chore(skills): scaffold reviewers/ directory for programmatic agent prompts"
```

---

### Task 2: Write `refs/lit-patterns.md`

The most critical reference doc — loaded by generation skills and the `lit-reviewer`. Every rule must be numbered, unambiguous, and directly checkable by a reviewer agent.

**Files:**
- Create: `.claude-plugin/refs/lit-patterns.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/lit-patterns.md` with the following complete content:

```markdown
# Lit Patterns

Reference for generation skills and the `lit-reviewer`. All rules are numbered and testable.

---

## Rules

### Lifecycle

1. Use `willUpdate(changedProperties)` for deriving state from properties. Never derive state in `updated()`.
2. Use `updated(changedProperties)` only for post-render side effects (e.g., restoring focus, measuring DOM). Never dispatch `grund-*` events here — dispatch from the controller action method that causes the state change.
3. Use `firstUpdated()` only for one-time DOM setup (e.g., a controller that needs a DOM reference). Never use it for logic that must run on every update.
4. Never call `this.requestUpdate()` inside `updated()`. This creates an infinite render loop.
5. The root element packages its reactive properties into a `HostSnapshot` plain object in `willUpdate` and passes it to the controller via `syncFromHost()`. The controller never reads reactive properties directly from the host — this decouples it from Lit and keeps it independently testable.

### Reactive Properties

6. Use `@property()` for public API (accessible as HTML attributes and JS properties). Use `@state()` for internal state never exposed to consumers.
7. Always define `hasChanged` for properties holding objects, arrays, or Sets. The Lit default (`!==`) works for primitives. Override for deep equality only when necessary.
8. Boolean properties: `@property({ type: Boolean })`. Reflect to attribute (`reflect: true`) only if consumers need CSS selector targeting (e.g., `[disabled]`). Reflected boolean attributes use HTML convention: presence = true, absence = false.
9. Never reflect object or array properties to attributes. Reflecting objects produces `[object Object]` in HTML.
10. Properties with `reflect: true` must have stable, serialisable values. Never reflect Sets, Maps, or class instances.

### Shadow DOM

11. Every compound component layer containing elements with `part` attributes MUST declare `exportparts` on its host element, forwarding all contained parts upward. This enables consumers to style `grund-accordion::part(trigger)` from outside the outermost element.
12. Use `slotchange` events on `<slot>` elements when a component must react to slotted content changing. The event fires asynchronously and may fire multiple times during initial render — guard with a flag or debounce if needed.
13. Use `delegatesFocus: true` on the shadow root only for form controls that wrap a native focusable element (e.g., a custom input wrapping `<input>`). Do not use it on composite widgets — they manage focus via `RovingFocusController`.

### Context

14. Use `@consume()` decorator by default for consuming context. Use the `ContextConsumer` class directly only when you need the subscription `subscribe` callback (e.g., to detect provider changes and re-register). Always document why.
15. Context objects provided via `@provide()` MUST be stable references. Mutate fields on the existing object in `willUpdate`; never recreate the whole object. Recreating the object triggers a re-render in every consumer.
16. Context subscriptions are always `private`. Expose derived values via public getters if other code needs them.
17. Context key symbols must be unique per component family. Define in the component's `context/` directory. Never reuse between unrelated component families.

### Dev-Mode Warnings

18. Gate dev-mode warnings with `if (import.meta.env.DEV)`. Vite tree-shakes this block in production builds — zero runtime cost in production.
19. Every compound element that can be structurally misused MUST warn when used outside its required parent context.
20. Warning format: `console.warn('[grund-{element}] {what is wrong}. {how to fix it}.')`.

```ts
// ✅ Correct
if (import.meta.env.DEV) {
  if (!this.itemCtx) {
    console.warn(
      '[grund-accordion-trigger] Must be used inside <grund-accordion-item>. ' +
      'Wrap this element in <grund-accordion-item value="...">.'
    );
  }
}
```

### File Organization

21. Class member ordering within a Lit element:
    1. Static properties / `static formAssociated`
    2. `@property()` / `@state()` decorated fields
    3. Private fields and controllers
    4. Constructor
    5. `connectedCallback` / `disconnectedCallback`
    6. Lifecycle methods (`willUpdate`, `updated`, `firstUpdated`)
    7. Public methods
    8. Private methods
    9. `render()`

22. Extract a `_renderX()` helper from `render()` when the template exceeds ~30 lines or contains a distinct logical section (e.g., the open vs closed state branches).
23. Import organization: (a) framework imports (`lit`, `@lit/context`), (b) internal imports (`../../controllers/...`), (c) type-only imports (`import type ...`). Blank line between groups.

### Define Timing and Upgrade Ordering

24. Components MUST work regardless of the order custom elements are defined. Never assume a parent element is already upgraded in `connectedCallback` — use context subscription to detect when the provider becomes available.
25. Wrap `customElements.define()` with a registration guard to prevent duplicate-definition errors (e.g., when two versions of the library are loaded):

```ts
if (!customElements.get('grund-accordion')) {
  customElements.define('grund-accordion', GrundAccordion);
}
```

### Memory Management

26. Every `addEventListener` added in `connectedCallback` or `hostConnected` MUST have a corresponding `removeEventListener` in `disconnectedCallback` or `hostDisconnected`. No exceptions.
27. Every `ResizeObserver`, `MutationObserver`, or `IntersectionObserver` created in a controller MUST call `.disconnect()` in `hostDisconnected`.
28. Registries that store references to child elements SHOULD use `WeakRef<T>` to prevent memory leaks when elements are removed from the DOM without explicit unregistration.

### Error Boundaries

29. Controller methods that process user-provided data or call external APIs MUST wrap risky operations in try/catch. On error: emit a dev-mode warning and either recover to a safe state or do nothing (fail silently in production).

### State Machines (Complex Lifecycle Only)

30. Use explicit state machines only for components with multi-step lifecycle where impossible states cause real bugs (Dialog, Sheet, multi-step wizard). Simple and composite widgets use pure resolver functions (see accordion's `resolveAccordionAction` as the canonical pattern).
31. Explicit state machine pattern when needed:

```ts
type DialogState = 'closed' | 'opening' | 'open' | 'closing';

const transitions: Record<DialogState, DialogState[]> = {
  closed: ['opening'],
  opening: ['open', 'closed'],
  open: ['closing'],
  closing: ['closed'],
};

transition(from: DialogState, to: DialogState): DialogState {
  if (!transitions[from].includes(to)) {
    if (import.meta.env.DEV) {
      console.warn(`[DialogController] Invalid transition: ${from} → ${to}`);
    }
    return from;
  }
  return to;
}
```

---

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| Dispatching events in `updated()` | Fires after render — can cause cascading re-renders in consumers | Dispatch from the controller action method |
| `requestUpdate()` inside `updated()` | Infinite render loop | Compute in `willUpdate`, not `updated` |
| Recreating context object in `willUpdate` | Re-renders all consumers every cycle | Mutate fields on the existing object |
| Reading host reactive props in controller | Tight coupling, not independently testable | Use `HostSnapshot` pattern via `syncFromHost()` |
| `customElements.define()` without guard | Throws on duplicate definition (micro-frontends) | Wrap with `if (!customElements.get(...))` |
| `addEventListener` without cleanup | Memory leak, stale handler on reconnect | Symmetric cleanup in `disconnectedCallback` |
| `display: contents` on element with ARIA role | Strips element box, breaks accessibility tree | Use `display: block` or `display: inline` |
```

- [ ] **Step 2: Review**

Verify every rule in the spec section `refs/lit-patterns.md` is present. Confirm:
- All 31 rules are numbered
- Code examples compile conceptually (correct Lit API usage)
- No contradictions with `CLAUDE.md`
- Anti-patterns table is complete

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/lit-patterns.md
git commit -m "docs(refs): add lit-patterns reference document (31 rules)"
```

---

### Task 3: Write `refs/headless-contract.md`

Defines the zero-style contract and the public API surface that headless components expose to consumers via parts, slots, and data attributes.

**Files:**
- Create: `.claude-plugin/refs/headless-contract.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/headless-contract.md`:

```markdown
# Headless Contract

Rules for zero-style enforcement, `::part()` API, slot design, and `data-*` attributes.
Loaded by generation skills and the `headless-reviewer`.

---

## Rules

### Zero Styles

1. The Shadow DOM stylesheet for every element MUST be either: (a) completely empty, OR (b) contain only a `:host { display: ... }` rule with a comment justifying the choice.
2. Never add `color`, `font`, `background`, `border`, `padding`, `margin`, `width`, `height`, `opacity`, `transform`, or any visual property to any Shadow DOM stylesheet.
3. Never add `transition` or `animation` CSS to Shadow DOM stylesheets. Transitions belong to consumers, not components.

### `:host` Display Strategy

4. Use `:host { display: block }` for elements that wrap block-level content (panels, containers, root elements).
5. Use `:host { display: inline }` for elements that wrap inline content.
6. NEVER use `display: contents` on an element that has or provides a semantic ARIA role. `display: contents` removes the element's layout box and can cause browsers to strip it from the accessibility tree.
7. Every `:host { display: ... }` rule MUST include a brief comment: `/* block: this element is a block-level container */`.

### `::part()` API

8. Every interactive element and every structural container in the Shadow DOM MUST have a `part` attribute.
9. Part names: lowercase, hyphenated nouns only. Examples: `trigger`, `panel-content`, `close-button`. No verbs (`activate`), no state adjectives (`open-panel`).
10. Part granularity targets: (a) the outermost shadow element, (b) any element that receives interactive states (`:hover`, `:focus`, `[disabled]`), (c) any element that carries decorative or slottable content. Not every internal `<div>` needs a part.
11. Every part name MUST be registered in `docs/vocabulary.md` before use.
12. Part names MUST be documented with `@csspart` JSDoc tag on the element class.

### `exportparts` Contract

13. Every compound component layer that wraps another shadow root containing `part` attributes MUST declare `exportparts` on the host, forwarding all contained parts upward.
14. Verify: the selector `grund-{component}::part({part-name})` MUST resolve from outside the outermost compound element without any intermediate CSS.
15. `exportparts` value format: comma-separated list of part names. If renaming, use `inner-name: outer-name` syntax. Prefer no renaming — use the same part name throughout the tree.

### Slot Design

16. The primary content slot is always unnamed (default slot): `<slot></slot>`.
17. Named slots (`<slot name="icon">`) are for distinct, optional content regions only. Use sparingly.
18. Provide meaningful fallback content inside named slots where a sensible default exists.
19. Every slot MUST be documented with `@slot` JSDoc tag. Include expected content type even though it is not enforced at runtime.
20. Never use slots to pass structured data. Slots are for rendered content only. Use properties for data.

### `data-*` Attribute API

21. All state-based styling hooks use `data-*` attributes. Never use bare unprefixed attributes (e.g., `expanded`, `selected`, `active`) as CSS hooks.
22. `data-*` attributes are set in `willUpdate`, not in response to DOM events or method calls directly.
23. Every `data-*` attribute exposed as public API MUST be registered in `docs/vocabulary.md`.
24. Standard attributes used across all components (set by their respective controllers/elements):

| Attribute | Values | Set by |
|---|---|---|
| `data-state` | `"open"` / `"closed"` | `OpenStateController` |
| `data-open` | boolean presence | Host in `willUpdate` |
| `data-disabled` | boolean presence | Host in `willUpdate` |
| `data-orientation` | `"vertical"` / `"horizontal"` | Root and sub-parts in `willUpdate` |
| `data-index` | string number | Item element in `willUpdate` |

### CSS Custom Properties

25. CSS custom properties exposed by components are limited to structural and timing concerns (z-index, transition duration, gap). Never expose color, typography, or visual properties — consumers own those.
26. Every CSS custom property MUST be documented with `@cssproperty` JSDoc tag and included in the Custom Elements Manifest via `custom-elements-manifest.config.mjs`.
27. CSS custom property naming: `--grund-{component}-{property}`. Example: `--grund-accordion-panel-transition-duration`.

### Forced Colors Mode

28. Every interactive state (focused, hovered, selected, expanded, disabled, checked) MUST be communicated through something other than color alone: border, outline, text decoration, or an icon/symbol.
29. Parts MUST be stylable under `@media (forced-colors: active)`. Test: apply forced colors simulation in browser devtools and verify all interactive states remain visually distinguishable.

---

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| CSS in Shadow DOM stylesheet beyond `:host { display }` | Couples visual concerns to component | Move all styles to consumer |
| `display: contents` on semantic element | Strips accessibility tree | Use `display: block` |
| Part name as verb or state adjective | Unstable, semantically wrong | Noun-only part names |
| Missing `exportparts` on compound layer | Consumer can't style nested parts | Declare `exportparts` on every layer |
| Bare `expanded` attribute as CSS hook | Inconsistent, not part of public API | Use `data-open` or `data-state` |
| CSS custom property for color | Headless contract violation | Consumers provide all colors |
```

- [ ] **Step 2: Review**

Verify: 29 rules present and numbered, `:host` decision tree covers all shapes, exportparts rules are actionable, vocabulary registration rule (11) is present.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/headless-contract.md
git commit -m "docs(refs): add headless-contract reference document (29 rules)"
```

---

### Task 4: Write `refs/ssr-contract.md`

Defines SSR safety rules including the new ID strategy that replaces `crypto.randomUUID()`.

**Files:**
- Create: `.claude-plugin/refs/ssr-contract.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/ssr-contract.md`:

```markdown
# SSR Contract

Rules for server-side rendering safety, deterministic IDs, and hydration correctness.
Loaded by generation skills and the `lit-reviewer`.

---

## Rules

1. Never access `document`, `window`, `navigator`, `location`, or `screen` in constructors, class field initializers, or static fields. These globals only exist in browser context and throw during SSR. Move all DOM access to `connectedCallback` or later lifecycle methods.

2. **ID generation strategy** (replaces `crypto.randomUUID()` from previous guidelines):
   - Accept an optional `id` property from consumers: `@property() id?: string`.
   - If `id` is provided, use it as-is.
   - If not provided and a deterministic ID can be derived (e.g., from a `value` prop), derive it: `this._id = \`grund-\${this.tagName.toLowerCase()}-\${this.value}\``.
   - Fall back to `crypto.randomUUID().slice(0, 8)` **only** in client-only code paths (i.e., inside `connectedCallback` or `firstUpdated`, never in constructors or field initializers).
   - Rationale: `crypto.randomUUID()` generates a different value each render during SSR, causing hydration mismatches where the server-generated ID differs from the client-generated ID.

3. Never call `attachShadow()` directly. Use Lit's default shadow root creation (via `createRenderRoot()`). Manual `attachShadow()` calls prevent Declarative Shadow DOM (DSD) output during SSR.

4. The `render()` method MUST produce identical output on the server and on the client's first render. Never branch `render()` on `typeof window !== 'undefined'`, `this.isConnected`, or any client-only condition that would differ between SSR and hydration.

5. Computed properties used inside `render()` MUST be derivable without DOM access. If a property requires querying the DOM (e.g., element dimensions), do not use it in `render()` — update it in `updated()` and trigger a re-render.

6. For `@lit-labs/ssr` compatibility: test that the component's initial `render()` output is valid HTML that can be serialised to a string without errors. See the SSR smoke test pattern in `refs/test-patterns.md`.

---

## ID Strategy — Full Example

```ts
// ✅ SSR-safe ID strategy
class GrundAccordionItem extends LitElement {
  @property() value: string = '';

  // Derived deterministically from value — stable across SSR and hydration
  private get _panelId() {
    return `grund-accordion-panel-${this.value}`;
  }

  private get _triggerId() {
    return `grund-accordion-trigger-${this.value}`;
  }
}

// ❌ NOT SSR-safe — generates new ID each render, causes hydration mismatch
class GrundAccordionItem extends LitElement {
  // Runs during class instantiation — will differ between server and client
  private _id = crypto.randomUUID().slice(0, 8);
}
```

---

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| `document.querySelector(...)` in constructor | Throws during SSR | Move to `connectedCallback` |
| `crypto.randomUUID()` as class field initializer | Differs between SSR and client | Use deterministic ID from `value` prop |
| `typeof window !== 'undefined'` in `render()` | Different output on server vs client | Keep render pure, move side effects to lifecycle |
| `attachShadow()` manual call | Prevents DSD generation | Use Lit default shadow root |
```

- [ ] **Step 2: Review**

Verify: Rule 2 (ID strategy) matches spec decision D6, deterministic ID example uses `value` prop, no contradictions with `CLAUDE.md`.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/ssr-contract.md
git commit -m "docs(refs): add ssr-contract reference document (6 rules + ID strategy)"
```

---

### Task 5: Write `refs/component-shapes.md`

Guides generation skills in adapting to component category. Each category lists required controllers, context layers, and structural patterns.

**Files:**
- Create: `.claude-plugin/refs/component-shapes.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/component-shapes.md`:

```markdown
# Component Shapes

Per-category guidance for generation skills. Read this before building any component.
Identifies required controllers, context structure, focus management strategy,
and planned shared controllers (built when the first component of that category is built).

---

## How to Identify the Category

| Indicator | Category |
|---|---|
| Has repeating items that expand/collapse, are selected, or are navigated | Composite widget |
| Submits a value to a `<form>` | Form control |
| Appears above other content, triggered by user action | Overlay |
| Renders a list of options, supports filtering or typeahead | Collection |
| Appears temporarily to communicate status, auto-dismisses | Feedback |
| No interaction, no state | Simple |

---

## Composite Widget

**Examples:** Accordion, Tabs, Toolbar, RadioGroup, TreeView

**Required structure:**
- `root/` — provider element, `@provide` context, `RovingFocusController`
- `item/` — repeating container, consumes root context, provides item context
- `[sub-parts]/` — trigger, panel, etc.
- `controller/` — owns state, pure resolver functions
- `registry/` — ordered child tracking
- `context/` — root context interface + item context interface

**Focus management:** `RovingFocusController` on root. Arrow keys move focus within widget. Tab exits to next page-level focusable.

**Required shared controllers:** `OpenStateController`, `AriaLinkController`, `RovingFocusController` (all exist in `src/controllers/`).

**Context pattern:**
- Root provides: expanded state, actions (requestToggle, requestOpen), registration callbacks
- Item provides: item-level state (value, index, disabled, expanded), sub-part registration callbacks
- Leaf elements consume item context only

---

## Form Control

**Examples:** Switch, Checkbox, Radio, Select, Input, Textarea, Slider

**Required structure:**
- Root element with `static formAssociated = true`
- `FormController` wrapping `ElementInternals` (build when first form control is built)

**Required `FormController` capabilities** (to implement when building the first form control):
- `attachInternals()` → `ElementInternals` instance
- `setFormValue(value)` — call in `willUpdate` when controlled value changes
- `setValidity(flags, message, anchor?)` — validation constraint API
- `formResetCallback()` — restore to `defaultValue`
- `formStateRestoreCallback(state, reason)` — browser autofill / back-forward cache
- `formDisabledCallback(disabled)` — propagate `<fieldset disabled>` to component

**Focus management:** `delegatesFocus: true` on shadow root when wrapping a native focusable element.

**Label association:** Use `ElementInternals` — consumers use `<label for="id">` pointing to the component's `id` attribute.

---

## Overlay

**Examples:** Dialog, Popover, Tooltip, Dropdown, Combobox dropdown, Sheet

**Required structure:**
- Trigger element (button, input, etc.)
- Content element (the floating/overlay layer)
- Controller owning open/closed state and positioning

**Required planned controllers** (build each when first overlay component needs it):
- `PresenceController` — delays DOM removal until `transitionend`/`animationend` fires (see `refs/transition-contract.md`)
- `FocusTrapController` — traps focus within modal overlays (Dialog, Sheet)
- `FocusRestorationController` — returns focus to trigger on close (Popover, Dropdown)
- `OutsideClickController` — detects pointer events outside the overlay
- `ScrollLockController` — prevents `<body>` scroll when modal overlay is open
- `PositioningController` — Floating UI wrapper for anchor-relative positioning (see `refs/positioning-strategy.md`)

**Focus management:** Modal overlays trap focus (`FocusTrapController`). Non-modal overlays restore focus to trigger on close (`FocusRestorationController`). See `refs/focus-management.md`.

**State machine:** Use explicit state machine pattern (from `refs/lit-patterns.md` Rule 30–31) for `opening → open → closing → closed` lifecycle.

---

## Collection

**Examples:** Select, Combobox, Listbox, Menu, Autocomplete

**Required structure:**
- Container (listbox/menu role)
- Option/item elements
- Optional text input for filtering/typeahead

**Required planned controllers** (build when first collection component needs it):
- `VirtualFocusController` — `aria-activedescendant` pattern for keyboard navigation without moving actual DOM focus (required when a text `<input>` must retain focus while options are "focused")

**Focus management:** Virtual focus (`aria-activedescendant`) when input retains focus. Physical roving tabindex for menus/listboxes without a text input.

**Additional concerns:**
- Typeahead: match typed characters against option text content
- Virtual scroll: for large option lists (100+ options), render only visible items
- Multi-select: track selected set, emit full set on `grund-change`

---

## Feedback

**Examples:** Toast, Alert, Banner, Notification

**Required structure:**
- Container managing lifecycle (queue, stacking)
- Individual notification element

**Required planned controllers** (build when first feedback component needs it):
- `LiveRegionController` — wraps `aria-live` region management to prevent competing live regions across component instances

**ARIA:** Use `role="alert"` (assertive) for errors, `role="status"` (polite) for informational. Never create multiple competing `aria-live` regions — share a single `LiveRegionController` instance.

**Lifecycle:** Auto-dismiss timers. Pause on hover/focus. Queue management for multiple concurrent toasts.

---

## Simple

**Examples:** Separator, VisuallyHidden, AspectRatio, ScrollArea (thin wrapper)

**Required structure:**
- Single element
- No controller, no registry, no item sub-parts
- Minimal spec: element name, ARIA role, parts, slots

**Pipeline:** Use Pipeline 2 (Simple) — no Superpowers brainstorming, no plan document.

---

## Planned Controllers Registry

Track build status here as the library grows:

| Controller | Status | First built for |
|---|---|---|
| `OpenStateController` | ✅ Exists | Accordion |
| `AriaLinkController` | ✅ Exists | Accordion |
| `RovingFocusController` | ✅ Exists | Accordion |
| `PresenceController` | 🔲 Planned | First overlay component |
| `FocusTrapController` | 🔲 Planned | Dialog |
| `FocusRestorationController` | 🔲 Planned | First non-modal overlay |
| `VirtualFocusController` | 🔲 Planned | Combobox |
| `LiveRegionController` | 🔲 Planned | First feedback component |
| `PositioningController` | 🔲 Planned | First positioned overlay |
| `FormController` | 🔲 Planned | First form control |
| `OutsideClickController` | 🔲 Planned | First dismissable overlay |
| `ScrollLockController` | 🔲 Planned | Dialog |
```

- [ ] **Step 2: Review**

Verify: all 6 categories present, each has focus management strategy, all planned controllers listed in registry, composite widget matches accordion's structure.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/component-shapes.md
git commit -m "docs(refs): add component-shapes reference document (6 categories + controller registry)"
```

---

### Task 6: Write `refs/test-patterns.md`

Defines shared test utilities API and recipes for all test types. Loaded by generation skills.

**Files:**
- Create: `.claude-plugin/refs/test-patterns.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/test-patterns.md`:

```markdown
# Test Patterns

Shared test utilities and recipes. Loaded by `/build-elements` and `/build-stories`.
All test files use Vitest + `@open-wc/testing-helpers` + Playwright browser mode.

---

## Shared Test Utilities

These utilities live in `src/test-utils/index.ts`. Add new utilities here as patterns emerge.

### `flush(el)`

Settles async context propagation. Context updates require multiple Lit render cycles.
Call after any state change that should propagate through `@provide`/`@consume`.

```ts
import { flush } from '../../test-utils/index.js';

await flush(el); // settles 3 render passes + microtask
```

### `simulateKeyboard(el, key, options?)`

**Add to `src/test-utils/index.ts` when first needed.** Dispatches a `KeyboardEvent` on `el` with correct `key`, `code`, and `bubbles: true`.

```ts
import { simulateKeyboard } from '../../test-utils/index.js';

simulateKeyboard(trigger, 'ArrowDown');
simulateKeyboard(trigger, 'Enter', { shiftKey: true });
```

### `getByPart(el, partName)`

**Add to `src/test-utils/index.ts` when first needed.** Queries the shadow root of `el` for an element with a matching `part` attribute.

```ts
const btn = getByPart(trigger, 'trigger'); // → HTMLButtonElement
```

### `expectAriaRelationship(source, target, type)`

**Add to `src/test-utils/index.ts` when first needed.** Asserts that `source` has the correct ARIA attribute linking it to `target`.

```ts
expectAriaRelationship(trigger, panel, 'controls');
// asserts: trigger.getAttribute('aria-controls') === panel.id
```

### `expectDataState(el, state)`

**Add to `src/test-utils/index.ts` when first needed.** Asserts `data-state` attribute value.

```ts
expectDataState(panel, 'open');
expectDataState(panel, 'closed');
```

---

## Recipes

### Standard Test File Structure

```ts
import { fixture, html, expect } from '@open-wc/testing';
import { flush } from '../../test-utils/index.js';

describe('GrundAccordion', () => {
  describe('initial state', () => {
    it('renders all items collapsed by default', async () => {
      const el = await fixture(html`
        <grund-accordion>
          <grund-accordion-item value="a">...</grund-accordion-item>
        </grund-accordion>
      `);
      await flush(el);
      // assertions
    });
  });
});
```

### Cross-Browser Configuration

In `vitest.config.ts`, the `components` project uses Playwright. To run cross-browser:

```bash
# Default (Chromium only)
npm run test:run

# Cross-browser (Chromium + Firefox + WebKit)
npm run test:run -- --project=components-firefox --project=components-webkit
```

Add `firefox` and `webkit` browser projects to `vitest.config.ts` when cross-browser testing is required.

### RTL Test Recipe

```ts
it('reverses arrow key navigation in RTL', async () => {
  const el = await fixture(html`
    <div dir="rtl">
      <grund-toolbar>...</grund-toolbar>
    </div>
  `);
  await flush(el);
  const firstButton = getByPart(el.querySelector('grund-toolbar'), 'button');
  firstButton.focus();
  simulateKeyboard(firstButton, 'ArrowLeft'); // In RTL, ArrowLeft = next item
  await flush(el);
  // assert next item is focused
});
```

### Define-Order Test

Verifies components work regardless of custom element registration order.

```ts
it('works when child elements are defined before parent', async () => {
  // Re-define in reverse order in a separate test file or describe block
  // Note: customElements.define() cannot be undone in the same test runner —
  // test this in a separate browser context (separate Playwright page).
});
```

### Mount/Unmount Memory Test

```ts
it('cleans up event listeners on disconnect', async () => {
  const el = await fixture(html`<grund-accordion>...</grund-accordion>`);
  await flush(el);

  const addSpy = vi.spyOn(EventTarget.prototype, 'addEventListener');
  const removeSpy = vi.spyOn(EventTarget.prototype, 'removeEventListener');

  el.remove(); // triggers disconnectedCallback

  // Verify every add has a corresponding remove
  // Count by event type to verify symmetry
});
```

### axe-core Recipe

```ts
import { fixture, html, expect } from '@open-wc/testing';
// @axe-core/playwright is run via vitest browser mode
// Use the Storybook a11y addon for component-level axe runs during development.
// For CI: add an axe check to /validate-build step.
```

### Event Ordering Verification

```ts
it('fires grund-change before grund-value-change', async () => {
  const el = await fixture(html`<grund-accordion>...</grund-accordion>`);
  await flush(el);

  const events: string[] = [];
  el.addEventListener('grund-change', () => events.push('grund-change'));
  el.addEventListener('grund-value-change', () => events.push('grund-value-change'));

  getTriggerButton(el, 0).click();
  await flush(el);

  expect(events).toEqual(['grund-change', 'grund-value-change']);
});
```

### Reparenting Stress Test

```ts
it('resubscribes to context after reparenting', async () => {
  const parent1 = await fixture(html`
    <grund-accordion>
      <grund-accordion-item value="a"><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-item>
    </grund-accordion>
  `);
  const parent2 = await fixture(html`<grund-accordion></grund-accordion>`);
  await flush(parent1);

  const item = parent1.querySelector('grund-accordion-item')!;
  parent2.appendChild(item); // reparent
  await flush(parent2);

  // item should now be registered with parent2's context
});
```

### Storybook `play` Function Pattern

```ts
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstTrigger = canvas.getByRole('button', { name: /first item/i });
    await userEvent.click(firstTrigger);
    await userEvent.keyboard('{ArrowDown}');
    // assert second trigger is focused
  },
};
```
```

- [ ] **Step 2: Review**

Verify: `flush` utility is documented, all recipe types from spec are present, cross-browser config included, RTL recipe present.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/test-patterns.md
git commit -m "docs(refs): add test-patterns reference document"
```

---

### Task 7: Write `refs/consumer-dx.md`

**Files:**
- Create: `.claude-plugin/refs/consumer-dx.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/consumer-dx.md`:

```markdown
# Consumer Developer Experience

Rules for error messages, API ergonomics, property naming, and framework integration.
Loaded by `/build-elements` and the `api-reviewer`.

---

## Rules

### Dev-Mode Error Messages

1. Every structural misuse pattern MUST have a dev-mode warning. Minimum required warnings per compound element:
   - Used outside required parent context (e.g., `grund-accordion-trigger` outside `grund-accordion-item`)
   - Required property not set (e.g., `value` on `grund-accordion-item` when `multiple=true`)
   - Duplicate values detected in sibling items

2. Warning format: `console.warn('[grund-{element}] {problem description}. {how to fix it}.')`.
   - Always include the element name in brackets at the start.
   - Always end with a concrete fix instruction.
   - Never include internal state dumps or stack traces.

3. Deprecation warnings: `console.warn('[grund-{element}] {prop/event} is deprecated. Use {alternative} instead. Will be removed in v{N}.')`.

### Progressive Disclosure

4. A consumer MUST be able to use the simplest case of any component with zero configuration beyond slotted content. All properties must have sensible defaults.

5. Document the "just works" path first in Storybook and JSDoc. Advanced properties (SSR IDs, keepMounted, hiddenUntilFound, loopFocus) are secondary.

6. Default values encode opinions: `multiple: false` (single-open by default), `disabled: false`, `orientation: 'vertical'` for vertically-stacked widgets.

### Property Naming

7. Boolean properties that are adjectives use the adjective directly: `disabled`, `multiple`, `required`, `checked`, `expanded`. Do NOT prefix with `is`/`has`/`should` unless the bare adjective is ambiguous.

8. Value properties: `value` (current controlled value), `defaultValue` (uncontrolled seed).

9. Orientation: always `orientation: 'vertical' | 'horizontal'`.

10. Content reveal strategy: `keepMounted` (keep DOM alive when closed), `hiddenUntilFound` (use browser find-in-page).

### Event Detail Design

11. Every `grund-*` event MUST have a typed `CustomEvent<T>` detail interface exported from `types.ts`.

12. Event detail includes enough context for a consumer to act without querying the component:
    - `grund-change`: `{ value: string, expanded: boolean }` — which item changed and its new state
    - `grund-value-change`: `{ value: string[], itemValue: string, open: boolean }` — full picture

13. Cancelable events: document which events are `cancelable: true`. The controller MUST check `event.defaultPrevented` before proceeding. Expose this in JSDoc: `@fires {CustomEvent<T>} grund-{action} - Cancelable. Call event.preventDefault() to stop X.`.

### Render Delegation (Composition)

14. The Web Component composition mechanism is `<slot>`. When a consumer needs the trigger to render as a different element (e.g., `<a>` instead of `<button>`), they slot their element and the component applies ARIA and keyboard behaviour via `AriaLinkController` and `RovingFocusController`.

15. Document the composition pattern per component in the Storybook `AsLink` or `CustomTrigger` story variant.

### Framework Integration Notes

16. **React (via `@lit/react`):** Generate React wrappers for any component that dispatches custom events (React does not listen to custom events natively). Event prop naming convention: `onGrundChange` for `grund-change`. Apply at release time.

17. **Vue:** Vue binds attributes vs properties using `:prop.prop` syntax. Document in stories or README which properties must use `.prop` modifier.

18. **Angular:** Consumers need `CUSTOM_ELEMENTS_SCHEMA` in their module or `schemas: [CUSTOM_ELEMENTS_SCHEMA]` in their standalone component. Document in getting-started guide.

### CSS Custom Properties

19. Expose CSS custom properties only for structural timing/layout concerns (e.g., `--grund-accordion-transition-duration`). Document with a default value so consumers know what they're overriding.
```

- [ ] **Step 2: Review**

Verify: dev-mode warning format is specified, progressive disclosure rule is present, event detail typing rule covers cancelable events.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/consumer-dx.md
git commit -m "docs(refs): add consumer-dx reference document (19 rules)"
```

---

### Task 8: Write `refs/form-participation.md`

**Files:**
- Create: `.claude-plugin/refs/form-participation.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/form-participation.md`:

```markdown
# Form Participation

Full `ElementInternals` API reference and `FormController` design.
Loaded by `/build-elements` when component category is `form-control`.

---

## Overview

Form-associated custom elements use the `ElementInternals` API to participate in HTML forms.
All form controls MUST use the shared `FormController` rather than raw `ElementInternals`.
`FormController` lives in `src/controllers/form.controller.ts` — build it with the first form control.

---

## Required Setup

```ts
class GrundSwitch extends LitElement {
  // 1. Required static field
  static formAssociated = true;

  // 2. Attach internals in constructor
  private _internals = this.attachInternals();

  // 3. Use FormController (wraps all ElementInternals calls)
  private _form = new FormController(this, this._internals);
}
```

---

## FormController Design

`FormController` wraps all `ElementInternals` interactions. Implement these capabilities:

### `setFormValue(value)`

Called in `willUpdate` whenever the component's value changes. Submits value to the form.

```ts
// Simple value
this._form.setValue('on'); // for Switch

// Complex value (multiple fields)
const data = new FormData();
data.append(this.name, this.value);
this._form.setValue(data);
```

### Validation Constraint API

```ts
// Valid state
this._form.setValidity({}, '');

// Invalid state
this._form.setValidity(
  { valueMissing: true },
  'Please check this box.',
  this.shadowRoot!.querySelector('input') ?? undefined
);
```

### Form Callbacks

```ts
// Called when parent <form> resets
formResetCallback() {
  this.checked = false; // restore to default
  this._form.setValue(null);
}

// Called for browser autofill or back-forward cache restore
formStateRestoreCallback(state: string | File | FormData, reason: 'restore' | 'autocomplete') {
  if (typeof state === 'string') {
    this.value = state;
  }
}

// Called when ancestor <fieldset disabled> changes
formDisabledCallback(disabled: boolean) {
  this.disabled = disabled;
}
```

### Label Association

`ElementInternals` automatically associates `<label for="id">` with the component.
The component must have an `id` attribute for this to work.

For internal visual labels, use `aria-labelledby` pointing to a shadow element with an ID,
OR use `aria-label` directly on the interactive shadow element.

---

## Indeterminate State (Checkbox)

```ts
@property({ type: Boolean }) indeterminate = false;

willUpdate(changed: PropertyValues) {
  if (changed.has('indeterminate') || changed.has('checked')) {
    if (this.indeterminate) {
      this._form.setValidity({}, ''); // indeterminate is not invalid
      // Visual state via data-indeterminate attribute
    }
  }
}
```

---

## Rules

1. Every form-associated custom element MUST declare `static formAssociated = true`.
2. `setFormValue()` MUST be called in `willUpdate` when `value` or `checked` changes, not in event handlers.
3. `formResetCallback()` MUST restore the element to its `defaultValue` or `defaultChecked` state.
4. `formDisabledCallback()` MUST propagate the `disabled` state to the component's visual and interactive state.
5. `formStateRestoreCallback()` MUST restore state from the provided value string for browser autofill scenarios.
6. Validation MUST use `setValidity()` with the appropriate `ValidityStateFlags`. Do not use custom validity without setting the correct built-in flags.
7. Use `FormController` — never use raw `ElementInternals` directly in element classes.
```

- [ ] **Step 2: Review**

Verify: all 5 form callbacks are documented, `FormController` design is clear enough to implement, `static formAssociated` rule is present.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/form-participation.md
git commit -m "docs(refs): add form-participation reference document"
```

---

### Task 9: Write `refs/transition-contract.md`

**Files:**
- Create: `.claude-plugin/refs/transition-contract.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/transition-contract.md`:

```markdown
# Transition Contract

How consumers animate open/close transitions. `PresenceController` design.
Loaded by `/build-elements` for overlay and show/hide components.

---

## The Core Contract

Components expose `data-state="open"` / `data-state="closed"` on their panel/content element
via `OpenStateController`. Consumers write all CSS transitions keyed on this attribute.

```css
/* Consumer's stylesheet — the component provides zero transition CSS */
grund-accordion-panel::part(panel) {
  overflow: hidden;
  transition: height 200ms ease;
}
grund-accordion-panel[data-state="closed"]::part(panel) {
  height: 0;
}
```

---

## The Exit Animation Problem

When `keepMounted=false` (the default), a closed panel is removed from the DOM.
If the consumer has added a CSS exit animation, the element is removed *before* the animation plays.

`PresenceController` solves this: it keeps the element in the DOM until the animation/transition completes.

---

## PresenceController Design

Build in `src/controllers/presence.controller.ts` when building the first overlay component.

**API:**

```ts
class PresenceController implements ReactiveController {
  constructor(
    host: ReactiveControllerHost & Element,
    options: {
      isPresent: () => boolean; // true = should be visible
      onExitComplete?: () => void; // called when exit animation finishes
    }
  );

  /** Whether the element should currently be in the DOM */
  get present(): boolean;
}
```

**Behaviour:**
- When `isPresent()` returns `true`: `present` is `true` immediately.
- When `isPresent()` returns `false`: `present` stays `true`, listens for `transitionend`/`animationend` on the host, then sets `present` to `false` and calls `onExitComplete()`.
- If no transition/animation is running (instant close), sets `present` to `false` immediately after one microtask.

**Usage in a panel element:**

```ts
private _presence = new PresenceController(this, {
  isPresent: () => this.itemCtx?.expanded ?? false,
  onExitComplete: () => this.requestUpdate(),
});

render() {
  if (!this._presence.present) return nothing;
  return html`<div part="panel" role="region"><slot></slot></div>`;
}
```

---

## `keepMounted` Interaction

- `keepMounted=true`: Element stays in DOM always. `PresenceController` not needed. CSS transitions work naturally.
- `keepMounted=false` (default): Use `PresenceController` to delay DOM removal.

---

## `prefers-reduced-motion`

Components do not add `@media (prefers-reduced-motion)` rules — consumers own all CSS.
However, components SHOULD expose a `data-reduced-motion` attribute or CSS custom property
so consumers can conditionally disable animations:

```css
@media (prefers-reduced-motion: reduce) {
  grund-accordion-panel::part(panel) {
    transition: none;
  }
}
```

Document in Storybook: show a motion-safe story variant with the above CSS applied.

---

## `hidden="until-found"` Interaction

When `hiddenUntilFound=true`, the panel uses `hidden="until-found"` instead of `data-state`.
The browser reveals the panel when find-in-page matches content inside it.
The component handles `beforematch` event to update internal expanded state.

```ts
// In panel element
@property({ type: Boolean }) hiddenUntilFound = false;

render() {
  if (this.itemCtx?.expanded) {
    return html`<div part="panel" role="region"><slot></slot></div>`;
  }
  if (this.hiddenUntilFound || this.accordionCtx?.hiddenUntilFound) {
    return html`<div part="panel" role="region" hidden="until-found"
      @beforematch=${this._handleBeforeMatch}><slot></slot></div>`;
  }
  if (!this._presence.present) return nothing;
  return html`<div part="panel" role="region"><slot></slot></div>`;
}
```

---

## Rules

1. Components expose `data-state="open"/"closed"` as the sole animation hook. No transition CSS in Shadow DOM.
2. When `keepMounted=false`, use `PresenceController` to delay DOM removal until animation completes.
3. When `keepMounted=true`, `PresenceController` is not needed — CSS transitions work naturally.
4. Document motion-safe patterns in Storybook stories.
5. `hidden="until-found"` support requires handling the `beforematch` event and updating component state.
```

- [ ] **Step 2: Review**

Verify: `PresenceController` API is concrete enough to implement, `keepMounted` interaction is clear, `hidden="until-found"` pattern present.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/transition-contract.md
git commit -m "docs(refs): add transition-contract reference document + PresenceController design"
```

---

### Task 10: Write `refs/focus-management.md`

**Files:**
- Create: `.claude-plugin/refs/focus-management.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/focus-management.md`:

```markdown
# Focus Management

Decision tree and controller designs for each focus management pattern.
Loaded by `/build-elements` and the `accessibility-reviewer`.

---

## Decision Tree

```
What type of component?
├── Composite widget (Tabs, Accordion, Toolbar, RadioGroup)
│   └── Use: RovingFocusController (exists in src/controllers/)
│       Arrow keys move focus within widget. Tab exits.
│
├── Modal overlay (Dialog, Sheet, AlertDialog)
│   └── Use: FocusTrapController (build when first modal is built)
│       Tab/Shift+Tab cycle within. Escape closes. Focus returns on close.
│
├── Non-modal overlay (Popover, Dropdown, Tooltip)
│   └── Use: FocusRestorationController (build when first overlay is built)
│       Overlay opens. Focus moves inside (if interactive). Close returns focus to trigger.
│
├── Collection with text input (Combobox, Autocomplete)
│   └── Use: VirtualFocusController — aria-activedescendant (build with Combobox)
│       <input> retains real focus. Option "focus" is visual + aria-activedescendant only.
│
└── Form control wrapping native element (Input, Textarea wrapper)
    └── Use: delegatesFocus: true on shadow root
        Real focus goes to the native element inside shadow root.
```

---

## RovingFocusController (exists)

Location: `src/controllers/roving-focus.controller.ts`

The existing implementation handles:
- `ArrowUp`/`ArrowDown` (vertical) or `ArrowLeft`/`ArrowRight` (horizontal)
- `Home`/`End` for first/last item
- Optional loop wrapping
- `composedPath()` to resolve focus origin across shadow boundaries
- One item at `tabIndex=0`, rest at `tabIndex=-1`

**RTL support:** When `dir="rtl"`, `ArrowLeft` and `ArrowRight` meanings MUST swap for horizontal orientation. Update `RovingFocusController` to check `document.dir` or `getComputedStyle(host).direction`.

---

## FocusTrapController (planned)

Build in `src/controllers/focus-trap.controller.ts` when building the first modal component.

**Required behaviour:**
- On activation: move focus to the first focusable element inside the trap zone (or a specified initial focus element).
- On `Tab`: cycle to next focusable element within trap. Wrap to first after last.
- On `Shift+Tab`: cycle to previous. Wrap to last before first.
- On deactivation: restore focus to the element that had focus before the trap was activated.
- Focusable elements include: `a[href]`, `button:not([disabled])`, `input:not([disabled])`, `select`, `textarea`, `[tabindex]:not([tabindex="-1"])`, shadow DOM elements with `delegatesFocus`.

---

## FocusRestorationController (planned)

Build in `src/controllers/focus-restoration.controller.ts` with first non-modal overlay.

**Required behaviour:**
- On open: record `document.activeElement` as the return target.
- On close: restore focus to the recorded element. If element no longer exists, focus the `<body>`.

---

## VirtualFocusController (planned)

Build in `src/controllers/virtual-focus.controller.ts` with Combobox.

**Required behaviour:**
- Maintains an index into the options list representing the "virtually focused" option.
- Sets `aria-activedescendant` on the input element to the virtually focused option's `id`.
- Adds a visual focus indicator class/attribute to the virtually focused option.
- Responds to `ArrowDown`/`ArrowUp` to change virtual focus index.
- Responds to `Enter` to confirm selection of virtually focused option.
- Real DOM focus stays on the `<input>` element throughout.

---

## `inert` Attribute

When a modal dialog is open, background content MUST be made inert:

```ts
// In dialog root element
updated() {
  const backdrop = document.querySelector('.page-content'); // consumer's root
  if (this.open) {
    backdrop?.setAttribute('inert', '');
  } else {
    backdrop?.removeAttribute('inert');
  }
}
```

Note: consumers are responsible for applying `inert` to their page content. The Dialog component should document this requirement clearly and provide a `data-dialog-open` attribute on `<body>` for consumers to use as a hook.

---

## Tab Order

1. One tab stop per composite widget. All items within the widget are reachable via arrow keys, not Tab.
2. Tab exits the widget to the next page-level focusable element.
3. Never trap focus in a non-modal component.

---

## Rules

1. Use `RovingFocusController` for all composite widgets (Tabs, Accordion, Toolbar, Menu, RadioGroup).
2. Use `FocusTrapController` for all modal overlays (Dialog, Sheet, AlertDialog).
3. Use `FocusRestorationController` for all non-modal overlays that move focus on open (Popover, Dropdown).
4. Use `VirtualFocusController` for all collection components with a text input (Combobox, Autocomplete).
5. `RovingFocusController` MUST respect `dir="rtl"` for horizontal orientation — swap `ArrowLeft`/`ArrowRight`.
6. Composite widgets have exactly one tab stop. Arrow keys navigate within. Tab exits.
7. Modal overlays MUST trap focus when open. Document `inert` requirement for background content.
```

- [ ] **Step 2: Review**

Verify: all 4 focus patterns have a controller mapped, decision tree covers all component categories, RTL requirement present.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/focus-management.md
git commit -m "docs(refs): add focus-management reference document"
```

---

### Task 11: Write `refs/positioning-strategy.md`

**Files:**
- Create: `.claude-plugin/refs/positioning-strategy.md`

- [ ] **Step 1: Write the document**

Create `.claude-plugin/refs/positioning-strategy.md`:

```markdown
# Positioning Strategy

Architectural decision and `PositioningController` design for overlay components.
Loaded by `/build-elements` for overlay and collection components.

---

## Architectural Decision

**Floating UI** is the positioning engine. Build `PositioningController` when the first
positioned overlay component is built.

**CSS Anchor Positioning** is the future path. When browser support is sufficient (check
[caniuse.com/css-anchor-positioning](https://caniuse.com/css-anchor-positioning)), migrate
`PositioningController` to use it natively with a Floating UI fallback.

---

## Popover API Integration

For overlays that need top-layer rendering (above `z-index` stacking context):

- Use the native `popover` attribute when available (Chrome 114+, Safari 17+, Firefox 125+).
- Fall back to absolute/fixed positioning for older browsers.
- Feature detect: `HTMLElement.prototype.hasOwnProperty('popover')`.

```ts
private _usePopoverApi = HTMLElement.prototype.hasOwnProperty('popover');

render() {
  return html`
    <div part="content"
      ?popover=${this._usePopoverApi || nothing}>
      <slot></slot>
    </div>
  `;
}
```

---

## PositioningController Design

Build in `src/controllers/positioning.controller.ts` with the first positioned overlay.

```ts
class PositioningController implements ReactiveController {
  constructor(
    host: ReactiveControllerHost & Element,
    options: {
      reference: () => Element | null;  // the anchor element
      floating: () => HTMLElement | null; // the positioned overlay element
      placement?: Placement;             // 'bottom', 'top', 'left', 'right', etc.
      offset?: number;                   // distance from anchor
    }
  );

  /** Updates position. Call after open. */
  update(): void;
}
```

**Responsibilities:**
- Calls `computePosition()` from Floating UI with `flip`, `shift`, and `offset` middleware.
- Updates `floating.style.top` / `floating.style.left` (or CSS transform).
- Re-computes on window resize and scroll (via `autoUpdate` from Floating UI).
- Cleans up `autoUpdate` listener in `hostDisconnected`.

---

## Rules

1. Never position overlay elements with hard-coded CSS `top`/`left` values — use `PositioningController`.
2. Always include `flip` middleware so overlays reposition when viewport space is insufficient.
3. Always include `shift` middleware to keep overlays within viewport boundaries.
4. Clean up `autoUpdate` listeners in `hostDisconnected` to prevent memory leaks.
5. Test positioning with: overlay near viewport edge, overlay in scrollable container, overlay in transformed parent.
```

- [ ] **Step 2: Review**

Verify: Floating UI is named as the engine, `PositioningController` API is implementable, Popover API integration is shown.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/refs/positioning-strategy.md
git commit -m "docs(refs): add positioning-strategy reference document"
```

---

### Task 12: Write `docs/vocabulary.md`

The living cross-component naming registry. Consulted during spec authoring and validated by `api-reviewer`.

**Files:**
- Create: `docs/vocabulary.md`

- [ ] **Step 1: Write the document**

Create `docs/vocabulary.md`:

```markdown
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
| `requestToggle(value)` | Toggle expanded/collapsed state of an item | Accordion, Disclosure |
| `requestOpen(value)` | Open a specific item | Accordion, Dialog |
| `requestClose(value?)` | Close a specific item or all items | Accordion, Dialog, Popover |
| `requestSelect(value)` | Select an item | Tabs, Select, Listbox |
| `requestNavigate(direction)` | Move focus/selection in a direction | Combobox, Menu |
| `registerItem(el)` | Register a child item with the root | All composite widgets |
| `unregisterItem(el)` | Unregister a child item | All composite widgets |
| `registerTrigger(el)` | Register a trigger sub-element with an item | Accordion, Disclosure |
| `registerPanel(el)` | Register a panel sub-element with an item | Accordion, Disclosure |
| `attachTrigger(el)` | Link a trigger element via registry | Accordion |
| `detachTrigger(el)` | Unlink a trigger element | Accordion |
| `attachPanel(el)` | Link a panel element via registry | Accordion |
| `detachPanel(el)` | Unlink a panel element | Accordion |

---

## Event Names

All events follow `grund-{action}` pattern, `bubbles: true`, `composed: false`.

| Event | Detail type | Meaning |
|---|---|---|
| `grund-change` | `{ value: string, expanded: boolean }` | An item's expanded state changed |
| `grund-value-change` | `{ value: string[], itemValue: string, open: boolean }` | Full expanded values snapshot |
| `grund-open-change` | `{ value: string, open: boolean }` | An item opened or closed |
| `grund-select` | `{ value: string }` | An item was selected |

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
| `data-state` | `"open"` / `"closed"` | `OpenStateController` |
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
| `accordionContext` | `Context<AccordionContextValue>` |
| `accordionItemContext` | `Context<AccordionItemContextValue>` |

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
```

- [ ] **Step 2: Review**

Verify: accordion vocabulary is seeded (action verbs, events, parts matching current implementation), format is scannable, "How to Add" instructions are present.

- [ ] **Step 3: Commit**

```bash
git add docs/vocabulary.md
git commit -m "docs: add cross-component vocabulary registry"
```

---

### Task 13: Restructure `CLAUDE.md`

Replace the current 228-line CLAUDE.md with a leaner version (~200 lines) that removes content now in reference docs and updates the two changed rules (ID generation, dev-mode warnings, workflow reference).

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read the current CLAUDE.md**

Read `CLAUDE.md` to understand current content before replacing.

- [ ] **Step 2: Write the new CLAUDE.md**

Replace `CLAUDE.md` entirely with:

```markdown
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
| `OpenStateController` | `data-state="open"/"closed"` on host | Any element with open/closed state |
| `AriaLinkController` | `ariaControlsElements` / `ariaLabelledByElements` | Trigger↔panel, label↔input |
| `RovingFocusController` | Keyboard-driven roving tabindex | Container element |

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
- Show/hide: `data-state="open"/"closed"` via `OpenStateController`. Exception: `hidden="until-found"` for browser-native find-in-page.
- Event naming: `grund-{action}` with `bubbles: true, composed: false`.
- ARIA linking: `AriaLinkController` for all cross-element ARIA relationships.
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
| `data-state="open"/"closed"` | Visibility state | `OpenStateController` |
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
- `AriaLinkController` for trigger↔panel and label↔input ARIA relationships
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
/validate-build             → lint, build, test, CEM, axe, bundle size
/diagnose-failure           → investigate persistent reviewer findings
/extract-pattern            → promote inline pattern to shared controller
/deprecate                  → mark API deprecated with migration path
/prepare-release            → semver, changelog, publish
/review-system-health       → periodic skill/reviewer quality audit
```
```

- [ ] **Step 3: Verify the new CLAUDE.md**

Check:
- Line count under 220 lines
- All changed rules are present (ID strategy, dev-mode warnings, registration guard)
- Skills section references new pipeline names (`/component-spec`, `/scaffold`, etc.)
- No references to removed skills (`/implement`, `/new-component`, old reviewer names)

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): restructure CLAUDE.md — move detail to refs/, update ID and dev-mode warning rules"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Verify all files exist**

```bash
ls .claude-plugin/reviewers/
ls .claude-plugin/refs/
ls docs/vocabulary.md
```

Expected: 10 ref docs, vocabulary.md, reviewers/.gitkeep

- [ ] **Step 2: Verify no broken references in CLAUDE.md**

Check that every `.claude-plugin/refs/` path mentioned in CLAUDE.md exists.

- [ ] **Step 3: Check CLAUDE.md line count**

```bash
wc -l CLAUDE.md
```
Expected: under 220 lines.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "docs: Plan 1 complete — foundation reference infrastructure ready for Plans 2-4"
```

---

## Plan Complete

Plan 1 delivers:
- `.claude-plugin/reviewers/` directory ready for Plan 2 (reviewer agents)
- 10 reference docs in `.claude-plugin/refs/` ready for skills to load
- `docs/vocabulary.md` vocabulary registry seeded with accordion vocabulary
- Restructured `CLAUDE.md` under 220 lines with updated rules

**Next:** Plan 2 — write the 6 reviewer agents in `.claude-plugin/reviewers/`.
