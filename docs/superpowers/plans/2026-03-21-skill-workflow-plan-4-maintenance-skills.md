# Skill & Workflow Redesign — Plan 4: Maintenance Skills

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update 2 existing maintenance skills to use the new 6-reviewer system, and create 7 new maintenance skills that complete the Grund UI skill & workflow redesign.

**Architecture:** Each skill is a user-invocable `SKILL.md` in `.claude-plugin/skills/{name}/`. Tasks 1–2 update existing skills that still reference the old reviewer names. Tasks 3–9 create new skills specified in `docs/superpowers/specs/2026-03-20-skill-workflow-redesign-design.md` § 3.4.

**Tech Stack:** Markdown (skill prompt documents). No code, no tests. Verification is a manual structure and correctness check against the spec.

**Spec:** `docs/superpowers/specs/2026-03-20-skill-workflow-redesign-design.md` § 3.4.

---

## File Map

**Modify:**
- `.claude-plugin/skills/diagnose-failure/SKILL.md` (update old reviewer names in usage examples and prose)
- `.claude-plugin/skills/post-plan-review/SKILL.md` (replace old 9-reviewer system with new 6-reviewer routing)

**Create:**
- `.claude-plugin/skills/extract-pattern/SKILL.md`
- `.claude-plugin/skills/deprecate/SKILL.md`
- `.claude-plugin/skills/audit-cross-component/SKILL.md`
- `.claude-plugin/skills/update-dependency/SKILL.md`
- `.claude-plugin/skills/rebuild-component/SKILL.md`
- `.claude-plugin/skills/prepare-release/SKILL.md`
- `.claude-plugin/skills/review-system-health/SKILL.md`

---

### Task 1: Update `/diagnose-failure`

**Files:**
- Modify: `.claude-plugin/skills/diagnose-failure/SKILL.md`

- [ ] **Step 1: Read the current file**

  Read `.claude-plugin/skills/diagnose-failure/SKILL.md`. The skill logic is sound but usage examples reference `guidelines-reviewer` (deprecated) and the Overview references the old `implement` skill.

