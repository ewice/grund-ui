---
name: "fix-bug"
description: "Use to fix a reported bug in an existing component. Follows TDD: reproduces in a failing test first, then applies the minimal fix. Use /diagnose-failure if root cause is unclear after reading the code."
---

## Overview

Bug → failing test (RED) → root cause → minimal fix (GREEN) → targeted review → `/validate-build`. Never fix a bug without a test that would have caught it.

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

Read the relevant reviewer SKILL.md files from `.claude-plugin/reviewers/{name}/SKILL.md`. Use each file's content as the Agent prompt. Dispatch as Agent calls. Read and inject the changed file contents as context.

| Modified layer | Reviewers |
|---|---|
| Controller only | `lit-reviewer`, `security-reviewer` |
| Elements | `lit-reviewer`, `headless-reviewer`, `accessibility-reviewer`, `security-reviewer` |
| ARIA or focus behavior | `accessibility-reviewer`, `security-reviewer` |
| Events or types | `api-reviewer`, `security-reviewer` |
| Tests only | `test-reviewer` |

### Step 5 — Validate

Run `/validate-build`.

### Step 6 — Commit

```bash
git add <affected files>
git commit -m "fix({name}): <one-line description of what was fixed>"
```

## Common Mistakes

- **Fixing without a failing test.** The test is the proof the bug existed and won't regress.
- **Changing unrelated code.** Minimal fix only. Refactoring is a separate commit.
- **Updating existing tests to pass instead of fixing the code.** Existing tests document intended behavior — update them only if the spec changed.
- **Skipping `security-reviewer`.** Listener leaks and XSS vectors hide in bug fixes.
