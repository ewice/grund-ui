# Code Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address all 16 issues found in the post-implementation code review: 3 critical bugs, 6 important fixes, and 7 suggestions.

**Architecture:** Fixes are organized bottom-up: cleanup → utility fixes → element fixes → build pipeline → architecture improvements → test coverage → documentation. Each task is independent and commits cleanly.

**Tech Stack:** Lit 3, TypeScript 5, Vite 8, Vitest 4, ESLint 10, `@lit/context`, `eslint-plugin-storybook`

---

### Task 1: Cleanup — delete Storybook scaffolds + add missing package.json fields

**Files:**
- Delete: `stories/Button.stories.ts`, `stories/Button.ts`, `stories/Header.stories.ts`, `stories/Header.ts`, `stories/Page.stories.ts`, `stories/Page.ts`, `stories/Configure.mdx`, `stories/button.css`, `stories/header.css`, `stories/page.css`, `stories/assets/` (entire directory)
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

No tests needed — this is deletion + config.

**Step 1: Delete Storybook scaffold files**

```bash
cd C:/Users/henni/Documents/Git/grund-ui
git rm -r stories/Button.stories.ts stories/Button.ts stories/Header.stories.ts stories/Header.ts stories/Page.stories.ts stories/Page.ts stories/Configure.mdx stories/button.css stories/header.css stories/page.css stories/assets/
```

**Step 2: Add `repository` and `engines` fields to package.json**

In `package.json`, after the `"license": "MIT"` line, add:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/your-username/grund-ui"
},
"engines": {
  "node": ">=20"
},
```

Note: Replace `your-username` with the actual GitHub username once the repo is created.

**Step 3: Add Playwright browser cache to CI**

In `.github/workflows/ci.yml`, replace the `Install Playwright browsers` step with:

```yaml
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}

      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install chromium

      - name: Install Playwright system dependencies
        run: npx playwright install-deps chromium
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Storybook scaffolds, add repository/engines fields, cache Playwright in CI"
```

---

### Task 2: Fix `generateId` — replace counter with crypto.randomUUID()

**Files:**
- Modify: `src/utils/id.ts`
- Modify: `src/utils/id.test.ts`

**Why:** The module-level counter is not reset between tests (non-deterministic ordering) and is unsafe for SSR (server/client ID mismatch). `crypto.randomUUID()` is natively available in all modern browsers and Node 19+ and produces globally unique IDs.

**Step 1: Update the test first**

Replace `src/utils/id.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { generateId } from './id.js';

describe('generateId', () => {
  it('generates a string with the given prefix', () => {
    const id = generateId('trigger');
    expect(id).toMatch(/^trigger-/);
  });

  it('generates unique IDs across 100 calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId('test')));
    expect(ids.size).toBe(100);
  });

  it('generates unique IDs across separate calls with the same prefix', () => {
    const a = generateId('panel');
    const b = generateId('panel');
    expect(a).not.toBe(b);
  });
});
```

**Step 2: Run test — verify it still passes with existing code**

```bash
npx vitest run --project=components src/utils/id.test.ts --reporter=verbose
```

Expected: PASS (the counter still works, just confirming test is good)

**Step 3: Replace the implementation**

Replace `src/utils/id.ts` with:

```ts
/**
 * Generates a unique ID string with the given prefix.
 * Uses `crypto.randomUUID()` for guaranteed uniqueness across
 * test runs, page navigations, and SSR/hydration scenarios.
 *
 * @param prefix - A short string prepended to the ID (e.g. 'trigger', 'panel')
 * @returns A unique string like `trigger-3f2a1b4c`
 */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
