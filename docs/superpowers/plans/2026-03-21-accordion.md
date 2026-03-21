# Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the accordion compound component with keyboard navigation, controlled/uncontrolled modes, and full ARIA support.

**Architecture:** Bottom-up build — shared `RovingFocusController` first, then accordion-local controller/registry/context, then elements from root to leaf. Each layer is independently testable before wiring into the next.

**Tech Stack:** Lit 3.3, @lit/context 1.1, Vitest 4.1 + Playwright browser mode, Storybook 10.2

**Spec:** `docs/superpowers/specs/2026-03-21-accordion-design.md`

---

## File Map

| File | Responsibility |
|---|---|
| `src/test-utils/index.ts` | Shared test helpers: `flush`, `simulateKeyboard`, `getByPart`, `expectAriaRelationship`, `expectDataState` |
| `src/controllers/roving-focus.controller.ts` | Shared roving tabindex keyboard navigation controller |
| `src/components/accordion/types.ts` | Public types: event details, host snapshot |
| `src/components/accordion/context/accordion.context.ts` | Context interfaces, context keys, `createRootContextValue`, `createItemContextValue` |
| `src/components/accordion/registry/accordion.registry.ts` | Ordered item tracking, trigger↔panel linking |
| `src/components/accordion/controller/accordion.controller.ts` | Pure state + action resolution |
| `src/components/accordion/root/accordion.element.ts` | Root element — provider, controller owner |
| `src/components/accordion/item/accordion-item.element.ts` | Item element — bridges root↔leaf context |
| `src/components/accordion/header/accordion-header.element.ts` | Heading wrapper with `role="heading"` + `aria-level` |
| `src/components/accordion/trigger/accordion-trigger.element.ts` | Button that toggles the panel |
| `src/components/accordion/panel/accordion-panel.element.ts` | Collapsible content region |
| `src/components/accordion/index.ts` | Barrel export |
| `src/index.ts` | Library barrel export |

---

## Task 1: Test Utilities

**Files:**
- Create: `src/test-utils/index.ts`
- Create: `src/test-utils/test-utils.test.ts`

- [ ] **Step 1: Create `flush` utility**

```ts
// src/test-utils/index.ts
import { aTimeout } from '@open-wc/testing';

/**
 * Settles async context propagation across multiple Lit render cycles.
 * Call after any state change that should propagate through @provide/@consume.
 */
export async function flush(el: Element): Promise<void> {
  // Context updates need multiple Lit update cycles to propagate
  for (let i = 0; i < 3; i++) {
    await (el as any).updateComplete;
    await aTimeout(0);
  }
}
```

- [ ] **Step 2: Add `simulateKeyboard` utility**

```ts
/**
 * Dispatches a KeyboardEvent on an element.
 */
export function simulateKeyboard(
  el: Element,
  key: string,
  options?: Partial<KeyboardEventInit>,
): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      code: key,
      bubbles: true,
      composed: true,
      cancelable: true,
      ...options,
    }),
  );
}
```

- [ ] **Step 3: Add `getByPart` utility**

```ts
/**
 * Queries the shadow root of an element for a matching CSS part.
 */
export function getByPart<T extends Element = HTMLElement>(
  el: Element,
  partName: string,
): T {
  const result = el.shadowRoot?.querySelector(`[part="${partName}"]`);
  if (!result) {
    throw new Error(`No element with part="${partName}" found in ${el.tagName}`);
  }
  return result as T;
}
```

- [ ] **Step 4: Add `expectAriaRelationship` and `expectDataState` utilities**

```ts
import { expect } from '@open-wc/testing';

/**
 * Asserts an ARIA relationship between two elements.
 */
export function expectAriaRelationship(
  source: Element,
  target: Element,
  type: 'controls' | 'labelledby',
): void {
  const attr = type === 'controls' ? 'aria-controls' : 'aria-labelledby';
  expect(source.getAttribute(attr)).to.equal(target.id);
}

/**
 * Asserts the data-state attribute value.
 */
export function expectDataState(
  el: Element,
  state: 'open' | 'closed',
): void {
  expect((el as HTMLElement).dataset.state).to.equal(state);
}
```

- [ ] **Step 5: Write a smoke test for flush**

```ts
// src/test-utils/test-utils.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { LitElement } from 'lit';
import { flush, simulateKeyboard, getByPart } from './index.js';

class TestElement extends LitElement {
  override render() {
    return html`<button part="btn">click</button>`;
  }
}
if (!customElements.get('test-flush-element')) {
  customElements.define('test-flush-element', TestElement);
}

describe('test-utils', () => {
  it('flush resolves without error', async () => {
    const el = await fixture(html`<test-flush-element></test-flush-element>`);
    await flush(el);
  });

  it('getByPart finds a part in shadow DOM', async () => {
    const el = await fixture(html`<test-flush-element></test-flush-element>`);
    const btn = getByPart(el, 'btn');
    expect(btn.textContent).to.equal('click');
  });

  it('getByPart throws when part is missing', async () => {
    const el = await fixture(html`<test-flush-element></test-flush-element>`);
    expect(() => getByPart(el, 'nonexistent')).to.throw();
  });

  it('simulateKeyboard dispatches a keydown event', async () => {
    const el = await fixture(html`<div></div>`);
    let received = '';
    el.addEventListener('keydown', (e: Event) => {
      received = (e as KeyboardEvent).key;
    });
    simulateKeyboard(el, 'ArrowDown');
    expect(received).to.equal('ArrowDown');
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run --project=components src/test-utils/test-utils.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/test-utils/
git commit -m "feat: add shared test utilities (flush, simulateKeyboard, getByPart, expectAriaRelationship, expectDataState)"
```

---

## Task 2: RovingFocusController

**Files:**
- Create: `src/controllers/roving-focus.controller.ts`
- Create: `src/controllers/roving-focus.controller.test.ts`

- [ ] **Step 1: Write failing tests for basic arrow key navigation**

