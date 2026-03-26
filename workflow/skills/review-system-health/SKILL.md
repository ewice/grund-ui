---
name: "review-system-health"
description: "Use periodically — after every 3rd new component or on demand — to audit reviewer effectiveness, vocabulary staleness, and reference doc coverage. Outputs update recommendations only."
---

## Overview

Keeps the skill system sharp. Identifies patterns that recur in reviewer findings (candidates to promote into generation rules), catches stale vocabulary entries, and flags reference doc gaps. This skill audits and recommends — it does not modify skill files.

## Usage

```
/review-system-health
```

Run after every 3rd new component, or whenever reviewers are producing many blockers per component.

**Trigger guidance:** Nothing auto-triggers this skill. Run it:
- After building component #3, #6, #9, etc. (the `/validate-build` summary reminds you)
- When the patch loop in `/build-elements` or `/post-plan-review` hits iteration 2 repeatedly
- On demand when the skill system feels noisy or stale

## Implementation

### Step 1 — Collect recent reviewer findings

Read `git log --oneline -100`. Look for commits with keywords: `fix`, `quality-gate`, `post-plan-review`, `patch`. For each: read the commit message to understand what was fixed and which reviewer flagged it.

### Step 2 — Identify recurring patterns

A pattern is **recurring** if the same rule or concept was flagged ≥ 3 times across different components or sessions.

For each recurring pattern:
- Which reviewer flagged it?
- Which generation skill is responsible for preventing it?
- What instruction would the generation skill need to add?

### Step 3 — Audit vocabulary staleness

Read `docs/vocabulary.md`. For each entry:

```bash
grep -r "{entry}" src/components/ --include="*.ts" -l
```

If no component uses it: flag as potentially stale.

### Step 4 — Check reference doc coverage

For each ref doc in `workflow/refs/`:
- Is it referenced in at least one generation skill's Step 1 read list?
- Does it have an Anti-patterns section?
- Does it follow the standard format (Rules → Patterns → Anti-patterns → Per-Category Notes)?

### Step 5 — Generate recommendations

Produce a report:

```
## System Health Report — {date}

### Recurring Reviewer Findings (candidates for generation rules)
- lit-reviewer rule 14 flagged 4 times → consider adding to /build-elements Step 3
- headless-reviewer rule 9 flagged 3 times → consider adding to /scaffold Step 3

### Vocabulary Staleness
- `requestActivate` — no usage in src/ — consider removing

### Reference Doc Gaps
- refs/positioning-strategy.md — not referenced by any skill
- refs/focus-management.md — missing Anti-patterns section

### Recommendations
1. {specific skill file to update with exact addition}
2. {vocab entry to remove with rationale}
3. {ref doc to update with what is missing}
```

Surface the report to the engineer. **Do not modify skill files** — the engineer decides which recommendations to act on.

## Common Mistakes

- **Modifying skill files directly.** This skill audits and recommends. Use the appropriate skill (writing-plans, or direct edit) to implement changes.
- **Flagging every reviewer finding.** Only flag findings that recur ≥ 3 times — one-off issues are expected.
- **Acting on stale vocabulary flags without checking.** A name might be used under a different form (e.g., `requestToggle` used as `ctx.requestToggle()`). Always grep before flagging.
