# Skill & Workflow Redesign for Grund UI

**Date:** 2026-03-20
**Status:** Draft
**Scope:** Full teardown and rebuild of the skill/agent system for building and maintaining a headless, accessible, performant, well-documented Lit Web Component library at scale.

---

## 1. Problem Statement

The current 16-skill system was designed around the accordion component and has never been used to build a component end-to-end. Analysis from Senior, Staff, and Principal Lit Frontend Engineering perspectives reveals:

- **Reviewer overlap and unclear boundaries** — 9 reviewers with overlapping concerns (guidelines-reviewer, spec-compliance-reviewer, and consistency-reviewer all check data attributes)
- **No Lit-specific engineering guidance** — no skill encodes lifecycle discipline, reactive property design, Shadow DOM patterns, SSR safety, or context subscription best practices
- **Missing engineering domains** — RTL, form participation, animation/presence, focus management, positioning, live regions, consumer DX, dev-mode warnings, bundle size, cross-browser testing, automated a11y testing
- **Workflow is waterfall** — generates all files in parallel then reviews everything at once; a wrong context interface cascades through 1000+ lines of code
- **Skills designed for accordion shape only** — doesn't account for form controls, overlays, collections, or feedback components
- **No maintenance workflows** — no bug fix, dependency update, deprecation, cross-component audit, or release pipeline
- **No feedback loop** — no mechanism to promote recurring reviewer findings into generation-time rules, no metrics on workflow effectiveness, no reviewer calibration

---

## 2. Design Principles

1. **Layered validation, not batch review.** Validate at each architectural layer before building the next. Types -> Context -> Controller -> Elements -> Tests -> Stories.
2. **Skills teach, reviewers verify.** Generation skills encode the *how*. Reviewers verify compliance. If a reviewer keeps catching the same thing, fix the generation skill.
3. **Clear ownership, no overlap.** Every concern has exactly one owner. No two skills flag the same issue.
4. **Token-conscious by design.** Skills loaded into agent context stay lean (<500 words for reviewers, <300 for reference triggers). Heavy material in separate reference docs loaded on demand.
5. **Component-shape-aware.** The system recognizes distinct component categories (composite widget, form control, overlay, collection, feedback, simple) and adapts guidance per category.
6. **The headless contract is sacred.** Zero visual styles. Every `::part()`, slot, `data-*` attribute, and CSS custom property is a public API decision treated as first-class.
7. **Consumer-first API design.** Every decision validated from the consumer's perspective. "Can someone use this without reading source?" is the bar.
8. **Right-sized ceremony.** A Separator doesn't go through the same pipeline as a Combobox. Workflow adapts to component complexity.
9. **Cross-component learning.** Patterns discovered in one component feed back into the system. Shared controllers, vocabulary registry, and reference docs evolve.
10. **Every skill is pressure-tested.** Following the writing-skills TDD methodology: no skill ships without a failing baseline and passing verification.
11. **Human readability is a deliverable.** Generated code must be readable by a human maintainer who didn't write it. Member ordering, naming, file size, template structure are enforced.
12. **Superpowers is the orchestrator, skills are the domain experts.** Superpowers owns workflow (brainstorm -> plan -> execute -> review -> finish). Project skills own domain knowledge (Lit patterns, a11y, headless design).

---

## 3. Skill Inventory

### 3.1 Layer 1: Design Skills

#### `/component-spec`

**Replaces:** `/new-component`

Interactive spec authoring that adapts to component shape. When invoked with `--from <design-spec-path>`, parses the Superpowers design spec for component name, category, purpose, decisions, and constraints, then asks only gap-filling questions.

**Component categories and adapted sections:**

| Category | Additional spec sections |
|---|---|
| Composite widget (Accordion, Tabs) | Items, compound elements, context layers, roving focus |
| Form control (Switch, Checkbox, Radio, Input) | Form association, validation states, label strategy, indeterminate state |
| Overlay (Dialog, Popover, Tooltip, Dropdown) | Trigger strategy, positioning, focus trapping, outside-click, scroll lock, z-index, exit animation |
| Collection (Select, Combobox, Listbox, Menu) | Filtering, typeahead, virtual scroll, multi-select, option groups, virtual focus |
| Feedback (Toast, Alert) | Lifecycle management, stacking, auto-dismiss, live regions |
| Simple (Separator, VisuallyHidden) | Minimal spec — element, ARIA role, parts, slots only |

**All categories include:** Cancelable event contract, focus management strategy, animation requirements, RTL considerations.

**Consults:** Vocabulary registry (naming consistency), `/apg` output (ARIA contract), `refs/component-shapes.md` (category guidance).

**Outputs:** `docs/specs/{name}.spec.md`

#### `/apg`

**Unchanged.** Maps pattern name to canonical APG URL, extracts keyboard interactions, roles, required/optional ARIA. Outputs structured block with gaps flagged.

#### Vocabulary Registry

**Location:** `docs/vocabulary.md`

A living document, not a skill. Tracks cross-component naming consistency:

- **Action verbs:** `requestToggle`, `requestOpen`, `requestClose`, `requestSelect`, `requestNavigate`
- **Event names:** `grund-change`, `grund-open-change`, `grund-value-change`, `grund-select`
- **Part names:** `trigger`, `panel`, `header`, `content`, `indicator`, `label`, `input`
- **Slot names:** conventions for unnamed vs named slots
- **Data attributes:** `data-state`, `data-open`, `data-disabled`, `data-orientation`, `data-index`
- **Context method signatures:** registration, action, query patterns

**Touchpoints:**
- `/component-spec` reads + writes new entries
- `api-reviewer` reads (validates names)
- `/extract-pattern` writes (new shared pattern names)
- `/review-system-health` audits for staleness

---

### 3.2 Layer 2: Generation Skills

Generation is incremental. Each skill validates its output before the next skill runs.

#### `/scaffold`

**Builds:** Directory structure, `types.ts`, `context/` interfaces, barrel `index.ts`.

**Key behaviors:**
- Generates SSR-safe ID strategy (deterministic, overridable — not bare `crypto.randomUUID()`)
- Generates safe `customElements.define()` wrapper (handles duplicate registration)
- Adapts directory structure to component category (no registry dir for simple components, no item dir for non-compound)
- Loads `refs/lit-patterns.md` and `refs/headless-contract.md`

**Validates:** Types compile. Context interfaces follow vocabulary. Correct shape for category.

**Reviewer gate:** `api-reviewer` on types + context, `headless-reviewer` on `::part()` names and `data-*` attributes defined in types (these are public API decisions made at scaffold time).

#### `/build-controller`

**Builds:** Controller, registry (if needed), pure utility functions in `utils/`.

**Key behaviors:**
- TDD: tests written first, then implementation
- Controller uses explicit state/transition pattern where appropriate (state machine formalization)
- No DOM access in controller
- Registry uses `WeakRef` where appropriate for long-lived element references
- Loads `refs/lit-patterns.md`
- Before implementing any pattern, checks existing components for inline versions -> triggers `/extract-pattern` if found

**Validates:** Unit tests pass. Controller independently testable. Actions resolve correctly.

**Reviewer gate:** `lit-reviewer` on controller only.

#### `/build-elements`

**Builds:** All custom elements (root, item, sub-parts). Wires context, lifecycle, shared controllers.

**Key behaviors:**
- TDD: integration tests first, then implementation
- Generates dev-mode warnings for structural misuse (wrong nesting, missing parents, deprecated APIs)
- Generates `exportparts` where compound layers need part forwarding
- Wires shared controllers: `OpenStateController`, `AriaLinkController`, `RovingFocusController`, and any category-specific controllers (`FormController`, `FocusTrapController`, `PresenceController`, etc.)
- Loads `refs/lit-patterns.md`, `refs/headless-contract.md`, `refs/consumer-dx.md`
- Loads `refs/form-participation.md` (if form control)
- Loads `refs/transition-contract.md` (if overlay/show-hide)
- Loads `refs/focus-management.md` (if needs trapping/restoration/virtual focus)
- Before implementing any pattern, checks existing components for inline versions

**Validates:** Elements render. Context flows. Lifecycle correct. Data attributes set. Parts and slots match spec. Dev warnings fire for misuse. Perf smoke test: render count, mount/unmount memory.

**Reviewer gate:** All 6 reviewers in parallel (full component now exists).

#### `/build-stories`

**Builds:** Storybook stories, visual tests, Storybook interaction tests (`play` functions).

**Key behaviors:**
- All spec variants covered
- Keyboard documentation in story
- Autodoc annotations correct
- `play` functions for keyboard and mouse interactions
- RTL variant story
- Loads `refs/test-patterns.md`

**Validates:** Stories render. Autodoc correct. Play functions pass.

**Reviewer gate:** `test-reviewer` on stories.

---

### 3.3 Layer 3: Verification Skills (Reviewer Agents)

All reviewers are dispatched as subagents in parallel. Each receives: files to review, component spec, relevant reference docs, review scope.

All return standardized JSON:

```json
{
  "verdict": "PASS | FAIL",
  "blockers": [{ "file": "", "line": 0, "rule": "", "message": "", "fix_hint": "" }],
  "warnings": [{ "file": "", "line": 0, "rule": "", "message": "" }],
  "notes": [""]
}
```

#### `accessibility-reviewer`

**Owns:** APG pattern compliance, ARIA attributes, keyboard contract, focus management pattern verification, screen reader behavior, RTL keyboard navigation, forced colors mode, live region requirements, touch target sizing guidance.

**Loads:** Spec (ARIA section), APG contract output, `refs/focus-management.md`.

**Does NOT touch:** Code structure, naming, performance.

#### `lit-reviewer`

**Owns:** Lit lifecycle correctness (`willUpdate` vs `updated` vs `firstUpdated`), reactive property design (`hasChanged`, reflection, `@property` vs `@state`), Shadow DOM patterns (`exportparts`, slot projection, `slotchange`), SSR safety (no `document`/`window` in constructors), template readability, member ordering, dev-mode warning presence, context subscription lifecycle, context object stability (no recreation per cycle), observer cleanup (`hostDisconnected`), define timing assumptions, `WeakRef` usage in registries, state machine pattern in controllers, error boundaries, render performance anti-patterns (`requestUpdate()` in `updated()`, unnecessary re-renders, expensive computations in `render()`).

