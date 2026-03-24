# Tabs — Implementation Spec

Implementation specification for the tabs component.

---

## Scope

- 1 component-local controller: `TabsController`
- 1 registry: `TabsRegistry`
- 1 context interface: root context (no item wrapper)
- 5 custom elements: `grund-tabs`, `grund-tabs-list`, `grund-tab`, `grund-tabs-panel`, `grund-tabs-indicator`
- No animation — consumers style transitions via `data-selected`, `data-activation-direction`, and `::part()`
- Value-based tab↔panel association (matching `value` attributes, no DOM nesting)
- `data-selected` for active state (selection-based, not disclosure-based `data-open`)
- Events use `bubbles: true, composed: false` per project convention

---

## 1. TabsController

Component-local controller in `src/components/tabs/controller/tabs.controller.ts`.
Pure state and action resolution — no DOM access, no Lit dependency.

### API

```ts
interface TabsHostSnapshot {
  value: string | null | undefined;   // undefined = uncontrolled
  defaultValue: string | null;        // seed for uncontrolled mode
  disabled: boolean;
}

class TabsController {
  activeValue: string | null;
  previousValue: string | null;

  syncFromHost(
    snapshot: TabsHostSnapshot,
    registeredValues: string[],
    disabledValues: Set<string>,
  ): void;

  requestActivation(value: string): string | null;

  isActive(value: string): boolean;
}
```

### Controlled vs Uncontrolled

- **Controlled:** `snapshot.value !== undefined`. `requestActivation` returns the
  requested value but does not update `activeValue`. The host fires
  `grund-value-change`; the consumer must set `value` to make it stick.
- **Uncontrolled:** `defaultValue` seeds `activeValue` once on first `syncFromHost`.
  After that, `requestActivation` updates `activeValue` directly and returns the new
  value. If no `defaultValue`, the first non-disabled tab in `registeredValues` is
  auto-selected.
- `value = null` (controlled, nothing selected) is valid for consumers that want a
  blank initial state.

### Disabled

Root-level `disabled` blocks all activation. Item-level disabled is checked by the
caller before invoking `requestActivation`.

---

## 2. TabsRegistry

Component-local registry in `src/components/tabs/registry/tabs.registry.ts`.
Ordered child tracking and tab↔panel linking by value. No Lit dependency.

### API

```ts
interface TabsRecord {
  value: string;
  tab: HTMLElement | null;
  panel: HTMLElement | null;
  disabled: boolean;
}

class TabsRegistry {
  registerTab(value: string, tab: HTMLElement): void;
  unregisterTab(value: string): void;
  registerPanel(value: string, panel: HTMLElement): void;
  unregisterPanel(value: string): void;

  setDisabled(value: string, disabled: boolean): void;

  getRecord(value: string): TabsRecord | undefined;
  getOrderedValues(): string[];
  getDisabledValues(): Set<string>;
  indexOf(value: string): number;

  getTabElement(value: string): HTMLElement | null;
  getPanelElement(value: string): HTMLElement | null;
}
```

### Key Decisions

- Keyed by `value` string — no item wrapper element to key on
- Async registration: tab and panel register independently. First creates a partial
  record (one side `null`); second completes it.
- DOM-order sorting via `compareDocumentPosition` on tab elements (tabs define visual
  order; panels can appear in any DOM order)
- No `WeakRef` — Lit elements reliably fire `disconnectedCallback`
- Root element owns the registry instance

---

## 3. Context

Single context scope in `src/components/tabs/context/tabs.context.ts`.
No item-level context — tabs and panels consume root context directly.

### Root Context

Provided by `<grund-tabs>`, consumed by all child elements.

```ts
interface TabsRootContext {
  // State
  activeValue: string | null;
  activationDirection: 'start' | 'end' | 'none';
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;

  // Registration callbacks
  registerTab(value: string, tab: HTMLElement): void;
  unregisterTab(value: string): void;
  registerPanel(value: string, panel: HTMLElement): void;
  unregisterPanel(value: string): void;

  // Disabled sync
  setDisabled(value: string, disabled: boolean): void;

  // Actions
  requestActivation(value: string): void;

  // ARIA linking lookups
  getTabElement(value: string): HTMLElement | null;
  getPanelElement(value: string): HTMLElement | null;
}
```

