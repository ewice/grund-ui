---
name: "quick-component"
description: "Use for trivial single-element, no-state components: Separator, VisuallyHidden, Label, Icon, and similar wrappers. Bypasses the full spec/scaffold/controller pipeline. NOT for components with keyboard interaction, events, compound structure, or dynamic state — those need /component-spec → /scaffold → vollgas:writing-plans."
---

## Overview

Builds a complete, reviewed, publishable component in one pass — no separate spec file, no
controller, no registry, no context. The full 6-reviewer suite still runs because trivial
components still have parts, slots, SSR safety requirements, and accessibility contracts.

Use this only when **all** of the following are true:
- Single custom element (no compound multi-element structure)
- No state (no `@state` fields, no controller)
- No keyboard interaction beyond natural focus
- No custom events dispatched
- No form association
- No dynamic child registration

If any of those are false, redirect to the full pipeline.

## Usage

```
/quick-component separator — A visual or semantic divider between content sections.
/quick-component visually-hidden — Wraps content for screen readers while hiding it visually.
```

## Implementation

### Step 1 — Inline spec (no file)

From the one-line description, identify:
- **Role** — the ARIA role (e.g., `separator`, `presentation`, `none`, or none for generic wrappers)
- **Parts** — every shadow element that consumers might need to style (`@csspart`)
- **Slots** — what slotted content is expected, if any
- **Properties** — any public attributes (e.g., `orientation: 'horizontal' | 'vertical'`)
- **Data attributes** — which properties reflect as `data-*` for CSS targeting (see `headless-contract.md`)

Check `docs/vocabulary.md` — if this component introduces new part names or data attributes not
yet registered, add them before writing any code.

Check `component-shapes.md` category "Simple" — confirm the component fits. If it requires a
controller listed there, stop and use the full pipeline instead.

### Step 2 — Create directory and element

Create `src/components/{name}/` with:

```
{name}/
└── {name}.ts       ← element implementation AND barrel (re-exports itself)
```

A single `{name}.ts` file is both the element and the barrel export. No `types.ts` unless there are
public event detail types or exported interfaces that consumers will import directly.

**Element implementation requirements:**
- `@element grund-{name}` JSDoc, `@slot`, `@csspart`, `@fires` (if any)
- `customElements.define()` wrapped with `if (!customElements.get('grund-{name}'))`
- Shadow DOM via Lit (`createRenderRoot()` through LitElement — never direct `attachShadow()`)
- Zero visual styles — no color, font, border, background, sizing beyond `display` on `:host`
- `@csspart` on every structural shadow element
- `data-*` attributes derived in `willUpdate` and synchronized through reflected reactive properties by default; avoid imperative `this.dataset.*` writes unless reflection is unsuitable and documented
- Dev-mode warning in `connectedCallback` if structural misuse is possible
- No `document`, `window`, or `navigator` in constructor or field initializers (SSR safety)

### Step 3 — Write tests

Write `src/components/{name}/{name}.test.ts`.

**Required tests for a trivial component:**
- Renders without errors (mounts, no console errors)
- Default slot renders slotted content (if slotted)
- Each public property: initial default, dynamic change, attribute reflection (if `reflect: true`)
- Each `data-*` attribute reflects correct value on property change
- Each `@csspart` is present on the rendered shadow element
- Mount/unmount memory test (verify `addEventListener`/`removeEventListener` symmetry) — even
  trivial components may attach listeners internally
- ARIA role present on the correct element

Do **not** write keyboard, event-ordering, registration, reparenting, or composition tests —
these do not apply.

Run `npm run test:run -- src/components/{name}/` — confirm tests pass.

### Step 4 — Run all 6 reviewers in parallel

Read `vollgas/refs/reviewer-dispatch.md` for context injection rules.

Dispatch all 6 reviewers as simultaneous Agent calls with the following context note added to
each prompt:

> **Component classification: Simple (trivial wrapper, no state, no keyboard, no events, no
> compound structure).** Checklist items covering keyboard contracts, dynamic registration,
> reparenting, event ordering, composition interference, context stability, state machines,
> and form integration do not apply and should not be flagged as blockers.

Inject context per the dispatch table in `reviewer-dispatch.md`.

Fix all blockers. Follow the patch loop rules in `vollgas/refs/reviewer-dispatch.md`.

### Step 5 — Write a minimal story

Write `stories/{name}.stories.ts`.

**Required:**
- `Meta` export with `title: 'Components/{Name}'`, `component: 'grund-{name}'`, `tags: ['autodocs']`
- `Default` story — minimal usage, no configuration
- `Disabled` story if the component accepts a `disabled` property
- One story per significant variant (e.g., `Horizontal` / `Vertical` for Separator)
- No `play` function required — but add one if there is meaningful interaction to demonstrate

### Step 6 — Validate and commit

Run `/validate-build`.

```bash
git add src/components/{name}/ stories/{name}.stories.ts
git commit -m "feat({name}): trivial component — element, parts, slots, tests"
```
