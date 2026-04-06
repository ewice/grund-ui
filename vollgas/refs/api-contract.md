# API Contract

Concrete public API rules for Grund UI reviewers and generation skills.
This contract focuses on the consumer-facing surface: exported elements, public types, event contracts, documentation, defaults, and breaking changes.

---

## Rules

### Public Surface and Exports

1. Every public custom element exported from `src/components/*/{name}.ts` must have a corresponding public entry in `package.json` exports. Internal implementation paths must not be part of the public surface.
2. Public exports must be intentionally public. Non-public exports must be marked `@internal` and must not appear as consumer-facing API in generated docs.
3. Public API review covers consumer-facing properties, events, slots, methods, tags, and exported types. Internal controllers, engines, context objects, and helper types are not public API unless they are explicitly exported for consumers.
4. Public methods, getters, and fields on exported element classes must be intentionally part of the consumer contract. Accidental public helpers are API leaks even if they are undocumented.
5. `protected` members on exported element classes imply subclass extension. Use `protected` only when subclassing is an intentional extension point; otherwise keep members `private` or internal to the implementation.

### Public Types

6. Every public custom event must have a corresponding exported `*Detail` interface in `types.ts`.
7. Public types in `types.ts` must be framework-agnostic. Do not expose Lit-specific implementation types such as `PropertyValues` or `LitElement` in the public type surface.
8. Public type signatures must match actual runtime behavior. If an event can emit `null`, be canceled, or carry multiple shapes, the exported types must say so.

### Documentation and CEM

9. Every public element class must document itself with `@element grund-{name}`.
10. Every public slot must have an `@slot` JSDoc entry.
11. Every public custom event must have an `@fires` JSDoc entry that matches the real event name and detail type.
12. Deprecated public API must include a migration path. A deprecation without guidance is incomplete documentation.
13. Public docs must describe consumer-observable behavior, not implementation details. Controlled/uncontrolled behavior, required labels, and meaningful defaults must be discoverable from docs and generated metadata.

### Event Contracts

14. Event docs and exported detail types must match actual dispatch behavior: name, detail shape, and cancelability.
15. Cancelable public events must document what `preventDefault()` stops.
16. Event names must follow the `grund-{action}` convention. When `docs/vocabulary.md` contains a public event entry, new event names must match or extend the registry intentionally rather than inventing synonyms.

### Consumer Ergonomics

17. Optional public properties should have sensible defaults for the zero-config path. If basic usage requires non-obvious setup, the docs must say so explicitly.
18. If a component supports controlled and uncontrolled modes, that contract must be explicit in the public docs and types. Consumers should be able to tell which side owns the state and what event reports requested changes.

### Breaking Changes

19. Removed or renamed public properties, events, exports, or detail types are breaking changes unless they are handled through an explicit deprecation or migration path.
20. If no CEM baseline exists, note that breaking-change detection is partial rather than assuming compatibility.

---

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| Exported element class leaves an internal helper `public` | Consumers see an API you did not intend to support | Make it `private`/`protected` or document it as public API (Rule 4) |
| `protected` helper exists with no subclassing story | Signals an unsupported extension point | Keep it private unless subclassing is intentional and documented (Rule 5) |
| Event dispatched without exported detail type | Consumers cannot type handlers safely | Export `*Detail` from `types.ts` (Rule 6) |
| `types.ts` exposes `PropertyValues<this>` | Public API leaks Lit internals | Keep public types framework-agnostic (Rule 7) |
| `@fires` says event is cancelable but dispatch omits `cancelable: true` | Docs and runtime behavior disagree | Align dispatch and docs (Rules 14–15) |
| Public export exists only from an internal path | Consumers depend on unstable internals | Export through the public entrypoint and exports map only (Rule 1) |
| Controlled component emits requests but docs imply uncontrolled ownership | Consumers misuse the API and get surprising behavior | Document controlled/uncontrolled ownership and change events explicitly (Rule 18) |
| New event name invented without updating vocabulary registry | Cross-component naming drifts | Add or align the public event name in `docs/vocabulary.md` (Rule 16) |
