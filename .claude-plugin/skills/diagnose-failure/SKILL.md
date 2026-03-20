---
name: "diagnose-failure"
description: "Use when a reviewer finding persists after a patch attempt, or when
  a finding doesn't make sense. Investigates root cause and suggests a resolution
  path."
---

## Overview

When the implement skill's patch loop hits iteration 2 and escalates, or when
a reviewer produces a confusing finding, this skill investigates why.

## Usage

```
/diagnose-failure — guidelines-reviewer says context is unstable but it looks stable
/diagnose-failure — accessibility-reviewer flags missing aria-controls but AriaLinkController is attached
/diagnose-failure — tests pass locally but test-coverage-reviewer says MISSING
```

## Implementation

### Step 1 — Reproduce the finding

Read the reviewer finding (JSON line). Identify:
- Which file and line the finding points to
- Which rule was cited
- What the reviewer expected vs. what it found

Read the actual code at that location. Determine if the finding is:
- **Correct** — the code genuinely violates the rule
- **False positive** — the code is correct but the reviewer misread it
- **Stale** — a previous patch fixed it but the reviewer wasn't re-run

### Step 2 — Trace the root cause

If the finding is correct:
- Why did the patch agent fail to fix it?
- Is the fix non-trivial (requires changes to multiple files)?
- Does the fix conflict with another rule?
- Is the spec ambiguous about this case?

If the finding is a false positive:
- Why did the reviewer misread the code?
- Is there a pattern the reviewer doesn't account for? (e.g., the accordion
  uses `buildItemCtx()` which creates a new object but binds methods via
  closures — technically new references but functionally stable)
- Should the reviewer skill be updated to handle this pattern?

If the finding is stale:
- Was the correct reviewer re-run after the patch? (implement only re-runs
  reviewers that had findings)
- Did the patch land in the right file?

### Step 3 — Recommend a resolution

Output one of:

**FIX_CODE** — the finding is valid and here's how to fix it:
```json
{"resolution": "FIX_CODE", "file": "...", "description": "...", "suggested_change": "..."}
```

**FIX_SPEC** — the spec is ambiguous or contradictory:
```json
{"resolution": "FIX_SPEC", "spec_file": "docs/specs/...", "issue": "...", "suggestion": "..."}
```

**FALSE_POSITIVE** — the reviewer is wrong:
```json
{"resolution": "FALSE_POSITIVE", "reviewer": "guidelines-reviewer", "rule": "...", "reason": "...", "suppress": true}
```
When suppressing a false positive, the implement skill should skip that finding
in the next patch iteration.

**NEEDS_DISCUSSION** — the finding exposes a genuine design tension:
```json
{"resolution": "NEEDS_DISCUSSION", "tension": "...", "options": ["...", "..."]}
```
Present the options to the engineer and wait for a decision.

## Common Mistakes

- **Blindly agreeing with the reviewer.** The reviewer is an LLM reading code —
  it can be wrong. Always verify against the actual code.
- **Blindly disagreeing with the reviewer.** The code might look correct at the
  call site but violate the principle in a way that's only visible from the
  architecture level.
- **Suppressing findings without documenting why.** Every FALSE_POSITIVE must
  include a clear reason that a future reader can evaluate.
