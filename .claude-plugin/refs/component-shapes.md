# Component Shapes

Per-category guidance for generation skills. Read this before building any component.
Identifies required controllers, context structure, focus management strategy,
and planned shared controllers (built when the first component of that category is built).

---

## How to Identify the Category

| Indicator | Category |
|---|---|
| Has repeating items that expand/collapse, are selected, or are navigated | Composite widget |
| Submits a value to a `<form>` | Form control |
| Appears above other content, triggered by user action | Overlay |
| Renders a list of options, supports filtering or typeahead | Collection |
| Appears temporarily to communicate status, auto-dismisses | Feedback |
| No interaction, no state | Simple |

---

## Composite Widget

**Examples:** Accordion, Tabs, Toolbar, RadioGroup, TreeView

**Required structure:**
- `root/` — provider element, `@provide` context, `RovingFocusController`
- `item/` — repeating container, consumes root context, provides item context
- `[sub-parts]/` — trigger, panel, etc.
- `controller/` — owns state, pure resolver functions
- `registry/` — ordered child tracking
- `context/` — root context interface + item context interface

**Focus management:** `RovingFocusController` on root. Arrow keys move focus within widget. Tab exits to next page-level focusable.

**Required shared controllers:** `RovingFocusController` (exists in `src/controllers/`). Open/closed state and ARIA linking are inline patterns — set `data-open` in `willUpdate` and derive ARIA IDs from context, binding them directly in templates.

**Context pattern:**
- Root provides: expanded state, actions (requestToggle, requestOpen), registration callbacks
- Item provides: item-level state (value, index, disabled, expanded), sub-part registration callbacks
- Leaf elements consume item context only

---

## Form Control

**Examples:** Switch, Checkbox, Radio, Select, Input, Textarea, Slider

**Required structure:**
- Root element with `static formAssociated = true`
- `FormController` wrapping `ElementInternals` (build when first form control is built)

**Required `FormController` capabilities** (to implement when building the first form control):
- `attachInternals()` → `ElementInternals` instance
- `setFormValue(value)` — call in `willUpdate` when controlled value changes
- `setValidity(flags, message, anchor?)` — validation constraint API
- `formResetCallback()` — restore to `defaultValue`
- `formStateRestoreCallback(state, reason)` — browser autofill / back-forward cache
- `formDisabledCallback(disabled)` — propagate `<fieldset disabled>` to component

**Focus management:** `delegatesFocus: true` on shadow root when wrapping a native focusable element.

**Label association:** Use `ElementInternals` — consumers use `<label for="id">` pointing to the component's `id` attribute.

---

## Overlay

**Examples:** Dialog, Popover, Tooltip, Dropdown, Combobox dropdown, Sheet

**Required structure:**
- Trigger element (button, input, etc.)
- Content element (the floating/overlay layer)
- Controller owning open/closed state and positioning

**Required planned controllers** (build each when first overlay component needs it):
- `PresenceController` — delays DOM removal until `transitionend`/`animationend` fires (see `refs/transition-contract.md`)
- `FocusTrapController` — traps focus within modal overlays (Dialog, Sheet)
- `FocusRestorationController` — returns focus to trigger on close (Popover, Dropdown)
- `OutsideClickController` — detects pointer events outside the overlay
- `ScrollLockController` — prevents `<body>` scroll when modal overlay is open
- `PositioningController` — Floating UI wrapper for anchor-relative positioning (see `refs/positioning-strategy.md`)

**Focus management:** Modal overlays trap focus (`FocusTrapController`). Non-modal overlays restore focus to trigger on close (`FocusRestorationController`). See `refs/focus-management.md`.

**State machine:** Use explicit state machine pattern (from `refs/lit-patterns.md` Rules 33–34) for `opening → open → closing → closed` lifecycle.

---

## Collection

**Examples:** Select, Combobox, Listbox, Menu, Autocomplete

**Required structure:**
- Container (listbox/menu role)
- Option/item elements
- Optional text input for filtering/typeahead

**Required planned controllers** (build when first collection component needs it):
- `VirtualFocusController` — `aria-activedescendant` pattern for keyboard navigation without moving actual DOM focus (required when a text `<input>` must retain focus while options are "focused")

**Focus management:** Virtual focus (`aria-activedescendant`) when input retains focus. Physical roving tabindex for menus/listboxes without a text input.

**Additional concerns:**
- Typeahead: match typed characters against option text content
- Virtual scroll: for large option lists (100+ options), render only visible items
- Multi-select: track selected set, emit full set on `grund-change`

---

## Feedback

**Examples:** Toast, Alert, Banner, Notification

**Required structure:**
- Container managing lifecycle (queue, stacking)
- Individual notification element

**Required planned controllers** (build when first feedback component needs it):
- `LiveRegionController` — wraps `aria-live` region management to prevent competing live regions across component instances

**ARIA:** Use `role="alert"` (assertive) for errors, `role="status"` (polite) for informational. Never create multiple competing `aria-live` regions — share a single `LiveRegionController` instance.

**Lifecycle:** Auto-dismiss timers. Pause on hover/focus. Queue management for multiple concurrent toasts.

---

## Simple

**Examples:** Separator, VisuallyHidden, AspectRatio, ScrollArea (thin wrapper)

**Required structure:**
- Single element
- No controller, no registry, no item sub-parts
- Minimal spec: element name, ARIA role, parts, slots

**Pipeline:** Use Pipeline 2 (Simple) — no Superpowers brainstorming, no plan document.

---

## Planned Controllers Registry

Track build status here as the library grows:

| Controller | Status | First built for |
|---|---|---|
| `RovingFocusController` | ✅ Exists | Accordion |
| `PresenceController` | 🔲 Planned | First overlay component |
| `FocusTrapController` | 🔲 Planned | Dialog |
| `FocusRestorationController` | 🔲 Planned | First non-modal overlay |
| `VirtualFocusController` | 🔲 Planned | Combobox |
| `LiveRegionController` | 🔲 Planned | First feedback component |
| `PositioningController` | 🔲 Planned | First positioned overlay |
| `FormController` | 🔲 Planned | First form control |
| `OutsideClickController` | 🔲 Planned | First dismissable overlay |
| `ScrollLockController` | 🔲 Planned | Dialog |
