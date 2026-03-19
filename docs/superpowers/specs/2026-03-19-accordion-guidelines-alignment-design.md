# Accordion Guidelines Alignment — Design Spec

**Date:** 2026-03-19
**Branch:** `accordion-rework`
**Status:** Approved

## Background

The accordion component is mid-refactor. Several registry methods were removed during a structural reorganisation, breaking the controller. Simultaneously, an incomplete type rename left imports broken across multiple files. This spec covers both the repair and the full application of the CLAUDE.md principal-engineer guidelines to the accordion as the library's reference implementation.

## Goals

1. Restore the accordion to a working, test-passing state
2. Apply all CLAUDE.md guidelines so the accordion serves as the template for future components
3. No architectural redesign — stay within the existing two-context model (root + item)

## Non-Goals

- Splitting the root context into per-consumer slices (premature without a second compound component)
- Changing the public element API (`value`, `disabled`, `multiple`, etc.)
- Adding new features

---

## Change Set

### 1 — Restore Registry (`accordion.registry.ts`)

The following methods were removed during the last refactor but are still called by `AccordionController`. They must be restored:

- `syncOrder()` — refreshes `disabled` from each item's live property; called before action resolution and snapshot queries
- `get itemOrder(): string[]` — ordered array of item values for `resolveAccordionAction`
- `get disabledValues(): ReadonlySet<string>` — set of disabled values for `resolveAccordionAction`
- `getItemState(item): GrundAccordionItemSnapshot | undefined` — snapshot for index/trigger/panel lookup
- `getOrderedTriggers(): GrundAccordionTrigger[]` — ordered trigger list for `RovingFocusController`
- `private snapshot(record): GrundAccordionItemSnapshot` — private snapshot builder

The `setRecordField` idempotency guard introduced in the WIP is good and should be kept.

**Why all of these:** The controller's `applyAction` passes `itemOrder` and `disabledValues` to `resolveAccordionAction`. `getItemState` is needed for item index derivation. `getOrderedTriggers` feeds `RovingFocusController`. Removing them makes the accordion non-functional.

### 2 — Settle Context Type Naming

The interface was renamed to `GrundAccordionContextValue` in `accordion.context.ts`, but all consuming files continue to import `AccordionContextValue` via the alias in `context/index.ts`. The alias bridges the gap but leaves an inconsistency between the declaration name and the export name.

**Decision:** Rename the interface declaration back to `AccordionContextValue`. This is an internal type — the `Grund` prefix belongs on public-facing element class names and event detail types, not internal context interfaces. The `@internal` JSDoc tag signals this.

**Actual work:** Two files only:
- `context/accordion.context.ts` — rename `GrundAccordionContextValue` → `AccordionContextValue` in the interface declaration
- `context/index.ts` — update the re-export to export `AccordionContextValue` directly (remove the `as GrundAccordionContextValue` alias)

No changes needed in consuming files — they already import `AccordionContextValue` and will continue to work.

### 3 — Remove Duplicate Context Methods

`toggle` and `openItem` on `AccordionContextValue` are explicit aliases for `requestToggle` and `requestOpen`. Per CLAUDE.md: "Every method on a context interface must earn its place."

**Source changes:**
- Remove `toggle` and `openItem` from `AccordionContextValue`
- Remove their corresponding entries from `createContextValue()` in `AccordionController`

**Test updates required** (tests use the old aliases — update to the canonical names):
- `context/accordion.context.test.ts` lines 35–36, 39–40: replace `toggle`/`openItem` with `requestToggle`/`requestOpen`; rename the test description at line 15 from `'keeps the descendant-facing root context aliases in the contract'` to something accurate (e.g. `'exposes requestToggle and requestOpen on the root context'`)
- `controller/accordion.controller.test.ts`: **fix the broken import first** — line 3 imports `AccordionRootController` from `'../root/accordion-root.controller'` which does not exist; correct it to `import { AccordionController } from '../controller/accordion.controller'` and update all usages in the file accordingly. Then update lines 92–93 to assert `requestToggle`/`requestOpen` instead of `toggle`/`openItem`.
- `root/accordion.test.ts` lines 28–29, 311–314: update the test helper element's button actions to call `ctx.requestToggle`/`ctx.requestOpen`

### 4 — Decompose `accordion-item.willUpdate`

The current `willUpdate` (50 lines, 6 concerns) violates the CLAUDE.md principle: *"When `willUpdate` handles multiple concerns, extract named methods for each phase."*

Decompose into three private methods called from `willUpdate`:

**`syncRegistration()`**
Handles the register/re-register/unregister dance:
- Detects value or disabled change via `changedProperties`
- Renames the expanded value on the controller if value changed
- Unregisters + re-registers when structural props change
- Registers on first connect

**`syncExpandedState()`**
Derives the current expanded flag from root context:
- Reads `accordionCtx.expandedItems.has(this.value)`
- Sets `this.expandedChanged` and `this.expanded`
- Rebuilds `this.itemCtx`

