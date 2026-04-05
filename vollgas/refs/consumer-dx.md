# Consumer Developer Experience

Rules for error messages, API ergonomics, property naming, and framework integration.
Loaded by the implementation plan and the `api-reviewer`.

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

14. The Web Component composition mechanism is `<slot>`. When a consumer needs the trigger to render as a different element (e.g., `<a>` instead of `<button>`), they slot their element and the component applies ARIA and keyboard behaviour via context-derived ARIA bindings and `RovingFocusController`.

15. Document the composition pattern per component in the Storybook `AsLink` or `CustomTrigger` story variant.

### Framework Integration Notes

16. **React (via `@lit/react`):** Generate React wrappers for any component that dispatches custom events (React does not listen to custom events natively). Event prop naming convention: `onGrundChange` for `grund-change`. Apply at release time.

17. **Vue:** Vue binds attributes vs properties using `:prop.prop` syntax. Document in stories or README which properties must use `.prop` modifier.

18. **Angular:** Consumers need `CUSTOM_ELEMENTS_SCHEMA` in their module or `schemas: [CUSTOM_ELEMENTS_SCHEMA]` in their standalone component. Document in getting-started guide.

### CSS Custom Properties

19. Expose CSS custom properties only for structural timing/layout concerns (e.g., `--grund-accordion-transition-duration`). Document with a default value so consumers know what they're overriding.
