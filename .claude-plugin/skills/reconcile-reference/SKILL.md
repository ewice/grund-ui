---
name: "reconcile-reference"
description: "Use after any component ships to diff its patterns against the accordion reference implementation. Identifies divergences, cites the correct approach per current rules, and produces a fix list for the reference or the new component."
---

## Overview

Compares a newly shipped component against the accordion reference implementation across all
structural patterns. Produces a table of divergences with a direction arrow (which is correct)
and an actionable fix list. Run once, after all reviewers approve and before
`/finishing-a-development-branch`.

## Usage

```
/reconcile-reference tabs
```

## Implementation

### Step 1 — Read both components

Read all element files for:
- The new component: `src/components/{name}/`
- The reference: `src/components/accordion/`

Also read:
- `.claude-plugin/refs/lit-patterns.md`
- `.claude-plugin/refs/headless-contract.md`
- `.claude-plugin/refs/aria-linking.md`

### Step 2 — Run the reconciliation checklist

For each item, check both components and note the current state:

| Pattern | Rule | New Component | Accordion | Correct Approach |
|---------|------|---------------|-----------|-----------------|
| `:host` display comment | headless-contract#7 | ? | ? | Comment required |
| ARIA linking strategy | aria-linking.md | ? | ? | Element Reference API preferred |
| Context callback stability | lit-patterns#15 | ? | ? | Stable fields for `ContextProvider`; stable fields recommended for `@provide` |
| `RovingFocusController` init | lit-patterns#27 | ? | ? | Class field initializer |
| Registry extends `OrderedRegistry` | lit-patterns#29 | ? | ? | Extend shared utility |
| `exportparts` on slotted layers | lit-patterns#11 | ? | ? | Only if element renders sub-elements in own shadow template |
| `@internal` on `HostSnapshot` | api-reviewer#11 | ? | ? | Required |
| Controller is not `ReactiveController` | CLAUDE.md | ? | ? | Plain class acceptable if no lifecycle hooks needed |

Fill in the actual state for each component. Mark each as ✅ (matches correct approach) or ❌ (diverges).

### Step 3 — Produce fix list

For every ❌ divergence, produce a fix entry:

```
### Fix: {Pattern} on {Component}
- **Current:** {what it does now}
- **Correct:** {what it should do per the rule}
- **Rule:** {rule citation}
- **Files:** {which files to change}
```

Group fixes by component:
- **Fixes for the new component** — apply now if pre-ship, or file as follow-up issue
- **Fixes for the accordion reference** — apply now; the reference must stay current

### Step 4 — Apply fixes to accordion

Apply all accordion fixes immediately. The reference implementation must always reflect current
standards — it is what all future components are built against.

For new component fixes found post-ship: create a follow-up issue or apply if the scope is small
(< 10 lines changed). Do not let them accumulate.

### Step 5 — Commit

```bash
git add src/components/accordion/
git commit -m "refactor(accordion): reconcile with current standards after {name} component ships"
```

Report: reconciliation complete. List all divergences found and whether they were fixed or filed.
