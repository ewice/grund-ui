# Grund UI — Design Document

**Date:** 2026-03-15
**Status:** Approved

## Overview

Grund UI is a headless, accessible Web Component library built with Lit. It provides behavior, accessibility (ARIA), and keyboard interactions without any visual styling opinions.

### Core Principles

- **Headless** — zero visual styles, only functional CSS (positioning, display, visibility)
- **Accessible** — WCAG 2.1 AA, full ARIA patterns, keyboard navigation, focus management
- **Composable** — compound component pattern (e.g., `accordion > item > header > trigger + panel`)
- **Extensible** — designed for a future ShadCN-like styled layer via class extension or external CSS
- **Framework-agnostic** — standard Web Components, usable in any framework or vanilla HTML

### Target Audience

Developers building design systems or apps who want full control over styling but don't want to reimplement accessibility and interaction patterns.

---

## Architecture

### Three-Layer Internal Architecture

```
┌─────────────────────────────────────────────┐
│  Layer 3: Custom Elements                   │
│  <grund-accordion>, <grund-dialog>, etc.    │
│  Shadow DOM + slots, compound patterns      │
│  PUBLIC API from v1                         │
├─────────────────────────────────────────────┤
│  Layer 2: Reactive Controllers              │
│  AccordionController, DialogController      │
│  State, ARIA, keyboard, focus management    │
│  INTERNAL in v1, PUBLIC API in v2           │
├─────────────────────────────────────────────┤
│  Layer 1: Utilities                         │
│  Focus trap, ID generation, keymap helpers  │
│  aria-* attribute management, unique IDs    │
│  INTERNAL                                   │
└─────────────────────────────────────────────┘
```

**Layer 1 — Utilities:** Shared primitives. Focus trap logic, keyboard shortcut mapping, unique ID generation, ARIA attribute helpers. Not exposed publicly.

**Layer 2 — Reactive Controllers:** Each component's behavior as a Lit `ReactiveController`. Manages state, ARIA attributes, keyboard interactions. Internal in v1, coded cleanly enough to expose as public API in v2 (the "React Aria hooks" equivalent for Web Components).

**Layer 3 — Custom Elements:** The public API. Each is a `LitElement` subclass using Shadow DOM with zero visual styles. Uses controllers from Layer 2. Compound components communicate via Lit Context Protocol internally, emit custom events externally.

### Shadow DOM Strategy

- **Shadow DOM on every component** — enables `<slot>`, encapsulation, `::part()`
- **Zero visual styles** — only functional CSS (`display`, `position`, `visibility`, overflow, transitions for show/hide)
- **Generous `part` attributes** — every structural element inside Shadow DOM gets a `part` name
- **CSS custom properties** — component-scoped, for configurable functional values (transition duration, z-index). Naming: `--grund-{component}-{property}` (e.g., `--grund-accordion-transition-duration`)
- **Attribute reflection** — states like `expanded`, `open`, `disabled`, `active` reflected as HTML attributes for CSS selectors

### Consumer Styling Contract

```css
/* 1. Attribute selectors for state */
grund-accordion-item[expanded] { ... }
grund-dialog[open] { ... }

/* 2. ::part() for internal structure */
grund-dialog::part(overlay) { background: rgba(0,0,0,0.5); }
grund-dialog::part(panel) { border-radius: 12px; }

/* 3. CSS custom properties for functional config */
grund-dialog {
  --grund-dialog-z-index: 100;
  --grund-dialog-transition-duration: 200ms;
}

/* 4. Slots for content composition */
<grund-dialog>
  <h2 slot="title">Confirm</h2>
  <p>Are you sure?</p>
  <grund-button slot="actions">OK</grund-button>
</grund-dialog>
```

### Parent-Child Communication

- **Lit Context Protocol** for internal wiring (parent provides state, children consume)
- **Custom Events** as the public API, named `grund-{component}-{action}` (e.g., `grund-accordion-change`, `grund-dialog-open`)
- **Attribute reflection** for CSS-observable state changes

### Form Association

Form-related components (Switch, Checkbox, Radio, Select, Slider) use `ElementInternals` for native form participation:

```ts
class GrundSwitch extends LitElement {
  static formAssociated = true;
  private internals = this.attachInternals();

  set checked(value: boolean) {
    this._checked = value;
    this.internals.setFormValue(value ? this.value : null);
  }
}
```

This enables:
- `FormData` construction
- Native form validation via `this.internals.setValidity()`
- Form reset behavior
- `:invalid` / `:valid` CSS pseudo-classes

A shared `FormController` (Layer 2) encapsulates the `ElementInternals` boilerplate.

### Future ShadCN-Like Styled Layer

The architecture supports two extension models:

**Class extension** (more powerful):
```ts
class StyledDialog extends GrundDialog {
  static styles = [
    GrundDialog.styles,
    css`
      [part="overlay"] { background: oklch(0 0 0 / 50%); }
      [part="panel"] { border-radius: 12px; padding: 24px; }
    `
  ];
}
customElements.define('styled-dialog', StyledDialog);
```