**`syncAttributes()`**
All `toggleAttribute` and `dataset` writes:
- `expanded`, `data-open`, `data-disabled`, `data-index`

`willUpdate(changedProperties: PropertyValues)` becomes a three-line orchestrator:
- Passes `changedProperties` to `syncRegistration(changedProperties)` — needs it to detect value/disabled changes via `changedProperties.has(...)`
- Calls `syncExpandedState()` — no changedProperties needed, reads live context state
- Calls `syncAttributes()` — no changedProperties needed, reads `this.expanded` and `this.itemCtx`

**`changedProperties` over manual tracking:** Replace `this.lastValue` / `this.lastDisabled` with `changedProperties.has('value')` and `changedProperties.has('disabled')`. These are reactive `@property` fields — Lit tracks them natively. Remove the `lastValue` and `lastDisabled` fields entirely.

### 5 — Remove Double Registration Path

`accordion-item.willUpdate` currently re-attaches triggers and panels on every update cycle (lines 125–137), duplicating what the trigger and panel already do via their own context callbacks.

Per CLAUDE.md: *"A registration or state mutation must happen through exactly one mechanism."*

**Canonical path:** Sub-part registers itself via item context callback (`registerTrigger` / `registerPanel`). The item stores the reference (`registeredTriggerElement`, `registeredPanelElement`) and calls through to the root context.

**Remove:** The `if (this.accordionCtx)` block in `willUpdate` that re-calls `attachTrigger`/`detachTrigger`/`attachPanel`/`detachPanel`. The `buildItemCtx` callbacks already handle this correctly.

### 6 — `OpenStateController` in Panel

`accordion-panel.ts` manually sets `this.dataset.state = expanded ? 'open' : 'closed'` in `willUpdate`. The `OpenStateController` exists precisely for this.

Replace the manual assignment with:

```ts
private openState = new OpenStateController(this, {
  isOpen: () => this.itemCtx?.expanded ?? false,
});
```

Remove `this.dataset.state = ...` from `willUpdate`. Keep `data-open` (separate attribute used by item for its own state signalling) — `OpenStateController` only manages `data-state` on the panel host.

**Timing note:** `OpenStateController` applies `data-state` in `hostUpdated()` (post-render) rather than `willUpdate()` (pre-render). The observable behaviour is identical here — nothing reads `data-state` during the panel's own render pass — so this is a safe swap.

### 7 — `ContextConsumer` Comment on Trigger

The trigger uses `ContextConsumer` instead of `@consume` for both contexts. Per CLAUDE.md, the exception must be documented.

For `accordionConsumer`: `@consume` would work. Convert to `@consume` decorator.

For `itemConsumer`: `ContextConsumer` is justified because the callback handles the context-switch case (unregistering from the previous item before registering with the new one). Keep `ContextConsumer` with a JSDoc comment explaining why.

### 8 — Dev-Mode Warning on Item

Add a structural misuse warning in `accordion-item.ts` for when the item is rendered outside an accordion root:

```ts
if (import.meta.env.DEV && !this.accordionCtx) {
  console.warn('[grund-ui] <grund-accordion-item> must be a descendant of <grund-accordion>.');
}
```

Place this in `syncRegistration()`, guarded so it only fires once (when `!this.registered && !this.accordionCtx`).

---

## File Impact Summary

| File | Changes |
|---|---|
| `registry/accordion.registry.ts` | Restore 5 missing methods + `snapshot` helper |
| `registry/types.ts` | No change (WIP changes are correct) |
| `context/accordion.context.ts` | Rename interface to `AccordionContextValue`; remove `toggle`/`openItem` |
| `context/index.ts` | Remove `as GrundAccordionContextValue` alias; export `AccordionContextValue` directly |
| `controller/accordion.controller.ts` | Remove `toggle`/`openItem` from `createContextValue` |
| `controller/accordion.controller.test.ts` | Fix broken import (`AccordionRootController` → `AccordionController`); update `toggle`/`openItem` assertions to `requestToggle`/`requestOpen` |
| `item/accordion-item.ts` | Decompose `willUpdate`; remove double registration; replace `lastValue`/`lastDisabled` with `changedProperties`; add dev warning |
| `trigger/accordion-trigger.ts` | Convert `accordionConsumer` to `@consume`; add `ContextConsumer` justification comment on `itemConsumer` |
| `panel/accordion-panel.ts` | Add `OpenStateController`; remove manual `dataset.state` assignment |
| `context/accordion.context.test.ts` | Update `toggle`/`openItem` references; rename test description |
| `root/accordion.test.ts` | Update test helper element to use `requestToggle`/`requestOpen` |

---

## Testing

No new tests required — the existing test suite covers all behaviours being refactored. The refactor must leave all existing tests green. Run `npm run test:run` and `npm run lint` to verify.

## Risks

- The double registration removal (change 5) is the highest-risk change. It relies on the sub-part context callbacks being reliably called before any consumer of `registeredTrigger`/`registeredPanel` reads them. The existing `flush()` test utility (3-cycle wait) should handle this, but tests should be checked carefully.