**Loads:** `refs/lit-patterns.md`, `refs/ssr-contract.md`.

**Does NOT touch:** ARIA, spec compliance, naming.

#### `headless-reviewer`

**Owns:** Zero-style enforcement (truly empty Shadow DOM stylesheet or justified `:host` display), `::part()` API completeness and naming, `exportparts` chain verification through compound layers, slot API design (named vs default, fallback content), `data-*` attribute contract, CSS custom property documentation, `:host` display strategy verification, consumer styling capability, forced colors considerations for parts.

**Loads:** `refs/headless-contract.md`.

**Does NOT touch:** Implementation internals.

#### `api-reviewer`

**Owns:** TypeScript types quality, JSDoc/CEM completeness, public API surface, event contracts (detail typing, cancelable documentation, ordering), property naming against vocabulary registry, CSS custom properties in CEM, `package.json` exports map correctness, breaking change detection (CEM diff), consumer ergonomics.

**Loads:** Vocabulary registry, CEM diff (if exists).

**Does NOT touch:** Internal code quality.

#### `test-reviewer`

**Owns:** Spec-to-test mapping, test quality, edge case coverage (dynamic DOM, reparenting, upgrade ordering), memory leak tests (mount/unmount cycles), composition tests (component-in-component), RTL test coverage, axe-core presence, Storybook `play` function coverage, form integration tests (if form control), event ordering tests.

**Loads:** `refs/test-patterns.md`, spec.

**Does NOT touch:** Implementation code.

#### `security-reviewer`

**Owns:** XSS vectors (`innerHTML`, `unsafeHTML`, `unsafeSVG` — explicit ban), event listener hygiene, `composed: false` on `grund-*` events, CSP compliance, ID construction safety, prototype pollution, supply chain (dependency audit in release pipeline).

**Self-contained** — no reference docs needed.

---

### 3.4 Layer 4: Maintenance Skills

#### `/modify-component`

**Improved.** Scoped changes to existing components. Identifies affected layers, runs only relevant reviewers based on what changed:

| Change type | Reviewers triggered |
|---|---|
| Context/types | `api-reviewer`, `lit-reviewer` |
| Controller | `lit-reviewer` |
| Elements | `lit-reviewer`, `headless-reviewer`, `accessibility-reviewer` |
| Tests | `test-reviewer` |
| All changes | `security-reviewer` (always) |

#### `/fix-bug`

**New.** Bug reproduction -> failing test (RED) -> root cause investigation (invokes `superpowers:systematic-debugging` if needed) -> minimal fix (GREEN) -> refactor -> `/audit-cross-component` for same bug class -> relevant reviewers -> `/validate-build`.

#### `/validate-build`

**Expanded.** Lint -> build -> test -> CEM generation (fail if CEM drifts from committed version) -> axe-core run -> bundle size check (per-component budget) -> cross-browser flag (optional `--cross-browser` for Chromium + Firefox + WebKit).

#### `/diagnose-failure`

**Unchanged.** Root cause when reviewer findings persist after 2 patch iterations. Outputs: `FIX_CODE`, `FIX_SPEC`, `FALSE_POSITIVE`, `NEEDS_DISCUSSION`.

#### `/extract-pattern`

**New.** Promotes inline pattern to shared controller/utility when second use is detected. Updates all consumers. Updates vocabulary registry. Runs `/validate-build` on all affected components.

#### `/deprecate`

**New.** Marks API as deprecated: adds `@deprecated` JSDoc with migration path, adds dev-mode `console.warn`, updates CEM, generates migration guide stub, plans removal version.

#### `/post-plan-review`

**Improved.** Quality gate after Superpowers-planned changes. Reads plan file map, infers reviewer selection from change types, runs selected reviewers (from the new set of 6), max 2 patch iterations, escalates to `/diagnose-failure`.

#### `/audit-cross-component`

**New.** Given a bug class or pattern issue, dispatches one subagent per component to check for the same issue. Returns consolidated findings. Used by `/fix-bug` and `/update-dependency`.

#### `/update-dependency`

**New.** Manages dependency version changes for the library.

**Input:** Dependency name + target version (e.g., `lit@4.0.0`, `@lit/context@2.0.0`).

**Steps:**
1. Read the dependency's changelog/release notes for breaking changes and migration guides.
2. Evaluate impact: which components/controllers/utilities import from this dependency?
3. If breaking changes detected: create a migration checklist per affected file.
4. Apply version bump in `package.json`. Run `npm install`.
5. Apply code migrations per the checklist (API changes, import path changes, deprecated API replacements).
6. Run `npm audit` to verify no new vulnerabilities introduced.
7. Run full test suite across all components (`/validate-build --cross-browser`).
8. If tests fail: diagnose whether failures are migration bugs or pre-existing. Fix migration bugs.
9. Dispatch `/audit-cross-component` to verify no subtle behavioral changes across the library.

**Output:** Updated `package.json`, migrated code, passing test suite, audit report.

#### `/rebuild-component`