```ts
// src/controllers/roving-focus.controller.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { LitElement } from 'lit';
import { simulateKeyboard } from '../test-utils/index.js';
import { RovingFocusController } from './roving-focus.controller.js';

class TestHost extends LitElement {
  controller!: RovingFocusController;

  override connectedCallback() {
    super.connectedCallback();
    this.controller = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () => Array.from(this.querySelectorAll('button')),
    });
  }

  override render() {
    return html`<slot></slot>`;
  }
}
if (!customElements.get('test-roving-host')) {
  customElements.define('test-roving-host', TestHost);
}

describe('RovingFocusController', () => {
  async function setup(opts?: { orientation?: 'vertical' | 'horizontal'; loop?: boolean; disabledIndex?: number }) {
    const el = await fixture<TestHost>(html`
      <test-roving-host>
        <button>One</button>
        <button>Two</button>
        <button>Three</button>
      </test-roving-host>
    `);
    if (opts?.orientation || opts?.loop !== undefined) {
      el.controller.update({ orientation: opts.orientation, loop: opts.loop });
    }
    if (opts?.disabledIndex !== undefined) {
      const btns = el.querySelectorAll('button');
      btns[opts.disabledIndex].dataset.disabled = '';
    }
    const buttons = Array.from(el.querySelectorAll('button'));
    return { el, buttons };
  }

  it('sets first item to tabIndex=0, rest to -1', async () => {
    const { buttons } = await setup();
    expect(buttons[0].tabIndex).to.equal(0);
    expect(buttons[1].tabIndex).to.equal(-1);
    expect(buttons[2].tabIndex).to.equal(-1);
  });

  it('ArrowDown moves focus to next item (vertical)', async () => {
    const { el, buttons } = await setup();
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[1]);
    expect(buttons[1].tabIndex).to.equal(0);
    expect(buttons[0].tabIndex).to.equal(-1);
  });

  it('ArrowUp moves focus to previous item (vertical)', async () => {
    const { el, buttons } = await setup();
    buttons[1].focus();
    // Need to sync tabindex state
    el.controller.update({});
    simulateKeyboard(el, 'ArrowUp');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('Home moves focus to first item', async () => {
    const { el, buttons } = await setup();
    buttons[2].focus();
    simulateKeyboard(el, 'Home');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('End moves focus to last item', async () => {
    const { el, buttons } = await setup();
    buttons[0].focus();
    simulateKeyboard(el, 'End');
    expect(document.activeElement).to.equal(buttons[2]);
  });

  it('loops from last to first when loop=true', async () => {
    const { el, buttons } = await setup({ loop: true });
    buttons[2].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('does not loop when loop=false', async () => {
    const { el, buttons } = await setup({ loop: false });
    buttons[2].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[2]);
  });

  it('skips disabled items', async () => {
    const { el, buttons } = await setup({ disabledIndex: 1 });
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[2]);
  });

  it('uses ArrowLeft/ArrowRight for horizontal orientation', async () => {
    const { el, buttons } = await setup({ orientation: 'horizontal' });
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowRight');
    expect(document.activeElement).to.equal(buttons[1]);
  });

  it('ignores ArrowDown/ArrowUp in horizontal orientation', async () => {
    const { el, buttons } = await setup({ orientation: 'horizontal' });
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('reverses ArrowLeft/ArrowRight in RTL for horizontal orientation', async () => {
    const wrapper = document.createElement('div');
    wrapper.dir = 'rtl';
    document.body.appendChild(wrapper);
    const { el, buttons } = await setup({ orientation: 'horizontal' });
    wrapper.appendChild(el);
    buttons[0].focus();
    // In RTL, ArrowLeft = next (visually right-to-left, so "left" moves forward)
    simulateKeyboard(el, 'ArrowLeft');
    expect(document.activeElement).to.equal(buttons[1]);
    wrapper.remove();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --project=components src/controllers/roving-focus.controller.test.ts`
Expected: FAIL — `RovingFocusController` not found

- [ ] **Step 3: Implement RovingFocusController**

```ts
// src/controllers/roving-focus.controller.ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface RovingFocusOptions {
  orientation: 'vertical' | 'horizontal';
  loop: boolean;
  getItems: () => HTMLElement[];
}

/**
 * Keyboard-driven roving tabindex for composite widgets.
 * Arrow keys move focus within the widget. Tab exits.
 * @internal
 */
export class RovingFocusController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private options: RovingFocusOptions;
  private handleKeydown = this.onKeydown.bind(this);

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: RovingFocusOptions,
  ) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostConnected(): void {
    this.host.addEventListener('keydown', this.handleKeydown);
    this.syncTabIndexes();
  }

  hostDisconnected(): void {
    this.host.removeEventListener('keydown', this.handleKeydown);
  }

  update(options: Partial<RovingFocusOptions>): void {
    Object.assign(this.options, options);
  }

  private syncTabIndexes(): void {
    const items = this.options.getItems();
    if (items.length === 0) return;

    // Find current roving item or default to first non-disabled
    const currentIndex = items.findIndex((item) => item.tabIndex === 0);
    const activeIndex =
      currentIndex >= 0
        ? currentIndex
        : items.findIndex((item) => !this.isDisabled(item));

    items.forEach((item, i) => {
      item.tabIndex = i === activeIndex ? 0 : -1;
    });
  }

  private onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    const items = this.options.getItems().filter((item) => !this.isDisabled(item));
    if (items.length === 0) return;

    const { key } = e;
    const { orientation, loop } = this.options;
    const isRtl =
      getComputedStyle(this.host).direction === 'rtl';

    let direction: 'next' | 'prev' | 'first' | 'last' | null = null;

    if (orientation === 'vertical') {
      if (key === 'ArrowDown') direction = 'next';
      else if (key === 'ArrowUp') direction = 'prev';
    } else {
      if (key === 'ArrowRight') direction = isRtl ? 'prev' : 'next';
      else if (key === 'ArrowLeft') direction = isRtl ? 'next' : 'prev';
    }

    if (key === 'Home') direction = 'first';
    else if (key === 'End') direction = 'last';

    if (!direction) return;

    e.preventDefault();

    const currentFocused = items.find(
      (item) => item === document.activeElement || item === e.composedPath()[0],
    );
    const currentIndex = currentFocused ? items.indexOf(currentFocused) : -1;

    let nextIndex: number;
    switch (direction) {
      case 'next':
        nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) nextIndex = loop ? 0 : items.length - 1;
        break;
      case 'prev':
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) nextIndex = loop ? items.length - 1 : 0;
        break;
      case 'first':
        nextIndex = 0;
        break;
      case 'last':
        nextIndex = items.length - 1;
        break;
    }

    const target = items[nextIndex];
    if (target) {
      // Update tabindexes across all items (including disabled ones for proper tabindex state)
      const allItems = this.options.getItems();
      allItems.forEach((item) => {
        item.tabIndex = item === target ? 0 : -1;
      });
      target.focus();
    }
  }

  private isDisabled(item: HTMLElement): boolean {
    return item.hasAttribute('data-disabled') || item.ariaDisabled === 'true';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project=components src/controllers/roving-focus.controller.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/controllers/
git commit -m "feat: add RovingFocusController for composite widget keyboard navigation"
```

---

## Task 3: Accordion Types + Context

**Files:**
- Create: `src/components/accordion/types.ts`
- Create: `src/components/accordion/context/accordion.context.ts`

- [ ] **Step 1: Create types**

```ts
// src/components/accordion/types.ts

/** Detail for `grund-value-change` event on the root element. */
export interface AccordionValueChangeDetail {
  value: string[];
  itemValue: string;
  open: boolean;
}

/** Detail for `grund-open-change` event on an item element. */
export interface AccordionOpenChangeDetail {
  open: boolean;
  value: string;
  index: number;
}

/** Snapshot of host properties passed to AccordionController.syncFromHost(). */
export interface AccordionHostSnapshot {
  value: string[] | undefined;
  defaultValue: string[] | undefined;
  multiple: boolean;
  disabled: boolean;
}
```

- [ ] **Step 2: Create context interfaces and keys**

```ts
// src/components/accordion/context/accordion.context.ts
import { createContext } from '@lit/context';

export interface AccordionRootContext {
  isExpanded: (value: string) => boolean;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  keepMounted: boolean;
  hiddenUntilFound: boolean;
  requestToggle: (itemValue: string, itemDisabled: boolean) => void;
  registerItem: (item: HTMLElement, value: string) => void;
  unregisterItem: (item: HTMLElement) => void;
}

export interface AccordionItemContext {
  value: string;
  index: number;
  expanded: boolean;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  keepMounted: boolean;
  hiddenUntilFound: boolean;
  triggerId: string;
  panelId: string;
  toggle: () => void;
  attachTrigger: (el: HTMLElement) => void;
  detachTrigger: (el: HTMLElement) => void;
  attachPanel: (el: HTMLElement) => void;
  detachPanel: (el: HTMLElement) => void;
}

export const accordionRootContext =
  createContext<AccordionRootContext>('accordion-root');

export const accordionItemContext =
  createContext<AccordionItemContext>('accordion-item');
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit --project tsconfig.json`
Expected: No errors (or only pre-existing errors from empty `src/index.ts`)

- [ ] **Step 4: Commit**

```bash
git add src/components/accordion/types.ts src/components/accordion/context/
git commit -m "feat: add accordion types and context interfaces"
```

