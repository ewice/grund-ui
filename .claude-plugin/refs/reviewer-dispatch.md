# Reviewer Dispatch

Canonical mapping of reviewers to context files and change-type selection rules.
Referenced by `/build-elements`, `/post-plan-review`, and `/modify-component`.

---

## Context Injection

When dispatching a reviewer as an Agent, read its SKILL.md from `.claude-plugin/reviewers/{name}/SKILL.md`
and inject the context files listed below alongside the changed/generated file contents.

| Reviewer | Always inject | Inject when available |
|---|---|---|
| `accessibility-reviewer` | All element files, `.claude-plugin/refs/focus-management.md`, `.claude-plugin/refs/aria-linking.md` | Component spec (`docs/specs/{name}.spec.md`) |
| `lit-reviewer` | All element files, `.claude-plugin/refs/lit-patterns.md`, `.claude-plugin/refs/ssr-contract.md` | Controller files |
| `headless-reviewer` | All element files, `.claude-plugin/refs/headless-contract.md` | `docs/vocabulary.md` |
| `api-reviewer` | All element files, `types.ts` | `docs/vocabulary.md`, component spec |
| `test-reviewer` | Test files, `.claude-plugin/refs/test-patterns.md` | Component spec, story files (when they exist). **During `/build-elements`:** also inject the Step 2 test requirements list so the reviewer can verify all required test categories were written (dynamic registration, RTL, reparenting, composition, memory, event ordering). |
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
3. Max 2 patch iterations per reviewer.
4. If blockers persist after 2 iterations: invoke `/diagnose-failure` and surface to the engineer.
