# Lit Patterns

Reference for generation skills and the `lit-reviewer`. All rules are numbered and testable.

---

## Rules

### Lifecycle

1. Use `willUpdate(changedProperties)` for deriving state from properties. Never derive state in `updated()`.
2. Use `updated(changedProperties)` only for post-render side effects (e.g., restoring focus, measuring DOM). Dispatch `grund-*` events from the controller action method that causes the state change. **Exception:** per-item derived events that depend on context propagation (e.g., `grund-open-change` on an item element) may be dispatched in `updated()` because the item cannot determine its new state until context settles in `willUpdate`. Guard with a `hasSettled` flag to suppress the initial-render event.
3. Use `firstUpdated()` only for one-time DOM setup (e.g., a controller that needs a DOM reference). Never use it for logic that must run on every update.
4. Never call `this.requestUpdate()` inside `updated()`. This creates an infinite render loop.
5. The root element packages its reactive properties into a `HostSnapshot` plain object in `willUpdate` and passes it to the Engine via `syncFromHost()`. The Engine never reads reactive properties directly from the host — this decouples it from Lit and keeps it independently testable with plain `new Engine()` instantiation.

### Reactive Properties

6. Use `@property()` for public API (accessible as HTML attributes and JS properties). Use `@state()` for internal state never exposed to consumers.
7. Always define `hasChanged` for properties holding objects, arrays, or Sets. The Lit default (`!==`) works for primitives. Override for deep equality only when necessary.
8. Boolean properties: `@property({ type: Boolean })`. Reflect to attribute (`reflect: true`) only if consumers need CSS selector targeting (e.g., `[disabled]`). Reflected boolean attributes use HTML convention: presence = true, absence = false.
9. Never reflect object or array properties to attributes. Reflecting objects produces `[object Object]` in HTML.
10. Properties with `reflect: true` must have stable, serialisable values. Never reflect Sets, Maps, or class instances.

### Shadow DOM

11. `exportparts` is only needed when an element renders another element with `part` attributes inside its own shadow DOM template. In slot-based compound components, child elements are in the consumer's light DOM — consumers can target their parts directly (e.g., `grund-tab::part(tab)`) without any `exportparts` declaration. Do not add `exportparts` to elements that only slot their children.
12. Use `slotchange` events on `<slot>` elements when a component must react to slotted content changing. The event fires asynchronously and may fire multiple times during initial render — guard with a flag or debounce if needed.
13. Use `delegatesFocus: true` on the shadow root only for form controls that wrap a native focusable element (e.g., a custom input wrapping `<input>`). Do not use it on composite widgets — they manage focus via `RovingFocusController`.

### Context

14. Use `@consume()` decorator by default for consuming context. Use the `ContextConsumer` class directly only when you need the subscription `subscribe` callback (e.g., to detect provider changes and re-register). Always document why.
15. Context object stability depends on the provider mechanism:
    - **With `@provide` decorator:** The decorator uses `Object.is()` to detect changes and only notifies consumers when the property reference changes. Recreation (assigning a new object) is necessary to trigger consumer updates — in-place mutation is invisible to `@provide`. Minimise recreation frequency: only reassign when state fields have actually changed.
    - **With `ContextProvider` directly:** Call `setValue(value, true)` to force notification after in-place mutation. This avoids recreating the object and is preferred for components with many consumers (50+ items).
    - In both cases, bind action methods once (via arrow functions or `.bind()` in the constructor or `createContextValue()`) so that callbacks are stable references even when the context object is recreated.
16. Context subscriptions are always `private`. Expose derived values via public getters if other code needs them.
17. Context key symbols must be unique per component family. Define in the component's `{name}.context.ts` file. Never reuse between unrelated component families.
18. Context interfaces expose the minimum API consumers need. Prefer read-only query methods (`getRecordByValue(value): { element, panel } | null`) over exposing mutable data structures (`getRegistry(): Registry`). If consumers need registry data for DOM queries (ARIA linking, geometry), add specific read-only methods to the context interface — never expose the registry instance directly.

### Dev-Mode Warnings

19. Gate dev-mode warnings with `if (import.meta.env.DEV)`. Vite tree-shakes this block in production builds — zero runtime cost in production.
20. Every compound element that can be structurally misused MUST warn when used outside its required parent context.
21. Warning format: `console.warn('[grund-{element}] {what is wrong}. {how to fix it}.')`.

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

### Accessibility Modifiers

