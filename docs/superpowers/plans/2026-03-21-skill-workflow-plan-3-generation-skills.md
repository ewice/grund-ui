# Skill & Workflow Redesign — Plan 3: Generation Skills

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 8 generation skills in `.claude-plugin/skills/` that implement the new layered component-building pipeline, and deprecate the 11 old skills they replace.

**Architecture:** Each skill is a user-invocable `SKILL.md` in `.claude-plugin/skills/{name}/`. Skills have YAML frontmatter (`name`, `description`) and are written as instructions for the main agent. Generation skills dispatch reviewer agents from `.claude-plugin/reviewers/` by reading their SKILL.md content and passing it as the Agent tool's `prompt`. The pipeline is sequential: `/component-spec` → `/scaffold` → `/build-controller` → `/build-elements` → `/build-stories` → `/validate-build`.

**Tech Stack:** Markdown (skill prompt documents). No code, no tests. Verification is a manual structure and correctness check against the spec.

**Spec:** `docs/superpowers/specs/2026-03-20-skill-workflow-redesign-design.md` § 3.1, § 3.2, § 3.4 (validate-build, modify-component, fix-bug).

---

## File Map

**Create:**
- `.claude-plugin/skills/component-spec/SKILL.md`
- `.claude-plugin/skills/scaffold/SKILL.md`
- `.claude-plugin/skills/build-controller/SKILL.md`
- `.claude-plugin/skills/build-elements/SKILL.md`
- `.claude-plugin/skills/build-stories/SKILL.md`
- `.claude-plugin/skills/fix-bug/SKILL.md`

**Modify:**
- `.claude-plugin/skills/validate-build/SKILL.md` (expand with axe, bundle size, cross-browser, CEM drift check)
- `.claude-plugin/skills/modify-component/SKILL.md` (update reviewer names to new 6-reviewer system)

**Deprecate (update description field only — do not delete):**
- `.claude-plugin/skills/new-component/SKILL.md`
- `.claude-plugin/skills/implement/SKILL.md`
- `.claude-plugin/skills/guidelines-reviewer/SKILL.md`
- `.claude-plugin/skills/accessibility-reviewer/SKILL.md`
- `.claude-plugin/skills/api-surface-reviewer/SKILL.md`
- `.claude-plugin/skills/consistency-reviewer/SKILL.md`
- `.claude-plugin/skills/performance-reviewer/SKILL.md`
- `.claude-plugin/skills/spec-compliance-reviewer/SKILL.md`
- `.claude-plugin/skills/story-reviewer/SKILL.md`
- `.claude-plugin/skills/test-coverage-reviewer/SKILL.md`
- `.claude-plugin/skills/security-reviewer/SKILL.md` (in skills/ — replaced by reviewers/)

---

### Task 1: Write `/component-spec`

