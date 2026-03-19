# Accordion Guidelines Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the accordion to working order and apply all CLAUDE.md principal-engineer guidelines so it serves as the library's reference implementation.

**Architecture:** Eight targeted changes across the accordion component — no new features, no public API changes. Each task is self-contained and leaves tests green. Tasks 1–3 restore broken functionality; tasks 4–8 apply CLAUDE.md guidelines.

**Tech Stack:** Lit 3, `@lit/context`, Vitest browser mode (Playwright/headless Chromium), TypeScript 5.

---

## File Map

| File | Role in this plan |
|---|---|
| `src/components/accordion/registry/accordion.registry.ts` | Task 1: restore missing methods |
| `src/components/accordion/context/accordion.context.ts` | Tasks 2 & 3: rename interface, remove aliases |
| `src/components/accordion/context/index.ts` | Task 2: fix re-export alias |
| `src/components/accordion/controller/accordion.controller.ts` | Task 3: remove `toggle`/`openItem` from `createContextValue` |
| `src/components/accordion/controller/accordion.controller.test.ts` | Tasks 2 & 3: fix broken import, update assertions |
| `src/components/accordion/context/accordion.context.test.ts` | Task 3: update test to match new interface |
| `src/components/accordion/root/accordion.test.ts` | Task 3: update test helper element |
| `src/components/accordion/item/accordion-item.ts` | Tasks 4, 5 & 8: decompose `willUpdate`, remove double registration, dev warning |
| `src/components/accordion/trigger/accordion-trigger.ts` | Task 7: convert `accordionConsumer` to `@consume` |
| `src/components/accordion/panel/accordion-panel.ts` | Task 6: add `OpenStateController` |

---

## Task 1: Restore Missing Registry Methods

The controller calls `registry.syncOrder()`, `registry.itemOrder`, `registry.disabledValues`, `registry.getItemState()`, and `registry.getOrderedTriggers()` — all of which were removed during the last refactor, making the accordion non-functional.

**Files:**
- Modify: `src/components/accordion/registry/accordion.registry.ts`

- [ ] **Step 1: Add the missing methods to the registry class**

  First verify the `GrundAccordionItemSnapshot` shape in `src/components/accordion/types.ts` — the `snapshot` helper below must return exactly those fields. The current shape is `{ index: number, disabled: boolean, trigger: Element | null, panel: Element | null }`.

  Open `src/components/accordion/registry/accordion.registry.ts`. After the existing `private get orderedRecords()` getter, add the following public API. Insert before the closing `}` of the class:

  ```ts
  public syncOrder(): void {
    for (const record of this.records.values()) {
      record.disabled = record.item.disabled ?? false;
    }
  }

  public get itemOrder(): string[] {
    return this.orderedRecords.map((r) => r.item.value);
  }

  public get disabledValues(): ReadonlySet<string> {
    return new Set(
      [...this.records.values()].filter((r) => r.disabled).map((r) => r.item.value),
    );
  }

  public getItemState(item: GrundAccordionItemLike): GrundAccordionItemSnapshot | undefined {
    const ordered = this.orderedRecords;
    const index = ordered.findIndex((r) => r.item === item);

    if (index === -1) {
      return undefined;
    }

    return this.snapshot(ordered[index], index);
  }

  public getOrderedTriggers(): GrundAccordionTrigger[] {
    return this.orderedRecords
      .map((r) => r.trigger)
      .filter((t): t is GrundAccordionTrigger => t !== null);
  }

  private snapshot(record: AccordionItemRecord, index: number): GrundAccordionItemSnapshot {
    return {
      index,
      disabled: record.disabled,
      trigger: record.trigger,
      panel: record.panel,
    };
  }
  ```

