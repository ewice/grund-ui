---
name: "post-plan-review"
description: "Use after superpowers:executing-plans or superpowers:subagent-driven-development completes to run the quality review pipeline against files changed by the plan. Bridges Superpowers plan execution with the Grund UI reviewer suite."
---

## Overview

Quality gate after Superpowers-planned changes. Reads the plan's file map, infers reviewer selection from change types, runs selected reviewers from the 6-reviewer suite, patches findings (max 2 iterations), then validates the build.

## Usage

```
/post-plan-review docs/superpowers/plans/2026-03-19-accordion-guidelines-alignment.md
```

If invoked without a path: use the most recently modified file under `docs/superpowers/plans/`.

## Implementation

### Phase 1 — Read the plan

Read the plan file. Extract:

1. **File Map** — all files listed as `Create:`, `Modify:`, or `Delete:`. These are the files the reviewers will scope to.

2. **Change types** — read the task titles and classify using the keyword-to-change-type mapping in `.claude-plugin/refs/reviewer-dispatch.md`. A plan may have multiple change types.

3. **Component spec** — check whether `docs/specs/{name}.spec.md` exists. If found, pass it to `api-reviewer` and `accessibility-reviewer`.

### Phase 2 — Select reviewers

Use the change-type selection table in `.claude-plugin/refs/reviewer-dispatch.md` to determine which reviewers to run.

### Phase 3 — Run reviewers (parallel)

Read `.claude-plugin/refs/reviewer-dispatch.md` for context injection rules. Read each selected reviewer's SKILL.md from `.claude-plugin/reviewers/{name}/SKILL.md`. Use its content as the Agent prompt. Dispatch all selected reviewers as simultaneous Agent calls, injecting context per the dispatch table.

### Phase 4 — Patch loop

**Max 2 iterations.** For each blocker:
1. Fix the blocker in the affected file
2. Re-run only the reviewer that flagged it

After 2 iterations, if blockers persist: invoke `/diagnose-failure` for each and surface to the engineer.

Commit all patch-loop fixes as a single commit:
```bash
git add <changed files>
git commit -m "fix(<component>): quality-gate fixes from post-plan-review"
```

### Phase 4.5 — Smallest diff audit

Run `/smallest-diff` on the patch-loop changes. If patches introduced dead code or diff noise, clean up before proceeding.

### Phase 5 — Build validation

Run `/validate-build`.

### Phase 6 — Report

```
## Post-Plan Review: {plan filename}

### Files reviewed
- {list from File Map}

### Reviewers run
- accessibility-reviewer: PASS | FAIL (N blockers)
- lit-reviewer: PASS
- headless-reviewer: PASS
- api-reviewer: PASS
- test-reviewer: PASS
- security-reviewer: PASS

### Patch loop
- Iteration 1: N blockers patched
- Iteration 2: PASS | escalated to /diagnose-failure

### Build validation
- Lint: PASS | Build: PASS | Tests: PASS | CEM: PASS

### Result
PASS — plan is complete and quality-gated.
```

## Common Mistakes

- **Running before all plan tasks complete.** Finish plan execution first. This skill reviews the final state, not intermediate states.
- **Skipping the patch loop.** Blockers must be resolved before marking the plan complete.
- **Not committing the fixup.** Patch-loop changes must be committed separately so the plan's own commits remain clean.
