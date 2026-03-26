# Reviewer Dispatch

Canonical mapping of reviewers to context files and change-type selection rules.
Referenced by `/build-elements`, `/post-plan-review`, and `/modify-component`.

---

## Context Injection

When dispatching a reviewer as an Agent, read its SKILL.md from `workflow/reviewers/{name}/SKILL.md`
and inject the context files listed below alongside the changed/generated file contents.

| Reviewer | Always inject | Inject when available |
|---|---|---|
| `accessibility-reviewer` | All element files, `workflow/refs/focus-management.md`, `workflow/refs/aria-linking.md` | Component spec (`docs/specs/{name}.spec.md`) |
| `lit-reviewer` | All element files, `workflow/refs/lit-patterns.md`, `workflow/refs/ssr-contract.md` | Controller files |
| `headless-reviewer` | All element files, `workflow/refs/headless-contract.md` | `docs/vocabulary.md` |
| `api-reviewer` | All element files, `types.ts` | `docs/vocabulary.md`, component spec |
| `test-reviewer` | Test files, `workflow/refs/test-patterns.md` | Component spec, story files (when they exist). **During `/build-elements`:** also inject the Step 2 test requirements list so the reviewer can verify all required test categories were written (dynamic registration, RTL, reparenting, composition, memory, event ordering). |
| `security-reviewer` | All element files | Controller files |

**Notes:**
- "All element files" = every `.ts` file under `src/components/{name}/` excluding test files.
- Story files do not exist during `/build-elements` — `test-reviewer` defers story coverage items to `/build-stories`.
- `security-reviewer` runs for **every** change type. Event listener leaks and XSS vectors appear in refactors and bug fixes.

---

## Change-Type Selection

Use these tables to determine which reviewers to run based on what changed.

### Full fleet (all 6 reviewers)

Run all 6 when:
- Building a new component (`/build-elements`)
- Adding a new sub-part element to an existing component
- Plan touches files across 3+ change types or modifies more than 5 files

### Targeted selection

| Change type | Reviewers |
|---|---|
| API change (new/changed property, event, type, export) | `api-reviewer`, `lit-reviewer`, `headless-reviewer`, `test-reviewer`, `security-reviewer` |
| Structural change (new/changed element, compound structure) | `lit-reviewer`, `headless-reviewer`, `accessibility-reviewer`, `test-reviewer`, `security-reviewer` |
| Accessibility or keyboard change | `accessibility-reviewer`, `lit-reviewer`, `test-reviewer`, `security-reviewer` |
| Bug fix | `lit-reviewer`, `test-reviewer`, `security-reviewer` |
| Refactor or rename | `lit-reviewer`, `test-reviewer`, `security-reviewer` |
| Internal (controller, context, lifecycle) | `lit-reviewer`, `security-reviewer` |

### Keyword-to-change-type mapping (for `/post-plan-review`)

| Keyword in plan task titles | Change type |
|---|---|
| "API", "property", "event", "interface", "type", "export" | API change |
| "ARIA", "keyboard", "accessibility", "role", "focus" | Accessibility change |
| "element", "compound", "sub-part", "register" | Structural change |
| "fix", "restore", "broken", "missing" | Bug fix |
| "refactor", "rename", "remove", "replace" | Refactor |
| "controller", "context", "lifecycle", "willUpdate" | Internal |

---

## Patch Loop

After collecting reviewer findings:
1. Fix all blockers.
2. Re-run only the reviewer(s) that flagged blockers — not the full fleet.
3. Max 2 patch iterations per reviewer. One iteration = one fix pass + one re-review. Fixing
   the same rule violation across multiple files in a single pass counts as one iteration.
   New findings that surface on the second pass (revealed by the now-cleaner codebase) are
   not the same blocker recurring — continue fixing those without counting against the limit.
4. If the *same* finding recurs after 2 genuine fix attempts (the fix didn't take): invoke
   `/diagnose-failure` and surface to the engineer.

## Dispute Protocol

When the implementer believes a reviewer finding is incorrect:

1. State the disagreement with a specific technical counter-argument citing the relevant rule.
2. Re-dispatch the reviewer with the counter-argument as additional context. Ask it to either:
   a. Defend the finding with a concrete scenario that demonstrates the bug, OR
   b. Withdraw the finding and reclassify it as a note.
3. If the reviewer defends with a concrete scenario → implement the fix.
4. If the reviewer cannot produce a concrete scenario → log as a declined finding and move on.

Declined findings are noted in the commit message:
`Declined: {reviewer}#{rule} — {one-sentence reason}`

This prevents:
- Blind implementation of incorrect findings (wastes time, may introduce bugs)
- Silent skipping of findings (no audit trail)
- Theoretical concerns blocking real work without evidence
