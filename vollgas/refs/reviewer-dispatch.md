# Reviewer Dispatch

Canonical mapping of reviewers to context files and change-type selection rules.
Referenced by the implementation plan and `vollgas:review-gate`.

---

## Context Injection

When dispatching a reviewer as an Agent, read its SKILL.md from `vollgas/reviewers/{name}/SKILL.md`
and inject the context files listed below alongside the changed/generated file contents.

| Reviewer | Always inject | Inject when available |
|---|---|---|
| `accessibility-reviewer` | All element files, `vollgas/refs/accessibility-contract.md`, `vollgas/refs/focus-management.md`, `vollgas/refs/aria-linking.md` | Component spec (`docs/specs/{name}.spec.md`) |
| `lit-reviewer` | All element files, `vollgas/refs/lit-patterns.md`, `vollgas/refs/ssr-contract.md` | Controller files |
| `headless-reviewer` | All element files, `vollgas/refs/headless-contract.md` | `docs/vocabulary.md` |
| `api-reviewer` | All element files, `types.ts`, `vollgas/refs/api-contract.md` | `docs/vocabulary.md`, component spec, `vollgas/refs/consumer-dx.md` |
| `test-reviewer` | Test files, `vollgas/refs/test-patterns.md` | Component spec, story files (when they exist). **During the implementation plan:** also inject the Step 2 test requirements list so the reviewer can verify all required test categories were written (dynamic registration, RTL, reparenting, composition, memory, event ordering). |
| `security-reviewer` | All element files | Controller files |
| `code-quality-reviewer` | All element files, engine files | Controller files |

**Notes:**
- "All element files" = every `.ts` file under `src/components/{name}/` excluding test files.
- Story files do not exist during the implementation plan — `test-reviewer` defers story coverage items to the stories plan step.
- `security-reviewer` runs for **every** change type. Event listener leaks and XSS vectors appear in refactors and bug fixes.
- Controllers created as part of the same changeset (e.g., `FormController` built as a pre-flight for a new component) are **always** injected — treat them as element files, not as optional context.

---

## Change-Type Selection

Use these tables to determine which reviewers to run based on what changed.

### Full fleet (all 7 reviewers)

Run all 7 when:
- Building a new component (the implementation plan)
- Adding a new sub-part element to an existing component
- Plan touches files across 3+ change types or modifies more than 5 files

### Targeted selection

| Change type | Reviewers |
|---|---|
| API change (new/changed property, event, type, export) | `api-reviewer`, `lit-reviewer`, `headless-reviewer`, `test-reviewer`, `security-reviewer`, `code-quality-reviewer` |
| Structural change (new/changed element, compound structure) | `lit-reviewer`, `headless-reviewer`, `accessibility-reviewer`, `test-reviewer`, `security-reviewer`, `code-quality-reviewer` |
| Accessibility or keyboard change | `accessibility-reviewer`, `lit-reviewer`, `test-reviewer`, `security-reviewer` |
| Bug fix | `lit-reviewer`, `test-reviewer`, `security-reviewer`, `code-quality-reviewer` |
| Refactor or rename | `lit-reviewer`, `test-reviewer`, `security-reviewer`, `code-quality-reviewer` |
| Internal (controller, context, lifecycle) | `lit-reviewer`, `security-reviewer`, `code-quality-reviewer` |

### Keyword-to-change-type mapping (for `vollgas:review-gate`)

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
   `vollgas:systematic-debugging` and surface to the engineer.

---

## Post-Reviewer Protocol

**Applies to every skill that dispatches reviewers.** Once the patch loop completes and all
reviewers return PASS, the pipeline enters post-reviewer mode for the remainder of the branch.

**Rule:** Any fix applied after reviewers have passed — whether during a subsequent pipeline
step, a `/validate-build` run, or a manual audit — must be written to
`vollgas/.feedback-queue.md` immediately. Do not wait; the record must survive context
compression.

**Entry format:**

```markdown
## Entry: <one-line description>

**Fixed file:** `path/to/file.ts`
**Pre-fix state:** <what was wrong — enough detail for a fresh agent to understand without session context>
**Fix applied:** <what was changed>
**Reviewer scope:** <reviewer-name>
**Classification:** quality | correctness
**Reasoning:** <the concrete cost or behavioral failure that justifies the fix>
```

The queue is processed by `/validate-build` Step 8 via a dedicated subagent. No individual
skill needs to process it — just write and continue.

---

## Reviewer Feedback Loop

### Step 1 — Write to the queue immediately

The moment you apply a fix after all reviewers have passed, append an entry to
`vollgas/.feedback-queue.md` (create the file if it doesn't exist). Do not wait
until `/validate-build` — write immediately so the record survives context compression.

**Entry format:**

```markdown
## Entry: <one-line description>

**Fixed file:** `path/to/file.ts`
**Pre-fix state:** <what was wrong — enough detail for a fresh agent to understand>
**Fix applied:** <what was changed>
**Reviewer scope:** <reviewer-name>
**Classification:** quality | correctness
**Reasoning:** <the concrete cost or behavioral failure that justifies the fix>
```

This applies to fixes made anywhere after reviewers passed: during `/validate-build`,
during a manual audit, or in response to a user question.

### Step 2 — Processing (dispatched by `/validate-build` Step 8)

`/validate-build` Step 8 dispatches a subagent to process the queue. The subagent
runs the following loop for each entry:

1. **Classify the fix:**
   - **Correctness** — pre-fix code produces wrong observable behavior. Proof required: a failing test or spec/design doc contradiction. Rule severity: **blocker**.
   - **Quality** — pre-fix code works but is redundant, fragile, or misleading. Proof required: a concrete description of the cost (performance, maintainability, developer confusion). Rule severity: **warning**.
   - If you can't articulate either a behavioral failure or a concrete cost, don't write a rule — it's a preference, not a fix.

2. **Identify which reviewer** should have caught it (match the concern to reviewer scope boundaries).

3. **Check whether an existing rule covers the concern.** If it does, the reviewer missed an application of its own rule — no rule change needed, but note the miss for later review of reviewer quality.

4. **If no existing rule covers it:** draft a new rule in the reviewer's checklist. The rule must be:
   - **Generic** — not component-specific. Name the anti-pattern, not the instance.
   - **Concrete** — include a one-sentence example of the mistake and the fix.
   - **Citable** — numbered sequentially after the reviewer's last rule.
   - **Severity matches classification** — correctness fixes produce blocker rules, quality fixes produce warning rules.

5. **Validate the rule:** re-dispatch the reviewer against the pre-fix file(s) (use `git show HEAD~1:path/to/file`). The reviewer must produce a finding citing the new rule. If it doesn't, reword until it does — the phrasing isn't concrete enough for the reviewer agent to act on.

6. **Commit the reviewer update alongside the code fix**, not in a separate PR. This keeps the rule addition traceable to the bug that motivated it.

7. **Delete the processed entry** from `vollgas/.feedback-queue.md`. Delete the file entirely when all entries are cleared.

---

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