**Files:**
- Create: `.claude-plugin/skills/component-spec/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/component-spec/SKILL.md` with the following content:

  ```markdown
  ---
  name: "component-spec"
  description: "Use to author a complete component specification before building. Run with --from <design-spec-path> to parse a Superpowers design spec, or interactively without arguments. Replaces /new-component. Outputs docs/specs/{name}.spec.md."
  ---

  ## Overview

  Produces `docs/specs/{name}.spec.md` — the source of truth for all downstream generation skills. Adapts sections to the component category.

  ## Usage

  ```
  /component-spec
  /component-spec --from docs/superpowers/specs/2026-03-20-accordion-design.md
  ```

  ## Implementation

  ### Step 1 — Load context

  Read `docs/vocabulary.md` and `.claude-plugin/refs/component-shapes.md`.

  ### Step 2 — Gather component info

  **If `--from <path>` provided:** Read the design spec. Extract front-matter:
  `component_name`, `category`, `purpose`, `key_decisions`, `open_questions`.

  **If no `--from`:** Ask:
  1. Component name (e.g., `accordion`, `dialog`, `switch`)
  2. Category: composite-widget | form-control | overlay | collection | feedback | simple
  3. One-sentence purpose

  ### Step 3 — Run `/apg`

  Derive the APG pattern name from component name and category. Follow the `/apg` skill to extract: keyboard interactions, roles, required/optional ARIA attributes, gaps to flag.

  ### Step 4 — Ask category-specific questions

  Ask only questions the design spec left open:

  | Category | Key questions |
  |---|---|
  | composite-widget | Item registry needed? Multiple open items? `defaultValue`/`value`/`multiple` props? |
  | form-control | Input type? Indeterminate state? Validation strategy? |
  | overlay | Trigger strategy? Focus trapping? Outside-click dismiss? |
  | collection | Filtering? Typeahead? Virtual scroll? Multi-select? |
  | feedback | Auto-dismiss? Stacking? Duration prop? |
  | simple | No additional questions. |

  All categories: Cancelable events? RTL considerations? Exit animations?

  ### Step 5 — Write the spec

  Write `docs/specs/{name}.spec.md`:
  - Front-matter (component_name, category, purpose, key_decisions, open_questions)
  - Component overview
  - Elements (each compound part and its role)
  - Context interfaces (state flowing down, actions flowing up — use vocabulary names)
  - Properties (public API, controlled/uncontrolled semantics)
  - Events (name, detail type, cancelable, when fired)
  - Keyboard contract (APG keys + any additions)
  - ARIA contract (roles, required attributes, optional attributes)
  - Parts and slots (headless API decisions)
  - Data attributes
  - Edge cases and constraints

  ### Step 6 — Verify

  Re-read the spec. Confirm:
  - All APG keyboard keys documented
  - Every property has controlled/uncontrolled semantics documented (where applicable)
  - Every event has a typed detail
  - All vocabulary names match `docs/vocabulary.md`

  Fill any gaps before handing off.

  ### Step 7 — Handoff

  Report: spec written to `docs/specs/{name}.spec.md`. **Next step: `/scaffold {name}`.**
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - Covers § 3.1 `/component-spec`: interactive authoring, category adaptation, vocabulary check, APG integration
  - Front-matter fields match D6 (component_name, category, purpose, key_decisions, open_questions)
  - All 6 categories have adapted questions
  - Output path is `docs/specs/{name}.spec.md`
  - Handoff chain points to `/scaffold`

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/component-spec/SKILL.md
  git commit -m "feat(skills): add component-spec skill"
  ```

---

### Task 2: Write `/scaffold`

**Files:**
- Create: `.claude-plugin/skills/scaffold/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/scaffold/SKILL.md` with the following content:

  ```markdown
  ---
  name: "scaffold"
  description: "Use after /component-spec to create directory structure, types.ts, context interfaces, and barrel exports. Runs api-reviewer and headless-reviewer on scaffold output. Next step after /component-spec."
  ---

  ## Overview

  Creates the file skeleton: directories, `types.ts` with all public interfaces, `context/` interfaces, and barrel `index.ts` files. No logic — just structure and types. Reviewer gate ensures the API surface is correct before any logic is written.

  ## Usage

  ```
  /scaffold accordion
  ```

  ## Implementation

  ### Step 1 — Read spec and context

  Read `docs/specs/{name}.spec.md`, `.claude-plugin/refs/lit-patterns.md`, and `.claude-plugin/refs/headless-contract.md`.

  ### Step 2 — Create directories

  Based on category from the spec:

  | Category | Directories to create |
  |---|---|
  | composite-widget | `root/`, `item/`, `controller/`, `registry/`, `context/`, plus each sub-part from spec |
  | form-control | `root/`, `controller/`, `context/` |
  | overlay | `root/`, `trigger/`, `content/`, `controller/`, `context/` |
  | collection | `root/`, `item/`, `controller/`, `context/` |
  | feedback | `root/`, `controller/`, `context/` |
  | simple | `root/` only |

  All under `src/components/{name}/`.

  ### Step 3 — Write `types.ts`

  Create `src/components/{name}/types.ts`:
  - `*Detail` interface for every event in the spec (exported)
  - `HostSnapshot` interface for the root element (controlled/uncontrolled pattern)
  - Category-specific interfaces (e.g., option types for collection)
  - No Lit-specific types (`PropertyValues`, `LitElement`) — framework-agnostic only

  ### Step 4 — Write context interfaces

  Create `src/components/{name}/context/index.ts`:
  - Context key (`Symbol`)
  - Context interface: state fields (read-only) and action callbacks (use vocabulary registry names)
  - Export both from `context/index.ts`

  ### Step 5 — Write barrel `index.ts`

  Create `src/components/{name}/index.ts`:
  - Re-export all element classes (placeholders for now — the files don't exist yet)
  - Re-export all public types from `types.ts`

  Also add SSR-safe ID helpers and define guard to every element stub:
  - Accept optional `id` property (`@property() id?: string`)
  - Derive deterministic IDs from `value` prop where applicable: `` `grund-${tagName}-${value}` ``
  - Fall back to `crypto.randomUUID().slice(0, 8)` only in `connectedCallback` — never in constructors or field initializers
  - Wrap `customElements.define(...)` with `if (!customElements.get('grund-{name}'))` guard

  ### Step 6 — Run reviewer gate (parallel)

  Read `.claude-plugin/reviewers/api-reviewer/SKILL.md` and `.claude-plugin/reviewers/headless-reviewer/SKILL.md`. Dispatch both as parallel Agent calls:

  - **api-reviewer**: pass `types.ts` and `context/index.ts`, the component spec, and `docs/vocabulary.md`
  - **headless-reviewer**: pass `types.ts` (checks part names and data-* attribute declarations), the component spec, and `.claude-plugin/refs/headless-contract.md`

  Collect findings. Fix all blockers before proceeding. Note warnings for follow-up.

  ### Step 7 — Commit

  ```bash
  git add src/components/{name}/
  git commit -m "feat({name}): scaffold — types, context interfaces, directory structure"
  ```

  **Next step: `/build-controller {name}`.**
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - Covers § 3.2 `/scaffold`: directory structure, types.ts, context interfaces, barrel index.ts
  - Category-specific directory table matches `refs/component-shapes.md` categories
  - Reviewer gate dispatches `api-reviewer` + `headless-reviewer` in parallel
  - Reviewer dispatch instruction says to read SKILL.md and pass as Agent prompt
  - Handoff chain points to `/build-controller`

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/scaffold/SKILL.md
  git commit -m "feat(skills): add scaffold skill"
  ```

