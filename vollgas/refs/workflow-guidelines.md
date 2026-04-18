# Workflow Guidelines

Guidelines for the subagent-driven development pipeline. These complement the vollgas
skills and apply to plan authoring, review dispatch, and integration testing.

---

## 1. Plan Code Granularity

Plans should include **test code verbatim** (tests define the contract and must be copy-paste
ready) but provide **implementation as contracts** — interfaces, invariants, pseudocode, and
the file's responsibility — not copy-paste implementation code.

When the plan is the code, subagents copy it without judgment and reviewers degrade to
"does this match the plan?" instead of "is this correct?" Bugs in plan code propagate
undetected through the entire pipeline.

**Self-review checklist after writing a plan** — scan each implementation section and rewrite if any of these are true:
- The section contains more than 5 lines of copy-paste TypeScript, HTML, or CSS
- The section describes HOW to implement rather than WHAT the file is responsible for
- A subagent could copy the section verbatim without making any design decisions

Rewrite offending sections as: interface definitions, invariants ("X must always equal Y"), or
pseudocode describing the algorithm without syntax details.

---

## 2. Risk-Based Review

Classify each plan task by risk level to avoid uniform review overhead:

| Risk | Examples | Review |
|---|---|---|
| Low | Types, barrel exports, context interfaces, scaffolding | Skip per-task review |
| Medium | Controllers, registries, pure logic | Spec review only |
| High | Element integration, context wiring, ARIA, keyboard | Both spec + code quality review |

Skip the spec review when the implementer reports no meaningful deviations from the plan's
contracts — spec review adds value only when the implementer made design decisions the plan
left open.

---

## 3. Early Integration Smoke Test

The plan must require an **integration smoke test as the first step** of the earliest
element-implementation task. The smoke test mounts the full compound structure and asserts
that context propagation works before detailed element logic is implemented.

This catches wiring bugs (registration timing, context availability) immediately instead of
deferring them to the final review.

---

## 4. Local Reviewer Integration

After the final implementation task, if the project has `vollgas/reviewers/`,
dispatch them per `vollgas/refs/reviewer-dispatch.md` instead of a generic code
quality review. The project's domain-specific reviewers (accessibility, headless, API, test,
security, lit) are more precise than a general-purpose review agent.

Every skill that dispatches reviewers must follow the **complete reviewer lifecycle** defined in
`vollgas/refs/reviewer-dispatch.md` — not just the dispatch table. This includes:

1. **Context injection** (Section 1) — always inject the listed ref files alongside changed file contents
2. **Patch loop** (Patch Loop section) — fix blockers, re-run only flagged reviewers, max 2 iterations
3. **Post-Reviewer Protocol** (Post-Reviewer Protocol section) — once all reviewers pass, any subsequent fix must be recorded in `vollgas/.feedback-queue.md` immediately; do not rely on memory or deferred recording
4. **Reviewer Feedback Loop** (Reviewer Feedback Loop section) — processed by a subagent in `/validate-build` Step 8; individual skills only write entries, never process them

The Post-Reviewer Protocol is the critical gate between "reviewers passed" and "branch done". Skipping it breaks the rule-improvement pipeline and allows systemic issues to go uncaught.

---

## 5. Smallest Diff Check

Every change should be the minimum diff that achieves the goal. Run `vollgas:smallest-diff` before committing to catch:
- Dead code (unreachable paths, unused imports/variables)
- Speculative code not required by the current task
- Premature abstractions (helpers/utilities with a single call site)
- Comments describing what the code does (rather than why)
- Files touched but not meaningfully changed
- Leftover debugging artifacts

**Pipeline integration:**
- After the implementation plan Step 3 (before 6-reviewer dispatch) — catches dead code early
- After `vollgas:review-gate` patch pass — verifies patches didn't introduce noise
- Before `/prepare-release` — final cleanliness gate

---

## 6. Deviation Tracking

When a subagent deviates from the plan — fixing a bug differently, discovering a constraint, or choosing an alternative pattern — it must record the deviation before finishing its task. The orchestrator incorporates deviations into the plan before the next subagent starts.

**Deviation format** (append to a `## Deviations` section in the plan file):
```
### Task N — {task title}
- **Deviated from:** {what the plan said}
- **Actual approach:** {what was implemented instead}
- **Why:** {reason — constraint, bug discovered, pattern incompatibility}
- **Downstream impact:** {which later tasks or reviewers need to know}
```

