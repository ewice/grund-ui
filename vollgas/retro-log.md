# Vollgas Retro Log

Recurring patterns found by the review-gate, tracked across branches.
Threshold for action: 2 occurrences in the same category.

---

## 2026-04-19 — feat-avatar

| Finding | Reviewer | Category | Occurrences |
|---------|----------|----------|-------------|
| `grund-status-change` dispatched in `willUpdate()` before DOM updated | lit-reviewer | `lit/event-dispatch-lifecycle` | 2 |
| `_previousStatus` null-guard as secondary symptom of willUpdate dispatch | lit-reviewer | `lit/event-dispatch-lifecycle` | 2 |
| No mount/unmount test for GrundAvatar engine.onChange subscription | test-reviewer | `test/mount-unmount-coverage` | 2 |
| No mount/unmount test for GrundAvatarImage load/error listener cleanup | test-reviewer | `test/mount-unmount-coverage` | 2 |
| `alt` attribute removed entirely when null (WCAG 1.1.1) | accessibility-reviewer | `accessibility/missing-alt` | 1 |
| Fallback visible during `loading` overlaps with image alt content | accessibility-reviewer | `accessibility/visibility-state-overlap` | 1 |
| `queueMicrotask + querySelectorAll` for structural warnings in child connectedCallback | lit-reviewer | `lit/structural-warnings-mechanism` | 1 |
| `data-visible` not registered in docs/vocabulary.md | headless-reviewer | `headless/vocabulary-registration` | 1 |
| `:host([data-...])` display-override selectors missing WHY comments | headless-reviewer | `headless/display-comment` | 1 |
| No sibling-composition test | test-reviewer | `test/sibling-composition` | 1 |
| Event sequence asserted with `.include()` instead of ordered `deep.equal()` | test-reviewer | `test/event-sequence-assertion` | 1 |
| Listeners lost on disconnect/reconnect (firstUpdated runs once) | lit-reviewer | `lit/listener-reconnect` | 1 |

Actions taken: (1) Added engine-onChange dispatch pattern to `vollgas/refs/lit-patterns.md` Rule 2. (2) Added Required Coverage section to `vollgas/refs/test-patterns.md` mandating mount/unmount tests for any component with listener/subscription cleanup.

---

## 2026-05-01 — add-collapsible

| Finding | Reviewer | Category | Occurrences |
|---------|----------|----------|-------------|
| Missing `@csspart` JSDoc on trigger and panel | headless-reviewer | `headless/jsdoc` | 2 |
| Missing `@cssproperty` JSDoc for CSS custom properties | headless-reviewer | `headless/jsdoc` | 2 |
| Panel `:host { display }` missing prescribed comment | headless-reviewer | `headless/display-comment` | 2 |
| Imperative `toggleAttribute` for `data-*` attributes | lit-reviewer | `lit/attribute-sync` | 1 |
| Missing `@element` JSDoc on all element classes | api-reviewer | `api/jsdoc` | 3 |
| Missing `@fires` JSDoc for `grund-open-change` | api-reviewer | `api/jsdoc` | 3 |
| Missing `@slot` JSDoc on all element classes | api-reviewer | `api/jsdoc` | 3 |
| Missing mount/unmount memory test for `beforematch` listener | test-reviewer | `test/mount-unmount-coverage` | 3 |

Actions taken: Added `@cssproperty` to the required JSDoc template in `vollgas/refs/jsdoc-contract.md`. The other JSDoc tags (@element, @slot, @fires, @csspart) were already in the template but not applied during implementation — no contract change needed for those (process gap).