22. Every class member in a Lit element or controller MUST have an explicit accessibility modifier (`public`, `protected`, or `private`). Use the narrowest scope that satisfies the contract:

    | Member | Modifier | Reason |
    |---|---|---|
    | `@property()` fields | `public` | Part of the element's public JS/HTML API |
    | `static styles` | `public static` | Read by Lit framework infrastructure |
    | `connectedCallback`, `disconnectedCallback`, `attributeChangedCallback` | `public override` | Defined as `public` in `HTMLElement` |
    | `render()`, `willUpdate()`, `updated()`, `firstUpdated()` | `protected override` | Defined as `protected` in `LitElement` / `ReactiveElement` |
    | `hostConnected()`, `hostDisconnected()`, `hostUpdate()`, `hostUpdated()` on controllers | `public` | Defined as `public` in the `ReactiveController` interface |
    | `@state()` fields | `private` | Internal reactive state — never part of the public API |
    | `@consume()` context subscriptions | `private` | Always private (Rule 16) |
    | Internal helpers, computed fields | `private` | Not part of any external contract |
    | Methods shared with subclasses | `protected` | Rare in this codebase — document why |

### File Organization

23. Class member ordering within a Lit element:
    1. Static properties / `static formAssociated`
    2. `@property()` / `@state()` decorated fields
    3. Private fields and controllers
    4. Constructor
    5. `connectedCallback` / `disconnectedCallback`
    6. Lifecycle methods (`willUpdate`, `updated`, `firstUpdated`)
    7. Public methods
    8. Private methods
    9. `render()`

24. Extract a `_renderX()` helper from `render()` when the template exceeds ~30 lines or contains a distinct logical section (e.g., the open vs closed state branches).
25. Import organization: (a) framework imports (`lit`, `@lit/context`), (b) internal imports (`../../controllers/...`), (c) type-only imports (`import type ...`). Blank line between groups.

### Define Timing and Upgrade Ordering

26. Components MUST work regardless of the order custom elements are defined. Never assume a parent element is already upgraded in `connectedCallback` — use context subscription to detect when the provider becomes available.
27. Wrap `customElements.define()` with a registration guard to prevent duplicate-definition errors (e.g., when two versions of the library are loaded):

```ts
if (!customElements.get('grund-accordion')) {
  customElements.define('grund-accordion', GrundAccordion);
}
```

### Memory Management

28. Every `addEventListener` added in `connectedCallback` or `hostConnected` MUST have a corresponding `removeEventListener` in `disconnectedCallback` or `hostDisconnected`. No exceptions.
29. Every `ResizeObserver`, `MutationObserver`, or `IntersectionObserver` created in a controller MUST call `.disconnect()` in `hostDisconnected`.
30. Registries that store references to child elements SHOULD use `WeakRef<T>` to prevent memory leaks when elements are removed from the DOM without explicit unregistration.

### Context Propagation Timing

31. In compound components using `@provide` / `@consume`, the parent's `firstUpdated()` fires **before** any child's `willUpdate()`. Context propagation triggers `requestUpdate` on consumers (microtask), so children register in their `willUpdate` one or more microtask cycles after the parent completes its first render. Never place logic that depends on child registration in `firstUpdated()` — the registry will always be empty at that point. Use registration callbacks on the context interface instead.

```ts
// ❌ Dead code — registry is empty when firstUpdated fires
override firstUpdated(): void {
  const first = this.registry.firstNonDisabled();
  if (first) this.activateTab(first.value);
}

// ✅ Auto-selection triggered when a child actually registers
registerTab: (tab: HTMLElement) => {
  this.registry.registerTab(tab, value);
  if (this._activeValue === null) {
    const first = this.registry.firstNonDisabled();
    if (first) this.activateTab(first.value);
  }
},
```

32. Corollary: dev-mode warnings about missing siblings (e.g., "no matching panel found") must not fire in `firstUpdated()` — sibling elements have not registered yet. Delay the check via `requestAnimationFrame`, `queueMicrotask`, or a settled guard in `updated()` that skips the first N render cycles.

### Error Boundaries

33. Engine methods that process user-provided data or call external APIs MUST wrap risky operations in try/catch. On error: emit a dev-mode warning and either recover to a safe state or do nothing (fail silently in production).

### State Machines (Complex Lifecycle Only)

