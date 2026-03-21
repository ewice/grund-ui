# Lit Patterns

Reference for generation skills and the `lit-reviewer`. All rules are numbered and testable.

---

## Rules

### Lifecycle

1. Use `willUpdate(changedProperties)` for deriving state from properties. Never derive state in `updated()`.
2. Use `updated(changedProperties)` only for post-render side effects (e.g., restoring focus, measuring DOM). Dispatch `grund-*` events from the controller action method that causes the state change. **Exception:** per-item derived events that depend on context propagation (e.g., `grund-open-change` on an item element) may be dispatched in `updated()` because the item cannot determine its new state until context settles in `willUpdate`. Guard with a `hasSettled` flag to suppress the initial-render event.
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
15. Context object stability depends on the provider mechanism:
    - **With `@provide` decorator:** The decorator uses `Object.is()` to detect changes and only notifies consumers when the property reference changes. Recreation (assigning a new object) is necessary to trigger consumer updates — in-place mutation is invisible to `@provide`. Minimise recreation frequency: only reassign when state fields have actually changed.
    - **With `ContextProvider` directly:** Call `setValue(value, true)` to force notification after in-place mutation. This avoids recreating the object and is preferred for components with many consumers (50+ items).
    - In both cases, bind action methods once (via arrow functions or `.bind()` in the constructor or `createContextValue()`) so that callbacks are stable references even when the context object is recreated.
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
| Dispatching events in `updated()` without a settled guard | Can fire during initial render or cause cascading re-renders | Dispatch from controller action method; use `updated()` only for context-derived events with a `hasSettled` guard (see Rule 2) |
| `requestUpdate()` inside `updated()` | Infinite render loop | Compute in `willUpdate`, not `updated` |
| Recreating context object on every `willUpdate` when nothing changed | Unnecessary re-renders in all consumers | With `@provide`: recreate only when state fields change. With `ContextProvider`: mutate in place + `setValue(ref, true)` (see Rule 15) |
| Reading host reactive props in controller | Tight coupling, not independently testable | Use `HostSnapshot` pattern via `syncFromHost()` |
| `customElements.define()` without guard | Throws on duplicate definition (micro-frontends) | Wrap with `if (!customElements.get(...))` |
| `addEventListener` without cleanup | Memory leak, stale handler on reconnect | Symmetric cleanup in `disconnectedCallback` |
| `display: contents` on element with ARIA role | Strips element box, breaks accessibility tree | Use `display: block` or `display: inline` |