### Design Rules

- Flat, single scope — no item wrapper, so no item context
- `activationDirection` derived in root element by comparing `indexOf(previousValue)`
  and `indexOf(activeValue)` in the registry
- Action callbacks bound once in `createContextValue()` for stable references
- One context key symbol: `tabsRootContext`

---

## 4. Elements

### `<grund-tabs>` — Root

- `@provide` root context
- Owns `TabsController` and `TabsRegistry`
- `willUpdate`: packages props into `TabsHostSnapshot`, calls `syncFromHost()`,
  computes `activationDirection`, recreates root context if state changed
- On activation: calls `requestActivation`, dispatches `grund-value-change`, updates
  internal state (uncontrolled) or fires event only (controlled)
- Render: `<slot>`
- `:host { display: block }`

**Properties:**

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string \| null \| undefined` | `undefined` | — |
| `defaultValue` | `string \| null` | `null` (auto-selects first non-disabled tab) | `default-value` |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | `orientation` |
| `disabled` | `boolean` | `false` | `disabled` |

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-value-change` | `{ value: string \| null, previousValue: string \| null }` | Active tab changed |

Event options: `bubbles: true, composed: false`.

**Data attributes:** `data-orientation`, `data-activation-direction`

---

### `<grund-tabs-list>` — List

- `@consume` root context (for `orientation`, `disabled`)
- `RovingFocusController` attached to this element (not the root) because the list is
  the composite widget boundary (`role="tablist"`)
- `getItems()` returns inner `<button>` elements from slotted `<grund-tab>` children.
  Each `<grund-tab>` exposes a public getter (e.g., `get triggerElement()`) that returns
  its shadow `<button>`. The list queries slotted tabs and maps to their trigger elements.
- `activateOnFocus` and `loopFocus` are props on this element only (not on context)
- When `activateOnFocus` is true, listens for roving focus changes and calls
  `requestActivation` on the newly focused tab's value
- Render: `<slot>` with `role="tablist"` and `aria-orientation` on shadow wrapper
- `:host { display: block }`
- Dev warning if used outside `<grund-tabs>`

**Properties:**

| Property | Type | Default | Attribute |
|---|---|---|---|
| `activateOnFocus` | `boolean` | `true` | `activate-on-focus` |
| `loopFocus` | `boolean` | `true` | `loop-focus` |

**CSS parts:** `list`
**ARIA:** `role="tablist"`, `aria-orientation`
**Data attributes:** `data-orientation`, `data-disabled`, `data-activation-direction`

---

### `<grund-tab>` — Tab

- `@consume` root context
- Renders `<button part="tab" role="tab"><slot></slot></button>`
- `willUpdate`: sets `aria-selected`, `aria-disabled`, `data-selected`, `data-disabled`,
  `data-orientation`, `data-index`, `data-activation-direction` on the button
- `updated()`: sets `ariaControlsElements` to the panel element only when it is
  connected to the DOM (`ctx.getPanelElement(this.value)`). Clears to `[]` when the
  panel is not present (e.g., unmounted inactive panel). This avoids dangling references
  to disconnected elements.
- Click handler calls `ctx.requestActivation(this.value)`
- Exposes `get triggerElement(): HTMLButtonElement` — returns the inner button for
  `RovingFocusController` on the list to manage `tabindex`
- Registers/unregisters with root context in `connectedCallback`/`disconnectedCallback`.
  On register and on `disabled` property change, calls `ctx.setDisabled(this.value, this.disabled)`
  to keep registry in sync.
- `:host { display: block }`
- Dev warning if used outside `<grund-tabs-list>`
- Dev warning if `value` is empty (required for tab↔panel association and deterministic IDs)

