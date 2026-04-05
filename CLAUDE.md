# Grund UI — Engineering Guidelines

Grund UI is a headless, accessible Web Component library built with Lit. "Headless" means
zero visual styles — Shadow DOM is used for `<slot>` and `::part()` support, not removed.
The reference implementation is the accordion at `src/components/accordion/`. When in doubt,
follow its structure.

This file holds the authoritative architecture and rules that apply to every change.
Detailed patterns live in `vollgas/refs/`.

## Refs Index

| File | Purpose |
|---|---|
| `accessibility-contract.md` | WCAG/APG conformance rules |
| `api-contract.md` | Public property, event, and type conventions |
| `aria-linking.md` | Cross-shadow ARIA with Element Reference API |
| `component-shapes.md` | Category definitions + planned shared controllers |
| `consumer-dx.md` | Public DX rules for library consumers |
| `focus-management.md` | Focus patterns per component category |
| `form-participation.md` | `ElementInternals` and form-association |
| `headless-contract.md` | `::part`, `data-*`, `exportparts` rules |
| `jsdoc-contract.md` | Required JSDoc on every custom element |
| `lit-patterns.md` | Lit element authoring rules |
| `positioning-strategy.md` | Overlay positioning |
| `reviewer-dispatch.md` | Which reviewers run for which change types |
| `ssr-contract.md` | SSR-safe ID generation and lifecycle |
| `test-patterns.md` | Required test categories and recipes |
| `transition-contract.md` | Show/hide and animation contracts |
| `workflow-guidelines.md` | Subagent pipeline guidelines |

---

## Architecture

Four layers, strictly separated:

1. **Utilities** (`src/utils/`) — pure functions, zero framework dependency
2. **Reactive Controllers** (`src/controllers/`) — `ReactiveController` implementations for DOM-dependent concerns (focus, listeners, observers)
3. **Engines** (`src/components/{name}/engine/`) — plain classes owning state and action resolution. Zero DOM, zero Lit, independently testable
4. **Custom Elements** (`src/components/{name}/`) — Lit elements in the compound component pattern; read context, render templates, delegate actions

### Compound Component Structure

```
component/
├── root/                 → Provider element (@provide, RovingFocusController, engine instantiation)
├── item/                 → Grouping element — only when a repeating container is needed
├── [sub-parts]/          → Leaf elements (trigger, panel, header, etc.)
├── engine/               → Pure state machine — no DOM, no Lit
├── registry/             → Ordered child tracking and sub-part attachment (omit if unneeded)
├── context/               → Context interfaces and context symbols
├── types.ts              → Public types, event detail types, snapshot interfaces
└── {component-name}.ts   → Barrel export
```

Element files inside each part directory are named `{component-name}.ts`. Test files use descriptive names (e.g., `accordion.test.ts`, `accordion-keyboard.test.ts`).

### Reactive Controllers vs Engines

Two distinct things share the word "controller" in Lit's ecosystem. Keep them strictly separate:

| | Reactive Controller | Engine |
|---|---|---|
| Location | `src/controllers/` | `src/components/{name}/engine/` |
| Implements | `ReactiveController` | Plain class — no interface |
| Constructor | `host.addController(this)` | `new EngineClass()` |
| Lifecycle hooks | `hostConnected`, `hostDisconnected`, `hostUpdated` | None |
| DOM access | Yes | Never |
| Lit dependency | Yes | Never |
| Test setup | Requires mock host or fixture | `new Engine()` — no setup needed |
| Examples | `RovingFocusController`, `FocusTrapController` | `AccordionEngine`, `TabsEngine`, `SelectionEngine` |

**Rule:** Touches DOM, attaches listeners, or needs lifecycle hooks → Reactive Controller. Owns state and resolves actions → Engine.

### Shared Reactive Controllers and Engines

- `RovingFocusController` — keyboard-driven roving tabindex, attached to the container/root element
- `SelectionEngine` — set-based selection state (single/multiple, controlled/uncontrolled, disabled gating). Wrap in a domain-specific Engine (e.g., `AccordionEngine`), never consume directly from a root element
- Planned controllers/engines: see `vollgas/refs/component-shapes.md`

**Before using any shared controller or engine:** run the abstraction fit check (`lit-patterns.md` Rule 37). If it doesn't cover a required behaviour, classify the gap (Extend / Custom / Inline) and act on it before writing element code.

### Pattern Extraction

**Extract on second use, flag on first.** Implement inline for the first component. Extract to a shared utility, Reactive Controller, or Engine when a second component needs it. Use `/extract-pattern`.

---

## Component Communication

One canonical mechanism per direction:

| Direction | Mechanism | Example |
|---|---|---|
| Parent → child | Lit Context (`@provide` / `@consume`) | Root provides expanded state to items |
| Child → parent | Registration callbacks on context | Item calls `ctx.registerItem(this)` |
| Sibling awareness | Registry | Trigger↔panel linked via registry records |
| External API (out) | Custom events on root element | `grund-change`, `grund-open-change` |
| External API (in) | Public properties on root element | `value`, `disabled`, `multiple` |