- [ ] **Step 2: Write the updated file**

  Replace `.claude-plugin/skills/diagnose-failure/SKILL.md` with:

  ```markdown
  ---
  name: "diagnose-failure"
  description: "Use when a reviewer finding persists after a patch attempt, or when a finding doesn't make sense. Investigates root cause and suggests a resolution path."
  ---

  ## Overview

  When a build skill's patch loop hits iteration 2 and escalates, or when a reviewer produces a confusing finding, this skill investigates why.

  ## Usage

  ```
  /diagnose-failure — lit-reviewer says context object is unstable but it looks stable
  /diagnose-failure — accessibility-reviewer flags missing aria-controls but AriaLinkController is attached
  /diagnose-failure — tests pass locally but test-reviewer says MISSING
  ```

  ## Implementation

  ### Step 1 — Reproduce the finding

  Read the reviewer finding (JSON). Identify:
  - Which file and line the finding points to
  - Which rule was cited
  - What the reviewer expected vs. what it found

  Read the actual code at that location. Determine if the finding is:
  - **Correct** — the code genuinely violates the rule
  - **False positive** — the code is correct but the reviewer misread it
  - **Stale** — a previous patch fixed it but the reviewer wasn't re-run

  ### Step 2 — Trace the root cause

  If the finding is correct:
  - Why did the patch fail to fix it?
  - Is the fix non-trivial (requires changes to multiple files)?
  - Does the fix conflict with another rule?
  - Is the spec ambiguous about this case?

  If the finding is a false positive:
  - Why did the reviewer misread the code?
  - Is there a pattern the reviewer doesn't account for? (e.g., the accordion uses `buildItemCtx()` which creates a new object but binds methods via closures — technically new references but functionally stable)
  - Should the reviewer skill be updated to handle this pattern?

  If the finding is stale:
  - Was the correct reviewer re-run after the patch?
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
  {"resolution": "FALSE_POSITIVE", "reviewer": "lit-reviewer", "rule": "...", "reason": "...", "suppress": true}
  ```
  When suppressing a false positive, skip that finding in the next patch iteration.

  **NEEDS_DISCUSSION** — a genuine design tension:
  ```json
  {"resolution": "NEEDS_DISCUSSION", "tension": "...", "options": ["...", "..."]}
  ```
  Present the options to the engineer and wait for a decision.

  ## Common Mistakes

  - **Blindly agreeing with the reviewer.** The reviewer is an LLM reading code — it can be wrong. Always verify against the actual code.
  - **Blindly disagreeing with the reviewer.** The code might look correct at the call site but violate the principle in a way only visible from the architecture level.
  - **Suppressing findings without documenting why.** Every FALSE_POSITIVE must include a clear reason that a future reader can evaluate.
  ```

- [ ] **Step 3: Verify**

  Confirm:
  - No old reviewer names remain (`guidelines-reviewer`, `performance-reviewer`, etc.)
  - Usage examples use new reviewer names (`lit-reviewer`, `accessibility-reviewer`, `test-reviewer`)
  - Overview no longer references `implement` skill
  - Logic and output formats unchanged

- [ ] **Step 4: Commit**

  ```bash
  git add .claude-plugin/skills/diagnose-failure/SKILL.md
  git commit -m "feat(skills): update diagnose-failure — fix old reviewer name references"
  ```

---

### Task 2: Update `/post-plan-review`

**Files:**
- Modify: `.claude-plugin/skills/post-plan-review/SKILL.md`

- [ ] **Step 1: Read the current file**

  Read `.claude-plugin/skills/post-plan-review/SKILL.md`. The file uses old reviewers (`guidelines-reviewer`, `performance-reviewer`, `api-surface-reviewer`, `spec-compliance-reviewer`, `consistency-reviewer`, `story-reviewer`, `test-coverage-reviewer`) and old confidence/severity filtering. Replace the entire file.

- [ ] **Step 2: Write the updated file**

  Replace `.claude-plugin/skills/post-plan-review/SKILL.md` with:

  ```markdown
  ---
  name: "post-plan-review"
  description: "Use after superpowers:executing-plans or superpowers:subagent-driven-development completes to run the quality review pipeline against files changed by the plan. Bridges Superpowers plan execution with the Grund UI reviewer suite."
  ---

  ## Overview

  Quality gate after Superpowers-planned changes. Reads the plan's file map, infers reviewer selection from change types, runs selected reviewers from the 6-reviewer suite, patches findings (max 2 iterations), then validates the build.

  ## Usage

  ```
  /post-plan-review docs/superpowers/plans/2026-03-19-accordion-guidelines-alignment.md
  ```

  If invoked without a path: use the most recently modified file under `docs/superpowers/plans/`.

  ## Implementation

  ### Phase 1 — Read the plan

  Read the plan file. Extract:

  1. **File Map** — all files listed as `Create:`, `Modify:`, or `Delete:`. These are the files the reviewers will scope to.

  2. **Change types** — read the task titles and classify:

  | Keyword in titles | Change type |
  |---|---|
  | "API", "property", "event", "interface", "type", "export" | `api` |
  | "ARIA", "keyboard", "accessibility", "role", "focus" | `accessibility` |
  | "element", "compound", "sub-part", "register" | `new-element` |
  | "fix", "restore", "broken", "missing" | `bugfix` |
  | "refactor", "rename", "remove", "replace" | `refactor` |
  | "controller", "context", "lifecycle", "willUpdate" | `internal` |

  A plan may have multiple change types.

  3. **Component spec** — check whether `docs/specs/{name}.spec.md` exists. If found, pass it to `api-reviewer` and `accessibility-reviewer`.

  ### Phase 2 — Select reviewers

  | Change type | Reviewers to run |
  |---|---|
  | `api` | `api-reviewer`, `lit-reviewer`, `security-reviewer` |
  | `accessibility` | `accessibility-reviewer`, `lit-reviewer`, `test-reviewer`, `security-reviewer` |
  | `new-element` | All 6 reviewers |
  | `bugfix` | `lit-reviewer`, `test-reviewer`, `security-reviewer` |
  | `refactor` | `lit-reviewer`, `security-reviewer` |
  | `internal` | `lit-reviewer`, `security-reviewer` |

  If the plan touches files across 3+ change types, or modifies more than 5 files: run all 6 reviewers.

  `security-reviewer` runs for every change type.

  ### Phase 3 — Run reviewers (parallel)

  Read each selected reviewer's SKILL.md from `.claude-plugin/reviewers/{name}/SKILL.md`. Use its content as the Agent prompt. Dispatch all selected reviewers as simultaneous Agent calls. Read and inject as context: changed file contents, component spec content (if exists), relevant ref doc contents per reviewer.

  ### Phase 4 — Patch loop

  **Max 2 iterations.** For each blocker:
  1. Fix the blocker in the affected file
  2. Re-run only the reviewer that flagged it

  After 2 iterations, if blockers persist: invoke `/diagnose-failure` for each and surface to the engineer.

  Commit all patch-loop fixes as a single commit:
  ```bash
  git add <changed files>
  git commit -m "fix(<component>): quality-gate fixes from post-plan-review"
  ```

  ### Phase 5 — Build validation

  Run `/validate-build`.

  ### Phase 6 — Report

  ```
  ## Post-Plan Review: {plan filename}

  ### Files reviewed
  - {list from File Map}

  ### Reviewers run
  - accessibility-reviewer: PASS | FAIL (N blockers)
  - lit-reviewer: PASS
  - headless-reviewer: PASS
  - api-reviewer: PASS
  - test-reviewer: PASS
  - security-reviewer: PASS

  ### Patch loop
  - Iteration 1: N blockers patched
  - Iteration 2: PASS | escalated to /diagnose-failure

  ### Build validation
  - Lint: PASS | Build: PASS | Tests: PASS | CEM: PASS

  ### Result
  PASS — plan is complete and quality-gated.
  ```

  ## Common Mistakes

  - **Running before all plan tasks complete.** Finish plan execution first. This skill reviews the final state, not intermediate states.
  - **Skipping the patch loop.** Blockers must be resolved before marking the plan complete.
  - **Not committing the fixup.** Patch-loop changes must be committed separately so the plan's own commits remain clean.
  ```

- [ ] **Step 3: Verify**

  Confirm:
  - No old reviewer names remain (guidelines-reviewer, performance-reviewer, api-surface-reviewer, spec-compliance-reviewer, consistency-reviewer, story-reviewer, test-coverage-reviewer)
  - Only new reviewers: accessibility-reviewer, lit-reviewer, headless-reviewer, api-reviewer, test-reviewer, security-reviewer
  - Reviewer dispatch reads SKILL.md and passes as Agent prompt
  - security-reviewer in every change-type row
  - Max 2 iterations + escalate to /diagnose-failure

- [ ] **Step 4: Commit**

  ```bash
  git add .claude-plugin/skills/post-plan-review/SKILL.md
  git commit -m "feat(skills): update post-plan-review — new 6-reviewer routing"
  ```

---

### Task 3: Write `/extract-pattern`

**Files:**
- Create: `.claude-plugin/skills/extract-pattern/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/extract-pattern/SKILL.md` with:

  ```markdown
  ---
  name: "extract-pattern"
  description: "Use when a pattern appears in 2+ components to promote it to a shared controller or utility. Extracts inline code into src/controllers/ or src/utils/, updates all consumers, and updates the vocabulary registry."
  ---

  ## Overview

  Second-use rule: implement inline on first use, extract on second. This skill handles the extraction: moves the inline pattern to a shared controller or utility, updates all consumers, and registers any new names in `docs/vocabulary.md`.

  ## Usage

  ```
  /extract-pattern -- roving focus logic inline in both accordion and tabs
  /extract-pattern -- open/close state management duplicated in dialog and popover
  ```

  ## Implementation

  ### Step 1 — Identify the pattern

  Read the inline implementations in both components. Document:
  - What state the pattern manages
  - What its public interface is (methods, properties, events)
  - Whether it belongs in `src/controllers/` (a `ReactiveController`) or `src/utils/` (a pure function)

  **Controllers:** stateful, tied to element lifecycle, implement `ReactiveController`.
  **Utilities:** pure functions, no Lit dependency, no element lifecycle.

  ### Step 2 — Check for prior art

  Read `src/controllers/` and `src/utils/`. If a closely related implementation already exists: extend it rather than creating a new one.

  ### Step 3 — Write failing tests (RED)

  Write `src/controllers/{name}.test.ts` or `src/utils/{name}.test.ts`. Tests must cover:
  - The shared interface (all public methods)
  - Both use cases that triggered extraction (one test case per originating component)
  - Edge cases from either inline implementation

  Run `npm run test:run -- src/controllers/` (or `src/utils/`) — confirm tests fail.

  ### Step 4 — Implement (GREEN)

  Write `src/controllers/{name}.ts` or `src/utils/{name}.ts`:
  - Follow `ReactiveController` pattern from `.claude-plugin/refs/lit-patterns.md` if it's a controller
  - No DOM access in controllers (testable in Node without a browser)
  - Constructor calls `host.addController(this)` for controllers
  - `hostConnected()` / `hostDisconnected()` for setup and teardown

  Run tests — confirm they pass.

  ### Step 5 — Update consumers

  For each component that has the inline version:
  1. Delete the inline code
  2. Import the shared controller/utility
  3. Wire it up

  Run `npm run test:run -- src/components/{name}/` for each updated component — all tests must pass.

  ### Step 6 — Update vocabulary registry

  If the extracted pattern introduces new action verbs, controller names, or method signatures: add them to `docs/vocabulary.md`.

  ### Step 7 — Run lit-reviewer

  Read `.claude-plugin/reviewers/lit-reviewer/SKILL.md`. Use its content as the Agent prompt. Dispatch as Agent call. Read and inject as context: new shared file content, all updated consumer file contents, `.claude-plugin/refs/lit-patterns.md` content, `.claude-plugin/refs/ssr-contract.md` content.

  Fix all blockers. Re-review after fixes. Max 2 iterations.

  ### Step 8 — Commit

  ```bash
  git add src/controllers/{name}.ts src/utils/{name}.ts src/components/*/
  git commit -m "refactor: extract {name} to shared {controller|utility}"
  ```

  **Next step: `/validate-build`.**
  ```

- [ ] **Step 2: Verify**

  Confirm:
  - Second-use rule documented
  - Controller vs utility decision guidance present
  - TDD: RED test before implementation
  - All consumers updated
  - Vocabulary registry update step present
  - lit-reviewer dispatched with correct context (lit-patterns.md + ssr-contract.md)

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/extract-pattern/SKILL.md
  git commit -m "feat(skills): add extract-pattern skill"
  ```

