# Grund UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the Grund UI project and implement the Accordion as the first reference component with full a11y, keyboard navigation, and test coverage.

**Architecture:** Three-layer (Utilities → Reactive Controllers → Custom Elements). Shadow DOM with zero visual styles. Compound component pattern. Lit Context for parent-child communication. See `docs/plans/2026-03-15-grund-ui-design.md` for full design.

**Tech Stack:** Lit 3, TypeScript 5, Vite 8 (library mode), Vitest 3 (browser mode + Playwright), Storybook 9, CEM Analyzer, ESLint 9 + eslint-plugin-lit, Prettier.

---

## Task 1: Initialize the project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.prettierrc`

**Step 1: Initialize git repo**

Run: `git init`

**Step 2: Create package.json**

```json
{
  "name": "grund-ui",
  "version": "0.0.1",
  "description": "A headless, accessible Web Component library built with Lit",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./accordion": "./dist/components/accordion/index.js"
  },
  "customElements": "custom-elements.json",
  "files": [
    "dist",
    "custom-elements.json"
  ],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:run": "vitest run",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lint": "eslint src/",
    "format": "prettier --write \"src/**/*.ts\"",
    "analyze": "cem analyze --litelement"
  },
  "keywords": ["web-components", "lit", "headless", "accessible", "a11y"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/user/grund-ui"
  }
}
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
custom-elements.json
storybook-static/
*.tsbuildinfo
.DS_Store
```

**Step 4: Create .prettierrc**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
```

**Step 5: Commit**

```bash
git add package.json .gitignore .prettierrc
git commit -m "chore: initialize grund-ui project"
```

---

## Task 2: Install dependencies and configure TypeScript

**Files:**
- Modify: `package.json` (via npm install)
- Create: `tsconfig.json`

**Step 1: Install production dependencies**

Run: `npm install lit @lit/context`

**Step 2: Install dev dependencies — build tooling**

Run: `npm install -D typescript vite @custom-elements-manifest/analyzer`

**Step 3: Install dev dependencies — testing**

Run: `npm install -D vitest @vitest/browser playwright @open-wc/testing`

**Step 4: Install dev dependencies — linting and formatting**

Run: `npm install -D eslint @eslint/js typescript-eslint eslint-plugin-lit prettier`

**Step 5: Install dev dependencies — Storybook**

Run: `npx storybook@latest init --type web_components_vite --skip-install && npm install`

Note: If `storybook init` prompts, select "web-components-vite" framework. If it fails with Vite 8, install manually:

```bash
npm install -D @storybook/web-components-vite @storybook/addon-essentials @storybook/blocks storybook
```

**Step 6: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.stories.ts"]
}
```

Key: `useDefineForClassFields: false` is required for Lit decorators to work correctly.

**Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "chore: install dependencies and configure TypeScript"
```

---

## Task 3: Configure Vite, Vitest, and ESLint

**Files:**
- Create: `vite.config.ts`
- Create: `eslint.config.js`

**Step 1: Create vite.config.ts**

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
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
  },
});
```

**Step 2: Create eslint.config.js**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import litPlugin from 'eslint-plugin-lit';

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
    ignores: ['dist/', 'node_modules/', 'storybook-static/', '*.config.*'],
  },
];
```

**Step 3: Verify lint runs**

Run: `npx eslint src/ --no-error-on-unmatched-pattern`
Expected: No errors (no files to lint yet)

**Step 4: Commit**

```bash
git add vite.config.ts eslint.config.js
git commit -m "chore: configure Vite 8 library mode, Vitest browser mode, and ESLint"
```

---

## Task 4: Configure Storybook and CEM

**Files:**
- Create or modify: `.storybook/main.ts`
- Create: `.storybook/preview.ts`
- Create: `custom-elements-manifest.config.mjs`

**Step 1: Configure .storybook/main.ts**

If storybook init created this file, replace its contents. Otherwise create it:

```ts
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
};

export default config;
```

**Step 2: Create .storybook/preview.ts**

```ts
import type { Preview } from '@storybook/web-components';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

**Step 3: Create custom-elements-manifest.config.mjs**

```js
export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.stories.ts', '**/*.styles.ts', '**/*.controller.ts'],
  outdir: '.',
  litelement: true,
};
```