**Why this matters:** Later subagents read the plan as truth. Spec reviewers compare implementation against the original plan. Without deviation records, correct deviations are flagged as non-conformant and incorrect deviations propagate silently.

---

## 7. Shared Abstractions Audit

Before defining implementation tasks in a plan, the plan MUST include a shared abstractions audit section:

```markdown
## Shared Abstractions Audit
Searched: src/utils/, src/controllers/, src/context/, reference component (accordion)
- OrderedRegistry (src/utils/ordered-registry.ts) — DOM-ordered child tracking → USE for registry
- RovingFocusController (src/controllers/roving-focus.controller.ts) — keyboard navigation → USE for list
- SelectionEngine (src/controllers/selection.engine.ts) — set-based selection state → USE when managing selected/pressed/expanded values
- disabledContext (src/context/disabled.context.ts) — cross-component disabled propagation → USE instead of adding disabled to component-specific context interfaces
- [none found for X] → implement inline, flag for extraction on second use
```

This section is injected verbatim into every implementer subagent's prompt. It prevents
subagents from reimplementing utilities they cannot discover independently within their
limited context window.

**Who populates this section:** The plan author (orchestrator or `writing-plans` skill), before
any implementation task is written. It requires a real grep of `src/utils/`, `src/controllers/`,
and `src/context/` at plan-writing time.

**Note on naming:** `src/controllers/` contains two distinct kinds of things:
- **Reactive Controllers** (e.g., `RovingFocusController`) — implement `ReactiveController`, need lifecycle hooks
- **Engines** (e.g., `SelectionEngine`) — plain classes, no Lit dependency, independently testable

List both accurately in the audit section. The distinction matters for how implementers write tests (mock host vs `new Engine()`).

**Context patterns:** `src/context/` contains shared context definitions that propagate state
across component boundaries (e.g., `disabledContext`). These MUST appear in the audit to
prevent plan authors from adding redundant fields to component-specific context interfaces.
A plan that defines `disabled: boolean` on a component context when `disabledContext` already
exists is a plan defect — reviewers will catch it, but the fix wastes a review round.

---

## 8. Session Boundaries

Running the full pipeline (spec → plan → implement → review-gate → finish) in a single
session exhausts context. The orchestrator accumulates prompt-construction and result-processing
costs for every subagent dispatch, even though subagents get fresh context.

**Natural break points — start a fresh session at each:**

| After | Durable artifact | Next session starts with |
|---|---|---|
| Brainstorming + spec | `docs/vollgas/specs/YYYY-MM-DD-*.md` | Read spec, invoke `vollgas:writing-plans` |
| Plan writing | `docs/vollgas/plans/YYYY-MM-DD-*.md` | Read plan, invoke `vollgas:subagent-driven-development` |
| Implementation (all tasks done) | Commits on feature branch | Read changed files, invoke `vollgas:review-gate` |
| Review-gate | Fix commits + findings file | Invoke `vollgas:finishing-a-development-branch` |

**Minimum viable split:** Break between implementation and review-gate. Implementation
produces commits as durable artifacts; review-gate can discover all changes from git diff
without needing the orchestrator's implementation history.

**How to hand off:** Each skill that ends at a boundary should output a continuation message:
```
Implementation complete. All N tasks committed on branch <branch-name>.
Start a fresh session and invoke vollgas:review-gate to run the post-implementation review.
```

The receiving session reads the plan file and git diff to reconstruct context — no session
state needs to survive the boundary.

---

## 9. Test Completeness

When writing test code in plans, cross-reference the project's `vollgas/refs/test-patterns.md`
to verify coverage of all required test categories. The plan author — not the implementer —
is responsible for test completeness because test code is written verbatim in plans.

**Required cross-reference:** Before finalizing the plan's test tasks, scan `test-patterns.md`
for the required categories list and verify each applicable category has a test in the plan.

Common categories missed by plan authors:
- Event ordering tests (when the spec defines an ordering contract)
- Form submission tests (when the component is form-associated or wraps form-associated children)
- Structural misuse tests (when the component has compound structure requirements)

A missing test category in the plan is a plan defect — the test-reviewer will catch it during
review-gate, but the fix wastes a review round and an implementer dispatch.