---

### Task 3: Write `/build-controller`

**Files:**
- Create: `.claude-plugin/skills/build-controller/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/build-controller/SKILL.md` with the following content:

  ```markdown
  ---
  name: "build-controller"
  description: "Use after /scaffold to implement the ReactiveController, registry (if needed), and pure utility functions. TDD: tests written before implementation. Runs lit-reviewer. Next step after /scaffold."
  ---

  ## Overview

  Implements all state logic before touching the DOM. The controller is independently testable — no elements needed. Unit tests cover every action and state transition.

  ## Usage

  ```
  /build-controller accordion
  ```

  ## Implementation

  ### Step 1 — Read spec and patterns

  Read `docs/specs/{name}.spec.md` and `.claude-plugin/refs/lit-patterns.md`. Identify from the spec:
  - State shape (what the controller owns)
  - Actions and their names (must match `docs/vocabulary.md` — `requestToggle`, `requestOpen`, etc.)
  - Resolution logic pattern: pure resolver functions (composite-widget, form-control, simple) OR explicit state machine (overlay, multi-step components). See `refs/lit-patterns.md` for both patterns.

  ### Step 2 — Write failing unit tests (RED)

  Write `src/components/{name}/controller/{name}.test.ts`:
  - Each action: assert state transitions correctly
  - Controlled mode: `syncFromHost()` with a `HostSnapshot` that has `value` set — state does not change on action, event fires
  - Uncontrolled mode: state changes on action, event fires
  - Edge cases from the spec (e.g., `multiple: false` closes other items when one opens)

  Run `npm run test:run -- src/components/{name}/controller/` — confirm tests fail.

  ### Step 3 — Implement the controller (GREEN)

  Write `src/components/{name}/controller/index.ts`:
  - Implements `ReactiveController`
  - All state as private fields
  - `syncFromHost(snapshot: HostSnapshot): void` — called in host's `willUpdate`
  - Actions dispatch `CustomEvent` through `this.host`
  - No DOM access — controller must be testable without a browser
  - Use pure resolver functions (composite/simple) or explicit `states`/`transition()` (overlays)

  If the spec requires a registry: write `src/components/{name}/registry/index.ts` for ordered child tracking. Use `WeakRef<T>` for stored element references.

  Run tests — confirm they pass.

  ### Step 4 — Dispatch `lit-reviewer`

  Read `.claude-plugin/reviewers/lit-reviewer/SKILL.md`. Dispatch as Agent call. Pass: controller file(s), registry file (if exists), component spec, `.claude-plugin/refs/lit-patterns.md`.

  Fix all blockers. Re-review if any fixes were made. Max 2 iterations. Escalate to `/diagnose-failure` if stuck after 2.

  ### Step 5 — Commit

  ```bash
  git add src/components/{name}/controller/ src/components/{name}/registry/
  git commit -m "feat({name}): controller — state machine, actions, resolver logic"
  ```

  **Next step: `/build-elements {name}`.**
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - TDD workflow: RED (write failing test) → GREEN (implement) pattern
  - Controlled/uncontrolled both tested
  - `syncFromHost(HostSnapshot)` pattern documented
  - State machine vs. pure resolver decision guidance present
  - `lit-reviewer` dispatched with ref doc
  - WeakRef noted for registries
  - Handoff chain points to `/build-elements`

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/build-controller/SKILL.md
  git commit -m "feat(skills): add build-controller skill"
  ```

