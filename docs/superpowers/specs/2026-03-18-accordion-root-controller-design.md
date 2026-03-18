# Accordion Root Controller Design

**Goal:** Introduce an accordion-specific root controller that absorbs the orchestration currently bloating `grund-accordion`, while preserving the current public accordion API and keeping generic concerns generic.

**Scope:** This design covers the internal architecture of the accordion root only. It does not redesign the public element structure or introduce an item controller.

## Problem

`src/components/accordion/accordion.ts` currently owns too much behavior for a Lit host element:

- controlled and uncontrolled expanded-state sync
- registry ownership and coordination
- value rename handling
- action application through the pure accordion engine
- event dispatch for `grund-change` and `grund-value-change`
- context value construction
- trigger ordering for roving focus

This makes the root element the behavioral center of the accordion instead of a thin host shell.

The current state is already better than the old accordion-specific controller that was removed, but the problem has shifted rather than disappeared. The root now contains enough real orchestration that a stronger controller boundary is justified.

## Design Goals

- Make `src/components/accordion/accordion.ts` a thin Lit integration shell.
- Introduce a meaningful accordion-specific controller, not a thin indirection layer.
- Keep `src/utils/accordion/engine.ts` pure and independent.
- Keep `src/controllers/roving-focus.controller.ts` generic and separate.
- Keep `src/components/accordion/accordion.registry.ts` as a focused structural store, even if owned internally by the new controller.
- Preserve the current accordion public API and emitted events.
- Keep the design accordion-specific for now, while leaving room for future reuse if the pattern proves itself.

## Non-Goals

- Introducing a generic “composite root controller” abstraction.
- Introducing an accordion item controller.
- Moving roving focus behavior into the accordion controller.
- Changing public props, slots, parts, or events.

## Recommended Approach

Introduce `AccordionRootController` as the single owner of accordion orchestration.

This controller should be accordion-specific and should own:

- the `AccordionRegistry` instance
- expanded state bookkeeping
- controlled and uncontrolled synchronization
- rename semantics for item value changes
- event payload generation
- event dispatch through the host
- context value generation
- ordered trigger exposure for the host

The Lit root element should own:

- public reactive properties
- controller instantiation
- roving focus instantiation
- pushing current prop values into the controller in `willUpdate()`
- providing the controller’s context value
- rendering

## Architecture

### 1. Keep the Existing Supporting Boundaries

Three existing pieces should remain separate:

- `src/utils/accordion/engine.ts`
  - pure transition logic only
- `src/components/accordion/accordion.registry.ts`
  - structural record storage only
- `src/controllers/roving-focus.controller.ts`
  - reusable keyboard focus behavior only

The new controller should compose them rather than replace them.

### 2. Add `AccordionRootController`

Create a controller in the accordion component directory, likely `src/components/accordion/accordion-root.controller.ts`.

It should own a host reference plus an internal `AccordionRegistry` instance.

Its responsibility is to answer: given the current host props, current registry state, and a user action, what does the accordion do next?

That makes it the single place where:

- prop-driven state sync
- action handling
- rename handling
- context generation
- event dispatch

come together.

### 3. Thin the Root Element

After the refactor, `src/components/accordion/accordion.ts` should mostly:

- declare public properties
- instantiate `AccordionRootController`
- instantiate `RovingFocusController`
- call one controller sync method in `willUpdate()`
- provide `controller.contextValue`
- pass `controller.triggers` into roving focus
- render the slot container

If the element still reconstructs event payloads, registry views, or context objects manually, the refactor is incomplete.

## Controller API

The controller should expose a small, semantic host-facing API.

### Host-Facing API

- `syncFromHost(input)`
- `requestToggle(value)`
- `requestOpen(value)`
- `renameExpandedValue(previousValue, nextValue)`
- `contextValue`
- `triggers`

`syncFromHost(input)` should accept a root-property snapshot rather than a large number of piecemeal setters.

### Host Sync Input

The sync snapshot should contain:

- `multiple`
- `disabled`
- `orientation`
- `loopFocus`
- `keepMounted`
- `hiddenUntilFound`
- `value`
- `defaultValue`

This keeps host/controller synchronization explicit and easy to reason about in `willUpdate()`.

### Internal Controller Helpers

The controller can have private helpers like:

- `syncRegistryOrder()`
- `syncExpandedValues()`
- `syncContextValue()`
- `dispatchActionResult(result)`

The host should not need to know about them.

