# Toggle Group Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `<grund-toggle-group>` as a composite widget wrapping existing `<grund-toggle>` children, with single/multiple selection, keyboard navigation, and controlled/uncontrolled modes.

**Architecture:** A root element `<grund-toggle-group>` provides Lit Context to child `<grund-toggle>` elements. The group owns all pressed state via a pure controller; toggles delegate to it when context is present. No `item/` layer — `<grund-toggle>` is both item and leaf. A registry tracks registered toggles in DOM order for `RovingFocusController`.

**Tech Stack:** Lit, `@lit/context`, `RovingFocusController` (existing), `OrderedRegistry` (existing), `@open-wc/testing` + Vitest for tests.

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `src/components/toggle-group/types.ts` | Event detail types and host snapshot interface |
| `src/components/toggle-group/context/toggle-group.context.ts` | Context interface and symbol |
| `src/components/toggle-group/controller/toggle-group.controller.ts` | Pure state machine — owns `pressedValues`, resolves single/multiple/controlled logic |
| `src/components/toggle-group/controller/toggle-group.controller.test.ts` | Unit tests for the controller |
| `src/components/toggle-group/registry/toggle-group.registry.ts` | Ordered child tracking for registered `<grund-toggle>` elements |
| `src/components/toggle-group/registry/toggle-group.registry.test.ts` | Unit tests for the registry |
| `src/components/toggle-group/registry/checkbox.ts` | Registry barrel export |
| `src/components/toggle-group/root/checkbox.ts` | `GrundToggleGroup` element — provider, controller, RovingFocusController |
| `src/components/toggle-group/root/toggle-group.test.ts` | Element tests: render, data attributes, events, disabled |
| `src/components/toggle-group/root/toggle-group-keyboard.test.ts` | Keyboard navigation tests |
| `src/components/toggle-group/root/toggle-group-controlled.test.ts` | Controlled mode and multiple mode tests |
| `src/components/toggle-group/checkbox.ts` | Barrel export |
| `stories/toggle-group.stories.ts` | Storybook stories |

### Modified files
| File | Change |
|---|---|
| `src/components/toggle/root/checkbox.ts` | Add optional context consumption; delegate to group when present |
| `src/components/toggle/types.ts` | No change needed (existing `PressedChangeDetail` is sufficient) |
| `src/checkbox.ts` | Add `export * from './components/toggle-group/index.js'` |

---

## Task 1: Types

**Files:**
- Create: `src/components/toggle-group/types.ts`

- [ ] **Step 1: Write the file**

```ts
/** Detail for `grund-value-change` event on the root element. */
export interface ToggleGroupValueChangeDetail {
  value: string[];
}

/**
 * Snapshot of host properties passed to ToggleGroupController.syncFromHost().
 * @internal
 */
export interface ToggleGroupHostSnapshot {
  value: string[] | undefined;
  defaultValue: string[];
  multiple: boolean;
  disabled: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/toggle-group/types.ts
git commit -m "feat(toggle-group): add types"
```

---

## Task 2: Context

**Files:**
- Create: `src/components/toggle-group/context/toggle-group.context.ts`

- [ ] **Step 1: Write the file**

```ts
import { createContext } from '@lit/context';

export interface ToggleGroupRootContext {
  isPressed: (value: string) => boolean;
  disabled: boolean;
  /** Returns the resolved new pressed state for the calling toggle, or null if blocked. */
  requestToggle: (value: string, toggleDisabled: boolean) => boolean | null;
  registerToggle: (toggle: HTMLElement, value: string) => void;
  unregisterToggle: (toggle: HTMLElement) => void;
}

export const toggleGroupRootContext =
  createContext<ToggleGroupRootContext>('toggle-group-root');
```

- [ ] **Step 2: Commit**

```bash
git add src/components/toggle-group/context/toggle-group.context.ts
git commit -m "feat(toggle-group): add context"
```

---

## Task 3: Controller

