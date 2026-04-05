# Focus Management

Decision tree and controller designs for each focus management pattern.
Loaded by the implementation plan and the `accessibility-reviewer`.

---

## Decision Tree

```
What type of component?
├── Composite widget (Tabs, Accordion, Toolbar, RadioGroup)
│   └── Use: RovingFocusController (exists in src/controllers/)
│       Arrow keys move focus within widget. Tab exits.
│
├── Modal overlay (Dialog, Sheet, AlertDialog)
│   └── Use: FocusTrapController (build when first modal is built)
│       Tab/Shift+Tab cycle within. Escape closes. Focus returns on close.
│
├── Non-modal overlay (Popover, Dropdown, Tooltip)
│   └── Use: FocusRestorationController (build when first overlay is built)
│       Overlay opens. Focus moves inside (if interactive). Close returns focus to trigger.
│
├── Collection with text input (Combobox, Autocomplete)
│   └── Use: VirtualFocusController — aria-activedescendant (build with Combobox)
│       <input> retains real focus. Option "focus" is visual + aria-activedescendant only.
│
└── Form control wrapping native element (Input, Textarea wrapper)
    └── Use: delegatesFocus: true on shadow root
        Real focus goes to the native element inside shadow root.
```

---

## RovingFocusController (exists)

Location: `src/controllers/roving-focus.controller.ts`

The existing implementation handles:
- `ArrowUp`/`ArrowDown` (vertical) or `ArrowLeft`/`ArrowRight` (horizontal)
- `Home`/`End` for first/last item
- Optional loop wrapping
- `composedPath()` to resolve focus origin across shadow boundaries
- One item at `tabIndex=0`, rest at `tabIndex=-1`

**RTL support:** When `dir="rtl"`, `ArrowLeft` and `ArrowRight` meanings MUST swap for horizontal orientation. Update `RovingFocusController` to check `document.dir` or `getComputedStyle(host).direction`.

---

## FocusTrapController (planned)

Build in `src/controllers/focus-trap.controller.ts` when building the first modal component.

**Required behaviour:**
- On activation: move focus to the first focusable element inside the trap zone (or a specified initial focus element).
- On `Tab`: cycle to next focusable element within trap. Wrap to first after last.
- On `Shift+Tab`: cycle to previous. Wrap to last before first.
- On deactivation: restore focus to the element that had focus before the trap was activated.
- Focusable elements include: `a[href]`, `button:not([disabled])`, `input:not([disabled])`, `select`, `textarea`, `[tabindex]:not([tabindex="-1"])`, shadow DOM elements with `delegatesFocus`.

---

## FocusRestorationController (planned)

Build in `src/controllers/focus-restoration.controller.ts` with first non-modal overlay.

**Required behaviour:**
- On open: record `document.activeElement` as the return target.
- On close: restore focus to the recorded element. If element no longer exists, focus the `<body>`.

---

## VirtualFocusController (planned)

Build in `src/controllers/virtual-focus.controller.ts` with Combobox.

**Required behaviour:**
- Maintains an index into the options list representing the "virtually focused" option.
- Sets `aria-activedescendant` on the input element to the virtually focused option's `id`.
- Adds a visual focus indicator class/attribute to the virtually focused option.
- Responds to `ArrowDown`/`ArrowUp` to change virtual focus index.
- Responds to `Enter` to confirm selection of virtually focused option.
- Real DOM focus stays on the `<input>` element throughout.

---

## `inert` Attribute

When a modal dialog is open, background content MUST be made inert:

```ts
// In dialog root element
updated() {
  const backdrop = document.querySelector('.page-content'); // consumer's root
  if (this.open) {
    backdrop?.setAttribute('inert', '');
  } else {
    backdrop?.removeAttribute('inert');
  }
}
```

Note: consumers are responsible for applying `inert` to their page content. The Dialog component should document this requirement clearly and provide a `data-dialog-open` attribute on `<body>` for consumers to use as a hook.

---

## Tab Order

1. One tab stop per composite widget. All items within the widget are reachable via arrow keys, not Tab.
2. Tab exits the widget to the next page-level focusable element.
3. Never trap focus in a non-modal component.

---

## Rules

1. Use `RovingFocusController` for all composite widgets (Tabs, Accordion, Toolbar, Menu, RadioGroup).
2. Use `FocusTrapController` for all modal overlays (Dialog, Sheet, AlertDialog).
3. Use `FocusRestorationController` for all non-modal overlays that move focus on open (Popover, Dropdown).
4. Use `VirtualFocusController` for all collection components with a text input (Combobox, Autocomplete).
5. `RovingFocusController` MUST respect `dir="rtl"` for horizontal orientation — swap `ArrowLeft`/`ArrowRight`.
6. Composite widgets have exactly one tab stop. Arrow keys navigate within. Tab exits.
7. Modal overlays MUST trap focus when open. Document `inert` requirement for background content.