---

### Task 4: Write `/deprecate`

**Files:**
- Create: `.claude-plugin/skills/deprecate/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/deprecate/SKILL.md` with:

  ```markdown
  ---
  name: "deprecate"
  description: "Use to mark a public API element as deprecated. Adds @deprecated JSDoc with migration path, dev-mode console.warn, updates CEM, and generates a migration guide stub. Never removes — deprecation is a warning phase."
  ---

  ## Overview

  Marks an API as deprecated without breaking existing consumers. Deprecation and removal are always separate commits — this skill handles only the deprecation phase.

  ## Usage

  ```
  /deprecate accordion -- value property renamed to selectedValue in next major
  /deprecate grund-accordion-indicator -- replaced by CSS ::part(indicator) styling
  ```

  ## Implementation

  ### Step 1 — Identify the API

  Confirm:
  1. What is being deprecated (property, event, element, slot, CSS custom property)?
  2. What replaces it? (If nothing replaces it, document that it will be removed.)
  3. Which version targets removal? (Check current semver in `package.json`.)

  ### Step 2 — Add `@deprecated` JSDoc

  In the relevant element class, update the JSDoc:

  For a deprecated property:
  ```ts
  /**
   * @deprecated Use `selectedValue` instead. Will be removed in v2.0.
   */
  @property() value?: string;
  ```

  For a deprecated element class:
  ```ts
  /**
   * @deprecated Replaced by CSS `::part(indicator)` styling. Will be removed in v2.0.
   * @element grund-accordion-indicator
   */
  export class GrundAccordionIndicatorElement extends LitElement {
  ```

  ### Step 3 — Add dev-mode warning

  For a deprecated property — warn when set (in `willUpdate`):
  ```ts
  override willUpdate(changed: PropertyValues) {
    if (import.meta.env.DEV && changed.has('value')) {
      console.warn('[grund-accordion] `value` is deprecated. Use `selectedValue` instead. Will be removed in v2.0.');
    }
    super.willUpdate(changed);
  }
  ```

  For a deprecated element — warn in `connectedCallback`:
  ```ts
  override connectedCallback() {
    super.connectedCallback();
    if (import.meta.env.DEV) {
      console.warn('[grund-accordion-indicator] This element is deprecated. Use CSS ::part(indicator) instead. Will be removed in v2.0.');
    }
  }
  ```

  ### Step 4 — Update CEM

  ```bash
  npm run analyze
  git add custom-elements.json
  ```

  Verify the `@deprecated` tag appears in the CEM output for the affected element or member.

  ### Step 5 — Write migration guide stub

  If `docs/migration/` does not exist: create the directory.

  Create or append to `docs/migration/v{N}.md`:
  ```markdown
  ## Deprecated: `value` on `<grund-accordion>`

  **Migration:** Replace `value` with `selectedValue`. The API is identical.

  **Removal target:** v2.0
  ```

  ### Step 6 — Commit

  ```bash
  git add <affected element files> custom-elements.json docs/migration/
  git commit -m "deprecate(<component>): <what> — use <replacement> instead"
  ```

  ## Common Mistakes

  - **Removing the deprecated API in the same commit.** Deprecation and removal are separate commits (often separate releases).
  - **Forgetting the CEM update.** The `@deprecated` tag must appear in `custom-elements.json` for tooling to surface it to consumers.
  - **No migration path.** Every deprecation must say what to use instead or when it will be removed.
  ```

- [ ] **Step 2: Verify**

  Confirm:
  - Covers § 3.4 `/deprecate`: @deprecated JSDoc, dev-mode warn, CEM update, migration guide stub
  - Code examples for both property and element deprecation
  - `willUpdate` used for property warn (not `updated` or `connectedCallback`)
  - `import.meta.env.DEV` guard on all warnings
  - "Never removes" principle stated

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/deprecate/SKILL.md
  git commit -m "feat(skills): add deprecate skill"
  ```

---

### Task 5: Write `/audit-cross-component`

**Files:**
- Create: `.claude-plugin/skills/audit-cross-component/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/audit-cross-component/SKILL.md` with:

  ```markdown
  ---
  name: "audit-cross-component"
  description: "Use when a bug or pattern issue may affect multiple components. Dispatches one subagent per component to check for the same issue. Returns consolidated findings. Called by /fix-bug and /update-dependency."
  ---

  ## Overview

  Single-issue audit across the entire component library. Each component gets a focused subagent. Prevents a fix from landing in only one place when the same bug or anti-pattern exists elsewhere.

  ## Usage

  ```
  /audit-cross-component -- aria-controls links missing when AriaLinkController is not attached
  /audit-cross-component -- crypto.randomUUID() called in class field initializers (SSR unsafe)
  /audit-cross-component -- event listeners not cleaned up in hostDisconnected
  ```

  ## Implementation

  ### Step 1 — Define the issue

  Write a one-sentence description of the pattern to find:
  - What file, code structure, or idiom to look for
  - What a correct implementation looks like
  - Whether the issue is in elements, controllers, utilities, or all

  ### Step 2 — List all components

  List all directories under `src/components/`. Also check `src/controllers/` and `src/utils/` if the issue is in shared code.

  ### Step 3 — Dispatch subagents (parallel)

  For each component directory, dispatch one Agent subagent with this prompt:

  > "Read all TypeScript files in `src/components/{name}/`. Check for: {issue description}. Report AFFECTED (with file path and line number) or CLEAN. Do not fix — report only."

  Dispatch all subagents simultaneously.

  ### Step 4 — Collect findings

  Aggregate results:

  ```
  ## Cross-Component Audit: {issue description}

  ### Affected
  - `accordion`: src/components/accordion/root/index.ts:42 — {description}
  - `tabs`: src/components/tabs/trigger/index.ts:17 — {description}

  ### Clean
  - `dialog`, `switch`, `separator`

  ### Summary
  2/5 components affected.
  ```

  ### Step 5 — Handoff

  If invoked by `/fix-bug` or `/update-dependency`: return findings to the caller for fixing.

  If invoked directly: present findings to the engineer and await decision on next steps.
  ```

- [ ] **Step 2: Verify**

  Confirm:
  - Covers § 3.4 `/audit-cross-component`: dispatches one subagent per component, returns consolidated findings
  - Subagents report only (do not fix)
  - All subagents dispatched simultaneously (parallel)
  - Output format shows affected + clean components
  - Handoff covers both caller-invoked and direct-invoked paths

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/audit-cross-component/SKILL.md
  git commit -m "feat(skills): add audit-cross-component skill"
  ```

---

### Task 6: Write `/update-dependency`

**Files:**
- Create: `.claude-plugin/skills/update-dependency/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/update-dependency/SKILL.md` with:

  ```markdown
  ---
  name: "update-dependency"
  description: "Use to update a dependency version. Reads changelog for breaking changes, creates a migration checklist, applies the update, validates the full library, and audits for cross-component side effects."
  ---

  ## Overview

  Safe dependency update: read before touching, verify after changing, validate the library end-to-end. Never bump a version without reading the changelog first.

  ## Usage

  ```
  /update-dependency lit@4.0.0
  /update-dependency @lit/context@2.0.0
  ```

  ## Implementation

  ### Step 1 — Read the changelog

  Search for `{dependency} {version} changelog release notes` or read the CHANGELOG.md at the package's repository. Identify:
  - Breaking changes (API removals, renames, behavior changes)
  - Deprecations introduced
  - Migration guides (official or community)

  If no changelog is found: proceed cautiously and test thoroughly.

  ### Step 2 — Evaluate impact

  ```bash
  grep -r "from '{dependency}" src/ --include="*.ts" -l
  grep -r "from \"{dependency}" src/ --include="*.ts" -l
  ```

  For each file that imports from the dependency: read the imports and note which APIs are used. Check each against the breaking change list from Step 1.

  ### Step 3 — Create migration checklist

  Write a checklist of every file + change needed:
  ```
  - src/controllers/aria-link.controller.ts: rename ariaControlsEl → ariaControlsElements
  - src/components/accordion/root/index.ts: update context import path
  ```

  If no breaking changes: proceed directly to Step 4 with no checklist.

  ### Step 4 — Apply version bump

  ```bash
  npm install {dependency}@{version}
  ```

  ### Step 5 — Apply migrations

  Work through the checklist file by file. For each file changed:
  - Make the edit
  - Run `npm run test:run -- {affected component path}` to confirm no regression

  ### Step 6 — Security audit

  ```bash
  npm audit
  ```

  Report any new vulnerabilities. If high-severity vulnerabilities are introduced: stop and surface to the engineer before proceeding.

  ### Step 7 — Full validation

  ```bash
  npm run test:run
  ```

  Distinguish migration bugs (introduced by this update — fix them) from pre-existing failures (document but do not fix here).

  Run `/validate-build --cross-browser`.

  ### Step 8 — Cross-component check

  Run `/audit-cross-component -- {description of any subtle behavioral change introduced by this version}` to verify no unexpected side effects across the library.

  ### Step 9 — Commit

  ```bash
  git add package.json package-lock.json <migrated files>
  git commit -m "chore: update {dependency} to {version}"
  ```

  ## Common Mistakes

  - **Skipping the changelog read.** Breaking changes exist in minor versions of pre-1.0 packages and some post-1.0 packages.
  - **Not grepping all import sites.** A single missed import will surface as a cryptic runtime error.
  - **Fixing pre-existing test failures.** Only fix regressions introduced by this update — pre-existing failures are a separate concern.
  - **Ignoring npm audit results.** A dependency update that introduces a high-severity vulnerability must not be merged.
  ```

- [ ] **Step 2: Verify**

  Confirm:
  - Covers § 3.4 `/update-dependency`: changelog read, impact evaluation, migration checklist, version bump, migrations, audit, full validation, cross-component check
  - grep commands for finding import sites
  - Security audit step present
  - `/audit-cross-component` invoked for behavioral change verification
  - Pre-existing vs migration failure distinction documented

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/update-dependency/SKILL.md
  git commit -m "feat(skills): add update-dependency skill"
  ```

---

### Task 7: Write `/rebuild-component`

**Files:**
- Create: `.claude-plugin/skills/rebuild-component/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/rebuild-component/SKILL.md` with:

  ```markdown
  ---
  name: "rebuild-component"
  description: "Use to bring an existing component up to current standards. Audits against CLAUDE.md, ref docs, and vocabulary, then produces a rebuild plan via superpowers:writing-plans. Planning skill only — does not implement."
  ---

  ## Overview

  Audits the existing component, produces a gap list, and generates a rebuild plan. The plan guides complete reimplementation using the current pipeline, with existing tests as the regression baseline. This skill produces a plan — not code.

  ## Usage

  ```
  /rebuild-component accordion
  ```

  ## Implementation

  ### Step 1 — Read current state

  Read all files in `src/components/{name}/`, test file(s), and the stories file. Understand the existing implementation before auditing.

  ### Step 2 — Read current standards

  Read:
  - `CLAUDE.md` — architecture and component design rules
  - `docs/vocabulary.md` — naming registry
  - `.claude-plugin/refs/lit-patterns.md`
  - `.claude-plugin/refs/headless-contract.md`
  - `.claude-plugin/refs/ssr-contract.md`

  If a component spec exists at `docs/specs/{name}.spec.md`: read it.

  ### Step 3 — Audit

  Compare the existing component against current standards. For each layer, produce a gap list:

  | Layer | Examples of gaps |
  |---|---|
  | Types | Missing `HostSnapshot`, wrong event detail shape, non-vocabulary names |
  | Context | Unstable context object (recreated each cycle), missing action callbacks |
  | Controller | DOM access in controller, no `syncFromHost`, missing `hostDisconnected` cleanup |
  | Elements | Missing `exportparts`, `data-*` set in event handlers not `willUpdate`, no dev-mode warnings |
  | Tests | Missing keyboard contract, no memory leak test, no RTL coverage, no reparenting test |
  | Stories | Missing Controlled story, no `play` function, `tags: ['autodocs']` absent |

  For each gap: classify as blocker (must fix before rebuild passes review) or cosmetic (nice to have).

  ### Step 4 — Produce rebuild plan

  Invoke `superpowers:writing-plans`. Provide:
  - The gap list as the spec input
  - The instruction to follow the generation pipeline: `/scaffold` → `/build-controller` → `/build-elements` → `/build-stories` → `/validate-build`
  - A baseline task at the start: "Run existing tests — document all failures as known baseline"

  ### Step 5 — Handoff

  Present the gap list and the plan path to the engineer. **Do not implement.**

  The engineer follows the plan using `superpowers:executing-plans` or `superpowers:subagent-driven-development`. The existing component remains in place until the rebuild passes all pipeline gates.

  ## Common Mistakes

  - **Implementing changes directly.** This skill produces a plan, not code. Use `superpowers:writing-plans` to hand off.
  - **Ignoring the existing tests.** The existing test suite is the regression baseline — the rebuild must pass it.
  - **Rebuilding without a spec.** If `docs/specs/{name}.spec.md` does not exist, run `/component-spec {name}` first to produce one.
  ```

- [ ] **Step 2: Verify**

  Confirm:
  - Covers § 3.4 D7 and `/rebuild-component`: audit, gap list, rebuild plan, hand off
  - Planning skill only — "does not implement" stated clearly in both description and Overview
  - Layer-by-layer gap table present
  - `superpowers:writing-plans` invoked for plan generation
  - Existing tests as regression baseline documented
  - "Run /component-spec first if no spec exists" in Common Mistakes

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/rebuild-component/SKILL.md
  git commit -m "feat(skills): add rebuild-component skill"
  ```

---

### Task 8: Write `/prepare-release`

**Files:**
- Create: `.claude-plugin/skills/prepare-release/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/prepare-release/SKILL.md` with:

  ```markdown
  ---
  name: "prepare-release"
  description: "Use to cut a release. Determines semver from CEM diff, generates changelog, validates all components, verifies migration guides for breaking changes, and outputs a publish command or release PR. Does not publish without explicit confirmation."
  ---

  ## Overview

  End-to-end release preparation: semver determination → changelog → full validation → output. Does not publish — presents the command and awaits engineer approval.

  ## Usage

  ```
  /prepare-release
  /prepare-release --dry-run
  ```

  ## Implementation

  ### Step 1 — Determine semver

  ```bash
  git diff origin/main...HEAD -- custom-elements.json
  ```

  Read the CEM diff. Classify the highest-impact change:
  - **Major** — any removed or renamed public property, event, element, `::part()` name, or slot
  - **Minor** — new public property, event, element, part, or slot; no removals
  - **Patch** — bug fixes, internal refactors, documentation; no API surface changes

  If `@changesets/cli` is configured (`package.json` has `@changesets/cli`): run `npx changeset version` and follow its output instead of the above.

  ### Step 2 — Generate changelog

  Read `git log --oneline origin/main...HEAD`. Group commits by type (`feat`, `fix`, `docs`, `chore`, `refactor`).

  Write or prepend to `CHANGELOG.md`:
  ```markdown
  ## [v{N}] — {YYYY-MM-DD}

  ### Breaking Changes
  - {entry for each major change — include migration path reference}

  ### New Features
  - {entry for each minor addition}

  ### Bug Fixes
  - {entry for each fix commit}
  ```

  ### Step 3 — Verify breaking changes have migration guides

  For every breaking change in Step 1: confirm a migration guide entry exists in `docs/migration/v{N}.md`. If missing: write the stub using `/deprecate`'s migration guide format before proceeding.

  ### Step 4 — Full library validation

  ```bash
  npm run test:run
  ```

  Then run `/validate-build --cross-browser`. All 6 steps (lint, build, tests, CEM, bundle, cross-browser) must pass.

  If any step fails: **stop**. Fix failures before proceeding — do not release with failing validation.

  ### Step 5 — Subpath exports check

  Read `package.json` → `exports`. For each subpath entry: verify the referenced file exists in the build output. Run:

  ```bash
  node --input-type=module <<'EOF'
  import './dist/index.js';
  console.log('exports OK');
  EOF
  ```

  Report any import errors.

  ### Step 6 — Dependency audit

  ```bash
  npm audit --audit-level=high
  ```

  No high-severity vulnerabilities allowed in a release. If found: stop and surface to the engineer.

  ### Step 7 — Output publish command or release PR

  Present the following to the engineer and **await explicit approval before running**:

  **Option A — Publish directly:**
  ```bash
  npm version {patch|minor|major}
  npm publish
  ```

  **Option B — Release PR:**
  ```bash
  git add package.json CHANGELOG.md docs/migration/
  git commit -m "chore: release v{N}"
  gh pr create --title "Release v{N}" --body "$(cat CHANGELOG.md | head -60)"
  ```

  Do not run either option until the engineer explicitly confirms.

  ## Common Mistakes

  - **Publishing without explicit confirmation.** Always await engineer approval. Present the command; do not execute it.
  - **Missing migration guides.** Every breaking change must have a documented migration path before release.
  - **Skipping cross-browser validation.** Releases must pass the full `--cross-browser` test suite.
  - **Releasing with a dirty CEM.** Run `npm run analyze` and commit the result before running this skill if any API has changed.
  ```

- [ ] **Step 2: Verify**

  Confirm:
  - Covers § 3.4 `/prepare-release`: semver from CEM diff, changelog, validation, subpath exports, dep audit, publish command
  - @changesets/cli conditional handling present
  - "Does not publish without confirmation" stated clearly in description and Step 7
  - Breaking change migration guide verification (Step 3) present
  - All 6 validate-build steps must pass

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/prepare-release/SKILL.md
  git commit -m "feat(skills): add prepare-release skill"
  ```

---

### Task 9: Write `/review-system-health`

**Files:**
- Create: `.claude-plugin/skills/review-system-health/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/review-system-health/SKILL.md` with:

  ```markdown
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

  For each ref doc in `.claude-plugin/refs/`:
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
  ```

- [ ] **Step 2: Verify**

  Confirm:
  - Covers § 3.4 `/review-system-health`: recurring findings → generation rules, vocabulary staleness, false-positive log → reviewer updates
  - "Run after every 3rd new component" cadence present
  - Recurring pattern threshold (≥ 3 times) defined
  - grep command for vocabulary staleness check
  - "Does not modify skill files" stated clearly

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/review-system-health/SKILL.md
  git commit -m "feat(skills): add review-system-health skill"
  ```

---

## Plan Complete

Plan 4 delivers:
- 2 updated skills: `/diagnose-failure` (new reviewer names), `/post-plan-review` (new 6-reviewer routing)
- 7 new skills: `/extract-pattern`, `/deprecate`, `/audit-cross-component`, `/update-dependency`, `/rebuild-component`, `/prepare-release`, `/review-system-health`

With Plans 1–4 complete, the full Skill & Workflow Redesign spec (§ 3.4) is implemented. The maintenance layer is now fully covered alongside the design, generation, and verification layers from Plans 2–3.
