---
name: "implement"
description: "Use when you have an approved component spec and need to generate
  all files, run the review loop, and produce a commit-ready component. Triggered
  after /new-component spec is approved."
---

## Overview

Orchestrates parallel file generation, then runs a two-gate review loop before
handing off to the engineer. The spec-compliance gate blocks progression to code
quality review. The patch loop runs max 2 iterations before escalating.

## Implementation

### Phase 1 — Generate (parallel)

Spawn one Agent per file group simultaneously — do not wait between spawns:

- **Agent A** — `src/components/{name}/types.ts`, `src/components/{name}/context/`
- **Agent B** — `src/components/{name}/controller/`
- **Agent C** — `src/components/{name}/registry/` (omit if no sibling linking needed)
- **Agent D** — all element files: `root/`, `item/`, and every sub-part element
- **Agent E** — test files under `src/components/{name}/` (derive cases from spec)
- **Agent F** — story file under `stories/`

Each agent receives: the full spec, `src/components/accordion/` as a reference
implementation, and the relevant section of CLAUDE.md.

Await all agents before proceeding.

### Phase 2 — Spec compliance gate

Run the `spec-compliance-reviewer` skill with:
- The approved spec
- All generated files

If it returns **FAIL**: surface the reason to the engineer and stop. Do not
proceed to Phase 3.

### Phase 3 — Quality review (parallel)

Spawn all four reviewer skills simultaneously:

- `guidelines-reviewer` — CLAUDE.md compliance
- `accessibility-reviewer` — APG pattern, ARIA, keyboard contract
- `api-surface-reviewer` — public types, JSDoc completeness, no breaking changes
- `test-coverage-reviewer` — every spec requirement has a test case

Collect all findings. Discard findings with confidence < 80.

### Phase 4 — Patch loop

For each remaining finding, spawn one patch Agent scoped to the finding + the
single affected file. Do not share state between patch agents.

After all patches land, re-run **only** the reviewer skills that had findings.
Do not re-run clean reviewers.

If findings persist after **2 iterations**: report BLOCKED with the unresolved
finding list. Do not attempt a third iteration.

If all findings clear: proceed to Phase 5.

### Phase 5 — Integration check

Run `consistency-reviewer` with:
- All newly generated files
- The full `src/components/` directory

### Phase 6 — Handoff

Report a summary to the engineer:
- Files generated
- Findings caught and resolved
- Any unresolved BLOCKED items
- Suggested next step: `/commit` or address blockers

Do not commit. The engineer decides when to commit.

## Common Mistakes

- **Starting Phase 3 before Phase 2 passes.** Never skip the spec gate.
- **Running the full review fleet after a patch.** Only re-run reviewers that had findings.
- **More than 2 patch iterations.** Escalate to human — the third loop is thrashing.
- **Patch agents sharing state.** One agent, one finding, one file. Isolated.
