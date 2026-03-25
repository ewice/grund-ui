---
name: "smallest-diff"
description: "Use after implementation to verify the diff is minimal and clean. Checks for dead code, speculative additions, unnecessary touched files, and diff noise. Run before committing or after reviewer patches. Read-only — reports findings but does not fix."
---

## Overview

Audits the current uncommitted or branch diff for unnecessary changes. The goal: every line in the diff should be traceable to an explicit requirement. Code that "might be useful later," files touched without meaningful change, and leftover debugging artifacts are flagged.

This skill complements `/validate-build` (which checks correctness) with a cleanliness gate.

## Usage

```
/smallest-diff
/smallest-diff --base main
```

Without `--base`: audits uncommitted changes (`git diff` + `git diff --cached`).
With `--base <ref>`: audits the full branch diff (`git diff <ref>...HEAD`).

## Implementation

### Step 1 — Collect the diff

```bash
# Uncommitted mode (default)
git diff --stat
git diff --cached --stat
git diff
git diff --cached

# Branch mode (--base provided)
git diff <base>...HEAD --stat
git diff <base>...HEAD
```

### Step 2 — Analyze each changed file

For every file in the diff, check the following. Report findings per file.

#### Dead code (blocker)

- **Unreachable code paths:** Functions or branches that can never execute given the current call sites. Example: `firstUpdated()` that reads a registry that is always empty at that lifecycle point.
- **Unused imports:** Imports that are not referenced anywhere in the file.
- **Unused variables or parameters:** Declared but never read.

#### Speculative code (blocker)

- **Features not in the spec or task description:** Code that handles scenarios not required by the current task. Example: adding `keepMounted` support when the task only asked for basic show/hide.
- **Premature abstractions:** Helpers, utilities, or base classes created for a single use site. The second use should trigger `/extract-pattern`.
- **Configuration for hypothetical future requirements:** Feature flags, options objects, or parameters that have only one possible value in the current codebase.

#### Diff noise (warning)

- **Files touched without meaningful change:** Whitespace-only changes, import reordering without additions/removals, reformatting that lint didn't require.
- **Comments describing WHAT the code does:** Comments should explain WHY. Self-evident code needs no comment. Flag comments like `// Set the value` or `// Loop through items`.
- **Redundant type annotations:** TypeScript infers return types and variable types — explicit annotations on internal code add noise unless they improve readability at call sites.
- **Console.log or debugger statements:** Leftover debugging artifacts.

#### Scope creep (warning)

- **Refactoring unrelated code:** Renaming variables, extracting functions, or restructuring code that was not part of the task.
- **Updating tests for changed behavior when the behavior change was not requested:** If a test was changed to make it pass (rather than the code being fixed), flag it.
- **Adding docstrings or type annotations to unchanged code:** JSDoc should only be added to new or modified code.

### Step 3 — Cross-file analysis

- **Are all new files necessary?** Flag any new file that could have been an edit to an existing file instead.
- **Are all touched files relevant to the task?** List each file and its relationship to the task. Flag files that don't have an obvious connection.

### Step 4 — Report

```
## Smallest Diff Audit

### Summary
Files changed: N
Lines added: N | Lines removed: N
Blockers: N | Warnings: N

### Blockers
- [file:line] Dead code: `firstUpdated()` auto-selection is unreachable (registry empty at this lifecycle point)
- [file:line] Speculative: `keepMounted` prop added but not in the task spec

### Warnings
- [file:line] Diff noise: comment describes what code does, not why
- [file] Scope creep: reformatted imports in unrelated file

### Clean files
- [file] — minimal, relevant change

### Verdict
CLEAN — diff is minimal and every change is traceable to the task.
NEEDS_CLEANUP — N blockers must be addressed before commit.
```

## Integration Points

- **After `/build-elements` Step 3** (before reviewers): catch dead code before the 6-reviewer dispatch.
- **After `/post-plan-review` Phase 4** (after patches): verify patches didn't introduce noise.
- **Before `/prepare-release`**: final cleanliness gate.
- **Standalone**: run anytime to audit uncommitted work.

## Common Mistakes

- **Fixing issues found by this skill.** This skill is read-only. Report and stop. The engineer or orchestrator decides what to clean up.
- **Flagging test code as speculative.** Tests for edge cases are NOT speculative — they're defensive. Only flag test code that tests functionality not present in the implementation.
- **Flagging `@internal` JSDoc as unnecessary.** Internal annotations serve CEM filtering and are always required on non-public exports.
