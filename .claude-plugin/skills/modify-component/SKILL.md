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
3. Does the spec need updating? If `docs/specs/{name}.spec.md` exists and the
   change affects the public API (new property, changed event, new element),
   the spec must be updated first.

If the spec needs updating, update it now before touching code. If no spec
exists, skip this step — the accordion predates the spec system.

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

Run only the reviewers relevant to the change:

| Change type | Reviewers to run |
|---|---|
| Public API change | `spec-compliance-reviewer`, `api-surface-reviewer`, `consistency-reviewer` |
| Accessibility change | `accessibility-reviewer`, `test-coverage-reviewer` |
| Bug fix | `guidelines-reviewer`, `test-coverage-reviewer` |
| New sub-part | All reviewers |
| Code style / refactor | `guidelines-reviewer`, `consistency-reviewer` |

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

Await engineer's `/commit` or corrections.

## Common Mistakes

- **Using /implement for a small change.** /implement is for generating entire
  components. Use /modify-component for changes to existing ones.
- **Touching files unrelated to the change.** Scope is critical. Only modify
  what the change requires.
- **Skipping the spec update.** If the public API changes and a spec exists,
  the spec must be updated first. Reviewers check against the spec.
- **Running all 6 reviewers for a bug fix.** Only run reviewers relevant to the
  change type.