---

### Task 4: Write `/build-elements`

**Files:**
- Create: `.claude-plugin/skills/build-elements/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/build-elements/SKILL.md` with the following content:

  ```markdown
  ---
  name: "build-elements"
  description: "Use after /build-controller to implement all custom elements: root, item, and sub-parts. TDD: integration tests first. Runs all 6 reviewers in parallel after implementation. Next step after /build-controller."
  ---

  ## Overview

  Implements root, item, and all sub-part elements. Wires context, shared controllers, ARIA relationships, lifecycle, dev-mode warnings, and `exportparts`. All 6 reviewers run in parallel — this is the main quality gate.

  ## Usage

  ```
  /build-elements accordion
  ```

  ## Implementation

  ### Step 1 — Read spec and refs

  Always read:
  - `docs/specs/{name}.spec.md`
  - `.claude-plugin/refs/lit-patterns.md`
  - `.claude-plugin/refs/headless-contract.md`
  - `.claude-plugin/refs/consumer-dx.md`

  Read conditionally based on category:
  - Form control: `.claude-plugin/refs/form-participation.md`
  - Overlay or show/hide: `.claude-plugin/refs/transition-contract.md` and `.claude-plugin/refs/focus-management.md`
  - Composite widget with roving focus: `.claude-plugin/refs/focus-management.md`

  ### Step 2 — Write failing integration tests (RED)

  Write `src/components/{name}/{name}.test.ts` using `simulateKeyboard`, `flush`, `getByPart` from `test-utils/index.ts`:
  - Every public property: initial default, dynamic change, attribute reflection
  - Every event: detail shape, controlled mode (state unchanged), uncontrolled mode (state changes)
  - Full keyboard contract from spec
  - Dynamic registration: add and remove child after initial render
  - Mount/unmount memory test
  - RTL (if component has `orientation`)

  Run tests — confirm they fail.

  ### Step 3 — Implement elements (GREEN)

  For each element in the spec:
  - `@provide` context on root; `@consume` on all consumers
  - Attach shared controllers as applicable: `OpenStateController`, `AriaLinkController`, `RovingFocusController`
  - Category-specific: `FormController` (form), `FocusTrapController`/`FocusRestorationController` (overlay)
  - Set `data-*` attributes in `willUpdate` (not in `updated` or event handlers)
  - `exportparts` on every compound layer wrapping shadow elements with `part` attributes
  - Dev-mode warning in `connectedCallback` when element is used outside its required parent
  - `customElements.define()` with `if (!customElements.get(...))` registration guard
  - `HostSnapshot` packaged in root's `willUpdate`, passed to controller via `syncFromHost()`

  Run tests — confirm they pass.

  ### Step 4 — Run all 6 reviewers in parallel

  Read all 6 reviewer SKILL.md files. Dispatch as simultaneous Agent calls:

  | Reviewer | Files to pass | Reference docs to pass |
  |---|---|---|
  | `accessibility-reviewer` | All element files | Spec ARIA section, `.claude-plugin/refs/focus-management.md` |
  | `lit-reviewer` | All element files | `.claude-plugin/refs/lit-patterns.md`, `.claude-plugin/refs/ssr-contract.md` |
  | `headless-reviewer` | All element files | `.claude-plugin/refs/headless-contract.md`, `docs/vocabulary.md` |
  | `api-reviewer` | All element files + `types.ts` | `docs/vocabulary.md` |
  | `test-reviewer` | Test file(s) | `.claude-plugin/refs/test-patterns.md`, component spec |
  | `security-reviewer` | All element files + controller | (self-contained) |

  Collect all findings. For each reviewer with blockers:
  1. Fix the blockers
  2. Re-run only that reviewer (not the full fleet)
  3. Max 2 patch iterations per reviewer
  4. If blockers persist after 2: invoke `/diagnose-failure` and surface to engineer

  ### Step 5 — Commit

  ```bash
  git add src/components/{name}/
  git commit -m "feat({name}): elements — root, item, sub-parts, context, ARIA, lifecycle"
  ```

  **Next step: `/build-stories {name}`.**
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - TDD workflow enforced (RED before GREEN)
  - All 6 reviewers dispatched in parallel with correct file sets and ref docs
  - Reviewer dispatch: reads SKILL.md and passes as Agent prompt
  - Conditional ref loading based on category
  - All shared controllers listed: OpenState, AriaLink, RovingFocus + category-specific
  - HostSnapshot pattern documented
  - `exportparts`, dev-mode warnings, registration guard all mentioned
  - Patch loop: max 2 iterations per reviewer, escalate to `/diagnose-failure`
  - Handoff chain points to `/build-stories`

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/build-elements/SKILL.md
  git commit -m "feat(skills): add build-elements skill"
  ```