```

**Step 4: Run test — verify it passes**

```bash
npx vitest run --project=components src/utils/id.test.ts --reporter=verbose
```

Expected: PASS (3/3)

**Step 5: Commit**

```bash
git add src/utils/id.ts src/utils/id.test.ts
git commit -m "fix: replace module counter in generateId with crypto.randomUUID() for test and SSR safety"
```

---

### Task 3: Fix `_buildItemCtx` side effect — keep the builder pure

**Files:**
- Modify: `src/components/accordion/accordion-item.ts`

**Why:** `_buildItemCtx()` currently mutates `this.expanded` (a reflected Lit property) as a side effect. Mutating a reactive property inside a method called during `willUpdate` can schedule a second update cycle. The fix: move the mutation to `willUpdate` directly, keeping `_buildItemCtx` as a pure function.

No new tests needed — existing integration tests cover this behavior.

**Step 1: Update `accordion-item.ts`**

Replace the `_buildItemCtx`, `willUpdate`, and `itemCtx` block (lines 27–43) with:

```ts
  @provide({ context: accordionItemContext })
  itemCtx: AccordionItemContextValue = this._buildItemCtx();

  private _buildItemCtx(): AccordionItemContextValue {
    return {
      value: this.value,
      disabled: this.disabled || (this.accordionCtx?.disabled ?? false),
      expanded: this.accordionCtx?.expandedItems.has(this.value) ?? false,
      triggerId: this.triggerId,
      panelId: this.panelId,
    };
  }

  override willUpdate() {
    this.expanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;
    this.itemCtx = this._buildItemCtx();
  }
```

The key change: `_buildItemCtx()` now reads `accordionCtx?.expandedItems` directly for the `expanded` field instead of reading `this.expanded`. The `willUpdate` hook still syncs `this.expanded` (for attribute reflection) but it's now a clean separation.

**Step 2: Run tests — verify no regressions**

```bash
npx vitest run --project=components src/components/accordion/accordion.test.ts --reporter=verbose
```

Expected: PASS (all existing tests)

**Step 3: Commit**

```bash
git add src/components/accordion/accordion-item.ts
git commit -m "fix: make _buildItemCtx a pure function, move expanded mutation to willUpdate"
```

---

### Task 4: Fix `accordion-header.ts` — remove unused `headingTags` array

**Files:**
- Modify: `src/components/accordion/accordion-header.ts`

**Why:** The `headingTags` array is declared but the switch statement renders templates directly without using the array's values. Remove it.

No new tests needed.

**Step 1: Remove the `headingTags` line and validate the level directly**

Replace `src/components/accordion/accordion-header.ts`:

```ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { accordionHeaderStyles } from './accordion.styles.js';

/**
 * Renders a semantic heading element wrapping the accordion trigger.
 *
 * @element grund-accordion-header
 * @slot - The accordion trigger element
 */
@customElement('grund-accordion-header')
export class GrundAccordionHeader extends LitElement {
  static override styles = accordionHeaderStyles;

