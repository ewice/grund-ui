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

Actions taken: pending approval