---

## Task 4: AccordionRegistry

**Files:**
- Create: `src/components/accordion/registry/accordion.registry.ts`
- Create: `src/components/accordion/registry/accordion.registry.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/components/accordion/registry/accordion.registry.test.ts
import { expect } from '@open-wc/testing';
import { AccordionRegistry } from './accordion.registry.js';

describe('AccordionRegistry', () => {
  function makeEl(id: string): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  afterEach(() => {
    document.body.querySelectorAll('div[id]').forEach((el) => el.remove());
  });

  it('registers and retrieves items', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    registry.registerItem(item, 'a');
    expect(registry.items).to.have.length(1);
    expect(registry.items[0].value).to.equal('a');
  });

  it('maintains DOM order', () => {
    const registry = new AccordionRegistry();
    const item1 = makeEl('item-1');
    const item2 = makeEl('item-2');
    // Register in reverse order
    registry.registerItem(item2, 'second');
    registry.registerItem(item1, 'first');
    expect(registry.items[0].value).to.equal('first');
    expect(registry.items[1].value).to.equal('second');
  });

  it('unregisters items', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    registry.registerItem(item, 'a');
    registry.unregisterItem(item);
    expect(registry.items).to.have.length(0);
  });

  it('attaches and detaches trigger', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    const trigger = makeEl('trigger-a');
    registry.registerItem(item, 'a');
    registry.attachTrigger(item, trigger);
    expect(registry.getRecord(item)?.trigger).to.equal(trigger);
    registry.detachTrigger(item);
    expect(registry.getRecord(item)?.trigger).to.be.null;
  });

  it('attaches and detaches panel', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    const panel = makeEl('panel-a');
    registry.registerItem(item, 'a');
    registry.attachPanel(item, panel);
    expect(registry.getRecord(item)?.panel).to.equal(panel);
    registry.detachPanel(item);
    expect(registry.getRecord(item)?.panel).to.be.null;
  });

  it('indexOf returns correct position', () => {
    const registry = new AccordionRegistry();
    const item1 = makeEl('item-1');
    const item2 = makeEl('item-2');
    registry.registerItem(item1, 'first');
    registry.registerItem(item2, 'second');
    expect(registry.indexOf(item1)).to.equal(0);
    expect(registry.indexOf(item2)).to.equal(1);
  });

  it('indexOf returns -1 for unregistered item', () => {
    const registry = new AccordionRegistry();
    const item = makeEl('item-a');
    expect(registry.indexOf(item)).to.equal(-1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --project=components src/components/accordion/registry/accordion.registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement AccordionRegistry**

```ts
// src/components/accordion/registry/accordion.registry.ts

export interface AccordionItemRecord {
  item: HTMLElement;
  value: string;
  trigger: HTMLElement | null;
  panel: HTMLElement | null;
}

/**
 * Ordered child tracking and trigger↔panel linking for accordion items.
 * No Lit dependency — pure DOM-order registry.
 * @internal
 */
export class AccordionRegistry {
  private records: AccordionItemRecord[] = [];

  get items(): AccordionItemRecord[] {
    return this.records;
  }

  registerItem(item: HTMLElement, value: string): void {
    // Insert in DOM order using compareDocumentPosition
    const record: AccordionItemRecord = { item, value, trigger: null, panel: null };
    const insertIndex = this.records.findIndex(
      (existing) =>
        existing.item.compareDocumentPosition(item) &
        Node.DOCUMENT_POSITION_PRECEDING,
    );
    if (insertIndex === -1) {
      this.records.push(record);
    } else {
      this.records.splice(insertIndex, 0, record);
    }
  }

  unregisterItem(item: HTMLElement): void {
    this.records = this.records.filter((r) => r.item !== item);
  }

  attachTrigger(item: HTMLElement, trigger: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.trigger = trigger;
  }

  attachPanel(item: HTMLElement, panel: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.panel = panel;
  }

  detachTrigger(item: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.trigger = null;
  }

  detachPanel(item: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.panel = null;
  }

  getRecord(item: HTMLElement): AccordionItemRecord | undefined {
    return this.records.find((r) => r.item === item);
  }

  indexOf(item: HTMLElement): number {
    return this.records.findIndex((r) => r.item === item);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project=components src/components/accordion/registry/accordion.registry.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/accordion/registry/
git commit -m "feat: add AccordionRegistry for ordered child tracking"
```

---

## Task 5: AccordionController

**Files:**
- Create: `src/components/accordion/controller/accordion.controller.ts`
- Create: `src/components/accordion/controller/accordion.controller.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/components/accordion/controller/accordion.controller.test.ts
import { expect } from '@open-wc/testing';
import { AccordionController } from './accordion.controller.js';

import type { AccordionHostSnapshot } from '../types.js';

describe('AccordionController', () => {
  function createController(snapshot?: Partial<AccordionHostSnapshot>) {
    const controller = new AccordionController();
    controller.syncFromHost({
      value: undefined,
      defaultValue: undefined,
      multiple: false,
      disabled: false,
      ...snapshot,
    });
    return controller;
  }

  describe('uncontrolled mode', () => {
    it('starts with no items expanded', () => {
      const ctrl = createController();
      expect(ctrl.isExpanded('a')).to.be.false;
    });

    it('seeds from defaultValue', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      expect(ctrl.isExpanded('a')).to.be.true;
    });

    it('seeds defaultValue only once', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      // Re-sync with different defaultValue — should not reseed
      ctrl.syncFromHost({
        value: undefined,
        defaultValue: ['b'],
        multiple: false,
        disabled: false,
      });
      expect(ctrl.isExpanded('a')).to.be.true;
      expect(ctrl.isExpanded('b')).to.be.false;
    });

    it('requestToggle opens an item', () => {
      const ctrl = createController();
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: false });
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isExpanded('a')).to.be.true;
    });

