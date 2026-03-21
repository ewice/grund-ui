# Skill & Workflow Redesign — Plan 2: Reviewer Agents

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 6 reviewer agents in `.claude-plugin/reviewers/` that generation skills dispatch as subagents to verify component quality.

**Architecture:** Each reviewer is a plain `SKILL.md` file — a subagent prompt with no YAML frontmatter. Generation skills read the SKILL.md, augment it with the specific files to review, reference docs, and component spec, then pass the whole thing as the `prompt` to the Agent tool. All reviewers return the same standardized JSON object (`verdict`, `blockers`, `warnings`, `notes`). Each reviewer has a non-overlapping scope so generation skills can run all 6 in parallel without duplicate findings.

**Tech Stack:** Markdown (subagent prompt documents). No code, no tests. Verification is a manual scope-completeness check against the spec.

**Spec:** `docs/superpowers/specs/2026-03-20-skill-workflow-redesign-design.md` § 3.3

---

## File Map

**Create:**
- `.claude-plugin/reviewers/accessibility-reviewer/SKILL.md`
- `.claude-plugin/reviewers/lit-reviewer/SKILL.md`
- `.claude-plugin/reviewers/headless-reviewer/SKILL.md`
- `.claude-plugin/reviewers/api-reviewer/SKILL.md`
- `.claude-plugin/reviewers/test-reviewer/SKILL.md`
- `.claude-plugin/reviewers/security-reviewer/SKILL.md`

---

### Task 1: Write `accessibility-reviewer`

**Files:**
- Create: `.claude-plugin/reviewers/accessibility-reviewer/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/reviewers/accessibility-reviewer/SKILL.md` with the following content:

  ```markdown
  You are the accessibility reviewer for Grund UI. Review the provided files and return a JSON verdict.

  ## Scope

  **Owns:** APG pattern compliance, ARIA attributes, keyboard contract, focus management, screen reader behavior, RTL keyboard navigation, forced colors mode, live region requirements.

  **Does NOT touch:** Code structure, naming conventions, performance, styles.

  ## Reference Docs

  The caller provides `refs/focus-management.md`, the component spec's ARIA section, and the APG contract output. Read them before reviewing.

  ## Checklist

  ### ARIA Roles
  1. Each element has the correct role per the APG pattern.
  2. No redundant `role` on elements with the correct implicit role.
  3. `role="region"` used only where the APG specifies.

  ### Required ARIA Attributes
  4. `aria-expanded` present and reflects open/closed state on triggers.
  5. `aria-controls` wired via `AriaLinkController` — not manual ID strings.
  6. `aria-labelledby` wired via `AriaLinkController` where the APG requires.
  7. `aria-disabled` reflects disabled state.
  8. `aria-orientation` present when component supports both axes.

  ### Keyboard Contract
  9. Enter/Space activates trigger.
  10. Arrow keys navigate within composite widget (via `RovingFocusController`).
  11. Home/End jump to first/last item.
  12. Tab exits the widget entirely — not trapped.
  13. Escape closes/dismisses where APG requires.

  ### Focus Management
  14. `RovingFocusController` used on container — no manual tabindex manipulation.
  15. Exactly one item at `tabIndex=0` at a time; all others at `tabIndex=-1`.
  16. Focus placement after open/close follows APG guidance.
  17. RTL orientation: `ArrowLeft`/`ArrowRight` swap for horizontal widgets.

  ### Live Regions
  18. `role="alert"` (assertive) for errors; `role="status"` (polite) for informational.
  19. No competing `aria-live` regions across component instances.

  ### Forced Colors
  20. Every interactive state (focused, hovered, expanded, disabled) communicates through something other than color alone.

  ### Touch Targets
  21. Touch target sizing guidance: interactive elements (triggers, close buttons) should be at least 44×44 CSS pixels per WCAG 2.5.5. Flag elements that appear smaller without a note in the spec.

  ## Output Format

  Return a single JSON object:

  ```json
  {
    "verdict": "PASS",
    "blockers": [{ "file": "", "line": 0, "rule": "aria-expanded required", "message": "Trigger missing aria-expanded attribute", "fix_hint": "Add aria-expanded=${this.expanded} to the button in render()" }],
    "warnings": [{ "file": "", "line": 0, "rule": "role=region landmark count", "message": "role=region on every panel may create too many landmarks when accordion has 6+ items" }],
    "notes": ["APG pattern: Accordion (sections with show/hide functionality)"]
  }
  ```

  `blockers` = WCAG violations (must fix). `warnings` = APG recommendations (should fix). `notes` = observations.

  Set `verdict` to `"FAIL"` if any blockers are present.
  ```