  /** Heading level rendered in the Shadow DOM (1–6). Defaults to 3 (h3). */
  @property({ type: Number }) level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  override render() {
    switch (this.level) {
      case 1:
        return html`<h1 part="heading"><slot></slot></h1>`;
      case 2:
        return html`<h2 part="heading"><slot></slot></h2>`;
      case 4:
        return html`<h4 part="heading"><slot></slot></h4>`;
      case 5:
        return html`<h5 part="heading"><slot></slot></h5>`;
      case 6:
        return html`<h6 part="heading"><slot></slot></h6>`;
      default:
        return html`<h3 part="heading"><slot></slot></h3>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-header': GrundAccordionHeader;
  }
}
```

Note: `case 3` is removed since the `default` branch handles it — this eliminates duplication. Cases 1, 2, 4, 5, 6 are explicit; anything else (including 3 and invalid values) falls to `default: h3`.

**Step 2: Run tests**

```bash
npx vitest run --project=components src/components/accordion/accordion.test.ts --reporter=verbose
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/components/accordion/accordion-header.ts
git commit -m "fix: remove unused headingTags array from accordion-header, switch on level directly"
```

---

### Task 5: Wire up `value` property for initial expanded state

**Files:**
- Modify: `src/components/accordion/accordion.ts`
- Modify: `src/components/accordion/accordion.test.ts`

**Why:** `@property() value?: string | string[]` is declared but never read. Setting `<grund-accordion value="item-1">` currently does nothing. This should set the initial expanded item(s).

**Step 1: Write the failing tests first**

Add this `describe` block to `accordion.test.ts`, after the `events` describe block:

```ts
  describe('initial value', () => {
    it('expands the item matching the value attribute on first render', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion value="item-2">
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
          <grund-accordion-item value="item-2">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 2</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 2</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await elementUpdated(el);
      await new Promise((r) => setTimeout(r, 0));
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item2?.hasAttribute('expanded')).toBe(true);
    });

    it('expands multiple items when value is an array in multiple mode', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion type="multiple" .value=${['item-1', 'item-2']}>
          <grund-accordion-item value="item-1">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
          <grund-accordion-item value="item-2">
            <grund-accordion-header>
              <grund-accordion-trigger>Item 2</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 2</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await elementUpdated(el);
      await new Promise((r) => setTimeout(r, 0));
      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item1?.hasAttribute('expanded')).toBe(true);
      expect(item2?.hasAttribute('expanded')).toBe(true);
    });
  });
```

**Step 2: Run tests — verify the new tests fail**

```bash
npx vitest run --project=components src/components/accordion/accordion.test.ts --reporter=verbose
```

Expected: 2 new tests FAIL (value property is ignored)

**Step 3: Implement value wiring in `accordion.ts`**

Add `PropertyValues` import and update `willUpdate`:

```ts
import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { AccordionController } from './accordion.controller.js';
import { accordionContext, type AccordionContextValue } from '../../context/accordion.context.js';
import { accordionStyles } from './accordion.styles.js';

/**
 * Root accordion container. Manages expand/collapse state and provides
 * context to all descendant accordion elements.
 *
 * @element grund-accordion
 * @fires {CustomEvent<{value: string | string[], expanded: boolean}>} grund-accordion-change - Fired when an item is expanded or collapsed
 */
@customElement('grund-accordion')
export class GrundAccordion extends LitElement {
  static override styles = accordionStyles;

  /** Controls whether one or multiple items can be open simultaneously. */
  @property({ type: String }) type: 'single' | 'multiple' = 'single';

  /** Disables all items in the accordion. */
  @property({ type: Boolean }) disabled = false;

  /** In single mode, allows the open item to be closed by clicking it again. */
  @property({ type: Boolean }) collapsible = false;

  /**
   * The value(s) of the initially expanded item(s).
   * Use a string for single mode, or an array for multiple mode.
   * Changing this after initial render resets the expanded state.
   */
  @property() value?: string | string[];

  private controller = new AccordionController(this);

  @provide({ context: accordionContext })
  accordionCtx: AccordionContextValue = this._buildCtx();

  private _buildCtx(): AccordionContextValue {
    return {
      type: this.type,
      disabled: this.disabled,
      collapsible: this.collapsible,
      expandedItems: this.controller.expandedItems,
      toggle: (value: string) => {
        this.controller.updateOptions({ type: this.type, collapsible: this.collapsible });
        this.controller.toggle(value);
        this.dispatchEvent(
          new CustomEvent('grund-accordion-change', {
            detail: {
              value: this.type === 'single' ? value : [...this.controller.expandedItems],
              expanded: this.controller.isExpanded(value),
            },
            bubbles: true,
            composed: true,
          }),
        );
      },
    };
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('value') && this.value !== undefined) {
      const values = Array.isArray(this.value) ? this.value : [this.value];
      this.controller.expandedItems = new Set(values);
    }
    this.controller.updateOptions({ type: this.type, collapsible: this.collapsible });
    this.accordionCtx = this._buildCtx();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion': GrundAccordion;
  }
}
```

**Step 4: Run tests — verify all pass**

```bash
npx vitest run --project=components src/components/accordion/accordion.test.ts --reporter=verbose
```

Expected: All tests PASS including the 2 new ones

**Step 5: Commit**

```bash
git add src/components/accordion/accordion.ts src/components/accordion/accordion.test.ts
git commit -m "feat: wire up value property for initial expanded state on grund-accordion"
```

---

### Task 6: Wire up `setDisabledItems` in the controller

**Files:**
- Modify: `src/components/accordion/accordion.ts`

**Why:** `AccordionController.setDisabledItems()` exists and is tested but is never called — the disabled guard in `toggle()` is unreachable dead code. Wire it up so the controller always has an accurate picture of disabled items, providing defense-in-depth against direct `toggle()` calls.

No new tests needed — the controller test already covers this path.

**Step 1: Update `willUpdate` in `accordion.ts` to sync disabled items**

In the `willUpdate` method added in Task 5, add the sync before `updateOptions`:

```ts
  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('value') && this.value !== undefined) {
      const values = Array.isArray(this.value) ? this.value : [this.value];
      this.controller.expandedItems = new Set(values);
    }

    // Sync disabled items from slotted accordion-item elements to the controller
    const disabledValues = new Set<string>();
    this.querySelectorAll('grund-accordion-item').forEach((item) => {
      if (item.hasAttribute('disabled')) {
        const value = item.getAttribute('value');
        if (value) disabledValues.add(value);
      }
    });
    this.controller.setDisabledItems(disabledValues);

    this.controller.updateOptions({ type: this.type, collapsible: this.collapsible });
    this.accordionCtx = this._buildCtx();
  }
```

**Step 2: Run tests**

```bash
npx vitest run --project=components src/components/accordion/accordion.test.ts --reporter=verbose
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/components/accordion/accordion.ts
git commit -m "fix: wire up controller.setDisabledItems() from accordion willUpdate"
```

---

### Task 7: Fix build pipeline — eliminate `emptyOutDir: false`

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json` (build script)

**Why:** `emptyOutDir: false` was added to prevent Vite from deleting `.d.ts` files placed by `tsc`. But this leaves stale artifacts in `dist/` when files are deleted. The fix: run Vite first (which cleans and builds JS), then run `tsc --emitDeclarationOnly` to add declarations after.

No tests needed — verify the build output.

**Step 1: Remove `emptyOutDir: false` from `vite.config.ts`**

Replace `vite.config.ts`:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        accordion: 'src/components/accordion/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js', '@lit/context'],
    },
    target: 'es2021',
    outDir: 'dist',
  },
});
```

**Step 2: Update the build script in `package.json`**

Change:
```json
"build": "tsc && vite build",
```
To:
```json
"build": "vite build && tsc --emitDeclarationOnly --declarationMap",
```

`--emitDeclarationOnly` skips JS output (Vite handles that). `--declarationMap` preserves source maps for `.d.ts` files.

**Step 3: Test the build**

```bash
npm run build
```

Expected: `dist/` contains both `.js` files (from Vite) and `.d.ts` files (from tsc). No stale files.

Verify key files exist:
```bash
ls dist/index.js dist/accordion.js dist/index.d.ts
```

**Step 4: Commit**

```bash
git add vite.config.ts package.json
git commit -m "fix: run vite build before tsc so emptyOutDir cleans stale artifacts correctly"
```

---

### Task 8: Fix ESLint — add stories scope and eslint-plugin-storybook

**Files:**
- Modify: `eslint.config.js`
- Modify: `package.json` (lint script)

**Why:** Story files in `stories/` are not currently linted, and `eslint-plugin-storybook` is installed but unconfigured.

No tests needed — verify lint runs on stories.

**Step 1: Update `eslint.config.js`**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import litPlugin from 'eslint-plugin-lit';
import storybookPlugin from 'eslint-plugin-storybook';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  litPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['stories/**/*.ts'],
    plugins: { storybook: storybookPlugin },
    rules: {
      ...storybookPlugin.configs.recommended.rules,
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'storybook-static/'],
  },
];
```

Key changes:
- Added `storybookPlugin` import and config for `stories/**/*.ts`
- Removed `*.config.*` from ignores (config files should be linted too)

**Step 2: Update lint script in `package.json` to include stories**

Change:
```json
"lint": "eslint src/",
```
To:
```json
"lint": "eslint src/ stories/",
```

**Step 3: Run lint to verify it works**

```bash
npm run lint
```

Expected: No errors (or only expected storybook-rule warnings)

**Step 4: Commit**

```bash
git add eslint.config.js package.json
git commit -m "fix: add eslint-plugin-storybook config and include stories/ in lint scope"
```

---

### Task 9: Create `RovingFocusController` — extract keyboard navigation

**Files:**
- Create: `src/controllers/roving-focus.controller.ts`
- Modify: `src/components/accordion/accordion-trigger.ts`

**Why:** The `focusSibling` method in `accordion-trigger.ts` implements roving focus — a pattern also needed by Tabs, Menu, RadioGroup, and Listbox. Extract it now before adding more components to prevent duplication.

**Step 1: Create the controller**

Create `src/controllers/roving-focus.controller.ts`:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Direction to move focus within a roving focus group. */
export type FocusDirection = 'next' | 'previous' | 'first' | 'last';

/**
 * Manages keyboard-driven focus movement within a container element.
 * Implements the roving focus pattern used by WAI-ARIA composites like
 * Accordion, Tabs, Menu, RadioGroup, and Listbox.
 *
 * @example
 * ```ts
 * class MyTrigger extends LitElement {
 *   rovingFocus = new RovingFocusController(this, {
 *     containerSelector: 'my-component',
 *     itemSelector: 'my-trigger',
 *     getFocusTarget: (el) => el.shadowRoot?.querySelector('button') ?? null,
 *     isDisabled: (el) => el.hasAttribute('disabled'),
 *   });
 * }
 * ```
 */
export class RovingFocusController implements ReactiveController {
  private host: ReactiveControllerHost & Element;
  private options: RovingFocusOptions;

  constructor(host: ReactiveControllerHost & Element, options: RovingFocusOptions) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  hostConnected() {}

  /**
   * Moves focus to the target item in the given direction within the container.
   * Disabled items are skipped. Navigation wraps at both ends.
   */
  moveFocus(direction: FocusDirection): void {
    const container = this.host.closest(this.options.containerSelector);
    if (!container) return;

    const allItems = Array.from(
      container.querySelectorAll(this.options.itemSelector),
    ) as Element[];

    const enabledItems = allItems.filter((item) => !this.options.isDisabled(item));
    if (enabledItems.length === 0) return;

    const currentIndex = enabledItems.indexOf(this.host);
    const target = this._resolveTarget(enabledItems, currentIndex, direction);
    this.options.getFocusTarget(target)?.focus();
  }

  private _resolveTarget(items: Element[], currentIndex: number, direction: FocusDirection): Element {
    const len = items.length;
    switch (direction) {
      case 'next':
        return items[(currentIndex + 1) % len];
      case 'previous':
        return items[(currentIndex - 1 + len) % len];
      case 'first':
        return items[0];
      case 'last':
        return items[len - 1];
    }
  }
}

/** Configuration for a roving focus group. */
export interface RovingFocusOptions {
  /** CSS selector for the container element that owns this focus group. */
  containerSelector: string;
  /** CSS selector for individual focusable items within the container. */
  itemSelector: string;
  /** Returns the actual focusable element within an item (e.g. a shadow root button). */
  getFocusTarget: (item: Element) => HTMLElement | null;
  /** Returns true if the item should be skipped during keyboard navigation. */
  isDisabled: (item: Element) => boolean;
}
```

**Step 2: Refactor `accordion-trigger.ts` to use the controller**

Replace `accordion-trigger.ts`:

```ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import {
  accordionContext,
  accordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from '../../context/accordion.context.js';
import { Keys } from '../../utils/keyboard.js';
import { RovingFocusController } from '../../controllers/roving-focus.controller.js';
import { accordionTriggerStyles } from './accordion.styles.js';

/**
 * Interactive trigger button for an accordion item.
 * Renders a `<button>` in the Shadow DOM and manages
 * `aria-expanded`, `aria-controls`, and keyboard navigation.
 *
 * @element grund-accordion-trigger
 * @slot - The trigger label content
 */
@customElement('grund-accordion-trigger')
export class GrundAccordionTrigger extends LitElement {
  static override styles = accordionTriggerStyles;

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  // Public so RovingFocusController can read disabled state across sibling instances
  @consume({ context: accordionItemContext, subscribe: true })
  _itemCtx?: AccordionItemContextValue;

  private rovingFocus = new RovingFocusController(this, {
    containerSelector: 'grund-accordion',
    itemSelector: 'grund-accordion-trigger',
    getFocusTarget: (el) =>
      (el as GrundAccordionTrigger).shadowRoot?.querySelector('button') ?? null,
    isDisabled: (el) => (el as GrundAccordionTrigger)._itemCtx?.disabled ?? false,
  });

  private handleClick() {
    if (this._itemCtx?.disabled) return;
    this.accordionCtx?.toggle(this._itemCtx?.value ?? '');
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this._itemCtx?.disabled) return;

    switch (e.key) {
      case Keys.ARROW_DOWN:
        e.preventDefault();
        this.rovingFocus.moveFocus('next');
        break;
      case Keys.ARROW_UP:
        e.preventDefault();
        this.rovingFocus.moveFocus('previous');
        break;
      case Keys.HOME:
        e.preventDefault();
        this.rovingFocus.moveFocus('first');
        break;
      case Keys.END:
        e.preventDefault();
        this.rovingFocus.moveFocus('last');
        break;
    }
  }

  override render() {
    const expanded = this._itemCtx?.expanded ?? false;
    const disabled = this._itemCtx?.disabled ?? false;

    return html`
      <button
        part="trigger"
        id=${this._itemCtx?.triggerId ?? ''}
        aria-expanded=${expanded}
        aria-controls=${this._itemCtx?.panelId ?? ''}
        ?disabled=${disabled}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-trigger': GrundAccordionTrigger;
  }
}
```

**Step 3: Run full test suite**

```bash
npx vitest run --project=components --reporter=verbose
```

Expected: All tests PASS (keyboard navigation tests should still pass through the controller)

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add src/controllers/ src/components/accordion/accordion-trigger.ts
git commit -m "refactor: extract RovingFocusController from accordion-trigger for reuse across components"
```

