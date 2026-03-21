# Accordion — Implementation Spec

Implementation specification for the accordion component and its shared dependency,
`RovingFocusController`.

---

## Scope

- 1 shared controller: `RovingFocusController`
- 1 component-local controller: `AccordionController`
- 1 registry: `AccordionRegistry`
- 2 context interfaces: root context, item context
- 5 custom elements: `grund-accordion`, `grund-accordion-item`, `grund-accordion-header`, `grund-accordion-trigger`, `grund-accordion-panel`
- No animation — consumers style transitions via `data-state` and `::part()`
- Open state and ARIA linking handled inline (no `OpenStateController` or `AriaLinkController` — extract on second use)

---

## 1. RovingFocusController

Shared controller in `src/controllers/roving-focus.controller.ts`.
Keyboard navigation within composite widgets — one tab stop per widget, arrow keys move between items.

### API

```ts
interface RovingFocusOptions {
  orientation: 'vertical' | 'horizontal';
  loop: boolean;
  getItems: () => HTMLElement[];
}

class RovingFocusController implements ReactiveController {
  constructor(host: ReactiveControllerHost & HTMLElement, options: RovingFocusOptions);
  update(options: Partial<RovingFocusOptions>): void;
}
```

### Behavior

- Listens for `keydown` on the host element (added in `hostConnected`, removed in `hostDisconnected`)
- Vertical orientation: `ArrowUp`/`ArrowDown`. Horizontal: `ArrowLeft`/`ArrowRight` (swapped when `direction: rtl` via `getComputedStyle`)
- `Home`/`End` for first/last item
- Sets `tabIndex=0` on the focused item, `tabIndex=-1` on all others
- Skips disabled items (checks `dataset.disabled` or `ariaDisabled`)
- `getItems()` callback lets the host control which elements are focusable — no `querySelectorAll` inside the controller

---

## 2. AccordionController

Component-local controller in `src/components/accordion/controller/accordion.controller.ts`.
Pure state and action resolution — no DOM access, no Lit dependency.

### API

```ts
interface AccordionHostSnapshot {
  value: string[] | undefined;
  defaultValue: string[] | undefined;
  multiple: boolean;
  disabled: boolean;
}

interface AccordionAction {
  type: 'toggle';
  itemValue: string;
  itemDisabled: boolean;
}

class AccordionController {
  expandedValues: Set<string>;

  syncFromHost(snapshot: AccordionHostSnapshot): void;
  requestToggle(action: AccordionAction): string[] | null;
  isExpanded(itemValue: string): boolean;
}
```

### Controlled vs Uncontrolled

- **Controlled:** `snapshot.value !== undefined`. `requestToggle` returns the proposed new value array but does not update `expandedValues`. The host fires `grund-value-change`; the consumer must set `value` to make it stick.
- **Uncontrolled:** `defaultValue` seeds `expandedValues` once on first `syncFromHost`. After that, `requestToggle` updates `expandedValues` directly and returns the new array.

### Single vs Multiple

- `multiple=false`: toggling an item closes all others. Toggling an already-open item closes it.
- `multiple=true`: toggling an item adds/removes it independently.

### Disabled

Both root-level `disabled` and item-level `itemDisabled` block the toggle.

---

## 3. AccordionRegistry

Component-local registry in `src/components/accordion/registry/accordion.registry.ts`.
Ordered child tracking and trigger↔panel linking. No Lit dependency.

### API

```ts
interface AccordionItemRecord {
  item: HTMLElement;
  value: string;
  trigger: HTMLElement | null;
  panel: HTMLElement | null;
}

class AccordionRegistry {
  get items(): AccordionItemRecord[];

  registerItem(item: HTMLElement, value: string): void;
  unregisterItem(item: HTMLElement): void;

  attachTrigger(item: HTMLElement, trigger: HTMLElement): void;
  attachPanel(item: HTMLElement, panel: HTMLElement): void;
  detachTrigger(item: HTMLElement): void;
  detachPanel(item: HTMLElement): void;

  getRecord(item: HTMLElement): AccordionItemRecord | undefined;
  indexOf(item: HTMLElement): number;
}
```

### Key Decisions

- DOM-order sorting via `compareDocumentPosition` on `registerItem`
- Trigger↔panel linking scoped to item — each record holds at most one trigger and one panel
- No `WeakRef` — Lit elements reliably fire `disconnectedCallback`, making explicit unregistration sufficient and `WeakRef` unnecessary overhead
- Root element owns the registry instance; item element owns attach/detach for its sub-parts

---

## 4. Context

Two context layers defined in `src/components/accordion/context/`.

### Root Context

Provided by `<grund-accordion>`, consumed by `<grund-accordion-item>`.

```ts
interface AccordionRootContext {
  isExpanded: (value: string) => boolean;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  keepMounted: boolean;
  hiddenUntilFound: boolean;

  requestToggle: (itemValue: string, itemDisabled: boolean) => void;

  registerItem: (item: HTMLElement, value: string) => void;
  unregisterItem: (item: HTMLElement) => void;
}
```

### Item Context

Provided by `<grund-accordion-item>`, consumed by trigger, header, and panel.