**Files:**
- Create: `src/components/toggle-group/controller/toggle-group.controller.ts`
- Create: `src/components/toggle-group/controller/toggle-group.controller.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/toggle-group/controller/toggle-group.controller.test.ts
import { expect, describe, it } from 'vitest';
import { ToggleGroupController } from './toggle-group.controller.js';
import type { ToggleGroupHostSnapshot } from '../types.js';

describe('ToggleGroupController', () => {
  function createController(snapshot?: Partial<ToggleGroupHostSnapshot>) {
    const ctrl = new ToggleGroupController();
    ctrl.syncFromHost({
      value: undefined,
      defaultValue: [],
      multiple: false,
      disabled: false,
      ...snapshot,
    });
    return ctrl;
  }

  describe('uncontrolled mode', () => {
    it('starts with no items pressed', () => {
      const ctrl = createController();
      expect(ctrl.isPressed('a')).to.be.false;
    });

    it('seeds from defaultValue', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      expect(ctrl.isPressed('a')).to.be.true;
    });

    it('seeds defaultValue only once', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      ctrl.syncFromHost({ value: undefined, defaultValue: ['b'], multiple: false, disabled: false });
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.false;
    });

    it('requestToggle presses an item', () => {
      const ctrl = createController();
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isPressed('a')).to.be.true;
    });

    it('requestToggle unpresses an already-pressed item', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal([]);
      expect(ctrl.isPressed('a')).to.be.false;
    });
  });

  describe('single mode', () => {
    it('unpresses the previously pressed item when pressing a new one', () => {
      const ctrl = createController({ defaultValue: ['a'] });
      ctrl.requestToggle('b', false);
      expect(ctrl.isPressed('a')).to.be.false;
      expect(ctrl.isPressed('b')).to.be.true;
    });
  });

  describe('multiple mode', () => {
    it('allows multiple items pressed simultaneously', () => {
      const ctrl = createController({ multiple: true, defaultValue: ['a'] });
      ctrl.requestToggle('b', false);
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.true;
    });
  });

  describe('disabled', () => {
    it('blocks toggle when root is disabled', () => {
      const ctrl = createController({ disabled: true });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.be.null;
    });

    it('blocks toggle when individual toggle is disabled', () => {
      const ctrl = createController();
      const result = ctrl.requestToggle('a', true);
      expect(result).to.be.null;
    });
  });

  describe('controlled mode', () => {
    it('does not update internal state on toggle', () => {
      const ctrl = createController({ value: [] });
      ctrl.requestToggle('a', false);
      expect(ctrl.isPressed('a')).to.be.false;
    });

    it('reflects externally set value', () => {
      const ctrl = createController({ value: ['a', 'b'] });
      expect(ctrl.isPressed('a')).to.be.true;
      expect(ctrl.isPressed('b')).to.be.true;
      expect(ctrl.isPressed('c')).to.be.false;
    });

    it('requestToggle returns the new value set without persisting', () => {
      const ctrl = createController({ value: [] });
      const result = ctrl.requestToggle('a', false);
      expect(result).to.deep.equal(['a']);
      expect(ctrl.isPressed('a')).to.be.false;
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/toggle-group/controller/toggle-group.controller.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Write the implementation**

```ts
// src/components/toggle-group/controller/toggle-group.controller.ts
import type { ToggleGroupHostSnapshot } from '../types.js';