---

### Task 5: Write `/build-stories`

**Files:**
- Create: `.claude-plugin/skills/build-stories/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/build-stories/SKILL.md` with the following content:

  ```markdown
  ---
  name: "build-stories"
  description: "Use after /build-elements to create Storybook stories covering all spec variants, play functions, and RTL story. Runs test-reviewer on stories. Final step before /validate-build."
  ---

  ## Overview

  Builds the full Storybook story file: all spec variants, keyboard play functions, RTL story, and autodoc annotations. test-reviewer gate ensures coverage is complete.

  ## Usage

  ```
  /build-stories accordion
  ```

  ## Implementation

  ### Step 1 — Read spec and patterns

  Read `docs/specs/{name}.spec.md` and `.claude-plugin/refs/test-patterns.md`.

  ### Step 2 — Write stories

  Write `stories/{name}.stories.ts`.

  **Required stories:**
  - `Default` — minimal usage (zero configuration beyond slotted content)
  - `Controlled` — `value` prop driven externally with an event listener showing state
  - `Disabled` — root-level disabled and individual item disabled (if applicable)
  - `RTL` — wrap in `<div dir="rtl">` (all components, skip only if spec explicitly has no RTL behavior)
  - One story per major spec variant (e.g., `Multiple` for accordion, `Modal` vs `NonModal` for dialog)

  **Required on at least one story — `play` function covering:**
  - Keyboard navigation: Tab to enter, Arrow keys, Enter/Space activate, Escape dismiss (where applicable)
  - State verification after interaction using `within(canvasElement).getByRole(...)`

  **Required on every story:**
  - Correct autodoc: `@element`, `@slot`, `@csspart`, `@fires` on the element class
  - `args` mapping to real component properties
  - `argTypes` for Controls panel (boolean, select where applicable)
  - Story `name` as plain English description of the variant

  ### Step 3 — Dispatch `test-reviewer`

  Read `.claude-plugin/reviewers/test-reviewer/SKILL.md`. Dispatch as Agent call. Pass: story file, unit test file, component spec, `.claude-plugin/refs/test-patterns.md`.

  Focus checklist items: play function present, story variants cover spec, Storybook a11y addon enabled.

  Fix all blockers. Re-review after fixes.

  ### Step 4 — Commit

  ```bash
  git add stories/{name}.stories.ts
  git commit -m "feat({name}): stories — all variants, play functions, autodoc annotations"
  ```

  **Next step: `/validate-build`.**
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - Covers § 3.2 `/build-stories`: all spec variants, play functions, RTL, autodoc
  - `test-reviewer` dispatched with all required files and ref docs
  - Default, Controlled, Disabled, RTL stories all required
  - Handoff chain points to `/validate-build`

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/build-stories/SKILL.md
  git commit -m "feat(skills): add build-stories skill"
  ```

---

### Task 6: Update `/validate-build`

**Files:**
- Modify: `.claude-plugin/skills/validate-build/SKILL.md`

- [ ] **Step 1: Read the current file**

  Read `.claude-plugin/skills/validate-build/SKILL.md`. The current skill covers: lint, build, tests, CEM analysis, and a summary. It is missing: CEM drift detection (git diff check), bundle size check, cross-browser flag, and axe integration note.

