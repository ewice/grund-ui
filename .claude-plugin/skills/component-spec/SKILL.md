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