**External CSS** (simpler, closer to ShadCN model):
```css
/* theme.css — copied into consumer's project */
grund-dialog::part(overlay) { background: oklch(0 0 0 / 50%); }
grund-dialog::part(panel) { border-radius: 12px; }
```

Tailwind is also viable via `adoptedStyleSheets` — a single compiled Tailwind stylesheet shared across all shadow roots.

### SSR Strategy

Design-ready, implement later. Architectural decisions should not block SSR (avoid direct DOM manipulation outside Lit's render cycle). Implement with `@lit-labs/ssr` + Declarative Shadow DOM in a future version.

---

## Component API Design

### Naming Conventions

- **Element prefix:** `grund-` (e.g., `<grund-accordion>`)
- **Event naming:** `grund-{component}-{action}` (e.g., `grund-accordion-change`)
- **CSS custom properties:** `--grund-{component}-{property}` (e.g., `--grund-accordion-transition-duration`)
- **Part naming:** descriptive, no prefix (e.g., `part="trigger"`, `part="panel"`)

### Registration & Import

```ts
// Auto-registration (most consumers)
import 'grund-ui/accordion';
// registers: grund-accordion, grund-accordion-item,
//            grund-accordion-header, grund-accordion-trigger, grund-accordion-panel

// Class import without registration (for extension)
import { GrundAccordion } from 'grund-ui/accordion';

// Register all components
import 'grund-ui';
```

### Accordion (Reference Implementation)

#### HTML API

```html
<grund-accordion>
  <grund-accordion-item value="item-1">
    <grund-accordion-header>
      <grund-accordion-trigger>
        What is Grund UI?
        <plus-icon slot="icon"></plus-icon>
      </grund-accordion-trigger>
    </grund-accordion-header>
    <grund-accordion-panel>
      <div>A headless Web Component library.</div>
    </grund-accordion-panel>
  </grund-accordion-item>

  <grund-accordion-item value="item-2" disabled>
    <grund-accordion-header>
      <grund-accordion-trigger>
        Disabled item
      </grund-accordion-trigger>
    </grund-accordion-header>
    <grund-accordion-panel>
      <div>This item cannot be opened.</div>
    </grund-accordion-panel>
  </grund-accordion-item>
</grund-accordion>
```

#### Attributes & Properties

**`<grund-accordion>` (root)**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `'single' \| 'multiple'` | `'single'` | One or many items open |
| `value` | `string \| string[]` | `undefined` | Currently open item(s) |
| `disabled` | `boolean` | `false` | Disable all items |
| `collapsible` | `boolean` | `false` | Allow closing all items in single mode |

**`<grund-accordion-item>`**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `string` | auto-generated | Unique identifier |
| `disabled` | `boolean` | `false` | Disable this item |
| `expanded` | `boolean` | `false` | Reflected — open state |

**`<grund-accordion-header>`**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `level` | `1-6` | `3` | Heading level rendered in Shadow DOM |

**`<grund-accordion-trigger>`**

Renders a `<button>` inside Shadow DOM. Manages `aria-expanded`, `aria-controls`, keyboard handling (Enter, Space).

**`<grund-accordion-panel>`**

Renders a `<div role="region">` inside Shadow DOM. Manages `aria-labelledby`, `hidden` state.

#### Shadow DOM Rendering

```html
<!-- grund-accordion-header shadow DOM -->
<h3 part="heading">
  <slot></slot>
</h3>

<!-- grund-accordion-trigger shadow DOM -->
<button part="trigger" aria-expanded="false" aria-controls="panel-{uid}" id="trigger-{uid}">
  <slot></slot>
</button>

<!-- grund-accordion-panel shadow DOM -->
<div part="panel" role="region" aria-labelledby="trigger-{uid}" id="panel-{uid}" hidden>
  <slot></slot>
</div>
```

#### Events

```ts
accordion.addEventListener('grund-accordion-change', (e) => {
  e.detail.value;    // string | string[] — new value
  e.detail.expanded; // boolean — whether the item opened or closed
});
```

#### Keyboard Interactions (WAI-ARIA Accordion Pattern)

| Key | Behavior |
|-----|----------|
| **Enter / Space** | Toggle the focused trigger |
| **Arrow Down** | Move focus to next trigger |
| **Arrow Up** | Move focus to previous trigger |
| **Home** | Move focus to first trigger |
| **End** | Move focus to last trigger |

#### Styling

```css
/* State */
grund-accordion-item[expanded] { ... }
grund-accordion-item[disabled] { ... }

/* Structure */
grund-accordion-header::part(heading) { ... }
grund-accordion-trigger::part(trigger) { ... }
grund-accordion-panel::part(panel) { ... }

/* Configuration */
grund-accordion-panel {
  --grund-accordion-transition-duration: 200ms;
}
```

#### ARIA — Fully Auto-Managed

Consumers never write ARIA attributes. The components handle: `aria-expanded`, `aria-controls`, `aria-labelledby`, `role="region"`, `id` linking between trigger and panel, and `hidden` state.

Consumers can add custom ARIA to host elements (e.g., `<grund-accordion aria-label="FAQ">`).

### Component Inventory

#### Initial Release (v0.1)

| Component | Elements | Controller |
|-----------|----------|------------|
| **Accordion** | `accordion`, `accordion-item`, `accordion-header`, `accordion-trigger`, `accordion-panel` | `AccordionController` |
| **Dialog** | `dialog`, `dialog-trigger`, `dialog-overlay`, `dialog-content`, `dialog-close` | `DialogController` |
| **Switch** | `switch` (form-associated) | `ToggleController`, `FormController` |
| **Tabs** | `tabs`, `tab-list`, `tab-trigger`, `tab-panel` | `TabsController` |
| **Popover** | `popover`, `popover-trigger`, `popover-content` | `PopoverController` |

#### Full Parity (future)

Button, Checkbox, Radio, RadioGroup, Select, Slider, Tooltip, Menu, Menubar, Listbox, Combobox, AlertDialog, Toast, Progress, Separator, Toggle, ToggleGroup, Collapsible, NavigationMenu, ContextMenu, DropdownMenu, HoverCard, ScrollArea, AspectRatio, Avatar, Badge.

---

## Project Structure

```
grund-ui/
├── src/
│   ├── components/
│   │   ├── accordion/
│   │   │   ├── accordion.ts              # <grund-accordion> root element
│   │   │   ├── accordion-item.ts         # <grund-accordion-item>
│   │   │   ├── accordion-header.ts       # <grund-accordion-header>
│   │   │   ├── accordion-trigger.ts      # <grund-accordion-trigger>
│   │   │   ├── accordion-panel.ts        # <grund-accordion-panel>
│   │   │   ├── accordion.controller.ts   # AccordionController
│   │   │   ├── accordion.styles.ts       # functional CSS only
│   │   │   ├── accordion.test.ts         # component tests
│   │   │   └── index.ts                  # barrel export + registration
│   │   ├── dialog/
│   │   │   └── ...                       # same pattern
│   │   └── ...
│   ├── controllers/                      # shared controllers
│   │   ├── focus-trap.controller.ts
│   │   └── form.controller.ts            # ElementInternals wrapper
│   ├── utils/
│   │   ├── aria.ts                       # ARIA attribute helpers
│   │   ├── keyboard.ts                   # key mapping utilities
│   │   └── id.ts                         # unique ID generation
│   ├── context/                          # Lit Context definitions
│   │   └── accordion.context.ts
│   └── index.ts                          # main barrel export
├── stories/
│   └── accordion.stories.ts
├── docs/
│   └── plans/
├── .storybook/
│   └── main.ts                           # Storybook config (Vite builder)
├── custom-elements-manifest.config.mjs   # CEM analyzer config
├── vite.config.ts                        # Vite 8, library mode
├── tsconfig.json
├── package.json
└── ...
```

### Package Exports (package.json)

```json
{
  "name": "grund-ui",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./accordion": "./dist/components/accordion/index.js",
    "./dialog": "./dist/components/dialog/index.js"
  },
  "customElements": "custom-elements.json"
}
```

---

## Tech Stack (v1)

| Tool | Version | Purpose |
|------|---------|---------|
| **Lit** | 3.x | Web Component framework |
| **TypeScript** | 5.x | Type safety, decorators |
| **Vite** | 8.x | Dev server, library build (Rolldown) |
| **Storybook** | 9.x | Component playground + docs |
| **@custom-elements-manifest/analyzer** | latest | Component manifest for Storybook + IDE |
| **Vitest** | 3.x | Test runner (browser mode) |
| **@vitest/browser** | 3.x | Real browser test environment |
| **Playwright** | latest | Browser provider for Vitest |
| **@open-wc/testing** | latest | Web Component test utilities |
| **ESLint** | 9.x | Linting (flat config) |
| **eslint-plugin-lit** | latest | Lit template linting |
| **Prettier** | latest | Formatting |
| **GitHub Actions** | — | CI: lint → test → build |

### Deferred to Later

| Tool | When to Add |
|------|------------|
| **Changesets** | When publishing to npm regularly |
| **size-limit** | Before v1 release |
| **@axe-core/playwright** | After initial components ship |
| **eslint-plugin-wc** | At scale (15+ components) |

---

## Accessibility

- **Target:** WCAG 2.1 AA (same as Base UI and React Aria)
- **Approach:** Every component follows its corresponding WAI-ARIA Authoring Practices pattern
- **Keyboard:** Full keyboard navigation per WAI-ARIA APG
- **Screen readers:** Correct ARIA roles, states, and properties, auto-managed
- **Focus management:** Focus trapping (Dialog), roving tabindex (Tabs, Accordion), focus restoration