---

### Task 10: Extract `flush()` test utility

**Files:**
- Create: `src/test-utils/index.ts`
- Modify: `src/components/accordion/accordion.test.ts`

**Why:** `await new Promise((r) => setTimeout(r, 0))` appears 8+ times in `accordion.test.ts` — it's a workaround for Lit's async context propagation. Extract it into a named utility so the intent is clear and the pattern is reusable for future component tests.

**Step 1: Create `src/test-utils/index.ts`**

```ts
import { elementUpdated } from '@open-wc/testing-helpers/pure';

/**
 * Flushes Lit's async update queue and allows microtasks to settle.
 * Use after triggering state changes (clicks, property mutations) to
 * ensure Lit re-renders and context propagates before asserting.
 *
 * @param el - The root element to wait on. Child elements are also awaited.
 */
export async function flush(el: Element): Promise<void> {
  await elementUpdated(el);
  const children = el.querySelectorAll(
    'grund-accordion-item, grund-accordion-trigger, grund-accordion-panel',
  );
  for (const child of children) {
    await elementUpdated(child);
  }
  await new Promise<void>((r) => setTimeout(r, 0));
}
```

**Step 2: Update `accordion.test.ts` to use `flush`**

- Replace the import of `elementUpdated` from `@open-wc/testing-helpers/pure` with an import of `flush` from `../../test-utils/index.js`
- Replace all occurrences of the inline `waitForUpdate` function with `flush`
- Replace all `await new Promise((r) => setTimeout(r, 0))` calls with `await flush(el)` (where `el` is the root accordion element in scope)