- [ ] **Step 2: Run the test suite**

  ```bash
  npm run test:run
  ```

  Expected: most tests pass. `accordion.controller.test.ts` will **fail to load** (not just fail assertions) because it imports `AccordionRootController` from a path that does not exist — this is a pre-existing broken import fixed in Task 2. Vitest will report it as a module resolution error, not a test failure. This is expected at this point. Ignore it and move on.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/accordion/registry/accordion.registry.ts
  git commit -m "fix(accordion): restore missing registry methods"
  ```

---

## Task 2: Fix Context Type Naming Inconsistency

The interface in `accordion.context.ts` is named `GrundAccordionContextValue`, but all consumers import it as `AccordionContextValue` via an alias in `index.ts`. This is confusing — `Grund` prefix belongs on public element class names, not internal interfaces.

**Files:**
- Modify: `src/components/accordion/context/accordion.context.ts`
- Modify: `src/components/accordion/context/index.ts`

- [ ] **Step 1: Rename the interface declaration**

  In `src/components/accordion/context/accordion.context.ts`, change line 10:

  ```ts
  // Before
  export interface GrundAccordionContextValue {

  // After
  export interface AccordionContextValue {
  ```

  Also update the `accordionContext` type annotation on line 33 (no change needed — it infers the type automatically, but verify it still reads `createContext<AccordionContextValue>`).

  The full file after the rename:

  ```ts
  import { createContext } from '@lit/context';
  import type {
    GrundAccordionItemLike,
    GrundAccordionItemSnapshot,
    GrundAccordionOrientation,
  } from '../types';
  import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
  import type { GrundAccordionPanel } from '../panel/accordion-panel';

  export interface AccordionContextValue {
    orientation: GrundAccordionOrientation;
    loopFocus: boolean;
    disabled: boolean;
    keepMounted: boolean;
    hiddenUntilFound: boolean;
    expandedItems: ReadonlySet<string>;
    requestToggle: (value: string) => void;
    requestOpen: (value: string) => void;
    renameExpandedValue: (previousValue: string, nextValue: string) => void;
    registerItem: (item: GrundAccordionItemLike) => void;
    unregisterItem: (item: GrundAccordionItemLike) => void;
    attachTrigger: (item: GrundAccordionItemLike, trigger: GrundAccordionTrigger | null) => void;
    detachTrigger: (item: GrundAccordionItemLike) => void;
    attachPanel: (item: GrundAccordionItemLike, panel: GrundAccordionPanel | null) => void;
    detachPanel: (item: GrundAccordionItemLike) => void;
    getItemState: (item: GrundAccordionItemLike) => GrundAccordionItemSnapshot | undefined;
    getItemIndex: (item: GrundAccordionItemLike) => number;
    toggle: (value: string) => void;
    openItem: (value: string) => void;
  }

  /** @internal */
  export const accordionContext = createContext<AccordionContextValue>('grund-accordion');
  ```

  > Note: `toggle` and `openItem` are still present here — they'll be removed in Task 3. Keep them for now to avoid breaking tests across tasks.

- [ ] **Step 2: Fix the re-export in `context/index.ts`**

  Replace the current line 1:

  ```ts
  // Before
  export { accordionContext, type GrundAccordionContextValue as GrundAccordionContextValue } from './accordion.context';

  // After
  export { accordionContext, type AccordionContextValue } from './accordion.context';
  ```

- [ ] **Step 3: Fix the broken import in `accordion.controller.test.ts`**

  The test file imports a class that does not exist (`AccordionRootController` from `'../root/accordion-root.controller'`). Fix line 3:

  ```ts
  // Before
  import { AccordionRootController } from '../root/accordion-root.controller';

  // After
  import { AccordionController } from '../controller/accordion.controller';
  ```

  Then replace every occurrence of `AccordionRootController` in the file with `AccordionController`. Verify the `describe` block name and all `new AccordionRootController(host)` calls.

  The affected lines (current references to rename):
  - Line 37: `function registerDisabledItem(controller: AccordionRootController)` → `AccordionController`
  - Line 58: `describe('AccordionRootController', ...)` → `describe('AccordionController', ...)`
  - Line 66: `const controller = new AccordionRootController(host)` → `AccordionController` (and all similar instantiations throughout the file)

- [ ] **Step 4: Run tests to verify the import fix works**

  ```bash
  npm run test:run -- --reporter=verbose src/components/accordion/controller/accordion.controller.test.ts
  ```

  Expected: the test file now compiles. Some tests may still fail due to the `toggle`/`openItem` assertions — that's fine, addressed in Task 3.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/accordion/context/accordion.context.ts src/components/accordion/context/index.ts src/components/accordion/controller/accordion.controller.test.ts
  git commit -m "fix(accordion): settle AccordionContextValue type naming and fix broken test import"
  ```

---

## Task 3: Remove Duplicate Context Methods (`toggle` / `openItem`)

`toggle` and `openItem` are aliases for `requestToggle` and `requestOpen`. CLAUDE.md requires every context method to earn its place. Remove the aliases from the interface, the controller, and update all tests.

**Files:**
- Modify: `src/components/accordion/context/accordion.context.ts`
- Modify: `src/components/accordion/controller/accordion.controller.ts`
- Modify: `src/components/accordion/controller/accordion.controller.test.ts`
- Modify: `src/components/accordion/context/accordion.context.test.ts`
- Modify: `src/components/accordion/root/accordion.test.ts`

- [ ] **Step 1: Remove `toggle` and `openItem` from the interface**

  In `src/components/accordion/context/accordion.context.ts`, remove these two lines from the `AccordionContextValue` interface:

  ```ts
  toggle: (value: string) => void;
  openItem: (value: string) => void;
  ```

- [ ] **Step 2: Remove the alias entries from `createContextValue()`**

  In `src/components/accordion/controller/accordion.controller.ts`, find `createContextValue()` and remove these two lines (currently lines 92–93):

  ```ts
  toggle: (value: string) => this.requestToggle(value),
  openItem: (value: string) => this.requestOpen(value),
  ```

- [ ] **Step 3: Update `accordion.controller.test.ts`**

  In `src/components/accordion/controller/accordion.controller.test.ts`:

  - Find the test at line 87 (description: `'preserves descendant aliases in contextValue'`). Replace the entire `it` block:

    ```ts
    it('exposes requestToggle and requestOpen on the context value', () => {
      const controller = new AccordionController(host);

      controller.syncFromHost(createSnapshot());

      expect(controller.contextValue.requestToggle).toBeTypeOf('function');
      expect(controller.contextValue.requestOpen).toBeTypeOf('function');
    });
    ```

- [ ] **Step 4: Update `accordion.context.test.ts`**

  In `src/components/accordion/context/accordion.context.test.ts`:

  - Line 15: rename the test description from `'keeps the descendant-facing root context aliases in the contract'` to `'exposes requestToggle and requestOpen on the root context contract'`
  - Remove `toggle: noop,` (line 35) and `openItem: noop,` (line 36) from the `rootContext` object literal
  - Replace the two assertions at lines 39–40:

    ```ts
    // Before
    expect(rootContext.toggle).toBe(noop);
    expect(rootContext.openItem).toBe(noop);

    // After
    expect(rootContext.requestToggle).toBe(noop);
    expect(rootContext.requestOpen).toBe(noop);
    ```

- [ ] **Step 5: Update `root/accordion.test.ts`**

  In `src/components/accordion/root/accordion.test.ts`:

  1. Find the `TestAccordionRootActions` class (lines 12–32). Update its `render()` method:

     ```ts
     public override render() {
       return html`
         <button id="toggle" @click=${() => this.accordionCtx?.requestToggle('item-1')}>toggle</button>
         <button id="open" @click=${() => this.accordionCtx?.requestOpen('item-2')}>open</button>
       `;
     }
     ```

  2. Find the test description at line 290: `'keeps descendant root actions working through the preserved context aliases'`. Rename it to `'keeps descendant root actions working via requestToggle and requestOpen'`.

  > Lines 311–314 only click the buttons and do not call context methods directly — they do not need updating.

- [ ] **Step 6: Run the full test suite**

  ```bash
  npm run test:run
  ```

  Expected: all tests pass. TypeScript should report no errors (`npm run build` as a secondary check).

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/accordion/context/accordion.context.ts src/components/accordion/controller/accordion.controller.ts src/components/accordion/controller/accordion.controller.test.ts src/components/accordion/context/accordion.context.test.ts src/components/accordion/root/accordion.test.ts
  git commit -m "refactor(accordion): remove toggle/openItem context aliases in favour of requestToggle/requestOpen"
  ```

---

## Task 4: Decompose `accordion-item.willUpdate` Into Named Phases

The current `willUpdate` is 50 lines handling 6 separate concerns. CLAUDE.md requires named phase methods for readability and testability.

**Files:**
- Modify: `src/components/accordion/item/accordion-item.ts`

- [ ] **Step 1: Add `PropertyValues` import**

  `accordion-item.ts` currently imports from `'lit'` — add `PropertyValues` to the import:

  ```ts
  import { LitElement, html, type PropertyValues } from 'lit';
  ```

- [ ] **Step 2: Remove the `lastValue` and `lastDisabled` fields**

  Delete these two lines from the class fields (currently lines 44–45):

  ```ts
  private lastValue = this.value;
  private lastDisabled = this.disabled;
  ```

- [ ] **Step 3: Replace `willUpdate` with the three-phase orchestration**

  Replace the entire `willUpdate()` method and add three private phase methods. The result:

  ```ts
  public override willUpdate(changedProperties: PropertyValues): void {
    this.syncRegistration(changedProperties);
    this.syncExpandedState();
    this.syncAttributes();
  }

  private syncRegistration(changedProperties: PropertyValues): void {
    const valueChanged = changedProperties.has('value');
    const disabledChanged = changedProperties.has('disabled');
    const syncStructure = this.registered && (valueChanged || disabledChanged);

    if (this.accordionCtx && valueChanged) {
      this.accordionCtx.renameExpandedValue(
        changedProperties.get('value') as string,
        this.value,
      );
    }

    if (this.accordionCtx && syncStructure) {
      this.accordionCtx.unregisterItem(this);
      this.registered = false;
    }

    if (this.accordionCtx && !this.registered) {
      this.accordionCtx.registerItem(this);
      this.registered = true;
    }

    if (import.meta.env.DEV && !this.registered && !this.accordionCtx) {
      console.warn('[grund-ui] <grund-accordion-item> must be a descendant of <grund-accordion>.');
    }
  }

  private syncExpandedState(): void {
    const nextExpanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;
    this.expandedChanged = nextExpanded !== this.expanded;
    this.expanded = nextExpanded;
    this.itemCtx = this.buildItemCtx();
  }

  private syncAttributes(): void {
    this.toggleAttribute('expanded', this.expanded);
    this.toggleAttribute('data-open', this.expanded);
    this.toggleAttribute('data-disabled', this.itemCtx.disabled);

    if (this.itemCtx.index >= 0) {
      this.dataset.index = String(this.itemCtx.index);
    } else {
      delete this.dataset.index;
    }
  }
  ```

  > **Important:** `renameExpandedValue` now uses `changedProperties.get('value')` to get the _previous_ value (which is what Lit stores in `changedProperties`). This is the Lit-native equivalent of the old `this.lastValue`.

  > **Why `syncAttributes` stays in `willUpdate` (not `updated`):** CLAUDE.md says DOM side effects belong in `updated`. These `toggleAttribute` calls are intentionally placed in `willUpdate` to ensure attributes are set _before_ render — avoiding a single-frame flash where the host element lacks `expanded`, `data-open`, or `data-disabled` on first paint. This is a documented exception to the hook rule.

- [ ] **Step 4: Run tests**

  ```bash
  npm run test:run
  ```

  Expected: all tests pass. The refactor is purely structural.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/accordion/item/accordion-item.ts
  git commit -m "refactor(accordion): decompose accordion-item willUpdate into named phase methods"
  ```

---

## Task 5: Remove Double Registration Path

`accordion-item.willUpdate` currently re-attaches trigger and panel on every update cycle (the `if (this.accordionCtx)` block after registration). This duplicates what the trigger and panel sub-parts already do via their item context callbacks. CLAUDE.md: "A registration or state mutation must happen through exactly one mechanism."

**Files:**
- Modify: `src/components/accordion/item/accordion-item.ts`

- [ ] **Step 1: Remove the re-attach block from `syncRegistration`**

  In `syncRegistration`, after the registration guard (`if (this.accordionCtx && !this.registered)`), delete the block that re-attaches trigger and panel:

  ```ts
  // DELETE this block entirely from syncRegistration:
  if (this.accordionCtx) {
    if (this.registeredTriggerElement) {
      this.accordionCtx.attachTrigger(this, this.registeredTriggerElement);
    } else {
      this.accordionCtx.detachTrigger(this);
    }

    if (this.registeredPanelElement) {
      this.accordionCtx.attachPanel(this, this.registeredPanelElement);
    } else {
      this.accordionCtx.detachPanel(this);
    }
  }
  ```

  The canonical path is the `registerTrigger`/`registerPanel` callbacks in `buildItemCtx()` — they already call `attachTrigger`/`attachPanel` on the root context. No other code should duplicate this.

- [ ] **Step 2: Run the full test suite, paying attention to registration tests**

  ```bash
  npm run test:run
  ```

  Expected: all tests pass. The `'registers trigger and panel children that mount after the item'` test in `accordion.test.ts` is the canary — if the canonical path works, it will pass.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/accordion/item/accordion-item.ts
  git commit -m "refactor(accordion): remove double sub-part registration path from item willUpdate"
  ```

---

## Task 6: Use `OpenStateController` in Panel

`accordion-panel.ts` manually writes `this.dataset.state = expanded ? 'open' : 'closed'` in `willUpdate`. `OpenStateController` exists precisely for this — use it.

**Files:**
- Modify: `src/components/accordion/panel/accordion-panel.ts`

- [ ] **Step 1: Add the import**

  In `accordion-panel.ts`, add to the existing imports:

  ```ts
  import { OpenStateController } from '../../../controllers/open-state.controller';
  ```

- [ ] **Step 2: Add the controller field**

  In the class body, after the `ariaLink` field, add:

  ```ts
  // @ts-expect-error -- controller registered for side effects; TS cannot see that read
  private openState = new OpenStateController(this, {
    isOpen: () => this.itemCtx?.expanded ?? false,
  });
  ```

  The `@ts-expect-error` is needed for the same reason as `ariaLink` above it — TypeScript sees the field as "assigned but never read" because the controller registers itself via `addController` and runs autonomously.

- [ ] **Step 3: Remove `PropertyValues` import if no longer needed**

  The `willUpdate` signature uses `PropertyValues` — check whether it's still needed after this task. It is still needed (for `changedProperties.has('itemCtx')`), so leave it.

- [ ] **Step 4: Remove the manual `dataset.state` assignment from `willUpdate`**

  Find line 64:

  ```ts
  this.dataset.state = expanded ? 'open' : 'closed';
  ```

  Delete this line. Also remove the `const expanded =` local variable on line 58 **only if** it is no longer used by `willUpdate` — but check first: `expanded` is also used by `this.toggleAttribute('data-open', expanded)` on line 61, so keep it.

- [ ] **Step 5: Run the tests**

  ```bash
  npm run test:run
  ```

  Expected: all tests pass. `data-state` is still set — now by the controller in `hostUpdated()` instead of `willUpdate()`. The observable output is identical.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/accordion/panel/accordion-panel.ts
  git commit -m "refactor(accordion): use OpenStateController for panel data-state"
  ```

---

## Task 7: Standardise Context Consumption on Trigger

The trigger uses `ContextConsumer` for both `accordionConsumer` and `itemConsumer`. `accordionConsumer` doesn't need the callback — `@consume` is sufficient. `itemConsumer` genuinely needs the callback (to unregister from the previous item before registering with the new one), so it stays as `ContextConsumer` but must be documented.

**Files:**
- Modify: `src/components/accordion/trigger/accordion-trigger.ts`

- [ ] **Step 1: Add the `consume` decorator import**

  `accordion-trigger.ts` currently only imports `customElement` from `'lit/decorators.js'`. Add `consume`:

  ```ts
  import { customElement, consume } from 'lit/decorators.js';
  ```

- [ ] **Step 2: Replace `accordionConsumer` with `@consume` decorator**

  Remove:

  ```ts
  private accordionCtx?: AccordionContextValue;

  // @ts-expect-error -- ContextConsumer is registered for side effects; TS cannot see that read
  private accordionConsumer = new ContextConsumer(this, {
    context: accordionContext,
    callback: (ctx) => {
      this.accordionCtx = ctx;
      this.requestUpdate();
    },
    subscribe: true,
  });
  ```

  Replace with:

  ```ts
  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;
  ```

  The `@consume` decorator handles storing the value and triggering updates automatically — no manual callback needed.

- [ ] **Step 3: Add a justification comment to `itemConsumer`**

  Update the `itemConsumer` declaration to explain why `@consume` is not used:

  ```ts
  // ContextConsumer used here (not @consume) because the trigger must unregister
  // from the previous item context before registering with the new one. The
  // callback gives us the previous value via `this.itemCtx` before overwriting it.
  // @ts-expect-error -- ContextConsumer is registered for side effects; TS cannot see that read
  private itemConsumer = new ContextConsumer(this, {
    context: accordionItemContext,
    callback: (ctx) => {
      if (this.itemCtx && this.itemCtx.value !== ctx.value) {
        this.itemCtx.unregisterTrigger();
      }
      this.itemCtx = ctx;
      ctx.registerTrigger(this);
      this.requestUpdate();
    },
    subscribe: true,
  });
  ```

- [ ] **Step 4: Remove unused `ContextConsumer` import if no longer needed**

  Check: `ContextConsumer` is still used by `itemConsumer`, so keep the import.

  Also remove the unused `AccordionContextValue` import from `'@lit/context'` if the `ContextConsumer` import was the only reason it was there — but `AccordionContextValue` is still used as the type for `private accordionCtx`, so keep that too.

- [ ] **Step 5: Run tests**

  ```bash
  npm run test:run
  ```

  Expected: all tests pass. The `@consume` decorator is functionally equivalent to the old `ContextConsumer` callback for this use case.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/accordion/trigger/accordion-trigger.ts
  git commit -m "refactor(accordion): convert accordionConsumer to @consume decorator on trigger"
  ```

---

## Task 8: Dev-Mode Warning for Missing Parent Context

When `<grund-accordion-item>` is used outside `<grund-accordion>`, it silently degrades. Add a dev-mode warning so developers get a clear message. (This was added as part of Task 4 — verify it's in place.)

**Files:**
- Verify: `src/components/accordion/item/accordion-item.ts`

- [ ] **Step 1: Verify the warning is in `syncRegistration`**

  Confirm the following block was added in Task 4 and is present in the file:

  ```ts
  if (import.meta.env.DEV && !this.registered && !this.accordionCtx) {
    console.warn('[grund-ui] <grund-accordion-item> must be a descendant of <grund-accordion>.');
  }
  ```

  If it was missed in Task 4, add it now at the end of `syncRegistration()`.

- [ ] **Step 2: Run tests and lint**

  ```bash
  npm run test:run && npm run lint
  ```

  Expected: all tests pass, no lint errors.

- [ ] **Step 3: Commit (only if a change was needed)**

  If the warning was already added in Task 4, skip this commit. If it was missing:

  ```bash
  git add src/components/accordion/item/accordion-item.ts
  git commit -m "feat(accordion): add dev-mode warning for item used outside accordion root"
  ```

---

## Final Verification

- [ ] **Run full test suite**

  ```bash
  npm run test:run
  ```

  Expected: all tests pass (green).

- [ ] **Run lint**

  ```bash
  npm run lint
  ```

  Expected: no errors.

- [ ] **Run build**

  ```bash
  npm run build
  ```

  Expected: no TypeScript errors, clean build output.