**Step 4: Verify Storybook starts**

Run: `npx storybook dev -p 6006 --no-open`
Expected: Storybook starts without errors (may show "no stories found" warning — that's fine)

Stop it with Ctrl+C after verifying.

**Step 5: Commit**

```bash
git add .storybook/ custom-elements-manifest.config.mjs
git commit -m "chore: configure Storybook 9 and Custom Elements Manifest"
```

---

## Task 5: Create utility layer (Layer 1)

**Files:**
- Create: `src/utils/id.ts`
- Create: `src/utils/keyboard.ts`
- Create: `src/utils/id.test.ts`
- Create: `src/utils/keyboard.test.ts`

**Step 1: Write failing test for unique ID generation**

Create `src/utils/id.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateId } from './id.js';

describe('generateId', () => {
  it('generates a string with the given prefix', () => {
    const id = generateId('trigger');
    expect(id).toMatch(/^trigger-/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId('test')));
    expect(ids.size).toBe(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/id.test.ts`
Expected: FAIL — `generateId` not found

**Step 3: Implement generateId**

Create `src/utils/id.ts`:

```ts
let counter = 0;

export function generateId(prefix: string): string {
  return `${prefix}-${++counter}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/id.test.ts`
Expected: PASS

**Step 5: Write failing test for keyboard utilities**

Create `src/utils/keyboard.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Keys } from './keyboard.js';

describe('Keys', () => {
  it('exports standard key constants', () => {
    expect(Keys.ENTER).toBe('Enter');
    expect(Keys.SPACE).toBe(' ');
    expect(Keys.ESCAPE).toBe('Escape');
    expect(Keys.ARROW_DOWN).toBe('ArrowDown');
    expect(Keys.ARROW_UP).toBe('ArrowUp');
    expect(Keys.HOME).toBe('Home');
    expect(Keys.END).toBe('End');
  });
});
```

**Step 6: Run test to verify it fails**

Run: `npx vitest run src/utils/keyboard.test.ts`
Expected: FAIL — `Keys` not found

**Step 7: Implement keyboard utilities**

Create `src/utils/keyboard.ts`:

```ts
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;
```

**Step 8: Run test to verify it passes**

Run: `npx vitest run src/utils/keyboard.test.ts`
Expected: PASS

**Step 9: Commit**

```bash
git add src/utils/
git commit -m "feat: add utility layer — ID generation and keyboard constants"
```

---

## Task 6: Create Accordion context (Lit Context)

**Files:**
- Create: `src/context/accordion.context.ts`

**Step 1: Create the Accordion context definition**

Create `src/context/accordion.context.ts`:

```ts
import { createContext } from '@lit/context';

export interface AccordionContextValue {
  type: 'single' | 'multiple';
  disabled: boolean;
  collapsible: boolean;
  expandedItems: Set<string>;
  toggle: (value: string) => void;
}

export const accordionContext = createContext<AccordionContextValue>('grund-accordion');

export interface AccordionItemContextValue {
  value: string;
  disabled: boolean;
  expanded: boolean;
  triggerId: string;
  panelId: string;
}

export const accordionItemContext = createContext<AccordionItemContextValue>('grund-accordion-item');
```

**Step 2: Commit**

```bash
git add src/context/
git commit -m "feat: add Lit Context definitions for Accordion"
```

---

## Task 7: Create AccordionController (Layer 2)

**Files:**
- Create: `src/components/accordion/accordion.controller.ts`
- Create: `src/components/accordion/accordion.controller.test.ts`

**Step 1: Write failing test for AccordionController**

Create `src/components/accordion/accordion.controller.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { AccordionController } from './accordion.controller.js';

// Minimal mock host for controller tests
function createMockHost() {
  const host = {
    addController: vi.fn(),
    requestUpdate: vi.fn(),
    removeEventListener: vi.fn(),
    addEventListener: vi.fn(),
  };
  return host;
}