**New.** Audits existing component against current standards (CLAUDE.md, reference docs, vocabulary). Generates gap list. Creates rebuild plan via `superpowers:writing-plans`. Executes via Pipeline 1 generation steps with existing tests as regression baseline. Old component stays until rebuild passes all gates.

#### `/prepare-release`

**New.** Determines semver version from CEM diff + behavioral changes. Generates changelog (integrates with `@changesets/cli` if configured). Validates: all components pass `/validate-build`, bundle size budgets met, subpath exports correct, dependency audit clean, every breaking change has migration guide entry. Outputs release PR or publish command.

#### `/review-system-health`

**New.** Periodic audit (after every 3rd new component or on demand). Reviews: reviewer finding patterns (recurring findings -> update generation skills), reference doc coverage, vocabulary staleness, false-positive log -> update reviewer prompts. Outputs: update recommendations.

---

## 4. Reference Documents

### 4.1 Document Structure

All reference docs follow a consistent format:

```markdown
# {Topic}

## Rules
Numbered, unambiguous, testable rules.

## Patterns
Before/after code examples. One excellent example per pattern.

## Anti-patterns
What NOT to do and why.

## Per-Category Notes
Specific guidance for composite / form / overlay / collection / feedback / simple.
```

Target size: <800 lines per document. Split by category if exceeded.

### 4.2 Reference Document Inventory

#### `refs/lit-patterns.md`

**Content:**
- Lifecycle rules: `willUpdate` (derived state), `updated` (post-render side effects only), `firstUpdated` (one-time DOM setup). Never dispatch events in `updated`. Never call `requestUpdate()` inside `updated`.
- Property design: `@property` (public API) vs `@state` (internal). `hasChanged` for objects/arrays. Reflection decision tree. Boolean attribute conventions.
- Shadow DOM: `exportparts` for compound layers. Nested slot projection. `slotchange` handling patterns. `delegatesFocus`.
- Context: `@consume` (default) vs `ContextConsumer` (when callback needed). Late provider handling. Context key collision prevention. Subscription lifecycle across disconnect/reconnect.
- SSR: No `document`/`window` in constructors or class fields. Deterministic ID strategy. Declarative Shadow DOM compatibility.
- Dev-mode warnings: Guard with `import.meta.env.DEV` (Vite tree-shakes in production). Pattern: `if (import.meta.env.DEV) { console.warn('grund-accordion-trigger: ...') }`. Used for structural validation, deprecation notices, misuse detection.
- Template organization: Member ordering (decorators -> properties -> constructor -> lifecycle -> public methods -> private methods -> render). Template extraction threshold. Import organization.
- Define timing: Upgrade ordering. Safe `customElements.define()` wrapper. Components must work regardless of registration order.
- Memory: `WeakRef` for element references in registries. Observer cleanup in `hostDisconnected`. `connectedCallback`/`disconnectedCallback` symmetry.
- Error boundaries: try/catch in controller methods that can throw. Graceful degradation.
- State machine pattern: Explicit states/transitions in controllers for complex components.

#### `refs/component-shapes.md`

**Content per category:**

| Category | Key requirements |
|---|---|
| Composite widget | Controller + registry + context layers. `RovingFocusController`. Multi-level context. Item registration. |
| Form control | `FormController` wrapping `ElementInternals`. `formAssociated`, `setFormValue`, validation constraint API, `formResetCallback`, `formStateRestoreCallback`, `formDisabledCallback`. `fieldset disabled` propagation. Label association. |
| Overlay | `PositioningController` (Floating UI / anchor positioning). `FocusTrapController`. `FocusRestorationController`. `OutsideClickController`. `ScrollLockController`. `PresenceController` for exit animations. z-index strategy. Popover API integration where available. |
| Collection | `VirtualFocusController` (`aria-activedescendant`). Typeahead. Virtual scroll for large datasets. Multi-select. Option groups. Filtering. |
| Feedback | `LiveRegionController`. Lifecycle management (auto-dismiss). Stacking. ARIA live region strategy. |
| Simple | Single element. No controller. No registry. Minimal spec. |

Focus management strategy per shape. Positioning needs per shape. Live region needs per shape.

#### `refs/headless-contract.md`

