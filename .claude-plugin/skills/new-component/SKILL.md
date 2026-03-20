---
name: "new-component"
description: "Use when starting to build a new Grund UI component from scratch.
  Guides the engineer through spec authoring, fetches the APG contract, and
  produces a spec file that the implement skill can consume."
---

## Overview

This skill is a conversation, not a code generator. It asks the right questions,
fetches the APG contract, and writes a spec file. No code is written here.
Code generation happens in `implement`.

Output: `docs/specs/{component-name}.spec.md` — the source of truth for the
component that all reviewer skills check against.

## Implementation

### Phase 1 — Gather intent

Ask the engineer:

1. **What is the component?**
   Capture: component name (in kebab-case), purpose in one sentence.

2. **Which WAI-ARIA APG pattern does it follow?**
   If unsure, list the common patterns and ask the engineer to select one.
   If it is a genuinely novel pattern with no APG match, note that and proceed
   without the APG contract.

3. **What are the compound elements?**
   For compound components: which sub-elements are needed? Reference the
   accordion structure as the template:
   - Root (provider, keyboard navigation)
   - Item (grouping container, if repeating items exist)
   - Sub-parts (trigger, panel, header, etc.)

   If it is a simple non-compound component (e.g., a switch, a checkbox),
   skip the item layer.

4. **What value does the root manage?**
   - Does the component have a controlled/uncontrolled value?
   - What type is the value? (string, string[], boolean, number?)
   - What is the `defaultValue` / `value` API?

5. **What events does it fire?**
   Ask for: event name (`grund-{action}`), when it fires, what the detail
   carries. Prompt with the accordion pattern as reference:
   - `grund-change` → `{ value, expanded }` (item-level toggle result)
   - `grund-value-change` → `{ value[], itemValue, open }` (root-level state)

6. **What are the key variants?**
   Ask about: disabled state, orientation, any feature flags analogous to
   `keepMounted` or `hiddenUntilFound`. Only ask about variants that are
   plausibly needed for this component type.

Do not overwhelm with questions. Ask in batches of 2–3. Wait for answers
before proceeding.

### Phase 2 — Fetch the APG contract

Once the engineer has named the APG pattern, run the `apg` skill:

```
/apg {pattern-name}
```

Present the output to the engineer. Ask them to confirm or override any gaps
flagged by the `apg` skill (controlled mode, multiple, etc.).

If no APG pattern applies, note this in the spec under `## Accessibility Notes`
and proceed with a custom accessibility plan.

### Phase 3 — Confirm the element structure

Propose the compound element list and names based on the APG roles. Follow the
accordion naming vocabulary exactly for analogous concepts:

| Accordion | Proposed analog | Element name |
|-----------|----------------|--------------|
| `grund-accordion` | Root | `grund-{name}` |
| `grund-accordion-item` | Item container | `grund-{name}-item` |
| `grund-accordion-header` | Header | `grund-{name}-header` |
| `grund-accordion-trigger` | Trigger | `grund-{name}-trigger` |
| `grund-accordion-panel` | Panel | `grund-{name}-panel` |

Omit elements that don't apply. Add elements the APG requires that have no
accordion analog.

Show the proposed structure to the engineer and ask for approval before writing
the spec.

### Phase 4 — Write the spec file

Create `docs/specs/{component-name}.spec.md` with this structure:

```markdown
# {ComponentName} Spec

## Purpose
{One sentence describing what this component is and what problem it solves.}

## APG Pattern
{Pattern name and URL, or "None — custom pattern" with rationale.}

## Elements

| Element | Tag | WAI-ARIA Role | Notes |
|---------|-----|---------------|-------|
| Root | `grund-{name}` | — | Provider; hosts RovingFocusController |
| Item | `grund-{name}-item` | — | Grouping container |
| Trigger | `grund-{name}-trigger` | button (implicit) | Activates the item |
| Panel | `grund-{name}-panel` | region (when open) | Content panel |

## Public API

### Root element: `grund-{name}`

| Property | Type | Default | Attribute | Description |
|----------|------|---------|-----------|-------------|
| `value` | `{type} \| undefined` | `undefined` | `attribute: false` | Controlled value |
| `defaultValue` | `{type} \| undefined` | `undefined` | `default-value` | Uncontrolled seed |
| `disabled` | `boolean` | `false` | `disabled` | Disables all items |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `orientation` | Axis for roving focus |
| `multiple` | `boolean` | `false` | `multiple` | Allow multiple open (if applicable) |

### Item element: `grund-{name}-item`

| Property | Type | Default | Attribute | Description |
|----------|------|---------|-----------|-------------|
| `value` | `string` | auto-generated | `value` | Unique item identifier |
| `disabled` | `boolean` | `false` | `disabled` | Disables this item |

## Events

| Event | Element | Detail type | When |
|-------|---------|-------------|------|
| `grund-change` | Root | `{ value: string, expanded: boolean }` | Item expands or collapses |
| `grund-value-change` | Root | `{ value: string[], itemValue: string, open: boolean }` | After any state change |
| `grund-open-change` | Item | `{ open: boolean, value: string, index: number }` | Item's open state changes |

## ARIA Contract

### Required attributes
- `{element}`: `{aria-attribute}` — {what it must express}

### Keyboard interactions
| Key | Effect |
|-----|--------|
| Enter / Space | {effect} |
| ArrowDown / ArrowUp | Move focus to next/previous trigger |
| Home / End | Move focus to first/last trigger |
| Tab | Exit widget to next page-level focusable |

## Data Attributes

| Attribute | Values | Set by | Meaning |
|-----------|--------|--------|---------|
| `data-state` | `open / closed` | `OpenStateController` | Panel visibility |
| `data-open` | present/absent | Item `willUpdate` | Item is open |
| `data-disabled` | present/absent | Item, Trigger `willUpdate` | Element is disabled |
| `data-orientation` | `vertical / horizontal` | Root, Panel `willUpdate` | Layout axis |
| `data-index` | number | Item `willUpdate` | DOM position |

## CSS Parts

| Part name | Element | What it wraps |
|-----------|---------|---------------|
| `trigger` | Trigger | The inner `<button>` |
| `panel` | Panel | The content container `<div>` |

## Slots

| Element | Slot | Content |
|---------|------|---------|
| Root | default | `grund-{name}-item` elements |
| Item | default | Header and Panel |
| Trigger | default | Trigger label content |
| Panel | default | Panel content |

## Controlled / Uncontrolled Behaviour

**Uncontrolled:** `defaultValue` seeds initial state once on first render.
Subsequent interactions update internal state. No consumer code needed.

**Controlled:** `value` drives state entirely. Interactions fire events but do
not mutate internal state. Consumer must handle `grund-change` and update
`value` to reflect changes.

## Context Design

### Root context (`{component}Context`)
Flows down to all descendants from `grund-{name}`.

State fields:
- `{field}`: `{type}` — {what it represents}

Action methods (bound in constructor — stable references):
- `requestToggle(value: string): void`
- `registerItem(item: {ItemLike}): void`
- `unregisterItem(item: {ItemLike}): void`

### Item context (`{component}ItemContext`)
Flows down to sub-parts within each `grund-{name}-item`.

State fields:
- `value: string`
- `expanded: boolean`
- `disabled: boolean`
- `index: number`

Action methods:
- `registerTrigger(trigger: ...): void`
- `unregisterTrigger(): void`
- `registerPanel(panel: ...): void`
- `unregisterPanel(): void`

## File Structure

```
src/components/{name}/
├── root/{name}.ts           ← Provider, RovingFocusController
├── item/{name}-item.ts      ← Item container, provides item context
├── trigger/{name}-trigger.ts
├── panel/{name}-panel.ts
├── header/{name}-header.ts  ← (if needed)
├── controller/
│   ├── {name}.controller.ts
│   ├── types.ts             ← AccordionControllerHost analog
│   └── constants.ts
├── context/
│   ├── {name}.context.ts    ← Root context interface + symbol
│   ├── {name}-item.context.ts
│   └── index.ts
├── registry/
│   ├── {name}.registry.ts   ← (omit if no trigger↔panel linking needed)
│   └── types.ts
├── types.ts                 ← Public types, detail interfaces, snapshots
└── index.ts                 ← Barrel export

stories/{name}.stories.ts
```

## Stories

- `Default` — basic usage, all items collapsed
- `Disabled` — `disabled` on root
- `Controlled` — consumer owns value via `@grund-change`
- `Multiple` — if multiple mode is supported
- `{ComponentSpecificFeature}` — any component-specific variant

## Open Questions

{List any decisions not yet made. Remove this section before handing to
implement.}
```

### Phase 5 — Review and approve

Present the spec to the engineer. Ask:

1. Are the public properties complete and correct?
2. Are the events and their detail shapes correct?
3. Are the keyboard interactions from the APG all accounted for?
4. Are there any open questions that must be resolved before implementation?

Incorporate feedback. Iterate until the engineer explicitly approves the spec
by saying something like "looks good", "approved", or "let's implement this".

Do not proceed to `implement` until the spec is explicitly approved.

### Phase 6 — Hand off

Once approved, tell the engineer:

```
Spec written to docs/specs/{name}.spec.md.
Run /implement to generate all component files with the review loop.
```

Do not run `/implement` yourself. The engineer decides when to proceed.

## Common Mistakes

- **Skipping Phase 1 questions and guessing.** Always ask first.
- **Writing the spec without APG data.** Always run `/apg` first if a pattern exists.
- **Proposing implementation details in the spec.** The spec is the _what_,
  not the _how_. No TypeScript in the spec except for interface shapes.
- **Leaving open questions unresolved.** Every open question must be answered
  before `/implement` runs.
- **Copying accordion fields verbatim.** Only include properties and events that
  this specific component actually needs.