describe('AccordionController', () => {
  it('initializes with no expanded items', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as any);
    expect(ctrl.expandedItems.size).toBe(0);
  });

  it('toggles an item in single mode', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as any, { type: 'single' });
    ctrl.toggle('item-1');
    expect(ctrl.expandedItems.has('item-1')).toBe(true);
  });

  it('collapses previous item in single mode', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as any, { type: 'single' });
    ctrl.toggle('item-1');
    ctrl.toggle('item-2');
    expect(ctrl.expandedItems.has('item-1')).toBe(false);
    expect(ctrl.expandedItems.has('item-2')).toBe(true);
  });

  it('does not collapse in single mode when collapsible is false', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as any, { type: 'single', collapsible: false });
    ctrl.toggle('item-1');
    ctrl.toggle('item-1');
    expect(ctrl.expandedItems.has('item-1')).toBe(true);
  });

  it('collapses in single mode when collapsible is true', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as any, { type: 'single', collapsible: true });
    ctrl.toggle('item-1');
    ctrl.toggle('item-1');
    expect(ctrl.expandedItems.has('item-1')).toBe(false);
  });

  it('toggles independently in multiple mode', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as any, { type: 'multiple' });
    ctrl.toggle('item-1');
    ctrl.toggle('item-2');
    expect(ctrl.expandedItems.has('item-1')).toBe(true);
    expect(ctrl.expandedItems.has('item-2')).toBe(true);
  });

  it('does not toggle a disabled item', () => {
    const host = createMockHost();
    const ctrl = new AccordionController(host as any);
    ctrl.setDisabledItems(new Set(['item-1']));
    ctrl.toggle('item-1');
    expect(ctrl.expandedItems.has('item-1')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/accordion/accordion.controller.test.ts`
Expected: FAIL — `AccordionController` not found

**Step 3: Implement AccordionController**

Create `src/components/accordion/accordion.controller.ts`:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface AccordionControllerOptions {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
}

export class AccordionController implements ReactiveController {
  private host: ReactiveControllerHost;
  private type: 'single' | 'multiple';
  private collapsible: boolean;
  private disabledItems = new Set<string>();

  expandedItems = new Set<string>();

  constructor(host: ReactiveControllerHost, options: AccordionControllerOptions = {}) {
    this.host = host;
    this.type = options.type ?? 'single';
    this.collapsible = options.collapsible ?? false;
    this.host.addController(this);
  }

  hostConnected() {}

  updateOptions(options: AccordionControllerOptions) {
    if (options.type !== undefined) this.type = options.type;
    if (options.collapsible !== undefined) this.collapsible = options.collapsible;
  }

  setDisabledItems(disabled: Set<string>) {
    this.disabledItems = disabled;
  }

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

  isExpanded(value: string): boolean {
    return this.expandedItems.has(value);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/accordion/accordion.controller.test.ts`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
git add src/components/accordion/accordion.controller.ts src/components/accordion/accordion.controller.test.ts
git commit -m "feat: add AccordionController with single/multiple mode, collapsible, disabled"
```

---

## Task 8: Create Accordion styles (functional CSS only)

**Files:**
- Create: `src/components/accordion/accordion.styles.ts`

**Step 1: Create functional styles**

Create `src/components/accordion/accordion.styles.ts`:

```ts
import { css } from 'lit';

export const accordionStyles = css`
  :host {
    display: block;
  }
`;

export const accordionItemStyles = css`
  :host {
    display: block;
  }
`;

export const accordionHeaderStyles = css`
  :host {
    display: block;
  }

  [part='heading'] {
    margin: 0;
    padding: 0;
  }
`;

export const accordionTriggerStyles = css`
  :host {
    display: block;
  }

  [part='trigger'] {
    all: unset;
    display: flex;
    cursor: pointer;
    box-sizing: border-box;
    width: 100%;
  }

  [part='trigger']:focus-visible {
    outline: revert;
  }

  :host([disabled]) [part='trigger'] {
    cursor: default;
  }
`;

export const accordionPanelStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }
`;
```

**Step 2: Commit**

```bash
git add src/components/accordion/accordion.styles.ts
git commit -m "feat: add Accordion functional styles (zero visual opinions)"
```

---

## Task 9: Implement Accordion custom elements (Layer 3)

**Files:**
- Create: `src/components/accordion/accordion.ts`
- Create: `src/components/accordion/accordion-item.ts`
- Create: `src/components/accordion/accordion-header.ts`
- Create: `src/components/accordion/accordion-trigger.ts`
- Create: `src/components/accordion/accordion-panel.ts`
- Create: `src/components/accordion/index.ts`
- Create: `src/index.ts`

**Step 1: Create `<grund-accordion>` root element**

Create `src/components/accordion/accordion.ts`:

```ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { AccordionController } from './accordion.controller.js';
import { accordionContext, type AccordionContextValue } from '../../context/accordion.context.js';
import { accordionStyles } from './accordion.styles.js';

@customElement('grund-accordion')
export class GrundAccordion extends LitElement {
  static override styles = accordionStyles;

  @property({ type: String }) type: 'single' | 'multiple' = 'single';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) collapsible = false;
  @property() value?: string | string[];

  private controller = new AccordionController(this);

  @provide({ context: accordionContext })
  get accordionCtx(): AccordionContextValue {
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

**Step 2: Create `<grund-accordion-item>`**

Create `src/components/accordion/accordion-item.ts`:

```ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';
import {
  accordionContext,
  accordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from '../../context/accordion.context.js';
import { generateId } from '../../utils/id.js';
import { accordionItemStyles } from './accordion.styles.js';

@customElement('grund-accordion-item')
export class GrundAccordionItem extends LitElement {
  static override styles = accordionItemStyles;

  @property() value: string = generateId('accordion-item');
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) expanded = false;

  private triggerId = generateId('trigger');
  private panelId = generateId('panel');

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  @provide({ context: accordionItemContext })
  get itemCtx(): AccordionItemContextValue {
    this.expanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;
    return {
      value: this.value,
      disabled: this.disabled || (this.accordionCtx?.disabled ?? false),
      expanded: this.expanded,
      triggerId: this.triggerId,
      panelId: this.panelId,
    };
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-item': GrundAccordionItem;
  }
}
```

**Step 3: Create `<grund-accordion-header>`**

Create `src/components/accordion/accordion-header.ts`:

```ts
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { accordionHeaderStyles } from './accordion.styles.js';

const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

@customElement('grund-accordion-header')
export class GrundAccordionHeader extends LitElement {
  static override styles = accordionHeaderStyles;

  @property({ type: Number }) level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  override render() {
    const tag = headingTags[this.level - 1] ?? 'h3';
    // Use static rendering since heading level doesn't change dynamically
    switch (tag) {
      case 'h1':
        return html`<h1 part="heading"><slot></slot></h1>`;
      case 'h2':
        return html`<h2 part="heading"><slot></slot></h2>`;
      case 'h3':
        return html`<h3 part="heading"><slot></slot></h3>`;
      case 'h4':
        return html`<h4 part="heading"><slot></slot></h4>`;
      case 'h5':
        return html`<h5 part="heading"><slot></slot></h5>`;
      case 'h6':
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

**Step 4: Create `<grund-accordion-trigger>`**

Create `src/components/accordion/accordion-trigger.ts`:

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
import { accordionTriggerStyles } from './accordion.styles.js';

@customElement('grund-accordion-trigger')
export class GrundAccordionTrigger extends LitElement {
  static override styles = accordionTriggerStyles;

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  @consume({ context: accordionItemContext, subscribe: true })
  private itemCtx?: AccordionItemContextValue;

  private handleClick() {
    if (this.itemCtx?.disabled) return;
    this.accordionCtx?.toggle(this.itemCtx?.value ?? '');
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.itemCtx?.disabled) return;

    switch (e.key) {
      case Keys.ARROW_DOWN: {
        e.preventDefault();
        this.focusSibling('next');
        break;
      }
      case Keys.ARROW_UP: {
        e.preventDefault();
        this.focusSibling('previous');
        break;
      }
      case Keys.HOME: {
        e.preventDefault();
        this.focusSibling('first');
        break;
      }
      case Keys.END: {
        e.preventDefault();
        this.focusSibling('last');
        break;
      }
    }
  }

  private focusSibling(direction: 'next' | 'previous' | 'first' | 'last') {
    const accordion = this.closest('grund-accordion');
    if (!accordion) return;

    const triggers = Array.from(
      accordion.querySelectorAll('grund-accordion-trigger'),
    ) as GrundAccordionTrigger[];

    const enabledTriggers = triggers.filter((t) => !t.itemCtx?.disabled);
    if (enabledTriggers.length === 0) return;

    const currentIndex = enabledTriggers.indexOf(this);
    let target: GrundAccordionTrigger | undefined;

    switch (direction) {
      case 'next':
        target = enabledTriggers[(currentIndex + 1) % enabledTriggers.length];
        break;
      case 'previous':
        target =
          enabledTriggers[(currentIndex - 1 + enabledTriggers.length) % enabledTriggers.length];
        break;
      case 'first':
        target = enabledTriggers[0];
        break;
      case 'last':
        target = enabledTriggers[enabledTriggers.length - 1];
        break;
    }

    target?.shadowRoot?.querySelector('button')?.focus();
  }

  override render() {
    const expanded = this.itemCtx?.expanded ?? false;
    const disabled = this.itemCtx?.disabled ?? false;

    return html`
      <button
        part="trigger"
        id=${this.itemCtx?.triggerId ?? ''}
        aria-expanded=${expanded}
        aria-controls=${this.itemCtx?.panelId ?? ''}
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

**Step 5: Create `<grund-accordion-panel>`**

Create `src/components/accordion/accordion-panel.ts`:

```ts
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import {
  accordionItemContext,
  type AccordionItemContextValue,
} from '../../context/accordion.context.js';
import { accordionPanelStyles } from './accordion.styles.js';

@customElement('grund-accordion-panel')
export class GrundAccordionPanel extends LitElement {
  static override styles = accordionPanelStyles;

  @consume({ context: accordionItemContext, subscribe: true })
  private itemCtx?: AccordionItemContextValue;

  override render() {
    const expanded = this.itemCtx?.expanded ?? false;

    if (!expanded) {
      this.setAttribute('hidden', '');
    } else {
      this.removeAttribute('hidden');
    }

    return html`
      <div
        part="panel"
        role="region"
        id=${this.itemCtx?.panelId ?? ''}
        aria-labelledby=${this.itemCtx?.triggerId ?? ''}
      >
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-panel': GrundAccordionPanel;
  }
}
```

**Step 6: Create barrel exports**

Create `src/components/accordion/index.ts`:

```ts
export { GrundAccordion } from './accordion.js';
export { GrundAccordionItem } from './accordion-item.js';
export { GrundAccordionHeader } from './accordion-header.js';
export { GrundAccordionTrigger } from './accordion-trigger.js';
export { GrundAccordionPanel } from './accordion-panel.js';
```

Create `src/index.ts`:

```ts
export * from './components/accordion/index.js';
```

**Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add src/
git commit -m "feat: implement Accordion compound custom elements with Shadow DOM, ARIA, and keyboard navigation"
```

---

## Task 10: Write Accordion integration tests

**Files:**
- Create: `src/components/accordion/accordion.test.ts`

**Step 1: Write integration tests**

Create `src/components/accordion/accordion.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import './index.js';
import type { GrundAccordion } from './accordion.js';
import type { GrundAccordionItem } from './accordion-item.js';

async function createAccordion() {
  const el = await fixture<GrundAccordion>(html`
    <grund-accordion>
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
      <grund-accordion-item value="item-3" disabled>
        <grund-accordion-header>
          <grund-accordion-trigger>Item 3</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>Content 3</grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `);
  // Allow context to propagate
  await new Promise((r) => setTimeout(r, 0));
  return el;
}

function getTriggerButton(accordion: GrundAccordion, index: number): HTMLButtonElement | null {
  const triggers = accordion.querySelectorAll('grund-accordion-trigger');
  return triggers[index]?.shadowRoot?.querySelector('button') ?? null;
}

function getPanel(accordion: GrundAccordion, index: number): GrundAccordionItem | null {
  const panels = accordion.querySelectorAll('grund-accordion-panel');
  return panels[index] as unknown as GrundAccordionItem | null;
}

describe('grund-accordion', () => {
  describe('rendering', () => {
    it('renders all items', async () => {
      const el = await createAccordion();
      const items = el.querySelectorAll('grund-accordion-item');
      expect(items.length).toBe(3);
    });

    it('renders triggers as buttons', async () => {
      const el = await createAccordion();
      const button = getTriggerButton(el, 0);
      expect(button).toBeTruthy();
      expect(button?.tagName).toBe('BUTTON');
    });

    it('renders header with correct heading level', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion>
          <grund-accordion-item value="item-1">
            <grund-accordion-header level="2">
              <grund-accordion-trigger>Item 1</grund-accordion-trigger>
            </grund-accordion-header>
            <grund-accordion-panel>Content 1</grund-accordion-panel>
          </grund-accordion-item>
        </grund-accordion>
      `);
      await new Promise((r) => setTimeout(r, 0));
      const header = el.querySelector('grund-accordion-header');
      const h2 = header?.shadowRoot?.querySelector('h2');
      expect(h2).toBeTruthy();
    });
  });

  describe('expand/collapse', () => {
    it('expands an item when its trigger is clicked', async () => {
      const el = await createAccordion();
      const button = getTriggerButton(el, 0);
      button?.click();
      await new Promise((r) => setTimeout(r, 0));
      const item = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      expect(item?.getAttribute('expanded')).not.toBeNull();
    });

    it('collapses the previous item in single mode', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 0)?.click();
      await new Promise((r) => setTimeout(r, 0));
      getTriggerButton(el, 1)?.click();
      await new Promise((r) => setTimeout(r, 0));
      const item1 = el.querySelector('grund-accordion-item[value="item-1"]') as HTMLElement;
      const item2 = el.querySelector('grund-accordion-item[value="item-2"]') as HTMLElement;
      expect(item1?.hasAttribute('expanded')).toBe(false);
      expect(item2?.hasAttribute('expanded')).toBe(true);
    });

    it('does not expand a disabled item', async () => {
      const el = await createAccordion();
      getTriggerButton(el, 2)?.click();
      await new Promise((r) => setTimeout(r, 0));
      const item = el.querySelector('grund-accordion-item[value="item-3"]') as HTMLElement;
      expect(item?.hasAttribute('expanded')).toBe(false);
    });
  });

  describe('multiple mode', () => {
    it('allows multiple items to be expanded', async () => {
      const el = await fixture<GrundAccordion>(html`
        <grund-accordion type="multiple">
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
      await new Promise((r) => setTimeout(r, 0));
      getTriggerButton(el, 0)?.click();
      await new Promise((r) => setTimeout(r, 0));
      getTriggerButton(el, 1)?.click();
      await new Promise((r) => setTimeout(r, 0));
      const items = el.querySelectorAll('grund-accordion-item');
      expect(items[0]?.hasAttribute('expanded')).toBe(true);
      expect(items[1]?.hasAttribute('expanded')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('sets aria-expanded on trigger button', async () => {
      const el = await createAccordion();
      const button = getTriggerButton(el, 0);
      expect(button?.getAttribute('aria-expanded')).toBe('false');
      button?.click();
      await new Promise((r) => setTimeout(r, 0));
      expect(button?.getAttribute('aria-expanded')).toBe('true');
    });

    it('links trigger and panel with aria-controls/aria-labelledby', async () => {
      const el = await createAccordion();
      const button = getTriggerButton(el, 0);
      const panel = el.querySelector('grund-accordion-panel');
      const panelDiv = panel?.shadowRoot?.querySelector('[role="region"]');
      const triggerId = button?.id;
      const panelId = button?.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(panelDiv?.id).toBe(panelId);
      expect(panelDiv?.getAttribute('aria-labelledby')).toBe(triggerId);
    });

    it('sets role="region" on panel', async () => {
      const el = await createAccordion();
      const panel = el.querySelector('grund-accordion-panel');
      const region = panel?.shadowRoot?.querySelector('[role="region"]');
      expect(region).toBeTruthy();
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus to next trigger on ArrowDown', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      const button1 = getTriggerButton(el, 1);
      button0?.focus();
      button0?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
      expect(el.querySelector('grund-accordion-trigger:nth-of-type(1)')?.shadowRoot?.activeElement).toBeTruthy();
    });

    it('wraps focus from last to first on ArrowDown', async () => {
      const el = await createAccordion();
      // Item 3 is disabled, so last enabled is item 2
      const button1 = getTriggerButton(el, 1);
      button1?.focus();
      button1?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
      // Should wrap to first
    });

    it('moves focus to first trigger on Home', async () => {
      const el = await createAccordion();
      const button1 = getTriggerButton(el, 1);
      button1?.focus();
      button1?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
    });

    it('moves focus to last trigger on End', async () => {
      const el = await createAccordion();
      const button0 = getTriggerButton(el, 0);
      button0?.focus();
      button0?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
    });
  });

  describe('events', () => {
    it('dispatches grund-accordion-change event', async () => {
      const el = await createAccordion();
      const handler = vi.fn();
      el.addEventListener('grund-accordion-change', handler);
      getTriggerButton(el, 0)?.click();
      await new Promise((r) => setTimeout(r, 0));
      expect(handler).toHaveBeenCalledOnce();
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.value).toBe('item-1');
      expect(detail.expanded).toBe(true);
    });
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run`
Expected: All tests pass. If some tests fail due to context propagation timing, adjust the `setTimeout` delays or use `el.updateComplete`.

**Step 3: Fix any failing tests**

Adjust implementation as needed. Common issues:
- Context not propagating: add `await el.updateComplete` after mutations
- Shadow DOM not ready: add small delays

**Step 4: Commit**

```bash
git add src/components/accordion/accordion.test.ts
git commit -m "test: add Accordion integration tests — rendering, expand/collapse, a11y, keyboard, events"
```

---

## Task 11: Create Accordion Storybook story

**Files:**
- Create: `stories/accordion.stories.ts`

**Step 1: Create the story**

Create `stories/accordion.stories.ts`:

```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import '../src/components/accordion/index.js';

const meta: Meta = {
  title: 'Components/Accordion',
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
    },
    collapsible: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    type: 'single',
    collapsible: false,
    disabled: false,
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (args) => html`
    <grund-accordion type=${args.type} ?collapsible=${args.collapsible} ?disabled=${args.disabled}>
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>What is Grund UI?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">
            Grund UI is a headless, accessible Web Component library built with Lit.
          </div>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2">
        <grund-accordion-header>
          <grund-accordion-trigger>How do I get started?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">
            Install the package and import the components you need.
          </div>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-3">
        <grund-accordion-header>
          <grund-accordion-trigger>Can I use it for my project?</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">Of course! Grund UI is free and open source.</div>
        </grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};

export const Multiple: Story = {
  args: { type: 'multiple' },
  render: Default.render,
};

export const Collapsible: Story = {
  args: { collapsible: true },
  render: Default.render,
};

export const WithDisabledItem: Story = {
  render: () => html`
    <grund-accordion>
      <grund-accordion-item value="item-1">
        <grund-accordion-header>
          <grund-accordion-trigger>Enabled item</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">This item works normally.</div>
        </grund-accordion-panel>
      </grund-accordion-item>
      <grund-accordion-item value="item-2" disabled>
        <grund-accordion-header>
          <grund-accordion-trigger>Disabled item</grund-accordion-trigger>
        </grund-accordion-header>
        <grund-accordion-panel>
          <div style="padding: 12px;">This item cannot be opened.</div>
        </grund-accordion-panel>
      </grund-accordion-item>
    </grund-accordion>
  `,
};
```

**Step 2: Generate Custom Elements Manifest**

Run: `npx cem analyze --litelement`
Expected: `custom-elements.json` created in project root

**Step 3: Verify Storybook renders**

Run: `npx storybook dev -p 6006 --no-open`
Open: `http://localhost:6006` — verify the Accordion stories render and controls work.

**Step 4: Commit**

```bash
git add stories/accordion.stories.ts
git commit -m "docs: add Accordion Storybook stories — default, multiple, collapsible, disabled"
```

---

## Task 12: Set up GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Test
        run: npm run test:run

      - name: Build
        run: npm run build

      - name: Generate CEM
        run: npm run analyze
```

**Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow — lint, test, build"
```

---

## Task 13: Final verification

**Step 1: Run full lint**

Run: `npm run lint`
Expected: No errors

**Step 2: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass

**Step 3: Run production build**

Run: `npm run build`
Expected: `dist/` created with ES modules and `.d.ts` files

**Step 4: Verify Storybook**

Run: `npm run storybook`
Expected: All stories render correctly

**Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final verification — all lint, tests, and build passing"
```