**Content:**
- Zero-style rules: What counts as a visual style. Shadow DOM stylesheet must be empty OR contain only justified `:host { display: ... }`.
- `:host` display strategy: Decision tree per component shape. `display: contents` strips semantics — never use on elements with semantic roles. `display: block` is default for most. Document and justify every `:host` rule.
- `::part()` naming: Conventions (noun, lowercase, hyphenated). Granularity guidelines (enough for consumers to target what they need, not so many it's a maintenance burden). Naming table maintained in vocabulary registry.
- `exportparts` contract: Every part must be accessible from the outermost compound element. Verify chain through all shadow boundaries.
- Slot design: Named vs default. Fallback content rules. Slot content type expectations (documented but not enforced at runtime). Unnamed slot for primary content.
- `data-*` attribute API: Complete registry. All styling hooks use `data-*`. Never bare unprefixed attributes.
- CSS custom properties: Allowed for structural concerns only (e.g., `--grund-transition-duration`). Must be documented in JSDoc (`@cssproperty`), included in CEM.
- Forced colors: All interactive states communicated through more than color alone. Parts must be stylable in forced colors mode.

#### `refs/test-patterns.md`

**Content:**
- Shared test utilities API:
  - `flush(el)` — settles async context propagation (3 render passes)
  - `simulateKeyboard(el, key, options?)` — dispatches keyboard events with correct event properties
  - `getByPart(el, partName)` — queries shadow DOM for elements with matching `part` attribute
  - `expectAriaRelationship(source, target, type)` — verifies `aria-controls`, `aria-labelledby`, etc.
  - `expectDataState(el, state)` — checks `data-state` attribute
  - `createFixture(html)` — wrapper around `@open-wc/testing-helpers` fixture
- axe-core recipe: Run `@axe-core/playwright` on every component state in test fixtures.
- Cross-browser config: Playwright projects for Chromium, Firefox, WebKit.
- RTL test recipe: Wrap fixture in `<div dir="rtl">`, verify keyboard navigation reverses.
- Define-order test: Register child elements before parent, verify component still works.
- Mount/unmount memory test: Create/destroy N instances, check for leaked listeners/observers.
- Reparenting stress test: Move element to different parent, verify context resubscription.
- Event ordering verification: Spy on multiple events, assert sequence.
- Form integration recipes: Submit, reset, validation, disabled fieldset.
- Storybook `play` function patterns: Keyboard navigation, mouse interaction, state verification.
- Visual regression baseline strategy: When to update vs when a diff is a bug.

#### `refs/consumer-dx.md`

**Content:**
- Dev-mode error message catalog: Standard messages for structural misuse (wrong nesting, missing parent, duplicate values), deprecated API usage, invalid prop values. All messages include component name, what's wrong, and how to fix it.
- Progressive disclosure: Defaults must be sensible. A consumer should be able to use the simple case without understanding advanced properties. Document the "just works" path prominently.
- Property naming conventions: Consistent across components. Boolean props start with `is`/`has`/`should` only when the bare adjective is ambiguous.
- Event detail design: Every event has a typed detail interface exported from `types.ts`. Detail includes enough context for consumers to act without querying the component.
- Render delegation: Document that `<slot>` is the Web Component composition mechanism. If a consumer needs the trigger to be an `<a>`, they slot an `<a>` and the component delegates behavior. Document this pattern per component shape.
- Framework wrapper notes: React (`@lit/react`), Vue (`:prop.attr`), Angular (`CUSTOM_ELEMENTS_SCHEMA`). Known quirks per framework.
- CSS custom property documentation standards.

#### `refs/form-participation.md`

**Content:**
- `ElementInternals` full API: `attachInternals()`, `shadowRoot` requirement, `formAssociated` static field.
- `setFormValue()`: For simple values (string) and complex values (FormData). When to call (in `willUpdate` when value changes).
- Validation constraint API: `setValidity()`, `reportValidity()`, `checkValidity()`. Custom validators. Validation message display strategy.
- Form callbacks: `formResetCallback()` (restore default value), `formStateRestoreCallback()` (browser autofill/back-forward cache), `formDisabledCallback()` (propagate disabled from `<fieldset>`).
- Label association: `<label for="">` with `ElementInternals`. Internal label via ARIA.
- Indeterminate state: Checkbox tri-state pattern.
- Shared `FormController` design: Wraps all of the above. Components use the controller, not raw `ElementInternals`.

#### `refs/transition-contract.md`

**Content:**
- `data-state` as the animation hook: Consumers write CSS transitions keyed on `[data-state="open"]` / `[data-state="closed"]`.
- `PresenceController` design: Keeps element in DOM until `transitionend`/`animationend` fires. Prevents exit animation cutoff. API: `present` (boolean), `onExitComplete` (callback).
- `keepMounted` interaction: When `keepMounted=true`, element stays in DOM (CSS transitions work). When `keepMounted=false`, `PresenceController` must delay removal.
- `prefers-reduced-motion`: Components expose `data-*` or CSS custom property. Consumers use `@media (prefers-reduced-motion: reduce)` to disable transitions. Stories demonstrate motion-safe patterns.
- `hidden="until-found"` interaction: Browser find-in-page reveals content. Component handles `beforematch` event to update state.

#### `refs/focus-management.md`

**Content:**
- Decision tree per component shape:
  - Roving tabindex (`RovingFocusController`) — composite widgets (Tabs, Accordion, Toolbar, Menu)
  - Focus trapping (`FocusTrapController`) — modal overlays (Dialog, Sheet)
  - Focus restoration (`FocusRestorationController`) — non-modal overlays (Popover, Dropdown)
  - Virtual focus (`VirtualFocusController`, `aria-activedescendant`) — collections with text input (Combobox, autocomplete)
- `inert` attribute: Set on non-active regions when modal is open. Browser support and polyfill notes.
- Focus delegation: `delegatesFocus` on shadow root. When to use (form controls that wrap a native input).
- Tab order: One tab stop per composite widget. Tab exits to next page-level focusable.

#### `refs/positioning-strategy.md`

**Content:**
- Architectural decision: Floating UI as the positioning engine (or CSS Anchor Positioning when browser support is sufficient).
- `PositioningController` design: Wraps Floating UI. Handles placement, flip, shift, offset, arrow. Updates on scroll and resize.
- Popover API integration: Use native `popover` attribute where available for top-layer positioning. Fallback for unsupported browsers.
- Collision detection: Viewport boundaries, scroll containers.
- CSS Anchor Positioning: Future path. Feature detection. Progressive enhancement.

#### `refs/ssr-contract.md`

**Content:**
- SSR-safe code rules: No `document`, `window`, `navigator` in constructors, class field initializers, or static fields. These are only safe in `connectedCallback` or later.
- Deterministic IDs: Accept optional `id` prop. Generate deterministic ID from component position/context if not provided. `crypto.randomUUID()` only as last resort in client-only code path.
- Declarative Shadow DOM: Components must produce valid DSD templates. Lit handles this, but custom `attachShadow` calls or manual shadow DOM manipulation breaks it.
- Hydration: `render()` output must match server output. Avoid conditional rendering based on client-only state during first render.
- `@lit-labs/ssr` compatibility: Test recipe for server-rendering a component and verifying output.

---

## 5. Workflows

### Universal Reviewer Gate Policy

All reviewer gates across all pipelines follow the same escalation path:

1. **First pass:** Reviewers run in parallel, return findings.
2. **Fix blockers:** The orchestrating skill applies `fix_hint` suggestions and re-runs only the reviewers that reported blockers.
3. **Second pass (max):** If blockers persist after the second pass, escalate to `/diagnose-failure` which determines: `FIX_CODE`, `FIX_SPEC`, `FALSE_POSITIVE`, or `NEEDS_DISCUSSION`.
4. **NEEDS_DISCUSSION** surfaces to the user for a decision. The pipeline pauses — it does not silently skip.

Warnings are logged but do not block. The orchestrating skill may choose to fix them or defer.

### 5.1 Pipeline 1: New Component (Full)

For composite widgets, form controls, overlays, collections — anything with real complexity.

```
superpowers:brainstorming
    -> design spec (docs/superpowers/specs/)
    -> consults vocabulary registry
    -> consults refs/component-shapes.md to identify category

superpowers:writing-plans
    -> implementation plan with layered tasks

/component-spec (pre-filled from design spec)
    -> adapts questions per component category
    -> consults /apg for ARIA contract
    -> consults vocabulary registry for naming consistency
    -> outputs spec (docs/specs/{name}.spec.md)

/scaffold
    -> types.ts, context/, index.ts
    -> loads refs/lit-patterns.md, refs/headless-contract.md
    -> validates: types compile, context interfaces match vocabulary
    -> reviewer gate: api-reviewer (types + context), headless-reviewer (parts + data attributes)

/build-controller
    -> controller, registry (if needed), utils/
    -> loads refs/lit-patterns.md
    -> TDD: tests first, then implementation
    -> pattern check: search existing components for inline versions
    -> validates: unit tests pass, no DOM access, actions resolve
    -> reviewer gate: lit-reviewer (controller only)

/build-elements
    -> all custom elements, shared controller wiring
    -> loads category-relevant refs
    -> TDD: integration tests first, then implementation
    -> pattern check: search existing components for inline versions
    -> generates dev-mode warnings
    -> generates exportparts
    -> validates: elements render, context flows, lifecycle correct
    -> perf smoke test: render count, mount/unmount memory
    -> reviewer gate: ALL 6 reviewers in parallel

/build-stories
    -> stories, visual tests, play functions
    -> validates: all spec variants covered, autodoc correct
    -> reviewer gate: test-reviewer

/validate-build
    -> lint -> build -> test -> CEM -> axe-core -> bundle size

superpowers:finishing-a-development-branch
    -> merge / PR / keep / discard
```

### 5.2 Pipeline 2: New Component (Simple)

For components with no state, no interaction, or trivial structure.

```
/component-spec (interactive, lightweight)
    -> recognizes simple shape, skips irrelevant sections

/scaffold
    -> types.ts (minimal or none), index.ts

/build-elements
    -> single element, no controller/registry
    -> TDD: tests first
    -> reviewer gate: lit-reviewer, headless-reviewer, accessibility-reviewer

/build-stories

/validate-build
```

No Superpowers brainstorming. No plan document.

### 5.3 Pipeline 3: Modify Existing Component (Superpowers-planned)

For significant changes that benefit from design thinking.

```
superpowers:brainstorming -> design spec
superpowers:writing-plans -> scoped plan

superpowers:executing-plans / superpowers:subagent-driven-development
    -> each task follows TDD
    -> review checkpoints use our domain reviewers (not generic Superpowers code-reviewer)

/post-plan-review
    -> runs relevant reviewers based on change map
    -> max 2 patch iterations -> /diagnose-failure if stuck

/validate-build
```

### 5.4 Pipeline 4: Modify Existing Component (Ad-hoc)

For small, well-understood changes.

```
/modify-component {name} -- {description}
    -> identifies affected layers and files
    -> TDD: updates/adds tests first
    -> makes the change
    -> runs relevant reviewers:
        context/types changed -> api-reviewer, lit-reviewer
        elements changed     -> lit-reviewer, headless-reviewer, accessibility-reviewer
        tests changed        -> test-reviewer
        all changes          -> security-reviewer (always)
    -> /validate-build
```

### 5.5 Pipeline 5: Bug Fix

```
/fix-bug {component} -- {description}
    -> writes failing test (RED)
    -> confirms test fails
    -> investigates root cause (superpowers:systematic-debugging if needed)
    -> minimal fix (GREEN)
    -> refactor
    -> /audit-cross-component: checks other components for same bug class
    -> relevant reviewers on changed files
    -> /validate-build
```

### 5.6 Pipeline 6: Rebuild Existing Component

```
/rebuild-component {name}
    -> audits existing component against current standards
    -> generates gap list
    -> superpowers:writing-plans -> rebuild plan

Execute via Pipeline 1 steps
    -> existing tests as regression baseline
    -> old component stays until rebuild passes all gates

Swap: remove old, rename new -> /validate-build
```

### 5.7 Pipeline 7: Shared Infrastructure Change

```
Change to shared controller, utility, or reference doc

/audit-cross-component (all consumers)
    -> one subagent per component
    -> runs affected reviewers on each
    -> full test suite
    -> /validate-build
```

### 5.8 Pipeline 8: Release

```
/prepare-release
    -> determines semver from CEM diff + behavioral changes
    -> generates changelog (@changesets/cli integration)
    -> validates: all components pass /validate-build
    -> validates: bundle size budgets met
    -> validates: subpath exports correct
    -> validates: dependency audit clean
    -> validates: breaking changes have migration guides
    -> outputs release PR or publish command
```

### 5.9 Supporting Workflows

| Trigger | Workflow |
|---|---|
| Second use of inline pattern detected | `/extract-pattern` -> shared controller/utility -> update consumers -> `/validate-build` |
| API needs to change | `/deprecate` -> `@deprecated` JSDoc + `console.warn` -> CEM update -> migration guide stub |
| Dependency update | `/update-dependency` -> evaluate changelog -> update code -> security audit -> full test suite |
| Reviewer finding persists 2 iterations | `/diagnose-failure` -> FIX_CODE / FIX_SPEC / FALSE_POSITIVE / NEEDS_DISCUSSION |
| Bug fix reveals pattern issue | `/audit-cross-component` -> check all components -> fix or file bugs |
| Every 3rd new component (or on demand) | `/review-system-health` -> reviewer finding patterns, ref doc coverage, vocabulary audit |

### 5.10 Workflow Selection

```
Is this a new component?
|-- Yes -> Complex (state, interaction, multiple elements)? -> Pipeline 1
|          Simple (no state, trivial)? -> Pipeline 2
|
Is this a bug fix?
|-- Yes -> Pipeline 5
|
Is this a modification?
|-- Large / uncertain scope -> Pipeline 3 (Superpowers-planned)
|   Small / well-understood -> Pipeline 4 (Ad-hoc)
|
Is this rebuilding an existing component to new standards?
|-- Yes -> Pipeline 6
|
Is this a shared controller/utility/reference change?
|-- Yes -> Pipeline 7
|
Is this a release?
|-- Yes -> Pipeline 8
```

---

## 6. Skills vs Agents

### Decision Framework

**Skills** (guide main agent): Work that requires judgment, accumulated context, user interaction, or decisions that cascade into subsequent steps.

**Agents** (isolated subprocesses): Work with clear inputs/outputs that can be parallelized or needs to protect the main context from noise.

### Mapping

**Skills (main agent):** `/component-spec`, `/apg`, `/scaffold`, `/build-controller`, `/build-elements`, `/build-stories`, `/modify-component`, `/fix-bug`, `/extract-pattern`, `/rebuild-component`, `/deprecate`, `/prepare-release`.

**Agents (dispatched):** All 6 reviewers (parallel, clear input/output), `/validate-build` (shell commands, pass/fail), `/audit-cross-component` (one subagent per component), `/review-system-health` (isolated analysis), pattern extraction checks (focused search returning yes/no).

**Hybrid (skill orchestrates, dispatches agents):**
- `/scaffold` dispatches `api-reviewer`
- `/build-controller` dispatches `lit-reviewer`
- `/build-elements` dispatches all 6 reviewers in parallel
- `/build-stories` dispatches `test-reviewer`
- `/fix-bug` dispatches `/audit-cross-component` agents
- `/post-plan-review` dispatches relevant reviewers
- `/modify-component` dispatches relevant reviewers

### Arbitration

When reviewer agents conflict, the orchestrating skill (which has full context) resolves. No separate "chief reviewer" — the generation skill IS the integrator.

---

## 7. Superpowers Integration

### Handoff Contracts

| Superpowers skill | Hands off to | Interface |
|---|---|---|
| `brainstorming` | `/component-spec` | Design spec file path. `/component-spec --from <path>` parses for: name, category, purpose, decisions, constraints. |
| `writing-plans` | Generation skills | Plan file. Each task maps to one generation skill. Task descriptions include which skill and which refs to load. |
| `executing-plans` | Generation skills | At review checkpoints, dispatches our 6 domain reviewers instead of generic Superpowers code-reviewer. |
| `subagent-driven-development` | Generation skills + our reviewers | Replaces Superpowers spec-reviewer and code-quality-reviewer with our domain reviewers. Implementer prompt augmented with relevant refs. |
| `test-driven-development` | Used WITHIN generation skills | `/build-controller` and `/build-elements` follow TDD internally. |
| `systematic-debugging` | `/fix-bug` | Invoked when root cause investigation is needed. |
| `verification-before-completion` | All pipelines | Every pipeline ends with verification. |
| `finishing-a-development-branch` | All pipelines | Terminal step. |

### Configuration

When using `subagent-driven-development` or `executing-plans`, the plan document specifies which of our 6 reviewers to run at each checkpoint, replacing the generic Superpowers reviewer dispatch.

---

## 8. Planned Shared Controllers

Not built now. Built when the first component in their category needs them. Tracked in `refs/component-shapes.md`.

| Controller | Purpose | Needed by |
|---|---|---|
| `PresenceController` | Delays DOM removal until exit animation completes | Dialog, Popover, Toast, collapsible panels |
| `FocusTrapController` | Traps focus within a container | Dialog, Sheet |
| `FocusRestorationController` | Returns focus to trigger on close | Dialog, Popover, Dropdown |
| `VirtualFocusController` | `aria-activedescendant` pattern | Combobox, Listbox |
| `LiveRegionController` | Shared `aria-live` announcements | Toast, validation, autocomplete |
| `PositioningController` | Floating UI / anchor positioning wrapper | Tooltip, Popover, Dropdown, Combobox |
| `FormController` | `ElementInternals` wrapper with validation | Switch, Checkbox, Radio, Select, Input |
| `OutsideClickController` | Detects clicks outside a component | Dropdown, Popover, Combobox |
| `ScrollLockController` | Prevents body scroll when overlay is open | Dialog, Sheet |

---

## 9. CLAUDE.md Restructuring

**Keep in CLAUDE.md (~250 lines max):**
- Architecture (3 layers, compound component structure)
- Communication patterns (context, registration, events, ARIA linking, keyboard)
- Context design rules
- Controlled/uncontrolled pattern
- Data attribute API
- Component design rules (prefix, Shadow DOM, ElementInternals)
- Accessibility targets (WCAG 2.1 AA, APG)
- JSDoc/CEM standards
- Updated skill workflow reference (new pipeline overview)

**Rules changed from current CLAUDE.md:**
- **ID generation:** Current rule (`crypto.randomUUID().slice(0, 8)`) is replaced. New rule: Accept optional `id` prop; generate deterministic ID from component position/context if not provided; `crypto.randomUUID()` only as last resort in client-only code path. This change is required for SSR/hydration safety. Update CLAUDE.md to reference `refs/ssr-contract.md` for the full ID strategy.
- **Dev-mode warnings:** New requirement not in current CLAUDE.md. Components must emit dev-mode console warnings for structural misuse. The `DEV` guard is resolved via Vite's `import.meta.env.DEV` (tree-shaken in production builds via dead code elimination). Add to CLAUDE.md component design rules section.

**Move to reference docs:**
- Detailed Lit patterns -> `refs/lit-patterns.md`
- Per-category component guidance -> `refs/component-shapes.md`
- Anything only relevant when building/reviewing components

---

## 10. Summary

| Layer | Count |
|---|---|
| Design skills | 2 (`/component-spec`, `/apg`) |
| Vocabulary registry | 1 (`docs/vocabulary.md`) |
| Generation skills | 4 (`/scaffold`, `/build-controller`, `/build-elements`, `/build-stories`) |
| Reviewer agents | 6 (`accessibility`, `lit`, `headless`, `api`, `test`, `security`) |
| Maintenance skills | 12 |
| Reference documents | 10 |
| Planned controllers | 9 (built on demand) |
| Pipelines | 8 |
| **Total** | **24 skills + 10 refs + 1 registry + 9 planned controllers** |

### What's Removed (from current 16)
- `guidelines-reviewer` (dissolved into specific reviewers)
- `spec-compliance-reviewer` (merged into each reviewer's mandate)
- `consistency-reviewer` (replaced by vocabulary registry + `api-reviewer`)
- `story-reviewer` (merged into `test-reviewer`)
- `performance-reviewer` (code checks -> `lit-reviewer`, runtime -> `/validate-build`)
- `/new-component` (replaced by `/component-spec`)
- `/implement` (replaced by layered generation: `/scaffold` -> `/build-controller` -> `/build-elements` -> `/build-stories`)

### What's New
- 8 new maintenance skills (`/fix-bug`, `/extract-pattern`, `/deprecate`, `/audit-cross-component`, `/update-dependency`, `/rebuild-component`, `/prepare-release`, `/review-system-health`)
- 3 reviewers redesigned (`lit-reviewer`, `headless-reviewer`, `api-reviewer`)
- 10 reference documents (from 0)
- 1 vocabulary registry (from 0)
- 9 planned shared controllers (from 3 existing)
- 5 new pipelines (bug fix, rebuild, shared infra, release, simple component)