- [ ] **Step 2: Verify against spec**

  Open `docs/superpowers/specs/2026-03-20-skill-workflow-redesign-design.md` § 3.3 `accessibility-reviewer`. Confirm:
  - All spec "Owns" items covered: APG compliance ✓, ARIA attributes ✓, keyboard contract ✓, focus management ✓, screen reader behavior ✓, RTL ✓, forced colors ✓, live regions ✓, touch target sizing ✓
  - Output format uses `verdict`/`blockers`/`warnings`/`notes` schema
  - Scope boundary ("Does NOT touch") is explicit
  - File is under 500 words (`wc -w .claude-plugin/reviewers/accessibility-reviewer/SKILL.md`)

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/reviewers/accessibility-reviewer/SKILL.md
  git commit -m "feat(reviewers): add accessibility-reviewer agent"
  ```

---

### Task 2: Write `lit-reviewer`

**Files:**
- Create: `.claude-plugin/reviewers/lit-reviewer/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/reviewers/lit-reviewer/SKILL.md` with the following content:

  ```markdown
  You are the Lit reviewer for Grund UI. Review the provided files and return a JSON verdict.

  ## Scope

  **Owns:** Lit lifecycle correctness, reactive property design, Shadow DOM patterns, SSR safety, member ordering, dev-mode warning presence, context lifecycle, context object stability, observer cleanup, render performance anti-patterns.

  **Does NOT touch:** ARIA semantics, spec compliance, API naming conventions.

  ## Reference Docs

  The caller provides `refs/lit-patterns.md` and `refs/ssr-contract.md`. Cross-reference rule numbers in your findings (e.g., `lit-patterns#2`).

  ## Checklist

  ### Lifecycle (lit-patterns Rules 1–5)
  1. `willUpdate` derives state only. `updated` handles post-render DOM side effects only. `firstUpdated` handles one-time DOM setup only.
  2. `requestUpdate()` never called inside `updated()`.
  3. Root element uses `HostSnapshot` pattern — packages reactive properties into a plain object, passes to controller via `syncFromHost()` in `willUpdate`. Controller never reads reactive properties from the host directly.

  ### Reactive Properties (Rules 6–10)
  4. `@property()` for public API; `@state()` for internal-only state.
  5. `hasChanged` defined for Object, Array, and Set properties.
  6. `reflect: true` only when consumers need CSS selector targeting. Objects and Sets never reflected.

  ### Shadow DOM (Rules 11–13)
  7. `exportparts` declared on every compound layer that wraps elements with `part` attributes.
  8. `slotchange` events used (not `MutationObserver`) to react to slotted content changes.
  9. `delegatesFocus: true` only for form controls wrapping native focusable elements.

  ### Context (Rules 14–17)
  10. `@consume` decorator used by default. `ContextConsumer` class used only when a callback is needed, with a comment explaining why.
  11. Context objects mutate fields in place — never recreated in `willUpdate`.
  12. Context subscriptions declared `private`.

  ### Dev-Mode Warnings (Rules 18–20)
  13. `if (import.meta.env.DEV)` guard on every warning.
  14. Every compound element warns when used outside its required parent context.
  15. Warning format: `[grund-{element}] {what is wrong}. {how to fix it}.`

  ### SSR Safety (ssr-contract.md Rules 1–2)
  16. No `document`, `window`, or `navigator` access in constructors or field initializers.
  17. `crypto.randomUUID()` not used as a field initializer — only inside `connectedCallback` or later.

  ### Memory Management (Rules 26–27)
  18. Every `addEventListener` in `connectedCallback`/`hostConnected` has a matching `removeEventListener` in `disconnectedCallback`/`hostDisconnected`.
  19. Every `ResizeObserver`, `MutationObserver`, or `IntersectionObserver` calls `.disconnect()` in `hostDisconnected`.

  ### Render Performance (Anti-patterns)
  20. No `requestUpdate()` inside `updated()`. No expensive computations inside `render()`.

  ### Template Readability (Rule 22)
  21. `render()` methods exceeding ~30 lines or containing multiple distinct logical sections extract `_renderX()` helpers.

  ### Define Timing (Rule 24)
  22. Components assume nothing about parent element upgrade order in `connectedCallback` — context subscription used to detect when provider becomes available.
  23. `customElements.define()` wrapped with a registration guard: `if (!customElements.get('grund-{name}'))`.

  ### WeakRef in Registries (Rule 28)
  24. Registries storing references to child elements use `WeakRef<T>` to prevent memory leaks when elements are removed without explicit unregistration.

  ### State Machines (Rules 30–31)
  25. Explicit state machine pattern (`states` object + `transition()` method) used only for components with complex multi-step lifecycle (Dialog, Sheet). Simple and composite widgets use pure resolver functions.

  ### Error Boundaries (Rule 29)
  26. Controller methods that process user-provided data or call external APIs wrap risky operations in `try/catch` — dev-mode warning on error, safe fallback or silent failure in production.

  ### Member Ordering (Rule 21)
  27. Class members follow: static properties → `@property`/`@state` → private fields/controllers → constructor → `connectedCallback`/`disconnectedCallback` → lifecycle methods → public methods → private methods → `render()`.

  ## Output Format

  ```json
  {
    "verdict": "PASS",
    "blockers": [{ "file": "", "line": 0, "rule": "lit-patterns#2", "message": "requestUpdate() called inside updated()", "fix_hint": "Move state derivation to willUpdate instead" }],
    "warnings": [{ "file": "", "line": 0, "rule": "lit-patterns#8", "message": "reflect: true on array property will serialize as [object Array]" }],
    "notes": []
  }
  ```

  Set `verdict` to `"FAIL"` if any blockers are present.
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - All spec "Owns" items covered: lifecycle ✓, reactive props ✓, Shadow DOM ✓, SSR safety ✓, member ordering ✓, dev-mode warnings ✓, context lifecycle ✓, context stability ✓, observer cleanup ✓, define timing ✓, WeakRef in registries ✓, state machine pattern ✓, error boundaries ✓, template readability ✓, render performance ✓
  - Rule numbers in checklist map to `refs/lit-patterns.md`
  - Output format uses standard schema
  - File under 500 words

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/reviewers/lit-reviewer/SKILL.md
  git commit -m "feat(reviewers): add lit-reviewer agent"
  ```

---

### Task 3: Write `headless-reviewer`

**Files:**
- Create: `.claude-plugin/reviewers/headless-reviewer/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/reviewers/headless-reviewer/SKILL.md` with the following content:

  ```markdown
  You are the headless reviewer for Grund UI. Review the provided files and return a JSON verdict.

  ## Scope

  **Owns:** Zero-style enforcement, `::part()` API completeness and naming, `exportparts` chain verification, slot design, `data-*` attribute contract, CSS custom property documentation, `:host` display strategy, forced colors considerations for parts.

  **Does NOT touch:** Implementation internals, ARIA semantics, code structure.

  ## Reference Docs

  The caller provides `refs/headless-contract.md`. Cross-reference rule numbers in findings (e.g., `headless-contract#2`).

  ## Checklist

  ### Zero Styles (Rules 1–3)
  1. Shadow DOM stylesheet is either empty or contains only a `:host { display: ... }` rule with a comment.
  2. No `color`, `font`, `background`, `border`, `padding`, `margin`, `width`, `height`, `opacity`, or `transform` in any Shadow DOM stylesheet.
  3. No `transition` or `animation` CSS in Shadow DOM stylesheets.

  ### `:host` Display Strategy (Rules 4–7)
  4. Block-level containers use `:host { display: block }` with a justifying comment.
  5. Inline content wrappers use `:host { display: inline }` with a justifying comment.
  6. `display: contents` never used on elements with a semantic ARIA role.

  ### `::part()` API (Rules 8–12)
  7. Every interactive element and structural container in the Shadow DOM has a `part` attribute.
  8. Part names are lowercase hyphenated nouns only — no verbs (`activate`), no state adjectives (`open-panel`).
  9. Every part is documented with `@csspart` JSDoc on the element class.
  10. Every part name exists in `docs/vocabulary.md`.

  ### `exportparts` Contract (Rules 13–15)
  11. Every compound layer wrapping a shadow root with `part` attributes declares `exportparts`, forwarding all contained parts upward.
  12. The selector `grund-{component}::part({name})` resolves from outside the outermost element without intermediate CSS.

  ### Slot Design (Rules 16–20)
  13. Primary content uses the unnamed default slot.
  14. Named slots used only for distinct optional content regions — not for data passing.
  15. Every slot documented with `@slot` JSDoc.

  ### `data-*` Attributes (Rules 21–24)
  16. State styling hooks use `data-*` attributes — no bare unprefixed attributes (e.g., `expanded` alone is not a valid CSS hook).
  17. Standard attributes (`data-state`, `data-open`, `data-disabled`, `data-orientation`, `data-index`) match the registry definitions in `headless-contract.md`.

  ### Consumer Styling Reachability
  18. Confirm that the `exportparts` chain is complete enough for a consumer to write `grund-{component}::part(trigger) { ... }` from outside the outermost element. Trace: outermost element → intermediate layers → innermost shadow element. Flag any break in the chain.

  ## Output Format

  ```json
  {
    "verdict": "PASS",
    "blockers": [{ "file": "", "line": 0, "rule": "headless-contract#2", "message": "Shadow DOM stylesheet includes color property", "fix_hint": "Remove the color rule — consumers own all visual styles" }],
    "warnings": [{ "file": "", "line": 0, "rule": "headless-contract#11", "message": "Part name 'open-panel' is a state adjective, not a noun" }],
    "notes": []
  }
  ```

  Set `verdict` to `"FAIL"` if any blockers are present.
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - All spec "Owns" items covered: zero styles ✓, `::part()` completeness + naming ✓, `exportparts` chain ✓, slot design ✓, `data-*` contract ✓, CSS custom property documentation ✓, `:host` display strategy ✓, forced colors ✓
  - Rule numbers map to `refs/headless-contract.md`
  - Output format uses standard schema
  - File under 500 words

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/reviewers/headless-reviewer/SKILL.md
  git commit -m "feat(reviewers): add headless-reviewer agent"
  ```

---

### Task 4: Write `api-reviewer`

**Files:**
- Create: `.claude-plugin/reviewers/api-reviewer/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/reviewers/api-reviewer/SKILL.md` with the following content:

  ```markdown
  You are the API reviewer for Grund UI. Review the provided files and return a JSON verdict.

  ## Scope

  **Owns:** TypeScript type quality, JSDoc/CEM completeness, public API surface, event contracts, property naming against the vocabulary registry, `package.json` exports map correctness, breaking change detection.

  **Does NOT touch:** Internal code quality, implementation correctness, styles.

  ## Reference Docs

  The caller provides the vocabulary registry (`docs/vocabulary.md`) and the CEM diff (if a baseline exists).

  ## Checklist

  ### TypeScript Types
  1. Every dispatched event has a corresponding `*Detail` interface exported from `types.ts`.
  2. `types.ts` contains no Lit-specific types (`PropertyValues`, `LitElement`) — it must be framework-agnostic.
  3. `HostSnapshot` interface exported if the component uses the controlled/uncontrolled pattern.

  ### JSDoc — Required on Every Element Class
  4. `@element grund-{name}` present.
  5. `@slot` present for every `<slot>` in shadow templates (named and unnamed).
  6. `@fires {CustomEvent<T>} grund-{action}` present for every dispatched event.
  7. `@csspart name` present for every `part="..."` attribute in shadow templates.

  ### JSDoc — Style Rules
  8. No `{Type}` annotations in `@param` or `@returns`.
  9. Boolean `@property` descriptions start with "Whether ..." — never "True if ...".
  10. First sentence on every element JSDoc is ≤ 80 characters.
  11. `@internal` on every non-public export.
  12. `@deprecated` includes a migration path.

  ### Event Contracts
  13. Event detail types match what the controller actually dispatches.
  14. Cancelable events documented: `@fires ... - Cancelable. Call event.preventDefault() to stop X.`

  ### Property Naming Against Vocabulary Registry
  15. Action verbs on context methods match the registry — no synonyms invented (e.g., `toggle` instead of `requestToggle`).
  16. Event names follow the `grund-{action}` pattern and match registry entries.
  17. Part names exist in the vocabulary registry — no new part names introduced without a registry entry.

  ### CSS Custom Properties in CEM
  18. Every CSS custom property exposed by the component is documented with `@cssproperty` JSDoc and will appear in the Custom Elements Manifest output.
  19. CSS custom property naming follows `--grund-{component}-{property}` convention.

  ### Consumer Ergonomics
  20. A consumer can use the simplest case of the component with zero configuration beyond slotted content — all properties have sensible defaults.
  21. Advanced properties (`keepMounted`, `hiddenUntilFound`, `loopFocus`) are not required for the default use case.

  ### Breaking Changes (CEM Diff)
  22. Removed properties, renamed events, or changed detail types flagged as blockers.
  23. If no baseline CEM exists, note it and skip the diff.

  ## Output Format

  ```json
  {
    "verdict": "PASS",
    "blockers": [{ "file": "", "line": 0, "rule": "api-reviewer#6", "message": "Missing @fires for grund-change event", "fix_hint": "Add @fires {CustomEvent<GrundAccordionChangeDetail>} grund-change - When an item's expanded state changes" }],
    "warnings": [{ "file": "", "line": 0, "rule": "api-reviewer#9", "message": "@property description starts with 'True if' instead of 'Whether'" }],
    "notes": []
  }
  ```

  Set `verdict` to `"FAIL"` if any blockers are present.
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - All spec "Owns" items covered: TypeScript types ✓, JSDoc/CEM ✓, public API surface ✓, event contracts ✓, naming against vocabulary ✓, exports map ✓, breaking change detection ✓, CSS custom properties in CEM ✓, consumer ergonomics ✓
  - Output format uses standard schema
  - File under 500 words

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/reviewers/api-reviewer/SKILL.md
  git commit -m "feat(reviewers): add api-reviewer agent"
  ```

---

### Task 5: Write `test-reviewer`

**Files:**
- Create: `.claude-plugin/reviewers/test-reviewer/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/reviewers/test-reviewer/SKILL.md` with the following content:

  ```markdown
  You are the test reviewer for Grund UI. Review the provided test files and Storybook stories and return a JSON verdict.

  ## Scope

  **Owns:** Spec-to-test mapping, test quality, edge case coverage (dynamic DOM, reparenting, upgrade ordering), memory leak tests, RTL coverage, axe-core presence, Storybook `play` function coverage, event ordering tests, form integration tests (if form control).

  **Does NOT touch:** Implementation code, ARIA semantics.

  ## Reference Docs

  The caller provides `refs/test-patterns.md` and the component spec. Use test-patterns recipes as quality benchmarks; use the spec to identify coverage gaps.

  ## Checklist

  ### Spec-to-Test Coverage
  1. Every public property tested for: initial default value, dynamic runtime change, attribute reflection (if `reflect: true`).
  2. Every event tested for: detail shape (not just "event fired"), controlled mode (event fires, internal state unchanged), uncontrolled mode (state changes and event fires).
  3. Every APG keyboard key tested: Enter/Space, Arrow keys, Home/End, Tab exit, Escape (where applicable).
  4. Keyboard events dispatched with `{ bubbles: true, composed: true }`.
  5. Assertions follow `await flush(el)` — never asserted before the flush.

  ### Dynamic Registration (Edge Cases)
  6. Child element added after initial render registers correctly.
  7. Child element removed unregisters correctly.
  8. Item reparented to a different root resubscribes to the new context.

  ### Memory and Lifecycle
  9. Mount/unmount test verifies event listener cleanup — uses `vi.spyOn` on `addEventListener`/`removeEventListener` and confirms symmetry after `el.remove()`.

  ### Composition
  10. At least one test verifies that two sibling instances of the same component do not interfere with each other.

  ### RTL
  11. Horizontal-oriented components have an RTL test verifying arrow key direction reversal.

  ### Accessibility in Tests
  12. At least one `expect(el).to.be.accessible()` axe-core assertion per component.
  13. At least one ARIA attribute asserted per state change.

  ### Storybook Stories
  14. At least one story has a `play` function covering keyboard navigation.
  15. Stories cover: default, disabled, controlled, RTL (where applicable).

  ### Form Integration (Form Controls Only)
  16. If the component is form-associated (`static formAssociated = true`): verify tests cover `formResetCallback`, `formDisabledCallback`, `<label for>` association, and `FormData` value submission in a `<form>`.

  ### Test Mechanics
  17. `flush(el)` imported from `test-utils/index.ts` and called after every state-triggering action.
  18. Context consumer tests use a minimal `LitElement` wrapper — not raw DOM fixtures.
  19. Test descriptions read as plain English specifications, not implementation notes.

  ## Output Format

  ```json
  {
    "verdict": "PASS",
    "blockers": [{ "file": "", "line": 0, "rule": "test-reviewer#9", "message": "No mount/unmount memory test present", "fix_hint": "Add test using vi.spyOn on addEventListener/removeEventListener, call el.remove(), assert symmetry" }],
    "warnings": [{ "file": "", "line": 0, "rule": "test-reviewer#11", "message": "No RTL test for horizontal accordion variant" }],
    "notes": []
  }
  ```

  Set `verdict` to `"FAIL"` if any blockers are present.
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - All spec "Owns" items covered: spec-to-test mapping ✓, test quality ✓, edge cases (dynamic DOM, reparenting, upgrade ordering) ✓, memory leak tests ✓, composition tests ✓, RTL ✓, axe-core ✓, Storybook play ✓, event ordering ✓
  - Output format uses standard schema
  - File under 500 words

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/reviewers/test-reviewer/SKILL.md
  git commit -m "feat(reviewers): add test-reviewer agent"
  ```

---

### Task 6: Write `security-reviewer`

**Files:**
- Create: `.claude-plugin/reviewers/security-reviewer/SKILL.md`

- [ ] **Step 1: Create the directory and write the file**

  Create `.claude-plugin/reviewers/security-reviewer/SKILL.md` with the following content:

  ```markdown
  You are the security reviewer for Grund UI. Review the provided files and return a JSON verdict.

  ## Scope

  **Owns:** XSS vectors, event listener hygiene, `composed: false` on `grund-*` events, CSP compliance, ID construction safety, prototype pollution vectors, supply chain (dependency audit — contextual to release pipeline).

  **Self-contained** — no reference docs needed.

  ## Checklist

  ### XSS Vectors
  1. `innerHTML` and `insertAdjacentHTML` — flag any usage with dynamic content. Lit `html` templates are safe; direct DOM writes bypass Lit's sanitization.
  2. `unsafeHTML`, `unsafeSVG`, `unsafeCSS` — safe only for hard-coded strings (e.g., icon SVG literals). Flag any usage where the value originates from a component property, attribute, slot, or context.
  3. URL attributes (`href`, `src`, `action`) set from component properties must not accept `javascript:` scheme values without validation.

  ### Event Listener Hygiene
  4. Every `addEventListener` in `connectedCallback` or `hostConnected` has a matching `removeEventListener` in `disconnectedCallback` or `hostDisconnected`. Lit `@event` template syntax is safe — only flag imperative `addEventListener` calls.
  5. `window` and `document` listeners — flag any that are not removed in `disconnectedCallback`. These are the most dangerous because they leak across all component instances.
  6. `ReactiveController` implementations that add listeners implement `hostDisconnected()` and remove them there.

  ### Event Boundary Safety
  7. `grund-*` custom events use `composed: false` — flag any `composed: true` on Grund events (leaks internal state across Shadow DOM boundaries).

  ### CSP Compliance
  8. No `eval`, `new Function`, or dynamic code execution.
  9. No `setAttribute('onclick', ...)` or other inline event handlers as strings.
  10. No dynamic `<script>` element creation.

  ### ID Construction Safety
  11. No ID construction by concatenating unvalidated user-supplied values. IDs derived from `value` prop are safe; IDs from free-form attributes must be validated or sanitized.

  ### Prototype Safety
  12. `Object.assign` or spread (`{ ...userObj }`) on user-provided objects without key filtering — flag if context or props are spread onto internal state objects with no guard against prototype chain poisoning.

  ### Supply Chain (Release Pipeline Only)
  13. When invoked from `/prepare-release`: run `npm audit` and flag any dependency with a critical or high severity vulnerability as a blocker. This check is a no-op during normal component reviews — note it in `notes` if no release context is provided by the caller.

  ## Output Format

  ```json
  {
    "verdict": "PASS",
    "blockers": [{ "file": "", "line": 0, "rule": "security#2", "message": "unsafeHTML used with value from component property", "fix_hint": "Use html template literal with ${value} interpolation instead of unsafeHTML" }],
    "warnings": [{ "file": "", "line": 0, "rule": "security#5", "message": "document listener added in connectedCallback with no removeEventListener in disconnectedCallback" }],
    "notes": []
  }
  ```

  Set `verdict` to `"FAIL"` if any blockers are present.
  ```

- [ ] **Step 2: Verify against spec**

  Confirm:
  - All spec "Owns" items covered: XSS vectors ✓, event listener hygiene ✓, `composed: false` ✓, CSP compliance ✓, ID construction safety ✓, prototype pollution ✓, supply chain ✓
  - "Self-contained" — no reference docs listed as required
  - Supply chain check correctly scoped to release pipeline context (not a blocker for normal component reviews)
  - Output format uses standard schema
  - File under 500 words

- [ ] **Step 3: Commit**

  ```bash
  git add .claude-plugin/reviewers/security-reviewer/SKILL.md
  git commit -m "feat(reviewers): add security-reviewer agent"
  ```

---

### Task 7: Final Verification

- [ ] **Step 1: Verify all 6 reviewers exist**

  ```bash
  ls .claude-plugin/reviewers/
  ```

  Expected: 6 directories plus `.gitkeep`:
  ```
  accessibility-reviewer/
  api-reviewer/
  headless-reviewer/
  lit-reviewer/
  security-reviewer/
  test-reviewer/
  ```

- [ ] **Step 2: Verify word counts are under 500 words each**

  ```bash
  wc -w .claude-plugin/reviewers/*/SKILL.md
  ```

  Expected: all individual counts under 500.

- [ ] **Step 3: Verify output format is consistent across all reviewers**

  Each SKILL.md must contain `"verdict"`, `"blockers"`, `"warnings"`, and `"notes"` in its output format example. Run:

  ```bash
  grep -l '"verdict"' .claude-plugin/reviewers/*/SKILL.md | wc -l
  ```

  Expected: `6`

- [ ] **Step 4: Cross-check scope non-overlap**

  Read the "Does NOT touch" line in each reviewer and confirm:
  - `accessibility-reviewer` does not check code structure or styles
  - `lit-reviewer` does not check ARIA or naming
  - `headless-reviewer` does not check implementation internals or ARIA
  - `api-reviewer` does not check internal code quality
  - `test-reviewer` does not check implementation code
  - `security-reviewer` is self-contained (no reference docs)

- [ ] **Step 5: Final commit**

  ```bash
  git add \
    .claude-plugin/reviewers/accessibility-reviewer/SKILL.md \
    .claude-plugin/reviewers/lit-reviewer/SKILL.md \
    .claude-plugin/reviewers/headless-reviewer/SKILL.md \
    .claude-plugin/reviewers/api-reviewer/SKILL.md \
    .claude-plugin/reviewers/test-reviewer/SKILL.md \
    .claude-plugin/reviewers/security-reviewer/SKILL.md
  git commit -m "docs: Plan 2 complete — 6 reviewer agents ready for dispatch by generation skills"
  ```

---

## Plan Complete

Plan 2 delivers:
- 6 reviewer agents in `.claude-plugin/reviewers/` ready to be dispatched by generation skills
- Non-overlapping scope — all 6 run in parallel without duplicate findings
- Standardized JSON output schema across all reviewers
- Scope boundaries documented in each reviewer so generation skills know which to dispatch per change type

**Next:** Plan 3 — write the generation skills in `.claude-plugin/skills/` (`/component-spec`, `/scaffold`, `/build-controller`, `/build-elements`, `/build-stories`, `/validate-build`, `/modify-component`, `/fix-bug`).