The `createAccordion` function becomes:

```ts
async function createAccordion() {
  const el = await fixture<GrundAccordion>(html`...`);
  await flush(el);
  return el;
}
```

Remove the `waitForUpdate` helper function entirely since `flush` replaces it.

**Step 3: Run tests**

```bash
npx vitest run --project=components src/components/accordion/accordion.test.ts --reporter=verbose
```

Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/test-utils/ src/components/accordion/accordion.test.ts
git commit -m "refactor: extract flush() test utility, replace inline setTimeout pattern in tests"
```

---

### Task 11: Add missing integration tests

**Files:**
- Modify: `src/components/accordion/accordion.test.ts`

**Why:** Two important user-facing behaviors are untested:
1. Non-collapsible single mode: clicking the open trigger again should keep it open
2. Dynamic `type`/`collapsible` property changes should take effect immediately

**Step 1: Add tests to `accordion.test.ts`**

Add to the existing `expand/collapse` describe block:

```ts
    it('keeps the item expanded when non-collapsible trigger is clicked again', async () => {
      const el = await createAccordion(); // default: collapsible=false
      getTriggerButton(el, 0)?.click();
      await flush(el);
      // Click again — should NOT collapse
      getTriggerButton(el, 0)?.click();
      await flush(el);
      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item?.hasAttribute('expanded')).toBe(true);
    });
