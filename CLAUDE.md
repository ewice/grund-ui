# Grund UI — Engineering Guidelines

Grund UI is a headless, accessible Web Component library built with Lit. "Headless" means
zero visual styles — Shadow DOM is used for `<slot>` and `::part()` support, not removed.
The reference implementation is the accordion. When in doubt, follow its structure.

Detailed patterns and rules live in `.claude-plugin/refs/`. This file contains the
authoritative architecture and the rules that apply to every change in the codebase.

---

## Architecture

Three layers, strictly separated:

1. **Utilities** (`src/utils/`) — pure functions, zero framework dependency
2. **Reactive Controllers** (`src/controllers/`, `src/components/*/controller/`) — `ReactiveController` implementations, reusable across components
3. **Custom Elements** (`src/components/*/`) — Lit elements, compound component pattern

### Compound Component Structure

```
component/
├── root/          → Provider element (@provide, controller, roving focus)
├── item/          → Grouping element — only when a repeating container is needed
├── [sub-parts]/   → Leaf elements (trigger, panel, header, etc.)
├── controller/    → ReactiveController owning all state and actions
├── registry/      → Ordered child tracking and sub-part attachment (omit if unneeded)
├── context/       → Context interfaces and context symbols
├── types.ts       → Public types, event detail types, snapshot interfaces
└── index.ts       → Barrel export
```

Element files use `index.ts` inside their part directory. Test files use descriptive names
(e.g., `accordion.test.ts`). Component type definitions (event details, host snapshots,
public interfaces) live in `types.ts`, separate from element implementations.

**Each layer has one job:**

- **Controller** — owns state, resolves actions, dispatches events through the host. No DOM access.
- **Registry** — ordered child tracking, sub-part attachment (trigger↔panel). No Lit runtime dependency.
- **Context** — carries reactive state down, action callbacks up. Interfaces designed per consumer role.
- **Elements** — read context, render templates, delegate actions via context callbacks.

### Shared Controllers

Use these — don't reinvent:

| Controller | Purpose | Attach to |
|---|---|---|
| `RovingFocusController` | Keyboard-driven roving tabindex | Container element |

Extract on second use: `data-open` toggle and ARIA ID linking are one-liners — extract to a shared controller when a second component needs the pattern.

**Before using a shared controller:** run the abstraction fit check (lit-patterns Rule 36). If the controller doesn't cover a required behavior, classify the gap (Extend / Custom / Inline) and act on it before writing any element code. Do not work around a gap that belongs in the controller — that produces temporal coupling.

Planned controllers (built when first component of that category is built): see `.claude-plugin/refs/component-shapes.md`.

### Pattern Extraction

**Extract on second use, flag on first.** Implement inline for the first component. Extract to a
shared utility or controller when a second component needs it. Use `/extract-pattern` skill.

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
- ARIA linking: use the Element Reference API (`ariaControlsElements`, `ariaLabelledByElements`) for cross-shadow relationships. Set in `updated()` after render. See `.claude-plugin/refs/aria-linking.md` for the full pattern. Legacy IDREF approach (`aria-controls`, `aria-labelledby`) does not resolve across shadow root boundaries.
- Keyboard navigation: `RovingFocusController` on the container element.
- No duplicate paths: a registration or state mutation happens through exactly one mechanism.

---

## Context Design

See `.claude-plugin/refs/lit-patterns.md` Rules 14–18 for the full context contract.

---

## Controlled / Uncontrolled Values

See `.claude-plugin/refs/lit-patterns.md` Rule 5 for the HostSnapshot and controlled/uncontrolled contract.

---

## Data Attributes

See `.claude-plugin/refs/headless-contract.md` Rules 21–24 for the canonical data attribute table and rules.

---

## Component Design Rules