    it('requestToggle closes an open item', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: false });
      expect(result).to.deep.equal([]);
      expect(ctrl.isExpanded('a')).to.be.false;
    });
  });

  describe('single mode', () => {
    it('closes other items when opening a new one', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      ctrl.requestToggle({ type: 'toggle', itemValue: 'b', itemDisabled: false });
      expect(ctrl.isExpanded('a')).to.be.false;
      expect(ctrl.isExpanded('b')).to.be.true;
    });
  });

  describe('multiple mode', () => {
    it('allows multiple items open', () => {
      const ctrl = createController({ multiple: true, defaultValue: ['a'] });
      ctrl.requestToggle({ type: 'toggle', itemValue: 'b', itemDisabled: false });
      expect(ctrl.isExpanded('a')).to.be.true;
      expect(ctrl.isExpanded('b')).to.be.true;
    });
  });

  describe('disabled', () => {
    it('blocks toggle when root is disabled', () => {
      const ctrl = createController({ disabled: true });
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: false });
      expect(result).to.be.null;
      expect(ctrl.isExpanded('a')).to.be.false;
    });

    it('blocks toggle when item is disabled', () => {
      const ctrl = createController();
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: true });
      expect(result).to.be.null;
      expect(ctrl.isExpanded('a')).to.be.false;
    });
  });

  describe('controlled mode', () => {
    it('does not update internal state', () => {
      const ctrl = createController({ value: [] });
      const result = ctrl.requestToggle({ type: 'toggle', itemValue: 'a', itemDisabled: false });
      expect(result).to.deep.equal(['a']);
      // Internal state should NOT change — consumer must set value
      expect(ctrl.isExpanded('a')).to.be.false;
    });

    it('reflects externally set value', () => {
      const ctrl = createController({ value: ['a', 'b'] });
      expect(ctrl.isExpanded('a')).to.be.true;
      expect(ctrl.isExpanded('b')).to.be.true;
      expect(ctrl.isExpanded('c')).to.be.false;
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --project=components src/components/accordion/controller/accordion.controller.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement AccordionController**

```ts
// src/components/accordion/controller/accordion.controller.ts
import type { AccordionHostSnapshot } from '../types.js';

export interface AccordionAction {
  type: 'toggle';
  itemValue: string;
  itemDisabled: boolean;
}

/**
 * Pure state and action resolution for the accordion.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class AccordionController {
  expandedValues = new Set<string>();

  private isControlled = false;
  private isSeeded = false;
  private multiple = false;
  private disabled = false;

  syncFromHost(snapshot: AccordionHostSnapshot): void {
    this.multiple = snapshot.multiple;
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.value !== undefined;

    if (this.isControlled) {
      this.expandedValues = new Set(snapshot.value);
    } else if (!this.isSeeded && snapshot.defaultValue !== undefined) {
      this.expandedValues = new Set(snapshot.defaultValue);
      this.isSeeded = true;
    }
  }

  requestToggle(action: AccordionAction): string[] | null {
    if (this.disabled || action.itemDisabled) {
      return null;
    }

    const isCurrentlyExpanded = this.expandedValues.has(action.itemValue);
    let nextValues: Set<string>;

    if (isCurrentlyExpanded) {
      nextValues = new Set(this.expandedValues);
      nextValues.delete(action.itemValue);
    } else {
      if (this.multiple) {
        nextValues = new Set(this.expandedValues);
        nextValues.add(action.itemValue);
      } else {
        nextValues = new Set([action.itemValue]);
      }
    }

    if (!this.isControlled) {
      this.expandedValues = nextValues;
    }

    return Array.from(nextValues);
  }

  isExpanded(itemValue: string): boolean {
    return this.expandedValues.has(itemValue);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --project=components src/components/accordion/controller/accordion.controller.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/accordion/controller/
git commit -m "feat: add AccordionController for state and action resolution"
```

---

## Task 6: Accordion Elements — Root + Item

**Files:**
- Create: `src/components/accordion/root/accordion.element.ts`
- Create: `src/components/accordion/item/accordion-item.element.ts`
- Create: `src/components/accordion/root/accordion.element.test.ts`

- [ ] **Step 1: Write failing integration test for root + item**

```ts
// src/components/accordion/root/accordion.element.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { flush } from '../../../test-utils/index.js';
import '../../../components/accordion/root/accordion.element.js';
import '../../../components/accordion/item/accordion-item.element.js';

import type { GrundAccordion } from './accordion.element.js';

describe('GrundAccordion + GrundAccordionItem', () => {
  async function setup(template = html`
    <grund-accordion>
      <grund-accordion-item value="a"></grund-accordion-item>
      <grund-accordion-item value="b"></grund-accordion-item>
    </grund-accordion>
  `) {
    const el = await fixture<GrundAccordion>(template);
    await flush(el);
    return el;
  }

  it('renders with default properties', async () => {
    const el = await setup();
    expect(el.multiple).to.be.false;
    expect(el.disabled).to.be.false;
    expect(el.orientation).to.equal('vertical');
  });

  it('items get data-index attributes', async () => {
    const el = await setup();
    const items = el.querySelectorAll('grund-accordion-item');
    expect(items[0].dataset.index).to.equal('0');
    expect(items[1].dataset.index).to.equal('1');
  });

  it('items reflect data-open when expanded via defaultValue', async () => {
    const el = await setup(html`
      <grund-accordion .defaultValue=${['a']}>
        <grund-accordion-item value="a"></grund-accordion-item>
        <grund-accordion-item value="b"></grund-accordion-item>
      </grund-accordion>
    `);
    const items = el.querySelectorAll('grund-accordion-item');
    expect(items[0].hasAttribute('data-open')).to.be.true;
    expect(items[1].hasAttribute('data-open')).to.be.false;
  });

  it('items reflect data-disabled when root is disabled', async () => {
    const el = await setup(html`
      <grund-accordion disabled>
        <grund-accordion-item value="a"></grund-accordion-item>
      </grund-accordion>
    `);
    const items = el.querySelectorAll('grund-accordion-item');
    expect(items[0].hasAttribute('data-disabled')).to.be.true;
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --project=components src/components/accordion/root/accordion.element.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement GrundAccordion root element**

```ts
// src/components/accordion/root/accordion.element.ts
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { RovingFocusController } from '../../../controllers/roving-focus.controller.js';
import { AccordionController } from '../controller/accordion.controller.js';
import { AccordionRegistry } from '../registry/accordion.registry.js';
import { accordionRootContext } from '../context/accordion.context.js';

import type { AccordionRootContext } from '../context/accordion.context.js';
import type { AccordionHostSnapshot, AccordionValueChangeDetail } from '../types.js';

/**
 * Root accordion container. Provides context to accordion items.
 *
 * @element grund-accordion
 * @slot - Accordion items
 * @fires {CustomEvent<AccordionValueChangeDetail>} grund-value-change - When the expanded set changes
 */
export class GrundAccordion extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  @property({ type: Array, hasChanged: () => true })
  value: string[] | undefined = undefined;

  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  defaultValue: string[] | undefined = undefined;

  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) disabled = false;
  @property() orientation: 'vertical' | 'horizontal' = 'vertical';
  @property({ type: Boolean, attribute: 'loop-focus' }) loopFocus = true;
  @property({ type: Boolean, attribute: 'keep-mounted' }) keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) hiddenUntilFound = false;

  @provide({ context: accordionRootContext })
  @state()
  private rootCtx!: AccordionRootContext;

  private controller = new AccordionController();
  private registry = new AccordionRegistry();
  private rovingFocus!: RovingFocusController;

  override connectedCallback(): void {
    super.connectedCallback();
    this.rovingFocus = new RovingFocusController(this, {
      orientation: this.orientation,
      loop: this.loopFocus,
      getItems: () =>
        this.registry.items
          .map((r) => r.trigger?.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]') ?? null)
          .filter((t): t is HTMLElement => t !== null),
    });
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: AccordionHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      multiple: this.multiple,
      disabled: this.disabled,
    };
    this.controller.syncFromHost(snapshot);

    this.rovingFocus?.update({
      orientation: this.orientation,
      loop: this.loopFocus,
    });

    this.dataset.orientation = this.orientation;

    // Recreate context on first render or when state-bearing properties change.
    // Note: handleToggle() also recreates context directly because internal
    // controller state changes don't trigger willUpdate (no reactive prop changes).
    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('multiple') ||
      changed.has('disabled') ||
      changed.has('orientation') ||
      changed.has('keepMounted') ||
      changed.has('hiddenUntilFound')
    ) {
      this.rootCtx = this.createRootContext();
    }
  }

  private createRootContext(): AccordionRootContext {
    return {
      isExpanded: (value: string) => this.controller.isExpanded(value),
      disabled: this.disabled,
      orientation: this.orientation,
      keepMounted: this.keepMounted,
      hiddenUntilFound: this.hiddenUntilFound,
      requestToggle: (itemValue: string, itemDisabled: boolean) => {
        this.handleToggle(itemValue, itemDisabled);
      },
      registerItem: (item: HTMLElement, value: string) => {
        this.registry.registerItem(item, value);
      },
      unregisterItem: (item: HTMLElement) => {
        this.registry.unregisterItem(item);
      },
    };
  }

  private handleToggle(itemValue: string, itemDisabled: boolean): void {
    const result = this.controller.requestToggle({
      type: 'toggle',
      itemValue,
      itemDisabled,
    });

    if (result === null) return;

    const isOpen = result.includes(itemValue);

    this.dispatchEvent(
      new CustomEvent<AccordionValueChangeDetail>('grund-value-change', {
        detail: { value: result, itemValue, open: isOpen },
        bubbles: true,
        composed: false,
      }),
    );

    // Must recreate context here because toggle changes internal controller
    // state (expandedValues) without changing any reactive property, so
    // willUpdate's guard won't detect the change on the next render cycle.
    this.rootCtx = this.createRootContext();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-accordion')) {
  customElements.define('grund-accordion', GrundAccordion);
}
```

- [ ] **Step 4: Implement GrundAccordionItem element**

```ts
// src/components/accordion/item/accordion-item.element.ts
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';

