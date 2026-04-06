---
name: "validate-build"
description: "Use after implementation or modification to verify build, tests, lint, CEM, and bundle size all pass. Run all steps even if one fails — the engineer needs the full picture. Pass --cross-browser for Firefox + WebKit coverage."
---

## Overview

Runs the full project toolchain and reports results. No code changes — read-only verification. Run all steps even if one fails — the engineer needs the full picture.

## Usage

```
/validate-build
/validate-build --cross-browser
```

## Implementation

### Step 1 — Lint

```bash
npm run lint
```

Failure: report each error with file and line. Auto-fixable issues: suggest `npm run lint -- --fix`.

### Step 2 — TypeScript build

```bash
npm run build
```

Failure: report TypeScript errors with file, line, and error message. Common causes: missing exports, type mismatches, unused imports.

### Step 3 — Tests

```bash
npm run test:run
```

**`--cross-browser` flag:** When passed, run Firefox and WebKit in addition to the default Chromium:

```bash
npm run test:run -- --project=components-firefox --project=components-webkit
```

Use `--cross-browser` for:
- `/prepare-release` (required)
- `/update-dependency` (required)
- Any change to focus management, keyboard handling, or Shadow DOM behavior (recommended)

Failure: report failing test name, file, and assertion message. Distinguish test failure (wrong assertion) from test error (runtime exception — typically a missing import or unregistered element).

### Step 4 — CEM analysis and drift check

```bash
npm run analyze
```

If analysis fails: report the error (common cause: JSDoc syntax errors).

After analysis succeeds, check for CEM drift:

```bash
git diff --exit-code custom-elements.json
```

If the CEM has drifted from the committed version: report the diff as a failure. Surface to the engineer — they must run `git add custom-elements.json && git commit -m "chore: update CEM"` before handoff.

### Step 5 — Export and registration validation

Verify structural integrity of all components. These are fast grep checks — no AI needed.

**Barrel export completeness:** Every element class under `src/components/*/` must be re-exported from its component's barrel file (`src/components/{name}/index.ts`).

```bash
# List all customElements.define() tags
grep -rh "customElements.define(" src/components/ --include="*.ts" | grep -oP "'grund-[^']+'" | sort > /tmp/defined-tags.txt
# List all exports from barrel files (index.ts per component directory)
for dir in src/components/*/; do
  [ -f "$dir/index.ts" ] && grep -h "export" "$dir/index.ts"
done | sort > /tmp/barrel-exports.txt
```

Report any element that is defined but not exported from its barrel.

**Duplicate tag detection:** No two files may register the same custom element tag name.

```bash
grep -rn "customElements.define(" src/components/ --include="*.ts" | sort -t"'" -k2 | uniq -d -f1
```

Report duplicates as blockers.

**Package.json exports map completeness:** Every component directory `src/components/{name}/` with a barrel `index.ts` must have a corresponding `"./{name}"` entry in `package.json` `exports`.

```bash
for dir in src/components/*/; do
  name=$(basename "$dir")
  if [ -f "$dir/index.ts" ]; then
    grep -q "\"\./$name\"" package.json || echo "MISSING exports entry: ./$name"
  fi
done
```

Report any missing entry as a failure.

**CEM-vs-code consistency:** After CEM analysis (Step 4), verify every `@element` JSDoc tag in source has a matching entry in `custom-elements.json`. Report any element present in code but missing from CEM.

### Step 6 — Bundle size check

```bash
npm run build:bundle-stats 2>/dev/null || echo "SKIP: no bundle-stats script"
```

If the script exists and fails: report which component exceeds its budget. Budget is defined per-component in `package.json` → `bundleSize` (if configured). If the key is absent: skip silently.

### Step 7 — Summary

```
LINT:         PASS | FAIL (N errors)
BUILD:        PASS | FAIL (N errors)
TESTS:        PASS | FAIL (N failing / M total)
CEM:          PASS | FAIL | DRIFT
EXPORTS:      PASS | FAIL (N issues)
BUNDLE:       PASS | FAIL (N over budget) | SKIP
CROSS-BROWSER: SKIP | PASS | FAIL

RESULT: ALL PASS | BLOCKED (list failing steps)
```

If ALL PASS: proceed to Step 8.
If BLOCKED: list failing steps with enough detail to diagnose. Do not fix — report and stop.

**System health reminder:** After every 3rd new component (count `src/components/` directories), append to the summary: `Consider a reviewer/refs audit — 3+ components since last check.`

### Step 8 — Reviewer Feedback Loop

```bash
test -f vollgas/.feedback-queue.md && echo "QUEUE_EXISTS" || echo "QUEUE_EMPTY"
```

**If `QUEUE_EMPTY`:** no post-reviewer fixes were recorded — proceed to `vollgas:finishing-a-development-branch`.

**If `QUEUE_EXISTS`:** dispatch a subagent with the following prompt:

> Read `vollgas/.feedback-queue.md` and `vollgas/refs/reviewer-dispatch.md`.
> For each entry in the queue, execute the Reviewer Feedback Loop (Step 2) from
> reviewer-dispatch.md. After processing each entry, delete it from the queue file.
> Delete the file entirely when all entries are cleared.
> Work through entries one at a time. For each:
> - classify (correctness / quality)
> - identify the reviewer scope
> - check whether an existing rule covers it; if so, note the miss
> - if no rule covers it, draft and validate a new rule
> Report what was done for each entry.

Do not proceed to `vollgas:finishing-a-development-branch` until the subagent completes and the queue file is gone.

## Common Mistakes

- **Skipping steps after first failure.** Run all steps — multiple failures are common.
- **Attempting to fix failures.** This skill is read-only. Report and stop.
- **Forgetting CEM drift.** Any JSDoc or property change must be followed by `npm run analyze` + committing the updated CEM.