**Rules:**
- Discovery: registration via context callbacks only. Never `querySelectorAll` to find child components.
- Show/hide: `data-open` boolean attribute set in `willUpdate`. Exception: `hidden="until-found"` for browser-native find-in-page.
- Event naming: `grund-{action}` with `bubbles: true, composed: false`.
- ARIA linking: use the Element Reference API (`ariaControlsElements`, `ariaLabelledByElements`) for cross-shadow relationships. Set in `updated()` after render. See `aria-linking.md`. Legacy IDREF (`aria-controls`, `aria-labelledby`) does not resolve across shadow root boundaries.
- Keyboard navigation: `RovingFocusController` on the container element.
- No duplicate paths: a registration or state mutation happens through exactly one mechanism.

---

## Component Design Rules

- Element prefix: `grund-`
- Each WAI-ARIA role maps to its own custom element — do not merge compound sub-elements for brevity
- Shadow DOM on every element, zero visual styles
- **IDs:** Accept optional `id` prop. Derive deterministic IDs from `value` where possible. Use `crypto.randomUUID().slice(0, 8)` only inside `connectedCallback` or later — never in constructors or field initializers. See `ssr-contract.md`.
- Use `ElementInternals` for form-associated components. See `form-participation.md`.
- **Dev-mode warnings:** Every compound element that can be structurally misused MUST emit a dev-mode warning. Guard with `if (import.meta.env.DEV)`. Format: `console.warn('[grund-{element}] {problem}. {fix}.')`.
- Wrap `customElements.define()` with a registration guard: `if (!customElements.get('...'))`.

**See also:** `lit-patterns.md` Rules 14–18 (context contract) and Rule 5 (HostSnapshot + controlled/uncontrolled), `headless-contract.md` Rules 21–24 (data attributes).

---

## Accessibility

Target: WCAG 2.1 AA. Follow the [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) for each component type.

Every component needs:
- Correct `role` and `aria-*` attributes per the relevant APG pattern
- `RovingFocusController` for composite widgets
- `@csspart` on every interactive and structural shadow element
- Keyboard contract covered by tests and documented in Storybook

See `focus-management.md`.

---

## Code Hygiene

- **Comments:** Non-JSDoc comments explain WHY, not WHAT. Code needing a WHAT-comment should be refactored.
- **Smallest diff:** Every change should be the minimum diff that achieves the goal. No speculative code, unused imports, or redundant abstractions.
- **JSDoc / CEM:** Every custom element needs JSDoc — see `jsdoc-contract.md`.

---

## Workflow

Skills in `vollgas/skills/`, reviewers in `vollgas/reviewers/`, refs in `vollgas/refs/`. Vollgas is the orchestrator. See `workflow-guidelines.md`.

| Task | Pipeline |
|---|---|
| New component (complex) | `vollgas:brainstorming` → `/component-spec` → `/scaffold` → `vollgas:writing-plans` → `vollgas:subagent-driven-development` → `vollgas:review-gate` → `/validate-build` → `vollgas:finishing-a-development-branch` |
| New component (simple) | `/component-spec` → `/scaffold` → `vollgas:writing-plans` → `vollgas:subagent-driven-development` → `vollgas:review-gate` → `/validate-build` → `vollgas:finishing-a-development-branch` |
| New component (trivial) | `/quick-component {name}` — only for single-element, no-state, no-keyboard, no-events (Separator, VisuallyHidden, Icon wrapper) |
| Modify existing | `vollgas:brainstorming` → `vollgas:writing-plans` → `vollgas:subagent-driven-development` → `vollgas:review-gate` → `/validate-build` → `vollgas:finishing-a-development-branch`. Consult `reviewer-dispatch.md` for targeted reviewer subset |
| Bug fix | `vollgas:systematic-debugging` → `vollgas:test-driven-development` → `vollgas:review-gate` → `/validate-build` → `vollgas:finishing-a-development-branch` |
| Rebuild to new standards | `vollgas:brainstorming` (gap analysis) → `vollgas:writing-plans` → `/scaffold` (fresh) → `vollgas:subagent-driven-development` → `vollgas:review-gate` → `/validate-build` → `vollgas:finishing-a-development-branch` |

### Supporting skills

| Skill | Purpose |
|---|---|
| `/apg {pattern}` | WAI-ARIA contract lookup |
| `/validate-build` | Lint, build, test, CEM, exports, bundle size |
| `vollgas:smallest-diff` | Audit diff for dead code, speculative additions, noise |
| `/quick-component` | Trivial single-element components |
| `/extract-pattern` | Promote inline pattern to shared engine/controller/utility |
| `/deprecate` | Mark API deprecated with migration path |
| `/audit-cross-component` | Check if a bug/pattern affects multiple components |
| `/update-dependency` | Safe dependency version bump with migration |
| `/prepare-release` | Semver, changelog, publish |
| `/reconcile-reference` | Reconcile drift between refs and implementation |
