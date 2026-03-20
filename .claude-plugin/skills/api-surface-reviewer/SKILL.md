---
name: "api-surface-reviewer"
description: "Use when reviewing the public API surface of a component for
  completeness, JSDoc accuracy, and absence of unintended breaking changes.
  Triggered by the implement skill (Phase 3)."
---

## Overview

Checks types.ts, all @property declarations, all @fires JSDoc, and all @csspart
JSDoc. Also runs a CEM diff if a baseline exists.

## Output Format

Same structure as guidelines-reviewer findings. End with PASS or FAIL.

## Checklist

**types.ts**
- [ ] Every event has a corresponding `*Detail` interface exported from types.ts
- [ ] Every snapshot interface (e.g. `AccordionHostSnapshot`) is exported
- [ ] No Lit-specific types leak into types.ts (it must be framework-agnostic)

**@property declarations**
- [ ] Every public property has a JSDoc description (first sentence ≤80 chars)
- [ ] Booleans documented as "Whether ..." not "True if ..."
- [ ] reflect: true set on properties that should appear as HTML attributes

**Events (@fires JSDoc)**
- [ ] @fires present for every CustomEvent the component dispatches
- [ ] @fires includes the detail type: `@fires {CustomEvent<NameDetail>} grund-name`
- [ ] Event detail shape in types.ts matches what the controller actually dispatches

**CSS parts (@csspart JSDoc)**
- [ ] @csspart present for every `part="..."` in shadow templates
- [ ] Part names described accurately (what element they wrap, not implementation detail)

**CEM diff (if baseline exists)**
Run: `npm run analyze -- --outdir /tmp/cem-new 2>/dev/null`
Then compare exported declarations against the last committed
`custom-elements.json`. Flag any removed exports, renamed properties, or
changed event detail types as breaking changes.

If no baseline CEM exists, skip this step and note it.