- [ ] **Step 2: Write the updated file**

  Replace `.claude-plugin/skills/validate-build/SKILL.md` with:

  ```markdown
  ---
  name: "validate-build"
  description: "Use after implementation or modification to verify build, tests, lint, CEM, and bundle size all pass. Run all steps even if one fails — the engineer needs the full picture. Pass --cross-browser for Firefox + WebKit coverage."
  ---

  ## Overview

  Runs the full project toolchain and reports results. No code changes — read-only verification. Run all steps even if one fails — the engineer needs the full picture.

  ## Usage

  ```
  /validate-build
  /validate-build --cross-browser
  ```

  ## Implementation

  ### Step 1 — Lint

  ```bash
  npm run lint
  ```

  Failure: report each error with file and line. Auto-fixable issues: suggest `npm run lint -- --fix`.

  ### Step 2 — TypeScript build

  ```bash
  npm run build
  ```

  Failure: report TypeScript errors with file, line, and error message. Common causes: missing exports, type mismatches, unused imports.

  ### Step 3 — Tests

  ```bash
  npm run test:run
  ```

  If `--cross-browser` was passed:

  ```bash
  npm run test:run -- --project=components-firefox --project=components-webkit
  ```

  Failure: report failing test name, file, and assertion message. Distinguish test failure (wrong assertion) from test error (runtime exception — typically a missing import or unregistered element).

  ### Step 4 — CEM analysis and drift check

  ```bash
  npm run analyze
  ```

  If analysis fails: report the error (common cause: JSDoc syntax errors).

  After analysis succeeds, check for CEM drift:

  ```bash
  git diff --exit-code custom-elements.json
  ```

  If the CEM has drifted from the committed version: report the diff as a failure. The CEM must be committed after every API-affecting change — run `git add custom-elements.json && git commit -m "chore: update CEM"`.

  ### Step 5 — Bundle size check

  ```bash
  npm run build:bundle-stats 2>/dev/null || echo "SKIP: no bundle-stats script"
  ```

  If the script exists and fails: report which component exceeds its budget. Budget is defined per-component in `package.json` → `bundleSize` (if configured). If the key is absent: skip silently.

  ### Step 6 — Summary

  ```
  LINT:         PASS | FAIL (N errors)
  BUILD:        PASS | FAIL (N errors)
  TESTS:        PASS | FAIL (N failing / M total)
  CEM:          PASS | FAIL | DRIFT
  BUNDLE:       PASS | FAIL (N over budget) | SKIP
  CROSS-BROWSER: SKIP | PASS | FAIL

  RESULT: ALL PASS | BLOCKED (list failing steps)
  ```

  If ALL PASS: component is ready for commit or handoff.
  If BLOCKED: list failing steps with enough detail to diagnose. Do not fix — report and stop.

  ## Common Mistakes

  - **Skipping steps after first failure.** Run all steps — multiple failures are common.
  - **Attempting to fix failures.** This skill is read-only. Report and stop.
  - **Forgetting CEM drift.** Any JSDoc or property change must be followed by `npm run analyze` + committing the updated CEM.
  ```

- [ ] **Step 3: Verify against spec**

  Confirm:
  - CEM drift detection via `git diff --exit-code custom-elements.json` present
  - Bundle size check present (with skip fallback)
  - `--cross-browser` flag handled
  - All 6 validation steps present (Lint, Build, Tests, CEM, Bundle, Summary)
  - "Run all steps even if one fails" rule present

- [ ] **Step 4: Commit**

  ```bash
  git add .claude-plugin/skills/validate-build/SKILL.md
  git commit -m "feat(skills): update validate-build — add CEM drift, bundle size, cross-browser"
  ```

---

### Task 7: Update `/modify-component`

**Files:**
- Modify: `.claude-plugin/skills/modify-component/SKILL.md`

- [ ] **Step 1: Read the current file**

  Read `.claude-plugin/skills/modify-component/SKILL.md`. The current skill references old reviewer names (`guidelines-reviewer`, `accessibility-reviewer` (old), `api-surface-reviewer`, `consistency-reviewer`, `performance-reviewer`, `spec-compliance-reviewer`, `story-reviewer`). These must be replaced with the new 6-reviewer system.

- [ ] **Step 2: Write the updated file**

  Replace `.claude-plugin/skills/modify-component/SKILL.md` with:

  ```markdown
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

  Read the relevant reviewer SKILL.md files and dispatch as Agent calls.

  | Change type | Reviewers to run |
  |---|---|
  | New or changed property/event (API change) | `api-reviewer`, `lit-reviewer`, `security-reviewer` |
  | New or changed element (structural change) | `lit-reviewer`, `headless-reviewer`, `accessibility-reviewer`, `security-reviewer` |
  | Accessibility or keyboard change | `accessibility-reviewer`, `lit-reviewer`, `security-reviewer` |
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
  ```