/**
 * Pure state and action resolution for the toggle group.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class ToggleGroupController {
  public pressedValues = new Set<string>();

  private isControlled = false;
  private isSeeded = false;
  private multiple = false;
  private disabled = false;

  public syncFromHost(snapshot: ToggleGroupHostSnapshot): void {
    this.multiple = snapshot.multiple;
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.value !== undefined;

    if (this.isControlled) {
      this.pressedValues = new Set(snapshot.value);
    } else if (!this.isSeeded && snapshot.defaultValue.length > 0) {
      this.pressedValues = new Set(snapshot.defaultValue);
      this.isSeeded = true;
    }
  }

  /** Returns the new value set, or null if the action was blocked. */
  public requestToggle(value: string, toggleDisabled: boolean): string[] | null {
    if (this.disabled || toggleDisabled) return null;

    const isCurrentlyPressed = this.pressedValues.has(value);
    let nextValues: Set<string>;

    if (isCurrentlyPressed) {
      nextValues = new Set(this.pressedValues);
      nextValues.delete(value);
    } else {
      nextValues = this.multiple
        ? new Set([...this.pressedValues, value])
        : new Set([value]);
    }

    if (!this.isControlled) {
      this.pressedValues = nextValues;
    }

    return Array.from(nextValues);
  }

  public isPressed(value: string): boolean {
    return this.pressedValues.has(value);
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/toggle-group/controller/toggle-group.controller.test.ts
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/toggle-group/controller/
git commit -m "feat(toggle-group): add controller with single/multiple/controlled logic"
```

---

## Task 4: Registry

**Files:**
- Create: `src/components/toggle-group/registry/toggle-group.registry.ts`
- Create: `src/components/toggle-group/registry/toggle-group.registry.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/toggle-group/registry/toggle-group.registry.test.ts
import { expect, describe, it, beforeEach } from 'vitest';
import { ToggleGroupRegistry } from './toggle-group.registry.js';

describe('ToggleGroupRegistry', () => {
  let registry: ToggleGroupRegistry;
  let a: HTMLElement;
  let b: HTMLElement;

  beforeEach(() => {
    registry = new ToggleGroupRegistry();
    a = document.createElement('div');
    b = document.createElement('div');
    document.body.append(a, b);
  });

  it('starts empty', () => {
    expect(registry.toggles).to.have.lengthOf(0);
  });

  it('registers a toggle', () => {
    registry.register(a, 'a');
    expect(registry.toggles).to.have.lengthOf(1);
    expect(registry.toggles[0].element).to.equal(a);
    expect(registry.toggles[0].value).to.equal('a');
  });

  it('unregisters a toggle', () => {
    registry.register(a, 'a');
    registry.unregister(a);
    expect(registry.toggles).to.have.lengthOf(0);
  });

  it('maintains DOM order', () => {
    registry.register(b, 'b');
    registry.register(a, 'a');
    expect(registry.toggles[0].element).to.equal(a);
    expect(registry.toggles[1].element).to.equal(b);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/toggle-group/registry/toggle-group.registry.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Write the implementation**

```ts
// src/components/toggle-group/registry/toggle-group.registry.ts
import { OrderedRegistry } from '../../../utils/ordered-registry.js';
import type { OrderedRecord } from '../../../utils/ordered-registry.js';

export interface ToggleGroupRecord extends OrderedRecord {
  value: string;
}

/**
 * Ordered child tracking for registered `<grund-toggle>` elements.
 * @internal
 */
export class ToggleGroupRegistry extends OrderedRegistry<ToggleGroupRecord> {
  public get toggles(): readonly ToggleGroupRecord[] {
    return this.entries;
  }

  public register(toggle: HTMLElement, value: string): void {
    this.insert({ element: toggle, value });
  }

  public unregister(toggle: HTMLElement): void {
    this.remove((r) => r.element === toggle);
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/toggle-group/registry/toggle-group.registry.test.ts
```

Expected: All PASS

- [ ] **Step 5: Write the registry barrel**

```ts
// src/components/toggle-group/registry/checkbox.ts
export { ToggleGroupRegistry } from './toggle-group.registry.js';
export type { ToggleGroupRecord } from './toggle-group.registry.js';
```

- [ ] **Step 6: Commit**

```bash
git add src/components/toggle-group/registry/
git commit -m "feat(toggle-group): add registry"
```

---

## Task 5: Root Element

**Files:**
- Create: `src/components/toggle-group/root/checkbox.ts`
- Create: `src/components/toggle-group/root/toggle-group.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/toggle-group/root/toggle-group.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/index.js';

import '../../../components/toggle-group/root/index.js';
import '../../../components/toggle/root/index.js';

import type { GrundToggleGroup } from './index.js';
import type { GrundToggle } from '../../toggle/root/index.js';

describe('GrundToggleGroup', () => {
  async function setup(
    template = html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
        <grund-toggle value="c">C</grund-toggle>
      </grund-toggle-group>
    `,
  ) {
    const el = await fixture<GrundToggleGroup>(template);
    await flush(el);
    return el;
  }

  it('renders with default properties', async () => {
    const el = await setup();
    expect(el.multiple).to.be.false;
    expect(el.disabled).to.be.false;
    expect(el.orientation).to.equal('horizontal');
    expect(el.loop).to.be.true;
  });

  it('sets data-orientation attribute', async () => {
    const el = await setup();
    expect(el.dataset.orientation).to.equal('horizontal');
  });

  it('sets data-orientation for vertical', async () => {
    const el = await setup(html`
      <grund-toggle-group orientation="vertical">
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    expect(el.dataset.orientation).to.equal('vertical');
  });

  it('sets data-disabled when disabled', async () => {
    const el = await setup(html`
      <grund-toggle-group disabled>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    expect(el.hasAttribute('data-disabled')).to.be.true;
  });

  it('sets data-multiple when multiple', async () => {
    const el = await setup(html`
      <grund-toggle-group multiple>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    expect(el.hasAttribute('data-multiple')).to.be.true;
  });

  it('reflects defaultValue on children via data-pressed', async () => {
    const el = await setup(html`
      <grund-toggle-group .defaultValue=${['a']}>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    expect(toggles[0].hasAttribute('data-pressed')).to.be.true;
    expect(toggles[1].hasAttribute('data-pressed')).to.be.false;
  });

  it('pressing a toggle fires grund-value-change', async () => {
    const el = await setup();
    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    const events: CustomEvent[] = [];
    el.addEventListener('grund-value-change', (e) => events.push(e as CustomEvent));

    toggles[0].shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(events).to.have.lengthOf(1);
    expect(events[0].detail.value).to.deep.equal(['a']);
  });

  it('group disabled overrides toggle disabled state', async () => {
    const el = await setup(html`
      <grund-toggle-group disabled>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    const toggle = el.querySelector<GrundToggle>('grund-toggle')!;
    await flush(el);
    // Toggle should reflect disabled state from group
    expect(toggle.hasAttribute('data-disabled')).to.be.true;
  });

  it('pressing a toggle fires grund-pressed-change on the toggle', async () => {
    const el = await setup();
    const toggle = el.querySelector<GrundToggle>('grund-toggle[value="a"]')!;
    const events: CustomEvent[] = [];
    toggle.addEventListener('grund-pressed-change', (e) => events.push(e as CustomEvent));

    toggle.shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(events).to.have.lengthOf(1);
    expect(events[0].detail.pressed).to.be.true;
  });

  it('in single mode pressing a new toggle unpresses the old one', async () => {
    const el = await setup(html`
      <grund-toggle-group .defaultValue=${['a']}>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    await flush(el);

    toggles[1].shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(toggles[0].hasAttribute('data-pressed')).to.be.false;
    expect(toggles[1].hasAttribute('data-pressed')).to.be.true;
  });

  it('warns in dev mode when a child toggle has no value', async () => {
    const warns: unknown[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warns.push(args);
    try {
      await fixture<GrundToggleGroup>(html`
        <grund-toggle-group>
          <grund-toggle>No value</grund-toggle>
        </grund-toggle-group>
      `);
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      console.warn = orig;
    }
    // Dev-mode warning should have been emitted
    expect(warns.some((w) => String(w).includes('grund-toggle'))).to.be.true;
  });

  it('warns in dev mode when two child toggles share the same value', async () => {
    const warns: unknown[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warns.push(args);
    try {
      await fixture<GrundToggleGroup>(html`
        <grund-toggle-group>
          <grund-toggle value="a">A</grund-toggle>
          <grund-toggle value="a">A dup</grund-toggle>
        </grund-toggle-group>
      `);
      await new Promise((r) => setTimeout(r, 50));
    } finally {
      console.warn = orig;
    }
    expect(warns.some((w) => String(w).includes('Duplicate'))).to.be.true;
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/toggle-group/root/toggle-group.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Write the root element**

```ts
// src/components/toggle-group/root/checkbox.ts
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { RovingFocusController } from '../../../controllers/roving-focus.controller.js';
import { ToggleGroupController } from '../controller/toggle-group.controller.js';
import { ToggleGroupRegistry } from '../registry/toggle-group.registry.js';
import { toggleGroupRootContext } from '../context/toggle-group.context.js';

import type { ToggleGroupRootContext } from '../context/toggle-group.context.js';
import type { ToggleGroupHostSnapshot, ToggleGroupValueChangeDetail } from '../types.js';

/**
 * Root toggle group container. Manages selection state across child `<grund-toggle>` elements.
 *
 * @element grund-toggle-group
 * @slot - `<grund-toggle>` children
 * @fires {CustomEvent<ToggleGroupValueChangeDetail>} grund-value-change - When the set of pressed toggles changes
 * @csspart group - The inner container element
 */
export class GrundToggleGroup extends LitElement {
  public static override styles = css`
    :host { display: inline-flex; }
  `;

  /**
   * The controlled set of pressed toggle values.
   * Setting this enables controlled mode — the element fires `grund-value-change`
   * but does not update internal state; the consumer must reflect the new value back.
   */
  @property({ type: Array, hasChanged: () => true })
  public value: string[] | undefined = undefined;

  /** Initial pressed values for uncontrolled mode. Ignored after the first render. */
  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  public defaultValue: string[] = [];

  /** Whether multiple toggles can be pressed simultaneously. */
  @property({ type: Boolean }) public multiple = false;

  /** Whether all toggles in the group are disabled. */
  @property({ type: Boolean }) public disabled = false;

  /** Orientation used for keyboard navigation arrow keys. */
  @property() public orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Whether keyboard navigation wraps from last to first and vice versa. */
  @property({ type: Boolean }) public loop = true;

  @provide({ context: toggleGroupRootContext })
  @state()
  protected rootCtx!: ToggleGroupRootContext;

  private readonly controller = new ToggleGroupController();
  private readonly registry = new ToggleGroupRegistry();

  // rovingFocus declared before callbacks so `this.rovingFocus` is initialized when
  // _registerToggle / _unregisterToggle are first called.
  private readonly rovingFocus = new RovingFocusController(this, {
    orientation: 'horizontal',
    loop: true,
    getItems: () =>
      this.registry.toggles
        .map((r) => r.element.shadowRoot?.querySelector<HTMLElement>('[part="button"]') ?? null)
        .filter((btn): btn is HTMLElement => btn !== null),
  });

  // Stable bound callbacks — defined as class fields so object identity is preserved across
  // createRootContext() calls, preventing unnecessary consumer re-renders.
  private readonly _isPressed = (value: string) => this.controller.isPressed(value);

  private readonly _requestToggle = (value: string, toggleDisabled: boolean): boolean | null => {
    return this.handleToggle(value, toggleDisabled);
  };

  private readonly _registerToggle = (toggle: HTMLElement, value: string): void => {
    if (import.meta.env.DEV) {
      if (!value) {
        console.warn(
          '[grund-toggle-group] A child <grund-toggle> has no value prop. ' +
            'Each toggle inside a group must have a unique value.',
        );
      } else if (this.registry.toggles.some((r) => r.value === value)) {
        console.warn(
          `[grund-toggle-group] Duplicate value "${value}" detected. ` +
            'Each toggle inside a group must have a unique value.',
        );
      }
    }
    this.registry.register(toggle, value);
    this.rovingFocus.sync();
  };

  private readonly _unregisterToggle = (toggle: HTMLElement): void => {
    this.registry.unregister(toggle);
    this.rovingFocus.sync();
  };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: ToggleGroupHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      multiple: this.multiple,
      disabled: this.disabled,
    };
    this.controller.syncFromHost(snapshot);

    this.rovingFocus.update({
      orientation: this.orientation,
      loop: this.loop,
    });

    this.dataset.orientation = this.orientation;
    this.toggleAttribute('data-disabled', this.disabled);
    this.toggleAttribute('data-multiple', this.multiple);

    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('multiple') ||
      changed.has('disabled') ||
      changed.has('orientation')
    ) {
      this.rootCtx = this.createRootContext();
    }
  }

  private createRootContext(): ToggleGroupRootContext {
    return {
      isPressed: this._isPressed,
      disabled: this.disabled,
      requestToggle: this._requestToggle,
      registerToggle: this._registerToggle,
      unregisterToggle: this._unregisterToggle,
    };
  }

  /** Returns the resolved pressed state for the toggled item, or null if blocked. */
  private handleToggle(value: string, toggleDisabled: boolean): boolean | null {
    const result = this.controller.requestToggle(value, toggleDisabled);
    if (result === null) return null;

    const newPressed = result.includes(value);

    this.dispatchEvent(
      new CustomEvent<ToggleGroupValueChangeDetail>('grund-value-change', {
        detail: { value: result },
        bubbles: true,
        composed: false,
      }),
    );

    // Recreate context — internal controller state changed without a reactive prop change.
    this.rootCtx = this.createRootContext();

    return newPressed;
  }

  protected override render() {
    return html`<div part="group" role="group"><slot></slot></div>`;
  }
}

if (!customElements.get('grund-toggle-group')) {
  customElements.define('grund-toggle-group', GrundToggleGroup);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/toggle-group/root/toggle-group.test.ts
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/toggle-group/root/checkbox.ts src/components/toggle-group/root/toggle-group.test.ts
git commit -m "feat(toggle-group): add root element with controller, registry, and context"
```

---

## Task 6: Controlled Mode and Multiple Mode Tests

**Files:**
- Create: `src/components/toggle-group/root/toggle-group-controlled.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/toggle-group/root/toggle-group-controlled.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush } from '../../../test-utils/index.js';

import '../../../components/toggle-group/root/index.js';
import '../../../components/toggle/root/index.js';

import type { GrundToggleGroup } from './index.js';
import type { GrundToggle } from '../../toggle/root/index.js';

describe('ToggleGroup Controlled Mode', () => {
  it('does not update pressed state without consumer updating value', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group .value=${[]}>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    el.querySelector<GrundToggle>('grund-toggle')!.shadowRoot!.querySelector('button')!.click();
    await flush(el);

    const toggle = el.querySelector<GrundToggle>('grund-toggle')!;
    expect(toggle.hasAttribute('data-pressed')).to.be.false;
  });

  it('reflects value when consumer updates it', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group .value=${[]}>
        <grund-toggle value="a">A</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    el.value = ['a'];
    await flush(el);

    const toggle = el.querySelector<GrundToggle>('grund-toggle')!;
    expect(toggle.hasAttribute('data-pressed')).to.be.true;
  });
});

describe('ToggleGroup Multiple Mode', () => {
  it('allows multiple toggles pressed simultaneously', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group multiple .defaultValue=${['a']}>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);

    const toggles = el.querySelectorAll<GrundToggle>('grund-toggle');
    toggles[1].shadowRoot!.querySelector('button')!.click();
    await flush(el);

    expect(toggles[0].hasAttribute('data-pressed')).to.be.true;
    expect(toggles[1].hasAttribute('data-pressed')).to.be.true;
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/components/toggle-group/root/toggle-group-controlled.test.ts
```

Expected: All PASS (root element is already implemented)

- [ ] **Step 3: Commit**

```bash
git add src/components/toggle-group/root/toggle-group-controlled.test.ts
git commit -m "test(toggle-group): add controlled mode and multiple mode tests"
```

---

## Task 7: Modify GrundToggle for Group Support

This is the most significant modification. `<grund-toggle>` needs to optionally consume `ToggleGroupRootContext` and delegate to the group when present.

**Files:**
- Modify: `src/components/toggle/root/checkbox.ts`

**Key behavioral changes when inside a group:**
- `effectivePressed` reads from `ctx.isPressed(this.value)` instead of internal state
- `effectiveDisabled` is `this.disabled || ctx.disabled`
- On click: calls `ctx.requestToggle(this.value, this.disabled)` and fires `grund-pressed-change`
- Button renders `aria-disabled` instead of native `disabled` (so `RovingFocusController` can skip disabled items via `ariaDisabled === 'true'`)
- Registers/unregisters itself with the group via context callbacks

- [ ] **Step 1: Write the modified file**

```ts
// src/components/toggle/root/checkbox.ts
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { toggleGroupRootContext } from '../../toggle-group/context/toggle-group.context.js';
import type { ToggleGroupRootContext } from '../../toggle-group/context/toggle-group.context.js';
import type { PressedChangeDetail } from '../types.js';

/**
 * A standalone pressable toggle button with `aria-pressed` state.
 * Also the primitive element used inside `<grund-toggle-group>`.
 *
 * @element grund-toggle
 * @slot - Button label content
 * @fires {CustomEvent<PressedChangeDetail>} grund-pressed-change - When pressed state changes
 * @csspart button - The inner button element
 */
export class GrundToggle extends LitElement {
  public static override styles = css`
    :host { display: inline; /* inline: toggle wraps an inline button element */ }
  `;

  /**
   * Whether the toggle is pressed. Setting this enables controlled mode.
   * In controlled mode the element fires `grund-pressed-change` but does not
   * update internal state — the consumer must reflect the new value back.
   * Has no effect when inside `<grund-toggle-group>` (group owns pressed state).
   */
  @property({ type: Boolean })
  public pressed: boolean | undefined = undefined;

  /**
   * Initial pressed state for uncontrolled mode. Ignored after the first render.
   * Has no effect when inside `<grund-toggle-group>`.
   */
  @property({ type: Boolean, attribute: 'default-pressed' })
  public defaultPressed = false;

  /**
   * Identifier for this toggle. Has no effect on the standalone element;
   * used by `<grund-toggle-group>` to identify which item is pressed.
   */
  @property()
  public value = '';

  /** Whether the toggle is disabled. */
  @property({ type: Boolean })
  public disabled = false;

  @state()
  private internalPressed = false;

  // Optionally consumed — undefined when toggle is standalone.
  @consume({ context: toggleGroupRootContext, subscribe: true })
  @state()
  private _groupCtx: ToggleGroupRootContext | undefined = undefined;

  private _isRegistered = false;

  private get effectivePressed(): boolean {
    if (this._groupCtx) return this._groupCtx.isPressed(this.value);
    return this.pressed ?? this.internalPressed;
  }

  private get effectiveDisabled(): boolean {
    if (this._groupCtx) return this.disabled || this._groupCtx.disabled;
    return this.disabled;
  }

  protected override willUpdate(_changed: Map<PropertyKey, unknown>): void {
    // Seed internal state from defaultPressed on first render only (standalone mode).
    if (!this.hasUpdated && !this._groupCtx) {
      this.internalPressed = this.defaultPressed;
    }

    this.toggleAttribute('data-pressed', this.effectivePressed);
    this.toggleAttribute('data-disabled', this.effectiveDisabled);
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    // Handle group context arriving or changing.
    if (changed.has('_groupCtx')) {
      const prev = changed.get('_groupCtx') as ToggleGroupRootContext | undefined;
      if (prev && this._isRegistered) {
        prev.unregisterToggle(this);
        this._isRegistered = false;
      }
      if (this._groupCtx) {
        if (import.meta.env.DEV && !this.value) {
          console.warn(
            '[grund-toggle] No value prop set on <grund-toggle> inside a <grund-toggle-group>. ' +
              'Each toggle inside a group must have a unique value prop.',
          );
        }
        this._groupCtx.registerToggle(this, this.value);
        this._isRegistered = true;
      }
    }

    // Re-register if value changes while already in a group.
    if (changed.has('value') && this._groupCtx && this._isRegistered) {
      this._groupCtx.unregisterToggle(this);
      this._groupCtx.registerToggle(this, this.value);
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._isRegistered && this._groupCtx) {
      this._groupCtx.unregisterToggle(this);
      this._isRegistered = false;
    }
  }

  private handleClick(): void {
    if (this.effectiveDisabled) return;

    if (this._groupCtx) {
      // Delegate state resolution to the group.
      // requestToggle returns the resolved pressed state for this specific toggle,
      // which may differ from !effectivePressed in single mode (e.g. group blocks deselect).
      const resolvedPressed = this._groupCtx.requestToggle(this.value, this.disabled);
      if (resolvedPressed === null) return;

      this.dispatchEvent(
        new CustomEvent<PressedChangeDetail>('grund-pressed-change', {
          detail: { pressed: resolvedPressed },
          bubbles: true,
          composed: false,
        }),
      );
      return;
    }

    // Standalone mode: manage own internal state.
    const newPressed = !this.effectivePressed;
    if (this.pressed === undefined) {
      this.internalPressed = newPressed;
    }

    this.dispatchEvent(
      new CustomEvent<PressedChangeDetail>('grund-pressed-change', {
        detail: { pressed: newPressed },
        bubbles: true,
        composed: false,
      }),
    );
  }

  protected override render() {
    const inGroup = Boolean(this._groupCtx);
    return html`
      <button
        part="button"
        type="button"
        ?disabled=${!inGroup && this.effectiveDisabled}
        aria-disabled=${inGroup ? String(this.effectiveDisabled) : nothing}
        aria-pressed=${String(this.effectivePressed)}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-toggle')) {
  customElements.define('grund-toggle', GrundToggle);
}
```

**Why `aria-disabled` instead of native `disabled` inside a group:**
`RovingFocusController` skips items via `ariaDisabled === 'true'`. Native `disabled` prevents `el.focus()` from working (browser no-ops it), so keyboard navigation would silently skip focus without moving. Using `aria-disabled` keeps the button focusable so the controller can skip it predictably.

- [ ] **Step 2: Run the existing toggle tests to confirm no regression**

```bash
npx vitest run src/components/toggle/
```

Expected: All PASS

- [ ] **Step 3: Run the toggle-group tests again to confirm the group integration works**

```bash
npx vitest run src/components/toggle-group/
```

Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/toggle/root/checkbox.ts
git commit -m "feat(toggle): add optional toggle-group context consumption for group support"
```

---

## Task 8: Keyboard Navigation Tests

**Files:**
- Create: `src/components/toggle-group/root/toggle-group-keyboard.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/toggle-group/root/toggle-group-keyboard.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { describe, it } from 'vitest';
import { flush, simulateKeyboard, getByPart } from '../../../test-utils/index.js';

import '../../../components/toggle-group/root/index.js';
import '../../../components/toggle/root/index.js';

import type { GrundToggleGroup } from './index.js';
import type { GrundToggle } from '../../toggle/root/index.js';

function getToggleButtons(el: GrundToggleGroup): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll<GrundToggle>('grund-toggle')).map((t) =>
    getByPart<HTMLButtonElement>(t, 'button'),
  );
}

function getActiveShadowButton(): Element | null {
  const host = document.activeElement;
  if (!host) return null;
  return host.shadowRoot?.activeElement ?? host;
}

describe('ToggleGroup Keyboard Navigation (horizontal)', () => {
  async function setup() {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
        <grund-toggle value="c">C</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);
    return el;
  }

  it('ArrowRight moves focus to next toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('ArrowLeft moves focus to previous toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowLeft');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('Home moves focus to first toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'Home');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('End moves focus to last toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'End');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });

  it('loops from last to first', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[2].focus();
    simulateKeyboard(buttons[2], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });

  it('skips disabled toggles', async () => {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group>
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b" disabled>B</grund-toggle>
        <grund-toggle value="c">C</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);
    const buttons = getToggleButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowRight');
    expect(getActiveShadowButton()).to.equal(buttons[2]);
  });
});

describe('ToggleGroup Keyboard Navigation (vertical)', () => {
  async function setup() {
    const el = await fixture<GrundToggleGroup>(html`
      <grund-toggle-group orientation="vertical">
        <grund-toggle value="a">A</grund-toggle>
        <grund-toggle value="b">B</grund-toggle>
      </grund-toggle-group>
    `);
    await flush(el);
    return el;
  }

  it('ArrowDown moves focus to next toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[0].focus();
    simulateKeyboard(buttons[0], 'ArrowDown');
    expect(getActiveShadowButton()).to.equal(buttons[1]);
  });

  it('ArrowUp moves focus to previous toggle', async () => {
    const el = await setup();
    const buttons = getToggleButtons(el);
    buttons[1].focus();
    simulateKeyboard(buttons[1], 'ArrowUp');
    expect(getActiveShadowButton()).to.equal(buttons[0]);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/components/toggle-group/root/toggle-group-keyboard.test.ts
```

Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/toggle-group/root/toggle-group-keyboard.test.ts
git commit -m "test(toggle-group): add keyboard navigation tests"
```

---

## Task 9: Barrel Export and Package Index

**Files:**
- Create: `src/components/toggle-group/checkbox.ts`
- Modify: `src/checkbox.ts`

- [ ] **Step 1: Write the barrel**

```ts
// src/components/toggle-group/checkbox.ts
export { GrundToggleGroup } from './root/index.js';
export type { ToggleGroupValueChangeDetail } from './types.js';
```

- [ ] **Step 2: Add to package index**

Edit `src/checkbox.ts` to add:
```ts
export * from './components/toggle-group/index.js';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/toggle-group/checkbox.ts src/checkbox.ts
git commit -m "feat(toggle-group): export from package index"
```

---

## Task 10: Storybook Stories

**Files:**
- Create: `stories/toggle-group.stories.ts`

- [ ] **Step 1: Write the stories**

```ts
// stories/toggle-group.stories.ts
import { html } from 'lit';
import { action } from 'storybook/actions';

import type { Meta, StoryObj } from '@storybook/web-components';
import type { GrundToggleGroup } from '../src/components/toggle-group/index.js';
import type { ToggleGroupValueChangeDetail } from '../src/components/toggle-group/index.js';

import '../src/components/toggle-group/index.js';
import '../src/components/toggle/index.js';

const onValueChange = (e: CustomEvent<ToggleGroupValueChangeDetail>) =>
  action('grund-value-change')(e.detail.value);

const meta: Meta<GrundToggleGroup> = {
  title: 'Components/ToggleGroup',
  component: 'grund-toggle-group',
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
    loop: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<GrundToggleGroup>;

export const Default: Story = {
  name: 'Default (single, uncontrolled)',
  args: { multiple: false, disabled: false, orientation: 'horizontal', loop: true },
  render: (args) => html`
    <grund-toggle-group
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      orientation=${args.orientation}
      ?loop=${args.loop}
      @grund-value-change=${onValueChange}
    >
      <grund-toggle value="bold">Bold</grund-toggle>
      <grund-toggle value="italic">Italic</grund-toggle>
      <grund-toggle value="underline">Underline</grund-toggle>
    </grund-toggle-group>
  `,
};

export const Multiple: Story = {
  name: 'Multiple selection',
  render: () => html`
    <grund-toggle-group multiple @grund-value-change=${onValueChange}>
      <grund-toggle value="bold">Bold</grund-toggle>
      <grund-toggle value="italic">Italic</grund-toggle>
      <grund-toggle value="underline">Underline</grund-toggle>
    </grund-toggle-group>
  `,
};

export const DefaultValue: Story = {
  name: 'Default value (uncontrolled)',
  render: () => html`
    <grund-toggle-group .defaultValue=${['italic']} @grund-value-change=${onValueChange}>
      <grund-toggle value="bold">Bold</grund-toggle>
      <grund-toggle value="italic">Italic</grund-toggle>
      <grund-toggle value="underline">Underline</grund-toggle>
    </grund-toggle-group>
  `,
};

export const Controlled: Story = {
  name: 'Controlled',
  render: () => html`
    <div>
      <grund-toggle-group
        id="ctrl-group"
        .value=${['bold']}
        @grund-value-change=${(e: CustomEvent<ToggleGroupValueChangeDetail>) => {
          action('grund-value-change')(e.detail.value);
          const el = document.getElementById('ctrl-group') as GrundToggleGroup;
          if (el) el.value = e.detail.value;
          const status = document.getElementById('ctrl-status');
          if (status) status.textContent = `Value: [${e.detail.value.join(', ')}]`;
        }}
      >
        <grund-toggle value="bold">Bold</grund-toggle>
        <grund-toggle value="italic">Italic</grund-toggle>
        <grund-toggle value="underline">Underline</grund-toggle>
      </grund-toggle-group>
      <p id="ctrl-status">Value: [bold]</p>
    </div>
  `,
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => html`
    <grund-toggle-group disabled .defaultValue=${['bold']}>
      <grund-toggle value="bold">Bold</grund-toggle>
      <grund-toggle value="italic">Italic</grund-toggle>
    </grund-toggle-group>
  `,
};

export const Vertical: Story = {
  name: 'Vertical orientation',
  render: () => html`
    <grund-toggle-group orientation="vertical" @grund-value-change=${onValueChange}>
      <grund-toggle value="top">Align Top</grund-toggle>
      <grund-toggle value="middle">Align Middle</grund-toggle>
      <grund-toggle value="bottom">Align Bottom</grund-toggle>
    </grund-toggle-group>
  `,
};
```

- [ ] **Step 2: Commit**

```bash
git add stories/toggle-group.stories.ts
git commit -m "feat(toggle-group): add Storybook stories"
```

---

## Task 11: Validate Build

Use the `/validate-build` skill for the full CEM, export surface, lint, build, and bundle-size checks.

- [ ] **Step 1: Run all tests first**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 2: Run `/validate-build`**

Invoke the `/validate-build` skill. It runs lint, build, CEM generation, export checks, and bundle size.

Expected: All checks pass

- [ ] **Step 3: Fix any errors** before proceeding. Commit fixes:

```bash
git add -p
git commit -m "fix(toggle-group): address build/lint issues"
```