```

Add a new `dynamic properties` describe block after `events`:

```ts
  describe('dynamic properties', () => {
    it('switches from single to multiple mode at runtime', async () => {
      const el = await createAccordion();
      // Open first item in single mode
      getTriggerButton(el, 0)?.click();
      await flush(el);
      // Switch to multiple mode
      el.type = 'multiple';
      await flush(el);
      // Now both items can be open
      getTriggerButton(el, 1)?.click();
      await flush(el);
      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item1?.hasAttribute('expanded')).toBe(true);
      expect(item2?.hasAttribute('expanded')).toBe(true);
    });

    it('enables collapsing when collapsible changes to true at runtime', async () => {
      const el = await createAccordion(); // collapsible=false by default
      getTriggerButton(el, 0)?.click();
      await flush(el);
      // Enable collapsible at runtime
      el.collapsible = true;
      await flush(el);
      // Should now be collapsible
      getTriggerButton(el, 0)?.click();
      await flush(el);
      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item?.hasAttribute('expanded')).toBe(false);
    });
  });
```

**Step 2: Run tests — verify new tests fail before they should pass**

```bash
npx vitest run --project=components src/components/accordion/accordion.test.ts --reporter=verbose
```

Note: The `non-collapsible re-click` test should already pass (the behavior exists). The `dynamic properties` tests may or may not pass — if they do, the implementation is already correct.

**Step 3: Verify all tests pass**

```bash
npx vitest run --project=components src/components/accordion/accordion.test.ts --reporter=verbose
```

Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/components/accordion/accordion.test.ts
git commit -m "test: add missing tests for non-collapsible re-click and dynamic type/collapsible changes"
```

