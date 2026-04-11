# Review Findings — add-checkbox-group

Date: 2026-04-11
Branch: add-checkbox-group
Rounds: 2

## Findings

### Finding 1
- **Reviewer:** headless-reviewer
- **Description:** `:host { display: block }` missing justifying comment (headless-contract#7)
- **Resolution:** fixed
- **Round:** 1

### Finding 2
- **Reviewer:** headless-reviewer
- **Description:** `@csspart group` missing from class JSDoc (headless-contract#12)
- **Resolution:** fixed
- **Round:** 1

### Finding 3
- **Reviewer:** headless-reviewer
- **Description:** `@slot` missing from class JSDoc (headless-contract#19)
- **Resolution:** fixed
- **Round:** 1

### Finding 4
- **Reviewer:** headless-reviewer
- **Description:** `label` property missing — consumers had no way to set an accessible group label without using `ariaLabel` (headless-contract#28)
- **Resolution:** fixed
- **Round:** 1

### Finding 5
- **Reviewer:** api-reviewer
- **Description:** Class JSDoc missing `@element`, `@slot`, `@fires`, `@csspart` tags (api-contract#9-11)
- **Resolution:** fixed
- **Round:** 1

### Finding 6
- **Reviewer:** api-reviewer
- **Description:** `allValues` property missing `@deprecated` JSDoc with migration path (api-contract#12)
- **Resolution:** fixed
- **Round:** 1

### Finding 7
- **Reviewer:** api-reviewer
- **Description:** Runtime deprecation warning missing removal version reference
- **Resolution:** fixed
- **Round:** 1

### Finding 8
- **Reviewer:** api-reviewer
- **Description:** Newly added `label` property had no JSDoc; `label` > `ariaLabel` precedence is non-obvious consumer behavior (api-contract#13)
- **Resolution:** fixed
- **Round:** 2

### Finding 9
- **Reviewer:** lit-reviewer
- **Description:** `_registerItem`/`_unregisterItem` called `_publishGroupContext()` synchronously inside child's `willUpdate`, causing O(N) context recreations on every initial render (lit-patterns#15)
- **Resolution:** fixed
- **Round:** 1

### Finding 10
- **Reviewer:** lit-reviewer
- **Description:** Same cascade path triggered O(N) `requestUpdate` calls on all context consumers (lit-patterns#4)
- **Resolution:** fixed
- **Round:** 1

### Finding 11
- **Reviewer:** code-quality-reviewer
- **Description:** Registration callbacks mutating parent `@state` (context) during child's update cycle — caused cascading updates proportional to child count
- **Resolution:** fixed via `_registryDirty` flag pattern
- **Round:** 1

### Finding 12
- **Reviewer:** test-reviewer
- **Description:** T1: test asserted on internal `groupCtx` object identity instead of observable `aria-checked` behavior
- **Resolution:** fixed
- **Round:** 1

### Finding 13
- **Reviewer:** test-reviewer
- **Description:** T2: no test verifying `removeEventListener` cleanup on disconnect (test-patterns mount/unmount recipe)
- **Resolution:** fixed
- **Round:** 1

### Finding 14
- **Reviewer:** test-reviewer
- **Description:** T3: no test verifying sibling-group isolation
- **Resolution:** fixed
- **Round:** 1

### Finding 15
- **Reviewer:** test-reviewer
- **Description:** T4: no Storybook `play` function on grouped stories
- **Resolution:** fixed
- **Round:** 1

### Finding 16
- **Reviewer:** test-reviewer
- **Description:** T5: no test for child removal updating parent aggregate state
- **Resolution:** fixed
- **Round:** 1

### Finding 17
- **Reviewer:** test-reviewer
- **Description:** T6: no reparenting test (checkbox moved between groups)
- **Resolution:** fixed
- **Round:** 1

### Finding 18
- **Reviewer:** test-reviewer
- **Description:** T7: no test for children appended dynamically after group mounts
- **Resolution:** fixed
- **Round:** 1
