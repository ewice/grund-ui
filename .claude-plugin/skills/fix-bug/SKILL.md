---
name: "fix-bug"
description: "Use to fix a reported defect — something that worked before or violates the spec. TDD mandatory: reproduces in a failing test first, then applies the minimal fix. For intentional behavior changes (new property, changed event, new sub-part), use /modify-component instead."
---

## Overview

Bug → failing test (RED) → root cause → minimal fix (GREEN) → targeted review → cross-component audit → `/validate-build`. Never fix a bug without a test that would have caught it.

## Usage

```
/fix-bug accordion -- selecting item via keyboard doesn't fire grund-change
/fix-bug dialog -- focus not restored to trigger on close
```

## Implementation

### Step 1 — Reproduce (RED)

Locate the component: `src/components/{name}/`.

Write a failing test that exactly reproduces the reported behavior. Run it:

```bash
npm run test:run -- src/components/{name}/
```

Confirm the test fails for the right reason — the described behavior, not an import error or syntax issue.

If you cannot write a failing test because the root cause is unknown: invoke `superpowers:systematic-debugging` before writing any code.

### Step 2 — Root cause

Read the relevant source files. Identify which layer owns the bug:
- **Controller** — wrong state resolution, action fires wrong state transition, event not dispatched
- **Element** — wrong lifecycle phase (e.g., DOM side effect in `willUpdate`), context misconfiguration, ARIA attribute missing or wrong value
- **Registry** — wrong item tracking, trigger↔panel ID mismatch

If root cause is unclear after reading the code: invoke `superpowers:systematic-debugging`.

### Step 3 — Fix (GREEN)

Apply the minimal change that makes the failing test pass without breaking any existing tests.

```bash
npm run test:run -- src/components/{name}/
```

All tests must pass. If fixing the bug requires changing other tests: that is a red flag — investigate whether those tests were wrong or whether the fix is breaking a valid contract.

### Step 4 — Targeted review

Read `.claude-plugin/refs/reviewer-dispatch.md` for the change-type selection table and context injection rules. Classify the bug fix by change type (typically "Bug fix", but use "Accessibility or keyboard change" if the fix is ARIA/focus-related, etc.). Select reviewers per the dispatch table.

Read each selected reviewer's SKILL.md from `.claude-plugin/reviewers/{name}/SKILL.md`. Use its content as the Agent prompt. Dispatch as Agent calls, injecting context per the dispatch table.

### Step 5 — Cross-component audit

If the bug could exist in other components (same pattern, shared controller, or common idiom): run `/audit-cross-component -- {one-sentence description of the pattern}`. Fix all affected components before proceeding.

Skip this step only if the bug is clearly specific to one component's unique logic.

### Step 6 — Validate

Run `/validate-build`.

### Step 7 — Commit

```bash
git add <affected files>
git commit -m "fix({name}): <one-line description of what was fixed>"
```

## Common Mistakes

- **Fixing without a failing test.** The test is the proof the bug existed and won't regress.
- **Changing unrelated code.** Minimal fix only. Refactoring is a separate commit.
- **Updating existing tests to pass instead of fixing the code.** Existing tests document intended behavior — update them only if the spec changed.
- **Skipping `security-reviewer`.** Listener leaks and XSS vectors hide in bug fixes.
- **Skipping cross-component audit.** If the same pattern exists elsewhere, the same bug exists elsewhere.
