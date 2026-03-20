---
name: "validate-build"
description: "Use after implementation or modification to verify that build, tests,
  lint, and CEM analysis all pass. Triggered by implement (Phase 6) and
  modify-component (Phase 5), or manually before committing."
---

## Overview

Runs the project toolchain and reports results. No code changes — only
verification. If any step fails, reports the failure clearly so the engineer
or a patch agent can fix it.

## Implementation

Run each validation step. Report results as they complete.

### Step 1 — Lint

```bash
npm run lint
```

If lint fails: report each error with file and line. These are typically
auto-fixable — suggest `npm run lint -- --fix` or specific code changes.

### Step 2 — TypeScript build

```bash
npm run build
```

If build fails: report TypeScript errors with file, line, and error message.
Common causes: missing exports, type mismatches, unused imports.

### Step 3 — Tests

```bash
npm run test:run
```

If tests fail: report the failing test name, file, and assertion message.
Distinguish between:
- **Test failure** (assertion wrong) — likely a bug in the component or test
- **Test error** (runtime exception) — likely a missing import or registration

### Step 4 — CEM analysis

```bash
npm run analyze
```

If analysis fails: report the error. Common cause: JSDoc syntax errors that
the CEM analyzer cannot parse.

### Step 5 — Summary

Report:

```
LINT:    PASS | FAIL (N errors)
BUILD:   PASS | FAIL (N errors)
TESTS:   PASS | FAIL (N failing, M total)
CEM:     PASS | FAIL

RESULT:  ALL PASS | BLOCKED (list failing steps)
```

If ALL PASS: tell the engineer the component is ready for `/commit`.

If BLOCKED: list the failing steps with enough detail to diagnose. Do not
attempt to fix — the engineer or a patch agent decides what to do.

## Common Mistakes

- **Skipping steps after the first failure.** Run all 4 steps even if one fails.
  Multiple failures are common and the engineer needs the full picture.
- **Attempting to fix failures.** This skill is read-only. Report and stop.
- **Running before reviews pass.** validate-build should run after the review
  loop, not before. Code that fails reviews will often also fail build.
