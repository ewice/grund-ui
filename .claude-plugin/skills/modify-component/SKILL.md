---
name: "modify-component"
description: "Use when changing an existing component — adding a property, changing
  an event, fixing a bug, or adding a sub-part. Use this instead of /implement
  for any change to a component that already exists."
---

## Overview

Most work is changes, not greenfield. This skill runs a targeted subset of the
review pipeline scoped to only the files that changed.

## Usage

```
/modify-component accordion — add loopFocus property
/modify-component tabs — fix keyboard navigation in horizontal mode
/modify-component dialog — add hidden-until-found support
```

## Implementation

### Phase 1 — Scope the change

Ask:
1. Which component? (must already exist in `src/components/`)
2. What is the change? (one sentence)
3. Does the spec need updating? Check for a spec in either location:
   - `docs/specs/{name}.spec.md` (created by `/new-component`)
   - `docs/superpowers/specs/` (created by Superpowers design review)

   If the change affects the public API (new property, changed event, new
   element) and a spec exists, update it first.

If the spec needs updating, update it now before touching code. If no spec
exists, skip this step — the accordion predates the spec system.

**If a Superpowers plan exists for this change** (`docs/superpowers/plans/`),
use `/post-plan-review` instead of this skill. `/modify-component` is for
ad-hoc changes; Superpowers-planned changes have their own execution and review
path.

### Phase 2 — Identify affected files

Based on the change description, identify which files will be touched:

| Change type | Files affected |
|---|---|
| New property on root | root/{name}.ts, controller, types.ts, test, story |
| New property on item | item/{name}-item.ts, context, types.ts, test, story |
| New event | controller, types.ts, root or item (dispatch site), test |
| New sub-part element | new element file, context (add registration), registry, test |
| Bug fix | typically controller or element + test |
| Keyboard change | root (RovingFocusController config), test |

List the affected files explicitly before proceeding. Do not touch files that
are not affected.

### Phase 3 — Make the change

Edit the affected files. Follow the same patterns as the existing code in the
component. Reference the accordion implementation for any ambiguity.

### Phase 4 — Targeted review

Run only the reviewers relevant to the change. `guidelines-reviewer`,
`security-reviewer`, and `performance-reviewer` apply to every change type —
security issues (listener leaks, XSS) and render-loop risks can appear anywhere.

| Change type | Reviewers to run |
|---|---|
| Public API change | `guidelines-reviewer`, `security-reviewer`, `performance-reviewer`, `spec-compliance-reviewer`, `api-surface-reviewer`, `consistency-reviewer` |
| Accessibility change | `guidelines-reviewer`, `security-reviewer`, `performance-reviewer`, `accessibility-reviewer`, `test-coverage-reviewer` |
| Bug fix | `guidelines-reviewer`, `security-reviewer`, `performance-reviewer`, `test-coverage-reviewer` |
| New sub-part | All reviewers (all 7 quality reviewers: `guidelines`, `security`, `performance`, `accessibility`, `api-surface`, `test-coverage`, `story` + `spec-compliance-reviewer` + `consistency-reviewer`) |
| Code style / refactor | `guidelines-reviewer`, `security-reviewer`, `performance-reviewer`, `consistency-reviewer` |

If a reviewer finds issues, fix them inline — do not spawn a separate patch loop
for small changes. The patch loop (from `/implement`) is for bulk generation
where files are too numerous to review manually.

### Phase 5 — Validate

Run `/validate-build` to confirm build, tests, lint, and CEM all pass.

### Phase 6 — Handoff

Report:
- Files changed
- Spec updated (yes/no)
- Reviewer results (PASS/FAIL for each)
- Build validation result

Await engineer's review. Commit when ready.

## Common Mistakes

- **Using /implement for a small change.** /implement is for generating entire
  components. Use /modify-component for changes to existing ones.
- **Using /modify-component when a Superpowers plan exists.** If the change was
  designed in Superpowers and has a plan file, use `superpowers:executing-plans`
  then `/post-plan-review` instead.
- **Touching files unrelated to the change.** Scope is critical. Only modify
  what the change requires.
- **Skipping the spec update.** If the public API changes and a spec exists
  (in either `docs/specs/` or `docs/superpowers/specs/`), update it first.
  Reviewers check against the spec.
- **Skipping security and performance reviewers.** They apply to every change
  type, not just "security changes" — listener leaks and render loops hide in
  refactors and bug fixes too.