**Properties:**

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string` | required | `value` |
| `disabled` | `boolean` | `false` | `disabled` |

**CSS parts:** `tab`
**ARIA:** `role="tab"`, `aria-selected`, `aria-controls` (via Element Reference API, only when panel is in DOM), `aria-disabled`
**Data attributes:** `data-selected`, `data-disabled`, `data-orientation`, `data-index`, `data-activation-direction`

---

### `<grund-tabs-panel>` — Panel

- `@consume` root context
- Render: `<div part="panel" role="tabpanel" tabindex="0"><slot></slot></div>` (active only)
- `updated()`: sets `ariaLabelledByElements` to the corresponding tab element via
  `ctx.getTabElement(this.value)` (Element Reference API for cross-shadow ARIA)
- Visibility:
  - Default (inactive): removed from DOM entirely
  - `keepMounted`: stays in DOM with `hidden` attribute, `tabindex` removed
  - `hiddenUntilFound`: uses `hidden="until-found"` instead of plain `hidden` for
    browser find-in-page support. Implies `keepMounted`. Panel listens for `beforematch`
    event and calls `requestActivation` to activate.
- `willUpdate`: sets `data-selected`, `data-orientation`, `data-activation-direction`
- Registers/unregisters with root context in `connectedCallback`/`disconnectedCallback`
- `:host { display: block }`
- Dev warning if used outside `<grund-tabs>`
- Dev warning if `value` is empty

**Properties:**

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string` | required | `value` |
| `keepMounted` | `boolean` | `false` | `keep-mounted` |
| `hiddenUntilFound` | `boolean` | `false` | `hidden-until-found` |

**CSS parts:** `panel`
**ARIA:** `role="tabpanel"`, `aria-labelledby` (via Element Reference API), `tabindex="0"` (active only)
**Data attributes:** `data-selected`, `data-orientation`, `data-activation-direction`

---

### `<grund-tabs-indicator>` — Indicator

- `@consume` root context
- No public properties
- Positioned inside `<grund-tabs-list>`
- `updated()`: reads active tab's geometry via `ctx.getTabElement(activeValue)` and sets
  CSS custom properties as inline styles on the indicator div
- `ResizeObserver` on the parent list and the active tab element. Both trigger the same
  `measure()` method. On activation change, swaps observer to new active tab. If no
  active tab, `measure()` is a no-op.
- Render: `<div part="indicator"></div>`
- `:host { display: block; position: absolute; pointer-events: none }` — `position`
  and `pointer-events` are intentional exceptions to the headless "no visual styles"
  rule; the indicator cannot function without absolute positioning, and it must not
  intercept clicks on underlying tabs
- Dev warning if used outside `<grund-tabs-list>`

**CSS parts:** `indicator`
**Data attributes:** `data-orientation`, `data-activation-direction`
**CSS custom properties (set as inline styles):**

| Property | Description |
|---|---|
| `--grund-tabs-indicator-width` | Width of the active tab |
| `--grund-tabs-indicator-height` | Height of the active tab |
| `--grund-tabs-indicator-left` | Distance from list left edge |
| `--grund-tabs-indicator-top` | Distance from list top edge |
| `--grund-tabs-indicator-right` | Distance from list right edge |
| `--grund-tabs-indicator-bottom` | Distance from list bottom edge |

CSS custom property names are physical (not logical) because values are physical pixel
measurements from `getBoundingClientRect()`. Exposing all four sides lets consumers use
either physical (`left`) or logical (`inset-inline-start`) CSS positioning.

Document all six properties with `@cssproperty` JSDoc tags on the indicator element.

---

## 5. Keyboard Contract

| Key | `activateOnFocus = true` | `activateOnFocus = false` |
|---|---|---|
| Arrow Left / Up | Focus + activate previous tab | Focus previous tab only |
| Arrow Right / Down | Focus + activate next tab | Focus next tab only |
| Home | Focus + activate first tab | Focus first tab only |
| End | Focus + activate last tab | Focus last tab only |
| Enter / Space | — | Activate focused tab |
| Tab | Move focus to active panel | Move focus to active panel |

Arrow axis follows `orientation`: Left/Right for `horizontal`, Up/Down for `vertical`.
RTL support inherited from `RovingFocusController` (swaps Left/Right in `direction: rtl`).
`loopFocus` on `<grund-tabs-list>` controls whether focus wraps at the ends.

---

## 6. Data Attributes

### `data-selected`

Boolean presence attribute. Set on `<grund-tab>` and `<grund-tabs-panel>` when active.
Distinct from `data-open` — `data-selected` is the standard for selection-based
components (tabs, radio group, listbox, combobox, select, toggle group, menu).
`data-open` is for disclosure/expand patterns (accordion, collapsible, dialog, popover).

