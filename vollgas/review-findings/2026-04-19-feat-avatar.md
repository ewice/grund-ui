# Review Findings — feat-avatar

Date: 2026-04-19
Branch: feat/avatar
Rounds: 2

## Findings

### Finding 1 (Round 1 — resolved)
- **Reviewer:** accessibility-reviewer
- **Description:** `alt=${this.alt ?? nothing}` removed the `alt` attribute entirely when null; an `<img>` with `src` but no `alt` fails WCAG 1.1.1
- **Resolution:** fixed — changed to `alt=${this.alt ?? ''}` in avatar-image.ts
- **Round:** 1

### Finding 2 (Round 1 — resolved)
- **Reviewer:** accessibility-reviewer
- **Description:** Fallback visible during `loading` state caused potential duplicate screen-reader content alongside the image alt
- **Resolution:** fixed — `shouldBeVisible` now requires `status === 'idle' || status === 'error'`
- **Round:** 1

### Finding 3 (Round 1 — resolved)
- **Reviewer:** lit-reviewer
- **Description:** `grund-status-change` dispatched in `willUpdate()` before DOM updated; listeners querying `data-status` saw the old value (Rule 2)
- **Resolution:** fixed — event dispatch moved to `updated()`
- **Round:** 1

### Finding 4 (Round 1 — resolved)
- **Reviewer:** lit-reviewer
- **Description:** `_previousStatus` null-guard design tension as secondary symptom of Finding 3
- **Resolution:** fixed — tracking now only in `updated()`
- **Round:** 1

### Finding 5 (Round 1 — resolved)
- **Reviewer:** lit-reviewer
- **Description:** Structural warnings (duplicate children) used `queueMicrotask + querySelectorAll` in child `connectedCallback` — violates Rules 40/42
- **Resolution:** fixed — moved to root `firstUpdated()` with `slotchange` listener
- **Round:** 1

### Finding 6 (Round 1 — resolved)
- **Reviewer:** headless-reviewer
- **Description:** `data-visible` attribute (public styling hook on `<grund-avatar-fallback>`) not registered in `docs/vocabulary.md`
- **Resolution:** fixed — row added to Data Attributes table in vocabulary.md
- **Round:** 1

### Finding 7 (Round 1 — resolved)
- **Reviewer:** headless-reviewer
- **Description:** `:host([data-status='loaded'])` and `:host([data-visible])` override selectors missing required WHY comments (Rule 7)
- **Resolution:** fixed — WHY comments added to both selectors
- **Round:** 1

### Finding 8 (Round 1 — resolved)
- **Reviewer:** test-reviewer
- **Description:** No mount/unmount test for `GrundAvatar` engine.onChange subscription cleanup
- **Resolution:** fixed — test added to avatar.test.ts
- **Round:** 1

### Finding 9 (Round 1 — resolved)
- **Reviewer:** test-reviewer
- **Description:** No mount/unmount test for `GrundAvatarImage` load/error listener cleanup
- **Resolution:** fixed — test added to avatar-image.test.ts
- **Round:** 1

### Finding 10 (Round 1 — resolved)
- **Reviewer:** test-reviewer
- **Description:** No sibling-composition test to verify two `<grund-avatar>` instances don't share context
- **Resolution:** fixed — test added to avatar.test.ts
- **Round:** 1

### Finding 11 (Round 1 — resolved)
- **Reviewer:** test-reviewer
- **Description:** Event sequence test used `.include()` instead of ordered `deep.equal(['loading', 'error'])`
- **Resolution:** fixed — changed to `deep.equal`
- **Round:** 1

### Finding 12 (Round 2 — ESCALATED)
- **Reviewer:** lit-reviewer
- **Description:** `GrundAvatarImage` loses its `load`/`error` listeners after disconnect/reconnect. `firstUpdated()` attaches them once; `disconnectedCallback()` removes them; no reconnect re-attachment exists. After reconnect, image status transitions are never reported to the root — the component silently stops working.
- **Resolution:** escalated — present in code after all Round 1 fixes; requires BLOCKER fix before ship
- **Round:** 2
