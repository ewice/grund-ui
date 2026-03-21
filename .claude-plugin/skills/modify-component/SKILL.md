---
name: "modify-component"
description: "Use for intentional behavior changes to an existing component — adding a property, changing an event, or adding a sub-part. Spec update likely. For reported defects, use /fix-bug instead. Runs a targeted subset of the 6 reviewers based on what changed."
---

## Overview

Intentional changes to existing components — new API surface, changed behavior, new sub-parts. Only the reviewers relevant to the change type run — not the full fleet. Faster than `/build-elements` for isolated changes.

**When to use which skill:**
- **`/modify-component`** — intentional behavior change (new property, changed event, new sub-part). Spec update likely.
- **`/fix-bug`** — reported defect (something broken or violating spec). TDD mandatory.
- **`superpowers:executing-plans` + `/post-plan-review`** — when a Superpowers plan already exists.

## Usage

```
/modify-component accordion -- add loopFocus property
/modify-component dialog -- add hidden-until-found support
/modify-component tabs -- change orientation to support both vertical and horizontal
```

## Implementation

### Phase 1 — Scope the change

1. Which component? (must exist in `src/components/`)
2. What is the change? (one sentence)
3. Does the spec need updating? Check `docs/specs/{name}.spec.md`. If the change affects the public API (new property, changed event, new element): update the spec first.

If a Superpowers plan exists for this change (`docs/superpowers/plans/`): use `superpowers:executing-plans` then `/post-plan-review` instead.

### Phase 2 — Identify affected files

| Change type | Affected files |
|---|---|
| New property on root | `root/`, controller, `types.ts`, test, story |
| New property on item | `item/`, context, `types.ts`, test, story |
| New event | controller, `types.ts`, dispatch element, test |
| New sub-part element | New element file, context (add registration), registry, test |
| Keyboard change | Root element (RovingFocusController config), test |

List the affected files explicitly. Do not touch unaffected files.

### Phase 3 — Make the change

Edit the affected files. Follow existing patterns in the component. Reference the accordion implementation for any ambiguity.

### Phase 4 — Targeted review

Read `.claude-plugin/refs/reviewer-dispatch.md` for the change-type selection table and context injection rules. Select reviewers based on the change type identified in Phase 2. Read each selected reviewer's SKILL.md from `.claude-plugin/reviewers/{name}/SKILL.md`. Use its content as the Agent prompt. Dispatch as Agent calls, injecting context per the dispatch table.

Fix blockers inline. The patch loop (multiple subagents) is for `/build-elements` bulk generation — for focused changes, fix directly.

### Phase 5 — Validate

Run `/validate-build`.

### Phase 6 — Handoff

Report:
- Files changed
- Spec updated (yes/no)
- Reviewer results (PASS/FAIL per reviewer)
- Build validation result

Await engineer decision on commit.

## Common Mistakes

- **Using `/build-elements` for a small change.** Use `/modify-component` for changes to existing components.
- **Using `/modify-component` when a Superpowers plan exists.** Use `superpowers:executing-plans` + `/post-plan-review` instead.
- **Touching unaffected files.** Scope is critical.
- **Skipping spec update.** If the public API changes and a spec exists: update it first.
- **Skipping `security-reviewer`.** It applies to every change type.