- Element prefix: `grund-`
- Each WAI-ARIA role maps to its own custom element — do not merge compound sub-elements for brevity
- Shadow DOM on every element, zero visual styles
- **IDs:** Accept optional `id` prop from consumers. Derive deterministic IDs from `value` prop where possible. Use `crypto.randomUUID().slice(0, 8)` only inside `connectedCallback` or later — never in constructors or field initializers. See `.claude-plugin/refs/ssr-contract.md` for the full strategy.
- Use `ElementInternals` for form-associated components. See `.claude-plugin/refs/form-participation.md`.
- **Dev-mode warnings:** Every compound element that can be structurally misused MUST emit a dev-mode warning. Guard with `if (import.meta.env.DEV)`. Format: `console.warn('[grund-{element}] {problem}. {fix}.')`.
- Wrap `customElements.define()` with a registration guard: `if (!customElements.get('...'))`.
- **Comments:** Non-JSDoc comments explain WHY, not WHAT. Code needing a WHAT-comment should be refactored to be self-explanatory.
- **Smallest diff:** Every change should be the minimum diff that achieves the goal. No speculative code, unused imports, or redundant abstractions.

---

## Accessibility

Target: WCAG 2.1 AA. Follow the [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/) for each component type.

Every component needs:
- Correct `role` and `aria-*` attributes per the relevant APG pattern
- `RovingFocusController` for composite widgets
- `@csspart` on every interactive and structural shadow element
- Keyboard contract covered by tests and documented in Storybook

See `.claude-plugin/refs/focus-management.md` for focus management patterns.

---

## JSDoc / CEM

JSDoc serves IDE tooltips and the Custom Elements Manifest. Use JSDoc syntax, not TSDoc.

**Required on every custom element:**

```ts
/**
 * One-sentence description.
 *
 * @element grund-{name}
 * @slot - Default slot description
 * @fires {CustomEvent<DetailType>} grund-{action} - When and why
 * @csspart name - What this part wraps
 */
```

**Rules:**
- No `{Type}` in `@param`/`@returns` — TypeScript is canonical
- Document why and constraints, not what. Omit where self-evident.
- First sentence under ~80 chars
- Booleans: "Whether ..." — never "True if ..."
- `@internal` on non-public exports
- `@deprecated` always includes migration path

---

## Skills — Workflow Reference

Skills live in `.claude-plugin/skills/`. Reviewer agents in `.claude-plugin/reviewers/`.
Reference docs in `.claude-plugin/refs/`. Superpowers is the orchestrator.
See `.claude-plugin/refs/workflow-guidelines.md` for subagent pipeline guidelines.

### New component (complex)
```
superpowers:brainstorming → /component-spec → /scaffold → /build-controller
    → /build-elements → /build-stories → /validate-build → superpowers:finishing-a-development-branch
```

### New component (simple, no state)
```
/component-spec → /scaffold → /build-elements → /build-stories → /validate-build → superpowers:finishing-a-development-branch
```

### New component (trivial — single element, no state, no keyboard, no events)
```
/quick-component {name} — {one-line description}
```
Examples: Separator, VisuallyHidden, Icon wrapper. If the component has any compound structure,
keyboard contract, or dispatched events, use the simple pipeline above instead.

### Modify existing (planned)
```
superpowers:brainstorming → superpowers:writing-plans
    → superpowers:executing-plans → /post-plan-review → /validate-build → superpowers:finishing-a-development-branch
```

### Modify existing (ad-hoc)
```
/modify-component {name} — {description}
```

### Bug fix
```
/fix-bug {component} — {description}
```

### Rebuild to new standards
```
/rebuild-component {name}
```

**Note:** `superpowers:finishing-a-development-branch` requires `/validate-build` to have passed first.
Its Step 1 only runs tests — lint, build, CEM, and export checks are covered by `/validate-build`.

### Supporting skills
```
/apg {pattern}              → WAI-ARIA contract
/validate-build             → lint, build, test, CEM, exports, bundle size
/smallest-diff              → audit diff for dead code, speculative additions, noise
/diagnose-failure           → investigate persistent reviewer findings
/quick-component {name}     → trivial single-element components (Separator, VisuallyHidden)
/extract-pattern            → promote inline pattern to shared controller
/deprecate                  → mark API deprecated with migration path
/audit-cross-component      → check if a bug/pattern affects multiple components
/update-dependency          → safe dependency version bump with migration
/prepare-release            → semver, changelog, publish
/review-system-health       → periodic skill/reviewer quality audit
```
