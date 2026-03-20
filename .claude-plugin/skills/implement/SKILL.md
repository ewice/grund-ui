---
name: "implement"
description: "Use when you have an approved component spec and need to generate
  all files, run the review loop, and produce a commit-ready component. Triggered
  after /new-component spec is approved."
---

## Overview

Orchestrates parallel file generation, then runs a gated review loop before
handing off to the engineer. The spec-compliance gate blocks progression to code
quality review. The patch loop runs max 2 iterations before escalating via
`/diagnose-failure`.

For an existing component, use `/modify-component` instead.

## Implementation

### Phase 1 — Generate (parallel)

Spawn one Agent per file group simultaneously — do not wait between spawns.
Each agent receives the full spec from `docs/specs/{name}.spec.md` and should
read `src/components/accordion/` as the reference implementation.

- **Agent A** — `types.ts` and `context/` (context interfaces, symbols, index)
- **Agent B** — `controller/` (controller class, types, constants)
- **Agent C** — `registry/` (omit if the spec has no sibling linking)
- **Agent D** — all element files: `root/`, `item/`, and every sub-part
- **Agent E** — test files (derive cases from the spec's public API, events,
  keyboard, ARIA, controlled/uncontrolled sections)
- **Agent F** — story file under `stories/`

Await all agents before proceeding.

### Phase 2 — Spec compliance gate

Run `spec-compliance-reviewer` with the spec and all generated files.

Parse the JSON output. If any requirement has status `MISSING` or `PARTIAL`:
stop and surface the failures to the engineer. Do not proceed to Phase 3.

### Phase 3 — Quality review (parallel)

Spawn all four reviewer agents simultaneously:

- `guidelines-reviewer`
- `accessibility-reviewer`
- `api-surface-reviewer`
- `test-coverage-reviewer`

Each reviewer returns JSON findings. Collect all findings. Filter:
- Keep findings with confidence ≥ 80
- Keep all `blocker` severity findings regardless of confidence
- Discard `suggestion` severity findings (address after handoff if desired)

### Phase 4 — Patch loop

**Iteration limit: 2.** After 2 failed iterations, escalate.

For each remaining finding:
1. Spawn one patch Agent scoped to the finding JSON + the affected file
2. The patch agent reads the file, applies the fix, and returns

After all patches land, re-run **only** the reviewer(s) that had findings.
Do not re-run clean reviewers.

**If findings clear:** proceed to Phase 5.

**If findings persist after iteration 2:**
- Run `/diagnose-failure` for each persistent finding
- Report the diagnosis to the engineer
- Do not attempt a third iteration

### Phase 5 — Consistency check

Run `consistency-reviewer` with all generated files + `src/components/`.

Parse findings. Blockers here are typically naming issues that require
regenerating files — surface them to the engineer rather than patching.

### Phase 6 — Build validation

Run `/validate-build`. This executes lint, build, tests, and CEM analysis.

If any step fails: report the failures alongside the review results.
Do not hand off code that doesn't build.

### Phase 7 — Handoff

Report a summary:

```
## Implementation Summary

### Files generated
- src/components/{name}/... (list all)
- stories/{name}.stories.ts

### Review results
- Spec compliance: PASS
- Guidelines: PASS
- Accessibility: PASS (1 warning suppressed — see below)
- API surface: PASS
- Test coverage: PASS
- Consistency: PASS

### Build validation
- Lint: PASS
- Build: PASS
- Tests: PASS (42 passing)
- CEM: PASS

### Suppressed findings
- [FALSE_POSITIVE] guidelines-reviewer: "..." — reason: ...

### Next step
Ready for /commit.
```

Do not commit. The engineer decides when to commit.

## Common Mistakes

- **Starting Phase 3 before Phase 2 passes.** Never skip the spec gate.
- **Running the full review fleet after a patch.** Only re-run reviewers that
  had findings.
- **More than 2 patch iterations.** Use `/diagnose-failure` instead.
- **Patch agents sharing state.** One agent, one finding, one file. Isolated.
- **Skipping Phase 6.** Code that passes reviews but fails to build is useless.
- **Handing off without a summary.** The engineer needs the full picture.
