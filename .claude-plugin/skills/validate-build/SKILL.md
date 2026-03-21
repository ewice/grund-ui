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

**Barrel export completeness:** Every element class under `src/components/*/` must be re-exported from its component's `index.ts`.

```bash
# List all customElements.define() tags
grep -rh "customElements.define(" src/components/ --include="*.ts" | grep -oP "'grund-[^']+'" | sort > /tmp/defined-tags.txt
# List all exports from barrel files
grep -rh "export" src/components/*/index.ts --include="*.ts" | sort > /tmp/barrel-exports.txt
```

Report any element that is defined but not exported from its barrel.

**Duplicate tag detection:** No two files may register the same custom element tag name.

```bash
grep -rn "customElements.define(" src/components/ --include="*.ts" | sort -t"'" -k2 | uniq -d -f1
```

Report duplicates as blockers.

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

If ALL PASS: component is ready for commit or handoff.
If BLOCKED: list failing steps with enough detail to diagnose. Do not fix — report and stop.

**System health reminder:** After every 3rd new component (count `src/components/` directories), append to the summary: `💡 Consider running /review-system-health — 3+ components since last audit.`

## Common Mistakes

- **Skipping steps after first failure.** Run all steps — multiple failures are common.
- **Attempting to fix failures.** This skill is read-only. Report and stop.
- **Forgetting CEM drift.** Any JSDoc or property change must be followed by `npm run analyze` + committing the updated CEM.