- [ ] **Step 3: Verify against spec**

  Confirm:
  - All reviewer names are from the new 6-reviewer system (no old names remain)
  - `security-reviewer` is listed for every change type
  - Reviewer dispatch: reads SKILL.md and passes as Agent prompt
  - Change-type routing table covers all major cases
  - Reference to Superpowers plan path (`docs/superpowers/plans/`) present

- [ ] **Step 4: Commit**

  ```bash
  git add .claude-plugin/skills/modify-component/SKILL.md
  git commit -m "feat(skills): update modify-component — new 6-reviewer routing"
  ```

---

### Task 8: Write `/fix-bug`

**Files:**
- Create: `.claude-plugin/skills/fix-bug/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/skills/fix-bug/SKILL.md` with the following content:

  ```markdown
  ---
  name: "fix-bug"
  description: "Use to fix a reported bug in an existing component. Follows TDD: reproduces in a failing test first, then applies the minimal fix. Use /diagnose-failure if root cause is unclear after reading the code."
  ---

  ## Overview

  Bug → failing test (RED) → root cause → minimal fix (GREEN) → targeted review → `/validate-build`. Never fix a bug without a test that would have caught it.

  ## Usage

  ```
  /fix-bug accordion -- selecting item via keyboard doesn't fire grund-change
  /fix-bug dialog -- focus not restored to trigger on close
  ```

  ## Implementation

  ### Step 1 — Reproduce (RED)

  Locate the component: `src/components/{name}/`.

  Write a failing test that exactly reproduces the reported behavior. Run it:

  ```bash
  npm run test:run -- src/components/{name}/
  ```

  Confirm the test fails for the right reason — the described behavior, not an import error or syntax issue.

  If you cannot write a failing test because the root cause is unknown: invoke `superpowers:systematic-debugging` before writing any code.

  ### Step 2 — Root cause

  Read the relevant source files. Identify which layer owns the bug:
  - **Controller** — wrong state resolution, action fires wrong state transition, event not dispatched
  - **Element** — wrong lifecycle phase (e.g., DOM side effect in `willUpdate`), context misconfiguration, ARIA attribute missing or wrong value
  - **Registry** — wrong item tracking, trigger↔panel ID mismatch

  If root cause is unclear after reading the code: invoke `superpowers:systematic-debugging`.

  ### Step 3 — Fix (GREEN)

  Apply the minimal change that makes the failing test pass without breaking any existing tests.

  ```bash
  npm run test:run -- src/components/{name}/
  ```

  All tests must pass. If fixing the bug requires changing other tests: that is a red flag — investigate whether those tests were wrong or whether the fix is breaking a valid contract.

  ### Step 4 — Targeted review

  Read the relevant reviewer SKILL.md files. Dispatch as Agent calls.

  | Modified layer | Reviewers |
  |---|---|
  | Controller only | `lit-reviewer`, `security-reviewer` |
  | Elements | `lit-reviewer`, `headless-reviewer`, `accessibility-reviewer`, `security-reviewer` |
  | ARIA or focus behavior | `accessibility-reviewer`, `security-reviewer` |
  | Events or types | `api-reviewer`, `security-reviewer` |
  | Tests only | `test-reviewer` |

  ### Step 5 — Validate

  Run `/validate-build`.

  ### Step 6 — Commit

  ```bash
  git add <affected files>
  git commit -m "fix({name}): <one-line description of what was fixed>"
  ```

  ## Common Mistakes

  - **Fixing without a failing test.** The test is the proof the bug existed and won't regress.
  - **Changing unrelated code.** Minimal fix only. Refactoring is a separate commit.
  - **Updating existing tests to pass instead of fixing the code.** Existing tests document intended behavior — update them only if the spec changed.
  - **Skipping `security-reviewer`.** Listener leaks and XSS vectors hide in bug fixes.
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - Covers § 3.4 `/fix-bug`: TDD reproduction, root cause investigation, minimal fix, review, validate-build
  - Three root cause layers listed (controller, element, registry)
  - `superpowers:systematic-debugging` invoked if root cause unclear
  - Reviewer routing table present
  - `security-reviewer` on every change type
  - "Never fix without a failing test" as a common mistake

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/skills/fix-bug/SKILL.md
  git commit -m "feat(skills): add fix-bug skill"
  ```

---

### Task 9: Deprecate old skills

The following skills in `.claude-plugin/skills/` are replaced by the new pipeline. Update only their `description` field in the YAML frontmatter to say "DEPRECATED — …" so they are no longer invoked accidentally.