34. Use explicit state machines only for components with multi-step lifecycle where impossible states cause real bugs (Dialog, Sheet, multi-step wizard). Simple and composite widgets use pure resolver functions (see accordion's `resolveAccordionAction` as the canonical pattern).
35. Explicit state machine pattern when needed:

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

### Selection State

36. Any component that manages a **set of selected / active / pressed values** MUST delegate to `SelectionEngine` (`src/controllers/selection.engine.ts`) rather than reimplementing the logic. Wrap it in a domain-specific Engine with component-appropriate names:

    ```ts
    // ✅ Correct — ToggleGroupEngine wraps SelectionEngine
    export class ToggleGroupEngine {
      private readonly selection = new SelectionEngine();
      public isPressed(value: string): boolean { return this.selection.isSelected(value); }
      public requestToggle(value: string, disabled: boolean): string[] | null {
        return this.selection.requestToggle(value, disabled);
      }
    }

    // ❌ Wrong — reimplementing Set-based state from scratch
    export class RadioGroupEngine {
      private selectedValues = new Set<string>();
      private isControlled = false;
      // ... (copy-paste of SelectionEngine logic)
    }
    ```

    `SelectionEngine` covers: single/multiple mode, controlled/uncontrolled, disabled gating, defaultValue seeding. If you need behaviour it does not cover, classify the gap (Rule 37) before writing inline code.

### Shared Controller / Engine / Abstraction Fit

37. Before attaching a shared controller, run the abstraction fit check:

    **Step 1 — List required behaviors.** Write down every behavior the spec demands that the controller is expected to handle.

    **Step 2 — Check coverage.** For each required behavior, does the controller handle it? Note any gaps.

    **Step 3 — Classify each gap:**

    | Classification | Criteria | Action |
    |---|---|---|
    | **Extend the abstraction** | Gap is a missing hook/callback/config; core model fits; extension benefits future components | Add the hook/callback to the controller; do not workaround |
    | **Custom implementation** | Core assumption of the abstraction is incompatible with the spec | Implement inline; add a `// Not using X because:` comment explaining why |
    | **Inline workaround** | Gap is trivially solved (1–2 lines) and extracting it adds no reuse value | Implement inline; no doc needed |

    **Step 4 — Act on classification.** Never implement a workaround that belongs in "Extend" as an "Inline workaround." Writing down the classification forces the decision — if the correct answer is "extend the abstraction," the workaround is the wrong action.

    **Concrete example (canonical failure mode):**
    - Gap: `RovingFocusController` does not call back when focus moves (needed to sync ARIA `aria-selected` state)
    - Classification: **Extend** — missing callback; core keyboard model fits; all composite widgets would benefit
    - Wrong action: read `document.activeElement` after the controller moves focus (temporal coupling)
    - Correct action: add `onFocusMove(element: HTMLElement) => void` callback to `RovingFocusController`

### Disabled Composition

38. Disabled state propagates through the tree via a shared `disabledContext` (`src/context/disabled.context.ts`). This replaces per-component `isEffectivelyDisabled` callbacks with a single, composable boolean context.

    **Provider pattern** — every element with a `disabled` prop that provides context to children:

    ```ts
    import { disabledContext } from '../../../context/disabled.context.js';

    // Root elements only provide (no ancestor to consume from):
    @provide({ context: disabledContext })
    @state()
    protected disabledCtx = false;

    // In willUpdate:
    this.disabledCtx = this.disabled;
    ```

    **Bridge pattern** — mid-level elements (e.g., accordion-item) that have their own `disabled` prop and sit between root and leaves:

    ```ts
    // Consume from ancestor, compose, and re-provide:
    @consume({ context: disabledContext, subscribe: true })
    @state()
    private ancestorDisabled = false;

    @provide({ context: disabledContext })
    @state()
    protected disabledCtx = false;

    // In willUpdate:
    const mergedDisabled = this.ancestorDisabled || this.disabled;
    this.disabledCtx = mergedDisabled;
    ```

    **Consumer pattern** — leaf elements read the boolean directly:

    ```ts
    @consume({ context: disabledContext, subscribe: true })
    @state()
    private ancestorDisabled = false;

    // Leaves with their own disabled prop compose locally:
    private get effectiveDisabled(): boolean {
      return this.ancestorDisabled || this.disabled;
    }

    // Leaves without a disabled prop use ancestorDisabled directly.
    ```

    Engines retain `disabled` in their `HostSnapshot` for action gating (`requestToggle`, `requestActivation` return `null` when disabled). They do NOT expose `isEffectivelyDisabled` — that concern is handled entirely by `disabledContext`.

### Event Composition

39. Every `CustomEvent` dispatched from a Grund UI element MUST set `composed` explicitly, and the chosen value MUST match the intended consumer boundary. Default library events that consumers handle on the host element will usually use `bubbles: true, composed: false`. Use `composed: true` only when the event intentionally needs to cross an ancestor shadow root boundary:

    ```ts
    // ✅ Correct — host-level consumer event stays inside the current shadow boundary
    this.dispatchEvent(new CustomEvent('grund-change', {
      detail: { value },
      bubbles: true,
      composed: false,
    }));

    // ✅ Correct — boundary crossing is intentional and explicit
    this.dispatchEvent(new CustomEvent('grund-overlay-request-close', {
      detail: { source: 'escape-key' },
      bubbles: true,
      composed: true,
    }));

    // ❌ Wrong — boundary behavior is implicit
    this.dispatchEvent(new CustomEvent('grund-change', {
      detail: { value },
      bubbles: true,
    }));

    // ❌ Wrong — crosses shadow boundaries without an intentional consumer need
    this.dispatchEvent(new CustomEvent('grund-change', {
      detail: { value },
      bubbles: true,
      composed: true,
    }));
    ```

### Component Discovery

40. Child components MUST be discovered via context registration callbacks only. Never use `querySelectorAll`, `querySelector`, or `closest` to find sibling or child custom elements. These approaches cannot cross shadow root boundaries and create brittle DOM-structure coupling:

    ```ts
    // ✅ Correct — child registers itself via context callback on connect
    registerItem: (item: HTMLElement, value: string) => {
      this.registry.register(item, value);
    }

    // ❌ Wrong — parent queries for children directly
    const items = this.querySelectorAll('grund-accordion-item');
    ```

### Render Purity

41. `render()` MUST be pure. It may compute template output from current reactive state, but it must not mutate class state, dispatch events, perform imperative DOM work, or read unstable live DOM state. DOM reads and writes belong in lifecycle hooks, not in `render()`:

    ```ts
    // ✅ Correct — render derives output from reactive state only
    render() {
      return html`<button ?disabled=${this.disabled}>${this.label}</button>`;
    }

    // ❌ Wrong — render mutates state and reads live DOM
    render() {
      this._isEmpty = this.items.length === 0;
      const width = this.getBoundingClientRect().width;
      return html`<div data-width=${width}></div>`;
    }
    ```

### Slotted Validation

42. Structural validation and dev-mode warnings that depend on slotted children MUST be driven by `slotchange` and, when needed, only the specific reactive properties that affect the validation result. Do not run slotted-child validation from generic `updated()` paths: that replays the same warnings on unrelated updates and can still miss child insertions that happen between host updates.

---

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| Dispatching events in `updated()` without a settled guard | Can fire during initial render or cause cascading re-renders | Dispatch from controller action method; use `updated()` only for context-derived events with a `hasSettled` guard (see Rule 2) |
| `requestUpdate()` inside `updated()` | Infinite render loop | Compute in `willUpdate`, not `updated` |
| Recreating context object on every `willUpdate` when nothing changed | Unnecessary re-renders in all consumers | With `@provide`: recreate only when state fields change. With `ContextProvider`: mutate in place + `setValue(ref, true)` (see Rule 15) |
| Reading host reactive props in Engine | Tight coupling, not independently testable | Use `HostSnapshot` pattern via `syncFromHost()` |
| `customElements.define()` without guard | Throws on duplicate definition (micro-frontends) | Wrap with `if (!customElements.get(...))` |
| `addEventListener` without cleanup | Memory leak, stale handler on reconnect | Symmetric cleanup in `disconnectedCallback` |
| `display: contents` on element with ARIA role | Strips element box, breaks accessibility tree | Use `display: block` or `display: inline` |
| Auto-selection or registry validation in `firstUpdated()` | Registry is always empty — children register asynchronously after context propagation | Use registration callbacks on the context interface (Rule 31) |
| Dev warning about missing siblings in `firstUpdated()` | Siblings haven't registered yet — always a false positive | Delay via `requestAnimationFrame` or settled guard in `updated()` (Rule 32) |
| Context interface exposing mutable registry | Consumers can corrupt state; violates principle of least privilege | Expose read-only query methods instead (Rule 18) |
| Context interface with raw `disabled: boolean` | Every consumer must reimplement group+item disabled composition and can get it wrong | Expose `isEffectivelyDisabled(itemDisabled: boolean) => boolean` (Rule 38) |
| Reimplementing Set-based selection state | Duplicates `SelectionEngine`; diverges on edge cases (controlled mode, disabled gating, seeding) | Wrap `SelectionEngine` in a domain Engine (Rule 36) |
| Working around a shared controller gap without classifying it | Temporal coupling, global state reads, and event-timing hacks are symptoms of a missing abstraction fit check | Run Rule 37 fit check; if gap is "Extend," add the hook rather than working around it |
| Omitting `composed` or choosing the wrong value on dispatched events | Event boundary behavior becomes implicit or leaks across shadow roots unexpectedly | Set `composed` explicitly and match it to the intended consumer boundary (Rule 39) |
| `querySelectorAll` / `querySelector` to find child custom elements | Cannot cross shadow roots; breaks on any structural change | Context registration callbacks only (Rule 40) |
| State mutation or live DOM reads in `render()` | Render output becomes unstable and can create self-triggering update paths | Keep `render()` pure and move work to lifecycle hooks (Rule 41) |