import {
  accordionRootContext,
  accordionItemContext,
} from '../context/accordion.context.js';

import type { AccordionRootContext, AccordionItemContext } from '../context/accordion.context.js';
import type { AccordionOpenChangeDetail } from '../types.js';

/**
 * Accordion item container. Bridges root and leaf element context.
 *
 * @element grund-accordion-item
 * @slot - Header and panel elements
 * @fires {CustomEvent<AccordionOpenChangeDetail>} grund-open-change - When this item's open state changes (after initial mount)
 */
export class GrundAccordionItem extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  @property() value = '';
  @property({ type: Boolean }) disabled = false;

  @consume({ context: accordionRootContext, subscribe: true })
  @state()
  private rootCtx?: AccordionRootContext;

  @provide({ context: accordionItemContext })
  @state()
  private itemCtx: AccordionItemContext = this.createItemContext();

  private hasSettled = false;
  private prevExpanded: boolean | undefined = undefined;

  // Stable callback references — bound once, reused across context recreations
  private readonly boundToggle = () => {
    this.rootCtx?.requestToggle(this.value, this.disabled);
  };
  private readonly boundAttachTrigger = (el: HTMLElement) => {
    this.rootCtx?.attachTrigger(this, el);
  };
  private readonly boundDetachTrigger = (_el: HTMLElement) => {
    this.rootCtx?.detachTrigger(this);
  };
  private readonly boundAttachPanel = (el: HTMLElement) => {
    this.rootCtx?.attachPanel(this, el);
  };
  private readonly boundDetachPanel = (_el: HTMLElement) => {
    this.rootCtx?.detachPanel(this);
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('exportparts', 'trigger,panel');
    if (!this.value) {
      this.value = crypto.randomUUID().slice(0, 8);
      if (import.meta.env.DEV) {
        console.warn(
          '[grund-accordion-item] No value provided. ' +
          'Set value="..." for SSR-safe, deterministic IDs.',
        );
      }
    }
    this.rootCtx?.registerItem(this, this.value);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.rootCtx?.unregisterItem(this);
    this.hasSettled = false;
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (!this.rootCtx) return;

    // Re-register if value changed
    if (changed.has('value') && changed.get('value') !== undefined) {
      this.rootCtx.unregisterItem(this);
      this.rootCtx.registerItem(this, this.value);
    }

    const expanded = this.rootCtx.isExpanded(this.value);
    const mergedDisabled = this.rootCtx.disabled || this.disabled;

    // Data attributes
    this.toggleAttribute('data-open', expanded);
    this.toggleAttribute('data-disabled', mergedDisabled);

    // Compute index from registration order
    // (Registry is on the root — we don't have direct access, but
    //  we can use the root context to check expansion. Index will be
    //  set via the item context for leaf elements to use.)

    this.itemCtx = this.createItemContext();
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    const expanded = this.rootCtx?.isExpanded(this.value) ?? false;

    if (this.hasSettled && this.prevExpanded !== expanded) {
      this.dispatchEvent(
        new CustomEvent<AccordionOpenChangeDetail>('grund-open-change', {
          detail: {
            open: expanded,
            value: this.value,
            index: Number(this.dataset.index ?? 0),
          },
          bubbles: true,
          composed: false,
        }),
      );
    }

    this.prevExpanded = expanded;
    this.hasSettled = true;
  }

  private createItemContext(): AccordionItemContext {
    const expanded = this.rootCtx?.isExpanded(this.value) ?? false;
    const mergedDisabled = (this.rootCtx?.disabled ?? false) || this.disabled;

    return {
      value: this.value,
      index: Number(this.dataset.index ?? 0),
      expanded,
      disabled: mergedDisabled,
      orientation: this.rootCtx?.orientation ?? 'vertical',
      keepMounted: this.rootCtx?.keepMounted ?? false,
      hiddenUntilFound: this.rootCtx?.hiddenUntilFound ?? false,
      triggerId: `grund-accordion-trigger-${this.value}`,
      panelId: `grund-accordion-panel-${this.value}`,
      toggle: this.boundToggle,
      attachTrigger: this.boundAttachTrigger,
      detachTrigger: this.boundDetachTrigger,
      attachPanel: this.boundAttachPanel,
      detachPanel: this.boundDetachPanel,
    };
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-accordion-item')) {
  customElements.define('grund-accordion-item', GrundAccordionItem);
}
```

**Note:** The item needs the registry's `indexOf` for `data-index`. Since the registry is owned by the root, we need to expose index lookup through the root context. Update the root context interface and the root element:

Add to `AccordionRootContext`:
```ts
indexOf: (item: HTMLElement) => number;
```

Add to `GrundAccordion.createRootContext()`:
```ts
indexOf: (item: HTMLElement) => this.registry.indexOf(item),
```

Update `GrundAccordionItem.willUpdate` to set `data-index`:
```ts
const index = this.rootCtx.indexOf(this);
this.dataset.index = String(index);
```

This means also add `indexOf`, `attachTrigger`, `detachTrigger`, `attachPanel`, `detachPanel` to root context that delegate to the registry.

- [ ] **Step 5: Update context interface with indexOf and attach/detach**

Add these fields to `AccordionRootContext` in `accordion.context.ts`:

```ts
indexOf: (item: HTMLElement) => number;
attachTrigger: (item: HTMLElement, trigger: HTMLElement) => void;
detachTrigger: (item: HTMLElement) => void;
attachPanel: (item: HTMLElement, panel: HTMLElement) => void;
detachPanel: (item: HTMLElement) => void;
```

Update `GrundAccordion.createRootContext()` to include:

```ts
indexOf: (item: HTMLElement) => this.registry.indexOf(item),
attachTrigger: (item: HTMLElement, trigger: HTMLElement) => {
  this.registry.attachTrigger(item, trigger);
},
detachTrigger: (item: HTMLElement) => {
  this.registry.detachTrigger(item);
},
attachPanel: (item: HTMLElement, panel: HTMLElement) => {
  this.registry.attachPanel(item, panel);
},
detachPanel: (item: HTMLElement) => {
  this.registry.detachPanel(item);
},
```

Update `GrundAccordionItem.willUpdate` to set `data-index`:

```ts
const index = this.rootCtx.indexOf(this);
this.dataset.index = String(index);
```

Note: `createItemContext` already uses the bound callbacks (`this.boundAttachTrigger`, etc.) defined as class fields.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run --project=components src/components/accordion/root/accordion.element.test.ts`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/accordion/
git commit -m "feat: add GrundAccordion root and GrundAccordionItem elements"
```

---

## Task 7: Accordion Elements — Header, Trigger, Panel

**Files:**
- Create: `src/components/accordion/header/accordion-header.element.ts`
- Create: `src/components/accordion/trigger/accordion-trigger.element.ts`
- Create: `src/components/accordion/panel/accordion-panel.element.ts`
- Create: `src/components/accordion/trigger/accordion-trigger.element.test.ts`

- [ ] **Step 1: Write failing integration test for the full accordion**

```ts
// src/components/accordion/trigger/accordion-trigger.element.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { flush, getByPart, expectDataState } from '../../../test-utils/index.js';