---

### Task 12: Add JSDoc to all public APIs

**Files:**
- Modify: `src/context/accordion.context.ts`
- Modify: `src/components/accordion/accordion.controller.ts`
- Modify: `src/components/accordion/accordion.ts` (already partially done in Task 5)
- Modify: `src/components/accordion/accordion-item.ts`
- Modify: `src/components/accordion/accordion-trigger.ts` (already partially done in Task 9)
- Modify: `src/components/accordion/accordion-header.ts` (already done in Task 4)
- Modify: `src/components/accordion/accordion-panel.ts`

**Why:** For a published library, JSDoc flows into the Custom Elements Manifest (CEM) and Storybook autodocs. Properties need descriptions so consumers understand what they do.

**Step 1: Update `accordion.context.ts`**

```ts
import { createContext } from '@lit/context';

/** State and actions provided by `<grund-accordion>` to all descendant elements. */
export interface AccordionContextValue {
  /** Whether one or multiple items can be open at a time. */
  type: 'single' | 'multiple';
  /** Whether all items in the accordion are disabled. */
  disabled: boolean;
  /** Whether the open item can be collapsed by clicking it again (single mode only). */
  collapsible: boolean;
  /** The set of currently expanded item values. */
  expandedItems: Set<string>;
  /** Toggles the expanded state of the item with the given value. */
  toggle: (value: string) => void;
}

/** @internal */
export const accordionContext = createContext<AccordionContextValue>('grund-accordion');

/** Per-item state provided by `<grund-accordion-item>` to its trigger and panel children. */
export interface AccordionItemContextValue {
  /** The unique value identifying this item within the accordion. */
  value: string;
  /** Whether this item is disabled (either directly or via parent accordion). */
  disabled: boolean;
  /** Whether this item is currently expanded. */
  expanded: boolean;
  /** DOM ID for the trigger button — used by the panel's `aria-labelledby`. */
  triggerId: string;
  /** DOM ID for the panel region — used by the trigger's `aria-controls`. */
  panelId: string;
}

/** @internal */
export const accordionItemContext = createContext<AccordionItemContextValue>('grund-accordion-item');
```

**Step 2: Update `accordion.controller.ts`**

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Options for configuring an `AccordionController`. */
export interface AccordionControllerOptions {
  /** Whether one or multiple items can be expanded at once. Defaults to `'single'`. */
  type?: 'single' | 'multiple';
  /** Whether the open item can be collapsed in single mode. Defaults to `false`. */
  collapsible?: boolean;
}

