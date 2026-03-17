# Accordion Redesign

**Goal:** Rebuild the accordion internals with the same current source-level public API while improving maintainability, readability, scalability, and Shadow DOM-safe accessibility.

**Scope:** Preserve the existing custom elements, root properties, and public events defined by the current source implementation. Internal architecture may change completely.

## Current Implementation Assessment

The current accordion works, but the responsibilities are distributed across the wrong boundaries.

`src/components/accordion/accordion.ts` currently owns too much:

- state transitions
- controlled and uncontrolled branching
- item ordering
- trigger discovery
- focus coordination
- event synthesis
- context assembly

`src/components/accordion/accordion.controller.ts` is too thin to serve as a durable architectural boundary. It wraps a `Set<string>`, but the real behavioral complexity still lives in the root element.

`src/components/accordion/accordion-item.ts`, `src/components/accordion/accordion-trigger.ts`, and `src/components/accordion/accordion-panel.ts` coordinate through lifecycle-driven registration side effects. That makes the implementation harder to reason about when elements mount, disconnect, reconnect, or move in the light DOM.

The current context shape is also too broad. It exposes registration mechanics and low-level plumbing instead of a stable, minimal contract.

## Design Goals

- Keep the current source-level public API intact.
- Remove the accordion-specific reactive controller.
- Keep `render()` methods pure.
- Move state rules into a pure utility layer with no Lit dependency.
- Make the root element the single coordinator for accordion rules.
- Keep compound sub-elements separate and semantically focused.
- Use Shadow DOM-safe ARIA element reflection instead of IDREF wiring.
- Make dynamic insertion, removal, and reordering predictable.
- Make tests align with architectural boundaries rather than only rendered output.

## Non-Goals

- Changing the public element structure.
- Introducing visual styles beyond the existing headless defaults.
- Replacing reusable generic controllers when they still provide clear value.
- Preserving stale Storybook or test API assumptions that no longer match the current source implementation.

## Recommended Architecture

The rebuild should use a pure state engine plus a root-owned registry.

### 1. Pure State Engine

Create a utility layer with no Lit dependency that is responsible for accordion rules:

- normalizing expanded values
- resolving toggle and open actions
- handling `multiple`
- ignoring disabled values
- producing ordered next-state results
- deriving event payloads

This layer should be deterministic and side-effect free. It replaces the current split between mutating and preview logic with one transition model.

In uncontrolled mode, the root commits the state returned by the engine.

In controlled mode, the root computes the next state and emits events, but does not commit internal state from the user action itself.

### 2. Root-Owned Registry

`src/components/accordion/accordion.ts` should own an ordered registry of item records.

Each item record should contain:

- `value`
- the item element reference
- the trigger element reference
- the panel element reference
- effective disabled state
- current DOM index

The registry answers:

- which items currently exist
- in what order they appear
- which trigger belongs to which item
- which panel belongs to which item

The registry is structural state. The expanded values are interaction state. They should remain separate concepts.

### 3. Thin Semantic Elements

Each custom element should have one clear responsibility.

`src/components/accordion/accordion-item.ts`:

- registers and unregisters the item
- exposes per-item derived state
- reflects `data-open`, `data-disabled`, and `data-index`

`src/components/accordion/accordion-trigger.ts`:

- renders the actual button
- requests toggle actions
- reflects `aria-expanded`
- maintains the roving tabindex target
- links to the panel via ARIA element reflection

`src/components/accordion/accordion-panel.ts`:

- renders the region content according to mount policy
- reflects `role="region"`
- links back to the trigger via ARIA element reflection
- reacts to `beforematch` by requesting open

`src/components/accordion/accordion-header.ts`:

- remains a semantic wrapper around the heading primitive
- reflects only per-item derived attributes needed by styling or tooling

## Why There Should Be No Accordion-Specific Controller

The accordion-specific controller should be removed.

The existing controller does not isolate enough complexity to justify the extra abstraction. The real logic still leaks into the root element, so the controller adds indirection without reducing responsibility.

A better split is:

- pure utility layer for state rules
- root element for orchestration and registration
- optional generic controllers for reusable concerns such as roving focus or ARIA reflection

This keeps abstractions honest. Generic controllers remain useful when they are truly reusable. Accordion-specific business logic should not live inside a Lit controller just to satisfy a pattern.

## Context Design

The root context should become smaller and more stable.

It should expose:

- orientation
- loop behavior
- root disabled state
- mount behavior flags
- methods to request `toggle` and `open`
- methods to register and unregister items
- methods to attach and detach trigger and panel elements
- readonly access to derived item state through a controlled boundary

The item context should expose only per-item derived state and part attachment hooks needed by the item subtree.

Descendants should not need to understand how the root stores its registry internally.

## ARIA And Shadow DOM Strategy

Do not use IDREF-based linking as the primary strategy.

The redesign should rely on Shadow DOM-safe ARIA element reflection:

- trigger uses `ariaControlsElements`
- panel uses `ariaLabelledByElements`

This avoids string-based ID plumbing across shadow boundaries and fits the actual element relationships more naturally.

## Lit Best Practices Applied

The redesign should explicitly follow the Lit guidance the user asked to optimize for:

- public properties remain public properties
- internal orchestration stays in internal state or plain fields
- `render()` stays pure
- derived state is computed in `willUpdate()`
- DOM side effects stay out of `render()`
- static styles remain static
- reflection is used only where it serves public semantics or styling hooks

The implementation should also keep the custom elements small enough that each one is understandable without reading the whole subsystem.

## Dynamic Behavior Expectations

The new model should remain correct when:

- items are inserted later
- items are removed
- items are reordered in the light DOM
- trigger and panel mount at different times
- the root `value` changes externally in controlled mode
- root disabled state changes at runtime
- item disabled state changes at runtime

The registry should be the single source of truth for structural relationships, and the state engine should be the single source of truth for expansion behavior.

## Edge Cases To Define Explicitly

The rebuild should document and test these cases:

- duplicate item values
- controlled `value` containing unknown values
- controlled `value` containing disabled values
- nested accordions
- reconnected descendants with stale references

The design recommendation is to normalize invalid values predictably at the root boundary and avoid hidden best-effort behavior.

## Testing Strategy

Testing should follow the architecture.

### Pure Utility Tests

The state engine should get dedicated utility tests for:

- single-mode transitions
- multiple-mode transitions
- disabled-value no-ops
- normalization behavior
- controlled-mode next-state calculation
- ordered event payload derivation

### Browser Integration Tests

Browser tests should focus on:

- registration across dynamic insert, remove, and reorder
- roving focus order and disabled-item skipping
- ARIA element reflection across Shadow DOM
- `keepMounted` behavior
- `hiddenUntilFound` behavior
- controlled-mode event emission without internal mutation
- runtime property changes on the root and items

## Expected Outcomes

If implemented well, the rebuild should produce:

- a smaller and more readable root element
- simpler compound descendants
- fewer lifecycle-driven registration side effects
- stronger correctness under dynamic DOM changes
- better separation between structure, state, and semantics
- a more scalable template for future headless composite components

## Recommendation

Rebuild the accordion around:

- a pure state engine in the utility layer
- a root-owned registry of item records
- thin semantic sub-elements
- ARIA element reflection instead of IDREF linking
- generic controllers only for truly reusable cross-cutting concerns

This is the cleanest architecture for a long-term headless component library built with Lit and Shadow DOM.