// Import all elements
import '../root/accordion.element.js';
import '../item/accordion-item.element.js';
import '../header/accordion-header.element.js';
import '../trigger/accordion-trigger.element.js';
import '../panel/accordion-panel.element.js';

import type { GrundAccordion } from '../root/accordion.element.js';

function getAccordionParts(el: GrundAccordion) {
  const items = Array.from(el.querySelectorAll('grund-accordion-item'));
  return items.map((item) => {
    const trigger = item.querySelector('grund-accordion-trigger')!;
    const panel = item.querySelector('grund-accordion-panel')!;
    const triggerBtn = getByPart<HTMLButtonElement>(trigger, 'trigger');
    return { item, trigger, panel, triggerBtn };
  });
}

describe('Full Accordion Integration', () => {
  async function setup(template = html`
    <grund-accordion>
      <grund-accordion-item value="a">
        <grund-accordion-header>
          <grund-accordion-trigger>Section A</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content A</grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="b">
        <grund-accordion-header>
          <grund-accordion-trigger>Section B</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content B</grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `) {
    const el = await fixture<GrundAccordion>(template);
    await flush(el);
    return el;
  }

  it('renders trigger buttons', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    expect(parts[0].triggerBtn).to.exist;
    expect(parts[0].triggerBtn.textContent?.trim()).to.equal('Section A');
  });

  it('trigger has correct ARIA attributes when closed', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    expect(parts[0].triggerBtn.getAttribute('aria-expanded')).to.equal('false');
    expect(parts[0].triggerBtn.getAttribute('aria-controls')).to.equal('grund-accordion-panel-a');
  });

  it('clicking trigger opens the panel', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    parts[0].triggerBtn.click();
    await flush(el);

    expect(parts[0].triggerBtn.getAttribute('aria-expanded')).to.equal('true');
    expect(parts[0].item.hasAttribute('data-open')).to.be.true;
  });

  it('panel has role="region" and aria-labelledby', async () => {
    const el = await setup(html`
      <grund-accordion .defaultValue=${['a']}>
        <grund-accordion-item value="a">
          <grund-accordion-header>
            <grund-accordion-trigger>A</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = getByPart(panel, 'panel');
    expect(panelDiv.getAttribute('role')).to.equal('region');
    expect(panelDiv.getAttribute('aria-labelledby')).to.equal('grund-accordion-trigger-a');
  });

  it('panel is not rendered when closed (default)', async () => {
    const el = await setup();
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
    expect(panelDiv).to.be.null;
  });

  it('single mode closes other items', async () => {
    const el = await setup(html`
      <grund-accordion .defaultValue=${['a']}>
        <grund-accordion-item value="a">
          <grund-accordion-header>
            <grund-accordion-trigger>A</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content A</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="b">
          <grund-accordion-header>
            <grund-accordion-trigger>B</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content B</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    const parts = getAccordionParts(el);
    // Open B
    parts[1].triggerBtn.click();
    await flush(el);

    expect(parts[0].item.hasAttribute('data-open')).to.be.false;
    expect(parts[1].item.hasAttribute('data-open')).to.be.true;
  });

  it('fires grund-value-change event', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    const events: any[] = [];
    el.addEventListener('grund-value-change', (e: Event) => {
      events.push((e as CustomEvent).detail);
    });

    parts[0].triggerBtn.click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].itemValue).to.equal('a');
    expect(events[0].open).to.be.true;
    expect(events[0].value).to.deep.equal(['a']);
  });

  it('fires grund-open-change event on item', async () => {
    const el = await setup();
    const parts = getAccordionParts(el);
    const events: any[] = [];
    parts[0].item.addEventListener('grund-open-change', (e: Event) => {
      events.push((e as CustomEvent).detail);
    });

    parts[0].triggerBtn.click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].open).to.be.true;
    expect(events[0].value).to.equal('a');
  });

  it('header sets role="heading" and aria-level', async () => {
    const el = await setup();
    const header = el.querySelector('grund-accordion-header')!;
    expect(header.getAttribute('role')).to.equal('heading');
    expect(header.getAttribute('aria-level')).to.equal('3');
  });

  it('disabled root prevents toggle', async () => {
    const el = await setup(html`
      <grund-accordion disabled>
        <grund-accordion-item value="a">
          <grund-accordion-header>
            <grund-accordion-trigger>A</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    const parts = getAccordionParts(el);
    parts[0].triggerBtn.click();
    await flush(el);

    expect(parts[0].item.hasAttribute('data-open')).to.be.false;
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --project=components src/components/accordion/trigger/accordion-trigger.element.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement GrundAccordionHeader**

```ts
// src/components/accordion/header/accordion-header.element.ts
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { accordionItemContext } from '../context/accordion.context.js';

import type { AccordionItemContext } from '../context/accordion.context.js';

/**
 * Heading wrapper for an accordion item trigger.
 *
 * @element grund-accordion-header
 * @slot - Trigger element
 */
export class GrundAccordionHeader extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  @property({ type: Number }) level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  @consume({ context: accordionItemContext, subscribe: true })
  @state()
  private itemCtx?: AccordionItemContext;

  override willUpdate(): void {
    this.setAttribute('role', 'heading');
    this.setAttribute('aria-level', String(this.level));

    if (import.meta.env.DEV) {
      if (!this.itemCtx) {
        console.warn(
          '[grund-accordion-header] Must be used inside <grund-accordion-item>. ' +
          'Wrap this element in <grund-accordion-item value="...">.',
        );
      }
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-accordion-header')) {
  customElements.define('grund-accordion-header', GrundAccordionHeader);
}
```

- [ ] **Step 4: Implement GrundAccordionTrigger**

```ts
// src/components/accordion/trigger/accordion-trigger.element.ts
import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { accordionItemContext } from '../context/accordion.context.js';

import type { AccordionItemContext } from '../context/accordion.context.js';

/**
 * Button that toggles an accordion panel open/closed.
 *
 * @element grund-accordion-trigger
 * @slot - Trigger label content
 * @csspart trigger - The inner button element
 */
export class GrundAccordionTrigger extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  @consume({ context: accordionItemContext, subscribe: true })
  @state()
  private itemCtx?: AccordionItemContext;

  override connectedCallback(): void {
    super.connectedCallback();
    // Defer registration to let context settle
    this.updateComplete.then(() => {
      this.itemCtx?.attachTrigger(this);
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.itemCtx?.detachTrigger(this);
  }

  override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.itemCtx) {
        console.warn(
          '[grund-accordion-trigger] Must be used inside <grund-accordion-item>. ' +
          'Wrap this element in <grund-accordion-item value="...">.',
        );
      }
    }

    if (this.itemCtx) {
      this.toggleAttribute('data-open', this.itemCtx.expanded);
      this.toggleAttribute('data-disabled', this.itemCtx.disabled);
      this.dataset.orientation = this.itemCtx.orientation;
      this.dataset.index = String(this.itemCtx.index);
    }
  }

  private handleClick(): void {
    if (this.itemCtx?.disabled) return;
    this.itemCtx?.toggle();
  }

  override render() {
    const ctx = this.itemCtx;
    return html`
      <button
        part="trigger"
        id="${ctx?.triggerId ?? ''}"
        aria-expanded="${ctx?.expanded ?? false}"
        aria-controls="${ctx?.panelId ?? ''}"
        aria-disabled="${ctx?.disabled ?? false}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-accordion-trigger')) {
  customElements.define('grund-accordion-trigger', GrundAccordionTrigger);
}
```

- [ ] **Step 5: Implement GrundAccordionPanel**

```ts
// src/components/accordion/panel/accordion-panel.element.ts
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { accordionItemContext } from '../context/accordion.context.js';

import type { AccordionItemContext } from '../context/accordion.context.js';

/**
 * Collapsible content region of an accordion item.
 *
 * @element grund-accordion-panel
 * @slot - Panel content
 * @csspart panel - The panel container
 */
export class GrundAccordionPanel extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  @property({ type: Boolean, attribute: 'keep-mounted' }) keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) hiddenUntilFound = false;

  @consume({ context: accordionItemContext, subscribe: true })
  @state()
  private itemCtx?: AccordionItemContext;

  private handleBeforematch = (): void => {
    this.itemCtx?.toggle();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.updateComplete.then(() => {
      this.itemCtx?.attachPanel(this);
    });
    this.addEventListener('beforematch', this.handleBeforematch);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.itemCtx?.detachPanel(this);
    this.removeEventListener('beforematch', this.handleBeforematch);
  }

  override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.itemCtx) {
        console.warn(
          '[grund-accordion-panel] Must be used inside <grund-accordion-item>. ' +
          'Wrap this element in <grund-accordion-item value="...">.',
        );
      }
    }

    if (this.itemCtx) {
      const expanded = this.itemCtx.expanded;
      this.toggleAttribute('data-open', expanded);
      this.toggleAttribute('data-disabled', this.itemCtx.disabled);
      this.dataset.state = expanded ? 'open' : 'closed';
      this.dataset.orientation = this.itemCtx.orientation;
      this.dataset.index = String(this.itemCtx.index);
    }
  }

  private get effectiveKeepMounted(): boolean {
    return this.keepMounted || (this.itemCtx?.keepMounted ?? false);
  }

  private get effectiveHiddenUntilFound(): boolean {
    return this.hiddenUntilFound || (this.itemCtx?.hiddenUntilFound ?? false);
  }

  override render() {
    const ctx = this.itemCtx;
    if (!ctx) return nothing;

    const expanded = ctx.expanded;

    // Not expanded: decide visibility strategy
    if (!expanded) {
      if (this.effectiveHiddenUntilFound) {
        return html`
          <div
            part="panel"
            id="${ctx.panelId}"
            role="region"
            aria-labelledby="${ctx.triggerId}"
            hidden="until-found"
          >
            <slot></slot>
          </div>
        `;
      }
      if (this.effectiveKeepMounted) {
        return html`
          <div
            part="panel"
            id="${ctx.panelId}"
            role="region"
            aria-labelledby="${ctx.triggerId}"
            hidden
          >
            <slot></slot>
          </div>
        `;
      }
      // Default: remove from DOM
      return nothing;
    }

    // Expanded
    return html`
      <div
        part="panel"
        id="${ctx.panelId}"
        role="region"
        aria-labelledby="${ctx.triggerId}"
      >
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-accordion-panel')) {
  customElements.define('grund-accordion-panel', GrundAccordionPanel);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run --project=components src/components/accordion/trigger/accordion-trigger.element.test.ts`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/accordion/header/ src/components/accordion/trigger/ src/components/accordion/panel/
git commit -m "feat: add accordion header, trigger, and panel elements"
```

---

## Task 8: Keyboard Navigation Integration Tests

**Files:**
- Create: `src/components/accordion/root/accordion-keyboard.test.ts`

- [ ] **Step 1: Write keyboard navigation tests**

```ts
// src/components/accordion/root/accordion-keyboard.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { flush, simulateKeyboard, getByPart } from '../../../test-utils/index.js';

import '../root/accordion.element.js';
import '../item/accordion-item.element.js';
import '../header/accordion-header.element.js';
import '../trigger/accordion-trigger.element.js';
import '../panel/accordion-panel.element.js';

import type { GrundAccordion } from '../root/accordion.element.js';

function getTriggerButtons(el: GrundAccordion): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll('grund-accordion-trigger')).map(
    (t) => getByPart<HTMLButtonElement>(t, 'trigger'),
  );
}

describe('Accordion Keyboard Navigation', () => {
  async function setup() {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a">
          <grund-accordion-header>
            <grund-accordion-trigger>A</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content A</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="b">
          <grund-accordion-header>
            <grund-accordion-trigger>B</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content B</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="c">
          <grund-accordion-header>
            <grund-accordion-trigger>C</grund-accordion-trigger>
          </grund-accordion-header>
          <grund-accordion-panel>Content C</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    return el;
  }

  it('ArrowDown moves focus to next trigger', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[1]);
  });

  it('ArrowUp moves focus to previous trigger', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[1].focus();
    simulateKeyboard(el, 'ArrowUp');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('Home moves focus to first trigger', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[2].focus();
    simulateKeyboard(el, 'Home');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('End moves focus to last trigger', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[0].focus();
    simulateKeyboard(el, 'End');
    expect(document.activeElement).to.equal(buttons[2]);
  });

  it('loops from last to first (loop-focus default true)', async () => {
    const el = await setup();
    const buttons = getTriggerButtons(el);
    buttons[2].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[0]);
  });

  it('skips disabled items', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>A</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="b" disabled>
          <grund-accordion-header><grund-accordion-trigger>B</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>B</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="c">
          <grund-accordion-header><grund-accordion-trigger>C</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>C</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const buttons = getTriggerButtons(el);
    buttons[0].focus();
    simulateKeyboard(el, 'ArrowDown');
    expect(document.activeElement).to.equal(buttons[2]);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --project=components src/components/accordion/root/accordion-keyboard.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/accordion/root/accordion-keyboard.test.ts
git commit -m "test: add accordion keyboard navigation integration tests"
```

---

## Task 9: Barrel Exports + Build Verification

**Files:**
- Create: `src/components/accordion/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create accordion barrel export**

```ts
// src/components/accordion/index.ts
export { GrundAccordion } from './root/accordion.element.js';
export { GrundAccordionItem } from './item/accordion-item.element.js';
export { GrundAccordionHeader } from './header/accordion-header.element.js';
export { GrundAccordionTrigger } from './trigger/accordion-trigger.element.js';
export { GrundAccordionPanel } from './panel/accordion-panel.element.js';

export type {
  AccordionValueChangeDetail,
  AccordionOpenChangeDetail,
} from './types.js';
```

- [ ] **Step 2: Create library barrel export**

```ts
// src/index.ts
export * from './components/accordion/index.js';
```

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run --project=components`
Expected: All tests PASS

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds, `dist/` contains `index.js` and `components/accordion/index.js`

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: No errors (warnings acceptable)

- [ ] **Step 6: Commit**

```bash
git add src/components/accordion/index.ts src/index.ts
git commit -m "feat: add accordion barrel exports and verify build"
```

---

## Task 10: Controlled Mode + Multiple Mode Tests

**Files:**
- Create: `src/components/accordion/root/accordion-controlled.test.ts`

- [ ] **Step 1: Write controlled mode and multiple mode tests**

```ts
// src/components/accordion/root/accordion-controlled.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { flush, getByPart } from '../../../test-utils/index.js';

import '../root/accordion.element.js';
import '../item/accordion-item.element.js';
import '../header/accordion-header.element.js';
import '../trigger/accordion-trigger.element.js';
import '../panel/accordion-panel.element.js';

import type { GrundAccordion } from '../root/accordion.element.js';

function getTriggerButton(el: GrundAccordion, index: number): HTMLButtonElement {
  const triggers = Array.from(el.querySelectorAll('grund-accordion-trigger'));
  return getByPart<HTMLButtonElement>(triggers[index], 'trigger');
}

describe('Accordion Controlled Mode', () => {
  it('does not update internal state in controlled mode', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion .value=${[]}>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    getTriggerButton(el, 0).click();
    await flush(el);

    // Should NOT be open — controlled mode requires consumer to set value
    const item = el.querySelector('grund-accordion-item')!;
    expect(item.hasAttribute('data-open')).to.be.false;
  });

  it('opens when consumer updates value', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion .value=${[]}>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    el.value = ['a'];
    await flush(el);

    const item = el.querySelector('grund-accordion-item')!;
    expect(item.hasAttribute('data-open')).to.be.true;
  });
});

describe('Accordion Multiple Mode', () => {
  it('allows multiple items open', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion multiple .defaultValue=${['a']}>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>A</grund-accordion-panel>
        </grund-accordion-item>
        <grund-accordion-item value="b">
          <grund-accordion-header><grund-accordion-trigger>B</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>B</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    getTriggerButton(el, 1).click();
    await flush(el);

    const items = el.querySelectorAll('grund-accordion-item');
    expect(items[0].hasAttribute('data-open')).to.be.true;
    expect(items[1].hasAttribute('data-open')).to.be.true;
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --project=components src/components/accordion/root/accordion-controlled.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/accordion/root/accordion-controlled.test.ts
git commit -m "test: add controlled mode and multiple mode accordion tests"
```

---

## Task 11: Panel Visibility + Event Suppression Tests

**Files:**
- Create: `src/components/accordion/panel/accordion-panel.test.ts`

- [ ] **Step 1: Write panel visibility and event tests**

```ts
// src/components/accordion/panel/accordion-panel.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { flush, getByPart, expectDataState } from '../../../test-utils/index.js';

import '../root/accordion.element.js';
import '../item/accordion-item.element.js';
import '../header/accordion-header.element.js';
import '../trigger/accordion-trigger.element.js';
import '../panel/accordion-panel.element.js';

import type { GrundAccordion } from '../root/accordion.element.js';

describe('Accordion Panel Visibility', () => {
  it('removes panel from DOM when closed (default)', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    expect(panel.shadowRoot?.querySelector('[part="panel"]')).to.be.null;
  });

  it('keeps panel in DOM with hidden attribute when keepMounted', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion keep-mounted>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
    expect(panelDiv).to.exist;
    expect(panelDiv?.hasAttribute('hidden')).to.be.true;
  });

  it('uses hidden="until-found" when hiddenUntilFound', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion hidden-until-found>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
    expect(panelDiv).to.exist;
    expect(panelDiv?.getAttribute('hidden')).to.equal('until-found');
  });

  it('panel-level keepMounted overrides root default', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel keep-mounted>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    const panelDiv = panel.shadowRoot?.querySelector('[part="panel"]');
    expect(panelDiv).to.exist;
    expect(panelDiv?.hasAttribute('hidden')).to.be.true;
  });

  it('sets data-state on panel', async () => {
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion .defaultValue=${['a']}>
        <grund-accordion-item value="a">
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);
    const panel = el.querySelector('grund-accordion-panel')!;
    expectDataState(panel, 'open');
  });
});

describe('Accordion Event Suppression', () => {
  it('does NOT fire grund-open-change on initial render with defaultValue', async () => {
    const events: any[] = [];
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion .defaultValue=${['a']}>
        <grund-accordion-item value="a" @grund-open-change=${(e: CustomEvent) => events.push(e.detail)}>
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    // Should not have fired during initial mount
    expect(events).to.have.length(0);
  });

  it('fires grund-open-change after initial render on user interaction', async () => {
    const events: any[] = [];
    const el = await fixture<GrundAccordion>(html`
      <grund-accordion>
        <grund-accordion-item value="a" @grund-open-change=${(e: CustomEvent) => events.push(e.detail)}>
          <grund-accordion-header><grund-accordion-trigger>A</grund-accordion-trigger></grund-accordion-header>
          <grund-accordion-panel>Content</grund-accordion-panel>
        </grund-accordion-item>
      </grund-accordion>
    `);
    await flush(el);

    const trigger = el.querySelector('grund-accordion-trigger')!;
    getByPart<HTMLButtonElement>(trigger, 'trigger').click();
    await flush(el);

    expect(events).to.have.length(1);
    expect(events[0].open).to.be.true;
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run --project=components src/components/accordion/panel/accordion-panel.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/accordion/panel/accordion-panel.test.ts
git commit -m "test: add panel visibility and event suppression tests"
```

---

## Task 12: Storybook Stories

**Files:**
- Create: `stories/accordion.stories.ts`

- [ ] **Step 1: Write stories**

```ts
// stories/accordion.stories.ts
import { html } from 'lit';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundAccordion } from '../src/components/accordion/index.js';

import '../src/components/accordion/index.js';

const meta: Meta<GrundAccordion> = {
  title: 'Components/Accordion',
  component: 'grund-accordion',
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    loopFocus: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<GrundAccordion>;

export const Default: Story = {
  render: (args) => html`
    <grund-accordion
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      orientation=${args.orientation ?? 'vertical'}
      ?loop-focus=${args.loopFocus ?? true}
    >
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>What is Grund UI?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <p>A headless, accessible Web Component library built with Lit.</p>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2">
        <grund-accordion-header>
          <grund-accordion-trigger>Is it accessible?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <p>Yes. It follows WAI-ARIA APG patterns with full keyboard support.</p>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-3">
        <grund-accordion-header>
          <grund-accordion-trigger>Can I style it?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <p>Absolutely. Use ::part() selectors and data-* attributes for full control.</p>
        </grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const WithDefaultOpen: Story = {
  render: () => html`
    <grund-accordion .defaultValue=${['item-2']}>
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>Section 1</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content 1</p></grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2">
        <grund-accordion-header>
          <grund-accordion-trigger>Section 2 (default open)</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content 2</p></grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const Multiple: Story = {
  render: () => html`
    <grund-accordion multiple .defaultValue=${['a', 'b']}>
      <grund-accordion-item value="a">
        <grund-accordion-header>
          <grund-accordion-trigger>Section A</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content A</p></grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="b">
        <grund-accordion-header>
          <grund-accordion-trigger>Section B</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content B</p></grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="c">
        <grund-accordion-header>
          <grund-accordion-trigger>Section C</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Content C</p></grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const Disabled: Story = {
  render: () => html`
    <grund-accordion disabled>
      <grund-accordion-item value="a">
        <grund-accordion-header>
          <grund-accordion-trigger>Disabled Section</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Cannot be opened</p></grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const ItemDisabled: Story = {
  render: () => html`
    <grund-accordion>
      <grund-accordion-item value="a">
        <grund-accordion-header>
          <grund-accordion-trigger>Enabled</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>This works</p></grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="b" disabled>
        <grund-accordion-header>
          <grund-accordion-trigger>Disabled Item</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel><p>Cannot be opened</p></grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};
```

- [ ] **Step 2: Verify Storybook builds**

Run: `npm run build-storybook`
Expected: Build succeeds without errors

- [ ] **Step 3: Commit**

```bash
git add stories/accordion.stories.ts
git commit -m "feat: add accordion Storybook stories"
```

---

## Task 13: Final Validation

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run --project=components`
Expected: All tests PASS

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Run CEM analysis**

Run: `npm run analyze`
Expected: `custom-elements.json` generated with all 5 accordion elements

- [ ] **Step 5: Verify exports work**

Run: `node -e "import('./dist/index.js').then(m => console.log(Object.keys(m)))"`
Expected: Lists all exported classes

- [ ] **Step 6: Commit CEM if changed**

```bash
git add custom-elements.json
git commit -m "chore: update custom elements manifest"
```