Register in `docs/vocabulary.md` alongside existing entries.

### `data-activation-direction`

Values: `'start' | 'end' | 'none'`. Set on every element (root, list, tab, panel,
indicator). Whether the newly active tab is earlier (`start`) or later (`end`) in the
list than the previously active tab. `none` on initial activation (no previous value).
Logical values; consumers combine with `data-orientation` to derive physical direction.

Register in `docs/vocabulary.md` alongside existing entries.

---

## 7. File Structure

```
src/components/tabs/
├── root/
│   └── index.ts              → <grund-tabs>
├── list/
│   └── index.ts              → <grund-tabs-list>
├── tab/
│   └── index.ts              → <grund-tab>
├── panel/
│   └── index.ts              → <grund-tabs-panel>
├── indicator/
│   └── index.ts              → <grund-tabs-indicator>
├── controller/
│   └── tabs.controller.ts
├── registry/
│   └── tabs.registry.ts
├── context/
│   └── tabs.context.ts
├── types.ts
└── index.ts                  → barrel export
```

---

## 8. Testing

Tests in `src/components/tabs/tests/`.

### Controller tests (`tabs-controller.test.ts`)

- Uncontrolled: auto-selects first non-disabled value
- Uncontrolled: `requestActivation` updates `activeValue` and sets `previousValue`
- Controlled: `requestActivation` returns requested value without updating internal state
- Skips disabled tabs in auto-selection
- `value = null` controlled: no tab selected

### Registry tests (`tabs-registry.test.ts`)

- Async registration: tab before panel, panel before tab
- Unregistration cleans up records
- DOM ordering derived from tab element positions
- `getOrderedValues()`, `getDisabledValues()`, `indexOf()` return correct results
- `getTabElement()`, `getPanelElement()` return correct elements or null

### Integration tests (`tabs.test.ts`)

- Renders with correct ARIA roles (`tablist`, `tab`, `tabpanel`)
- `aria-selected` on active tab, `aria-controls`/`aria-labelledby` linked
- Click activates tab, shows panel, fires `grund-value-change`
- Arrow keys move focus (horizontal: Left/Right, vertical: Up/Down)
- `activate-on-focus=true`: arrow keys activate immediately
- `activate-on-focus=false`: Enter/Space required to activate
- `loop-focus`: wraps at boundaries; `loop-focus=false`: stops at boundaries
- Home/End keys focus first/last tab
- Disabled tab: skipped in roving focus, click rejected
- Root `disabled` disables all tabs
- Controlled mode: `value` prop drives state
- Uncontrolled mode: `default-value` seeds initial state
- `keepMounted`: inactive panel stays in DOM with `hidden`
- `hiddenUntilFound`: uses `hidden="until-found"`, `beforematch` activates tab
- Element Reference API ARIA linking (`ariaControlsElements`, `ariaLabelledByElements`)
- Dynamic add/remove: tabs added after initial render
- Active panel gets `tabindex="0"`, inactive panels do not
- `data-selected`, `data-activation-direction`, `data-orientation` set correctly
- Indicator: CSS custom properties update on tab change

---

## 9. Storybook

Stories in `src/components/tabs/stories/`.

### Stories

- **Default** — 3 tabs, uncontrolled, horizontal
- **Vertical** — `orientation="vertical"`
- **Controlled** — external `value` prop drives active tab
- **Default Value** — `default-value` sets initial selection
- **Disabled Tab** — single tab disabled, others active
- **Disabled Root** — entire component disabled
- **Manual Activation** — `activate-on-focus="false"`, requires Enter/Space
- **With Indicator** — includes `<grund-tabs-indicator>`
- **Keep Mounted** — panels stay in DOM when inactive
- **Dynamic Tabs** — add/remove tabs at runtime
- **Many Tabs** — stress test with 20+ tabs
- **No Loop** — `loop-focus="false"`, focus stops at boundaries

### Documentation

- Keyboard contract table
- ARIA roles and attributes mapping
- CSS parts reference with styling examples
- CSS custom properties from indicator
- `data-selected` vs `data-open` distinction
