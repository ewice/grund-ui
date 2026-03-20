---
name: "post-plan-review"
description: "Use after superpowers:executing-plans completes to run the quality
  review pipeline against the files changed by the plan. Bridges Superpowers
  plan execution with the Grund UI reviewer suite."
---

## Overview

`superpowers:subagent-driven-development` or `superpowers:executing-plans`
implements the changes and runs `npm test` at each task boundary. This skill
picks up where that ends: it reads the plan's File Map to know which files
changed, infers which reviewers apply from the Change Set, runs them in
parallel, patches any findings, then validates the build.

This is the seam between Superpowers execution and Grund UI quality gates.
Run it as the final step of every Superpowers-driven change.

## Usage

```
/post-plan-review docs/superpowers/plans/2026-03-19-accordion-guidelines-alignment.md
```

If invoked without a path, look for the most recently modified file under
`docs/superpowers/plans/` and use that.

## Implementation

### Phase 1 — Read the plan

Read the plan file. Extract:

1. **File Map** — the table of files and their roles. These are the files the
   reviewers will scope to. If no File Map table exists, read the task headers
   and collect every `Modify:` / `Create:` / `Delete:` file reference.

2. **Change Set summary** — read the section headers or task titles and classify
   the change types present in this plan:

   | Keyword in headers/titles | Change type |
   |---|---|
   | "API", "property", "event", "interface", "type", "export" | `api` |
   | "ARIA", "keyboard", "accessibility", "role", "focus" | `accessibility` |
   | "register", "sub-part", "element", "compound" | `new-element` |
   | "fix", "restore", "broken", "missing" | `bugfix` |
   | "refactor", "decompose", "rename", "remove", "replace" | `refactor` |
   | "context", "controller", "lifecycle", "willUpdate" | `internal` |

   A single plan may have multiple change types. Collect all that apply.

3. **Spec file reference** — check whether a component API spec exists at
   `docs/specs/{name}.spec.md` (written by `/new-component`). If found, it
   will be used by `spec-compliance-reviewer`.

   Do not use `docs/superpowers/specs/` files for spec-compliance — those are
   change-set design specs (Background / Goals / Change Set format) and are
   incompatible with `spec-compliance-reviewer`'s expected format. They are
   passed as context to other reviewers only.

### Phase 2 — Select reviewers

Always run:
- `guidelines-reviewer` — applies to every change
- `security-reviewer` — applies to every change
- `performance-reviewer` — applies to every change

Add based on change types detected in Phase 1:

| Change type detected | Additional reviewers |
|---|---|
| `api` | `api-surface-reviewer`, `spec-compliance-reviewer` (if `docs/specs/{name}.spec.md` exists) |
| `accessibility` | `accessibility-reviewer`, `test-coverage-reviewer` |
| `new-element` | `accessibility-reviewer`, `api-surface-reviewer`, `test-coverage-reviewer`, `story-reviewer` |
| `bugfix` | `test-coverage-reviewer` |
| `refactor` | _(no additions — base three + Phase 5 consistency check)_ |
| `internal` | _(no additions — base three cover this)_ |

`consistency-reviewer` is intentionally excluded from this table — it requires
the full `src/components/` directory for meaningful cross-component comparison
and runs separately in Phase 5.

Also add `story-reviewer` if the plan's File Map includes any `stories/` file.

If the plan touches more than 5 files across multiple change types, run all
reviewers except `consistency-reviewer` (which stays in Phase 5 regardless).

### Phase 3 — Run reviewers (parallel)

Spawn all selected reviewer agents simultaneously. Each agent receives:
- The list of changed files from Phase 1
- The Superpowers design spec (if one exists at `docs/superpowers/specs/`)
- The component name and the nature of the change

Collect all JSON findings. Apply the same filter as `/implement`:
- Keep findings with confidence ≥ 80
- Keep all `blocker` findings regardless of confidence
- Discard `suggestion` severity findings

### Phase 4 — Patch loop

**Iteration limit: 2.** After 2 failed iterations, escalate.

For each remaining finding (blockers and warnings):
1. Spawn one patch agent scoped to the finding JSON + the affected file
2. Patch agent reads the file, applies the fix, returns

After all patches, re-run only the reviewers that had findings.

**If findings clear:** proceed to Phase 5.

**If findings persist after iteration 2:**
- Run `/diagnose-failure` for each persistent finding
- Report diagnosis to the engineer
- Do not attempt a third iteration

Fixes from the patch loop should be staged and committed as a single fixup
commit at the end:
```bash
git add <changed files>
git commit -m "fix(<component>): quality-gate fixes from post-plan-review"
```

### Phase 5 — Consistency check

If any `new-element` or `api` change types were detected, run
`consistency-reviewer` against the changed files and `src/components/`.

Surface any blockers to the engineer — these are typically naming issues that
require a targeted fix rather than automated patching.

### Phase 6 — Build validation

Run `/validate-build`. This executes lint, build, tests, and CEM analysis.

If any step fails: report the failures. Do not mark the plan as complete.

### Phase 7 — Report

```
## Post-Plan Review: {plan filename}

### Files reviewed
- {list from File Map}

### Reviewers run
- guidelines-reviewer: PASS
- security-reviewer: PASS
- performance-reviewer: PASS (1 warning suppressed)
- accessibility-reviewer: PASS
- test-coverage-reviewer: PASS

### Patch loop
- Iteration 1: 2 findings patched (guidelines, performance)
- Iteration 2: PASS

### Build validation
- Lint: PASS
- Build: PASS
- Tests: PASS (38 passing)
- CEM: PASS

### Suppressed findings
- [SUPPRESSED] performance-reviewer: "..." — reason: ...

### Result
PASS — plan is complete and quality-gated.
```

## Note on plan authoring

Superpowers-generated plans should include a final task that calls this skill:

```markdown
## Final Task: Quality Gate

- [ ] Run `/post-plan-review {this-plan-file-path}` and resolve any findings
```

If the plan does not include this task, add it manually before closing out
the plan.

## Common Mistakes

- **Running before all plan tasks are complete.** Finish `superpowers:executing-plans`
  first. This skill reviews the final state, not intermediate states.
- **Skipping the patch loop.** Findings from reviewers are not advisory for
  this library — blockers must be resolved before the plan is marked complete.
- **Not committing the fixup.** Patch loop changes must be committed separately
  so the plan's own commits remain clean.