## Registry Ownership

The controller should instantiate and own `AccordionRegistry` internally.

The root element should not create or pass around a registry instance.

The reason is architectural, not stylistic: registry ownership is part of accordion orchestration now. Leaving registry creation in the host would keep structural complexity leaking back into `accordion.ts`.

`AccordionRegistry` should still stay a separate module and class so it remains independently understandable and testable.

## Context Ownership

The controller should own context value construction.

The context is no longer simple host glue. It is the public internal contract between the root and its descendant parts. If the controller owns accordion behavior but the host still assembles the context object, the boundary is split in the wrong place.

The controller should expose either:

- `contextValue`

or:

- `getContextValue()`

The preferred option is a cached `contextValue` updated during controller sync.

The context object should include:

- expanded item state
- root actions
- item registration hooks
- trigger and panel attachment hooks
- derived item lookup
- rename hook if that remains part of the contract

## Roving Focus Boundary

Roving focus should stay outside the accordion root controller.

`src/controllers/roving-focus.controller.ts` is already a legitimate generic controller, and moving keyboard behavior into the accordion controller would mix accordion semantics with reusable focus mechanics.

The accordion root controller should expose:

- `triggers`

as the fully ordered list of `GrundAccordionTrigger` instances that participate in roving focus.

The host should still decide how the generic roving focus controller consumes that list.

## Event Dispatch

The controller should dispatch accordion events through the host.

It should not stop at returning payloads for the element to dispatch manually. Event emission is part of accordion behavior, and splitting that between controller and host weakens the boundary.

`requestToggle()` and `requestOpen()` should:

1. resolve the transition through the pure engine
2. update internal state if uncontrolled
3. dispatch `grund-change`
4. dispatch `grund-value-change`
5. request a host update if needed

This makes the controller the single behavioral owner of accordion actions.

## Data Flow

The recommended update flow is:

1. Lit properties change on `grund-accordion`
2. `accordion.ts` calls `controller.syncFromHost(...)` in `willUpdate()`
3. the controller:
   - syncs registry order
   - syncs controlled or uncontrolled expanded state
   - caches `contextValue`
   - exposes ordered triggers
4. descendants consume the controller-owned context value
5. user actions call controller-owned methods like `requestToggle()` and `requestOpen()`
6. the controller resolves transitions, updates internal state if needed, dispatches events, and requests host updates

This makes the root declarative and the controller imperative in one predictable place.

## Testing Strategy

The controller should introduce a new test layer between the pure engine tests and the browser integration tests.

### Pure Engine Tests

Keep these in `src/utils/accordion/engine.test.ts`.

They continue to verify transition math only.

### Root Controller Tests

Add dedicated controller tests for:

- controlled vs uncontrolled sync
- default value seeding
- registry-driven trigger ordering
- root disabled behavior
- item disabled behavior
- rename behavior
- event dispatch through the host
- context value generation

These should be faster and more focused than browser tests because they test orchestration directly.

### Browser Integration Tests

Keep browser tests for actual DOM contracts:

- ARIA reflection
- mount and unmount behavior
- roving focus behavior
- item value mutation behavior
- descendant event behavior

After the controller refactor, browser tests should not be carrying orchestration coverage that belongs in controller tests.

## Migration Plan

The implementation should proceed in small steps:

1. add `AccordionRootController` with tests
2. move expanded-state orchestration into the controller
3. move event dispatch into the controller
4. move context value generation into the controller
5. move registry ownership into the controller
6. simplify `accordion.ts` until it only wires props, context, roving focus, and render

This order keeps the refactor incremental and debuggable.

## Risks

### Main Risk

The controller could become a second bloated root if it simply absorbs code without enforcing a cleaner boundary.

The success criterion is not “more code in a controller”. It is “a smaller, more comprehensible root host and a controller with one clear responsibility: accordion orchestration.”

### Secondary Risk

The controller could become over-generic too early.

That should be avoided. This design is intentionally accordion-specific. If a similar pattern later proves useful for tabs or other composite roots, that can be generalized then.

## Recommendation

Introduce an accordion-specific `AccordionRootController` that owns registry coordination, expanded state, rename semantics, event dispatch, context generation, and trigger ordering.

Keep:

- `engine.ts` pure
- `accordion.registry.ts` separate
- `roving-focus.controller.ts` generic

Do not add an item controller.

This is the cleanest next step if the goal is to make the accordion root readable again without forcing premature abstraction across the rest of the library.