/**
 * Manages accordion expand/collapse state as a Lit Reactive Controller.
 * Handles single/multiple mode, collapsible behavior, and disabled item protection.
 *
 * Intended to be used internally by `<grund-accordion>`. May be exposed as a
 * public API in a future version for advanced customization.
 */
export class AccordionController implements ReactiveController {
  private host: ReactiveControllerHost;
  private type: 'single' | 'multiple';
  private collapsible: boolean;
  private disabledItems = new Set<string>();

  /** The set of currently expanded item values. */
  expandedItems = new Set<string>();

  constructor(host: ReactiveControllerHost, options: AccordionControllerOptions = {}) {
    this.host = host;
    this.type = options.type ?? 'single';
    this.collapsible = options.collapsible ?? false;
    this.host.addController(this);
  }

  hostConnected() {}

  /** Updates the controller's mode options without resetting expanded state. */
  updateOptions(options: AccordionControllerOptions) {
    if (options.type !== undefined) this.type = options.type;
    if (options.collapsible !== undefined) this.collapsible = options.collapsible;
  }

  /** Replaces the set of item values that cannot be toggled. */
  setDisabledItems(disabled: Set<string>) {
    this.disabledItems = disabled;
  }

  /**
   * Toggles the expanded state of the item with the given value.
   * Respects the current `type`, `collapsible`, and `disabledItems` settings.
   */
  toggle(value: string) {
    if (this.disabledItems.has(value)) return;

    if (this.type === 'single') {
      if (this.expandedItems.has(value)) {
        if (this.collapsible) {
          this.expandedItems.delete(value);
        }
      } else {
        this.expandedItems.clear();
        this.expandedItems.add(value);
      }
    } else {
      if (this.expandedItems.has(value)) {
        this.expandedItems.delete(value);
      } else {
        this.expandedItems.add(value);
      }
    }

    this.host.requestUpdate();
  }

  /** Returns `true` if the item with the given value is currently expanded. */
  isExpanded(value: string): boolean {
    return this.expandedItems.has(value);
  }
}
```

**Step 3: Update `accordion-item.ts`**

Add JSDoc above `@customElement` and to each `@property`:

```ts
/**
 * A single item within an accordion. Groups a header/trigger with its panel
 * and provides per-item context (value, disabled, expanded, IDs) to children.
 *
 * @element grund-accordion-item
 * @slot - The accordion header and panel
 */
@customElement('grund-accordion-item')
export class GrundAccordionItem extends LitElement {
  // ...

  /** Unique value identifying this item. Auto-generated if not provided. */
  @property() value: string = generateId('accordion-item');

  /** Disables this item, preventing it from being expanded or collapsed. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Reflects the current expanded state as an HTML attribute for CSS selectors. */
  @property({ type: Boolean, reflect: true }) expanded = false;
```

**Step 4: Update `accordion-panel.ts`**

```ts
/**
 * The collapsible content region of an accordion item.
 * Manages `hidden`, `role="region"`, and `aria-labelledby`.
 *
 * @element grund-accordion-panel
 * @slot - The panel content
 */
@customElement('grund-accordion-panel')
export class GrundAccordionPanel extends LitElement {
```

**Step 5: Run tests and TypeScript check**

```bash
npx vitest run --project=components --reporter=verbose
npx tsc --noEmit
```

Expected: All tests PASS, no TypeScript errors

**Step 6: Regenerate Custom Elements Manifest**

```bash
npm run analyze
```

**Step 7: Commit**

```bash
git add src/ custom-elements.json
git commit -m "docs: add JSDoc to all public classes, properties, methods, and context interfaces"
```

---

### Task 13: Final verification

**No file changes — verification only.**

**Step 1: Run full lint**

```bash
npm run lint
```

Expected: No errors

**Step 2: Run full test suite**

```bash
npm run test:run -- --project=components
```

Expected: All tests pass

**Step 3: Run production build**

```bash
npm run build
```

Expected: Clean build, no errors

**Step 4: Print commit history**

```bash
git log --oneline
```

Expected: Clean history of atomic commits from this plan + prior work.