```ts
interface AccordionItemContext {
  value: string;
  index: number;
  expanded: boolean;
  disabled: boolean;          // merged: root disabled OR item disabled
  orientation: 'vertical' | 'horizontal';
  keepMounted: boolean;       // root default, may be overridden per-panel
  hiddenUntilFound: boolean;  // root default, may be overridden per-panel

  triggerId: string;          // derived from value
  panelId: string;            // derived from value

  toggle: () => void;

  attachTrigger: (el: HTMLElement) => void;
  detachTrigger: (el: HTMLElement) => void;
  attachPanel: (el: HTMLElement) => void;
  detachPanel: (el: HTMLElement) => void;
}
```

### Design Rules

- Leaf elements consume item context only — no direct root context dependency
- ARIA IDs derived from `value` prop (e.g., `grund-accordion-trigger-${value}`)
- Merged disabled so leaf elements don't check both sources
- Action callbacks bound once in `createContextValue()` for stable references
- Two separate context key symbols: `accordionRootContext`, `accordionItemContext`

---

## 5. Elements

### `<grund-accordion>` — Root

- `@provide` root context
- Owns `AccordionController` and `AccordionRegistry`
- `RovingFocusController` attached — `getItems()` returns trigger buttons from registry records
- `willUpdate`: packages props into `AccordionHostSnapshot`, calls `syncFromHost()`, recreates root context if state changed
- On toggle: calls `requestToggle`, dispatches `grund-value-change`, updates internal state (uncontrolled) or fires event only (controlled)
- Render: `<slot>`
- `:host { display: block }`

**Properties:**

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string[] \| undefined` | `undefined` | — |
| `defaultValue` | `string[] \| undefined` | `undefined` | `default-value` |
| `multiple` | `boolean` | `false` | `multiple` |
| `disabled` | `boolean` | `false` | `disabled` |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `orientation` |
| `loopFocus` | `boolean` | `true` | `loop-focus` |
| `keepMounted` | `boolean` | `false` | `keep-mounted` |
| `hiddenUntilFound` | `boolean` | `false` | `hidden-until-found` |

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-value-change` | `{ value: string[], itemValue: string, open: boolean }` | Expanded set changed |

### `<grund-accordion-item>` — Item

- `@consume` root context, `@provide` item context
- `willUpdate`: reads root context for expanded/disabled, derives index from registry, sets `data-open`, `data-disabled`, `data-index`
- Provides item context with `toggle()`, ARIA IDs, attach/detach callbacks
- `updated()`: dispatches `grund-open-change` with settled guard (suppresses initial render)
- Registers/unregisters with root context in `connectedCallback`/`disconnectedCallback`
- Render: `<slot>`, `exportparts="trigger,panel"`
- `:host { display: block }`

**Properties:**

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string` | auto-generated | `value` |
| `disabled` | `boolean` | `false` | `disabled` |

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-open-change` | `{ open: boolean, value: string, index: number }` | Item open state changes (after mount) |

**Data attributes:** `data-open`, `data-disabled`, `data-index`

### `<grund-accordion-header>` — Header

- `@consume` item context (only needs `disabled`)
- `level` property (1–6, default 3) — sets `role="heading"` and `aria-level` on the host
- Render: `<slot>`
- `:host { display: block }`
- Dev warning if used outside item

### `<grund-accordion-trigger>` — Trigger

- `@consume` item context
- Renders `<button part="trigger"><slot></slot></button>`
- `willUpdate`: sets `aria-expanded`, `aria-controls` (panel ID), `id` (trigger ID), `data-open`, `data-disabled`, `data-orientation`, `data-index`
- Click handler calls `itemCtx.toggle()`
- Registers/unregisters trigger with item context
- `:host { display: block }`
- Dev warning if used outside item

**CSS parts:** `trigger`

### `<grund-accordion-panel>` — Panel

- `@consume` item context
- Render: `<div part="panel" role="region" aria-labelledby="${triggerId}"><slot></slot></div>`
- Visibility:
  - Default (closed): removed from DOM entirely
  - `keepMounted`: stays in DOM with `hidden` attribute
  - `hiddenUntilFound`: uses `hidden="until-found"` for browser find-in-page
- `willUpdate`: sets `data-open`, `data-disabled`, `data-state="open"/"closed"` (inline, no OpenStateController), `data-orientation`, `data-index`
- Panel-level `keepMounted` and `hiddenUntilFound` properties override the root-level defaults when set
- Registers/unregisters panel with item context
- `:host { display: block }`
- Dev warning if used outside item

**Properties:**

| Property | Type | Default | Attribute |
|---|---|---|---|
| `keepMounted` | `boolean` | `false` | `keep-mounted` |
| `hiddenUntilFound` | `boolean` | `false` | `hidden-until-found` |

Panel uses its own property if set, otherwise falls back to the value from item context (which originates from the root).

**CSS parts:** `panel`

---

## File Structure

```
src/
├── controllers/
│   └── roving-focus.controller.ts
├── components/
│   └── accordion/
│       ├── root/
│       │   └── accordion.element.ts
│       ├── item/
│       │   └── accordion-item.element.ts
│       ├── header/
│       │   └── accordion-header.element.ts
│       ├── trigger/
│       │   └── accordion-trigger.element.ts
│       ├── panel/
│       │   └── accordion-panel.element.ts
│       ├── controller/
│       │   └── accordion.controller.ts
│       ├── registry/
│       │   └── accordion.registry.ts
│       ├── context/
│       │   └── accordion.context.ts
│       ├── types.ts
│       └── index.ts
└── index.ts
```