- [ ] **Step 1: Update `new-component` description**

  In `.claude-plugin/skills/new-component/SKILL.md`, change the `description` frontmatter value to:
  `"DEPRECATED — replaced by /component-spec. Do not use."`

- [ ] **Step 2: Update `implement` description**

  In `.claude-plugin/skills/implement/SKILL.md`, change the `description` frontmatter value to:
  `"DEPRECATED — replaced by /scaffold + /build-controller + /build-elements + /build-stories pipeline. Do not use."`

- [ ] **Step 3: Update old reviewer skill descriptions**

  Update each of the following, changing only their `description` to:

  - `guidelines-reviewer`: `"DEPRECATED — replaced by lit-reviewer and headless-reviewer in .claude-plugin/reviewers/. Do not use."`
  - `accessibility-reviewer` (in skills/): `"DEPRECATED — replaced by .claude-plugin/reviewers/accessibility-reviewer/. Do not use."`
  - `api-surface-reviewer`: `"DEPRECATED — replaced by .claude-plugin/reviewers/api-reviewer/. Do not use."`
  - `consistency-reviewer`: `"DEPRECATED — scope merged into api-reviewer. Do not use."`
  - `performance-reviewer`: `"DEPRECATED — render performance coverage merged into lit-reviewer. Do not use."`
  - `spec-compliance-reviewer`: `"DEPRECATED — scope split across api-reviewer and lit-reviewer. Do not use."`
  - `story-reviewer`: `"DEPRECATED — replaced by .claude-plugin/reviewers/test-reviewer/. Do not use."`
  - `test-coverage-reviewer`: `"DEPRECATED — replaced by .claude-plugin/reviewers/test-reviewer/. Do not use."`
  - `security-reviewer` (in skills/): `"DEPRECATED — replaced by .claude-plugin/reviewers/security-reviewer/. Do not use."`

- [ ] **Step 4: Verify**

  ```bash
  grep -r "DEPRECATED" .claude-plugin/skills/*/SKILL.md | wc -l
  ```

  Expected: 11 (all deprecated skills updated).

- [ ] **Step 5: Commit**

  ```bash
  git add \
    .claude-plugin/skills/new-component/SKILL.md \
    .claude-plugin/skills/implement/SKILL.md \
    .claude-plugin/skills/guidelines-reviewer/SKILL.md \
    .claude-plugin/skills/accessibility-reviewer/SKILL.md \
    .claude-plugin/skills/api-surface-reviewer/SKILL.md \
    .claude-plugin/skills/consistency-reviewer/SKILL.md \
    .claude-plugin/skills/performance-reviewer/SKILL.md \
    .claude-plugin/skills/spec-compliance-reviewer/SKILL.md \
    .claude-plugin/skills/story-reviewer/SKILL.md \
    .claude-plugin/skills/test-coverage-reviewer/SKILL.md \
    .claude-plugin/skills/security-reviewer/SKILL.md
  git commit -m "chore(skills): deprecate old skills replaced by new pipeline"
  ```

- [ ] **Step 6: Final commit**

  ```bash
  git add \
    .claude-plugin/skills/component-spec/SKILL.md \
    .claude-plugin/skills/scaffold/SKILL.md \
    .claude-plugin/skills/build-controller/SKILL.md \
    .claude-plugin/skills/build-elements/SKILL.md \
    .claude-plugin/skills/build-stories/SKILL.md \
    .claude-plugin/skills/fix-bug/SKILL.md \
    .claude-plugin/skills/validate-build/SKILL.md \
    .claude-plugin/skills/modify-component/SKILL.md
  git commit -m "docs: Plan 3 complete — 8 generation skills ready, 11 old skills deprecated"
  ```

---

## Plan Complete

Plan 3 delivers:
- 6 new skills: `/component-spec`, `/scaffold`, `/build-controller`, `/build-elements`, `/build-stories`, `/fix-bug`
- 2 improved skills: `/validate-build` (CEM drift, bundle size, cross-browser), `/modify-component` (new 6-reviewer routing)
- 11 deprecated skills marked with "DEPRECATED" to prevent accidental invocation
- Full sequential pipeline: `/component-spec` → `/scaffold` → `/build-controller` → `/build-elements` → `/build-stories` → `/validate-build`

**Next:** Plan 4 — maintenance skills (`/diagnose-failure` improvements, `/extract-pattern`, `/deprecate`, `/post-plan-review`, `/audit-cross-component`, `/update-dependency`, `/rebuild-component`, `/prepare-release`, `/review-system-health`).
