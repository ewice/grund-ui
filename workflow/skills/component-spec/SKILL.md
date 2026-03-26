---
name: "component-spec"
description: "Use to author a complete component specification before building. Run with --from <design-spec-path> to parse a Superpowers design spec, or interactively without arguments. Outputs docs/specs/{name}.spec.md."
---

## Overview

Produces `docs/specs/{name}.spec.md` — the source of truth for all downstream generation skills. Adapts sections to the component category.

## Usage

```
/component-spec
/component-spec --from docs/superpowers/specs/{date}-{name}-design.md
```

## Implementation

### Step 1 — Load context

Read `docs/vocabulary.md` and `workflow/refs/component-shapes.md`.

### Step 2 — Gather component info

**If `--from <path>` provided:** Read the design spec. Extract front-matter:
`component_name`, `category`, `purpose`, `key_decisions`, `open_questions`.

**If no `--from`:** Ask:
1. Component name (e.g., `accordion`, `dialog`, `switch`)
2. Category: composite-widget | form-control | overlay | collection | feedback | simple
3. One-sentence purpose

### Step 3 — Run `/apg`

Derive the APG pattern name from component name and category. Follow the `/apg` skill to extract: keyboard interactions, roles, required/optional ARIA attributes, gaps to flag.

**If the category is `simple` or `feedback`, or `/apg` returns no matching pattern:** skip to Step 4 and note "No APG pattern — ARIA contract is minimal" in the spec's ARIA contract section.

### Step 4 — Ask category-specific questions

**If `--from`:** Ask only questions not already answered by `key_decisions` or `open_questions` in the design spec.

**If interactive:** Ask all category-specific questions for the identified category.

| Category | Key questions |
|---|---|
| composite-widget | Item registry needed? Multiple open items? `defaultValue`/`value`/`multiple` props? Group-level `disabled` + item-level `disabled` — how do they compose? (Always: `isEffectivelyDisabled(itemDisabled) = groupDisabled \|\| itemDisabled` — confirm this is correct for the component, then note it in the spec so `/build-engine` generates the method.) |
| form-control | Input type? Indeterminate state? Validation strategy? |
| overlay | Trigger strategy? Focus trapping? Outside-click dismiss? |
| collection | Filtering? Typeahead? Virtual scroll? Multi-select? |
| feedback | Auto-dismiss? Stacking? Duration prop? |
| simple | No additional questions. |

All categories: Cancelable events? RTL considerations? Exit animations?

### Step 5 — Update vocabulary

Before writing the spec, check whether the component introduces new action verbs, event names, or part names not yet in `docs/vocabulary.md`. Propose any new entries to the user. Once confirmed, add them to `docs/vocabulary.md`.

### Step 6 — Write the spec

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
- Edge cases and constraints (see below)

**Edge cases section guidance** — for every component with a `value` or key-based prop, the spec MUST explicitly address:

| Edge case | What to specify |
|-----------|----------------|
| Duplicate keys | Two children share the same `value`. Behavior: last-wins, first-wins, or reject with dev warning? |
| Invalid value | `value` or `defaultValue` doesn't match any registered child. Behavior: fallback to first, select nothing, dev warning? |
| Dynamic mutations | Child added after initial render. Active child removed. Child's `value` prop changes after registration. |
| Controlled↔uncontrolled transition | Consumer switches `value` from defined to `undefined`. Behavior: maintain last value, reset to default, dev warning? |

**Property lifecycle table (required for every `@property()` on the root element):**

For each public property, the spec MUST answer:

| Property | Set before `connectedCallback` | Changed at runtime | Set to `undefined`/`null` | Reflected? |
|----------|-------------------------------|-------------------|--------------------------|------------|
| `value` | _e.g., stored, applied on first render_ | _e.g., updates state, fires event_ | _e.g., switches to uncontrolled_ | No |
| ... | ... | ... | ... | ... |

Fill in the actual behavior for each property. This table is the contract for `syncFromHost()` and for integration tests.

For overlays, additionally specify: what happens when the trigger is removed while open?
For form controls, additionally specify: what happens on `formResetCallback` when in controlled mode?

### Step 7 — Verify

Re-read the spec. Confirm:
- All APG keyboard keys documented
- Every property has controlled/uncontrolled semantics documented (where applicable)
- Every event has a typed detail
- All vocabulary names match `docs/vocabulary.md`

Fill any gaps before handing off.

### Step 8 — Handoff

Report: spec written to `docs/specs/{name}.spec.md`. **Next step: `/scaffold {name}`.**
