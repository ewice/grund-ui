# Workflow Guidelines

Guidelines for the subagent-driven development pipeline. These complement the superpowers
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

If the plan provided exact code and the implementer reports no deviations, skip the spec
review — it adds value only when the implementer made design decisions.

---

## 3. Early Integration Smoke Test

The plan must require an **integration smoke test as the first step** of the earliest
element-implementation task. The smoke test mounts the full compound structure and asserts
that context propagation works before detailed element logic is implemented.

This catches wiring bugs (registration timing, context availability) immediately instead of
deferring them to the final review.

---

## 4. Local Reviewer Integration

After the final implementation task, if the project has `.claude-plugin/reviewers/`,
dispatch them per `.claude-plugin/refs/reviewer-dispatch.md` instead of a generic code
quality review. The project's domain-specific reviewers (accessibility, headless, API, test,
security, lit) are more precise than a general-purpose review agent.

---

## 5. Smallest Diff Check

Every change should be the minimum diff that achieves the goal. Reviewers should flag:
- Unused imports or variables
- Comments describing what the code does (rather than why)
- Speculative code not required by the current task
- Redundant abstractions or premature generalizations
- Files touched but not meaningfully changed

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
