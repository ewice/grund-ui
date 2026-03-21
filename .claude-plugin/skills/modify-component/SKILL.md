---
name: "modify-component"
description: "Use when changing an existing component — adding a property, changing an event, fixing a bug, or adding a sub-part. Runs a targeted subset of the 6 reviewers based on what changed. Use instead of /build-elements for changes to existing components."
---

## Overview

Scoped changes to existing components. Only the reviewers relevant to the change type run — not the full fleet. Faster than `/build-elements` for isolated changes.

## Usage

```
/modify-component accordion -- add loopFocus property
/modify-component tabs -- fix keyboard navigation in horizontal mode
/modify-component dialog -- add hidden-until-found support
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
| Bug fix | Typically controller or element + test |
| Keyboard change | Root element (RovingFocusController config), test |

List the affected files explicitly. Do not touch unaffected files.

### Phase 3 — Make the change

Edit the affected files. Follow existing patterns in the component. Reference the accordion implementation for any ambiguity.

### Phase 4 — Targeted review

Read the relevant reviewer SKILL.md files from `.claude-plugin/reviewers/{name}/SKILL.md`. Use each file's content as the Agent prompt. Dispatch as Agent calls. Read and inject the changed file contents as context.

| Change type | Reviewers to run |
|---|---|
| New or changed property/event (API change) | `api-reviewer`, `lit-reviewer`, `security-reviewer` |
| New or changed element (structural change) | `lit-reviewer`, `headless-reviewer`, `accessibility-reviewer`, `security-reviewer` |
| Accessibility or keyboard change | `accessibility-reviewer`, `lit-reviewer`, `test-reviewer`, `security-reviewer` |
| Bug fix | `lit-reviewer`, `security-reviewer`, `test-reviewer` |
| New sub-part | All 6 reviewers |
| Code style / refactor only | `lit-reviewer`, `security-reviewer` |

`security-reviewer` runs for every change type — event listener leaks and XSS vectors appear in refactors and bug fixes.

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
