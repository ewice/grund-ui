# Positioning Strategy

Architectural decision and `PositioningController` design for overlay components.
Loaded by `/build-elements` for overlay and collection components.

---

## Architectural Decision

**Floating UI** is the positioning engine. Build `PositioningController` when the first
positioned overlay component is built.

**CSS Anchor Positioning** is the future path. When browser support is sufficient (check
[caniuse.com/css-anchor-positioning](https://caniuse.com/css-anchor-positioning)), migrate
`PositioningController` to use it natively with a Floating UI fallback.

---

## Popover API Integration

For overlays that need top-layer rendering (above `z-index` stacking context):

- Use the native `popover` attribute when available (Chrome 114+, Safari 17+, Firefox 125+).
- Fall back to absolute/fixed positioning for older browsers.
- Feature detect: `HTMLElement.prototype.hasOwnProperty('popover')`.

```ts
private _usePopoverApi = HTMLElement.prototype.hasOwnProperty('popover');

render() {
  return html`
    <div part="content"
      ?popover=${this._usePopoverApi || nothing}>
      <slot></slot>
    </div>
  `;
}
```

---

## PositioningController Design

Build in `src/controllers/positioning.controller.ts` with the first positioned overlay.

```ts
class PositioningController implements ReactiveController {
  constructor(
    host: ReactiveControllerHost & Element,
    options: {
      reference: () => Element | null;  // the anchor element
      floating: () => HTMLElement | null; // the positioned overlay element
      placement?: Placement;             // 'bottom', 'top', 'left', 'right', etc.
      offset?: number;                   // distance from anchor
    }
  );

  /** Updates position. Call after open. */
  update(): void;
}
```

**Responsibilities:**
- Calls `computePosition()` from Floating UI with `flip`, `shift`, and `offset` middleware.
- Updates `floating.style.top` / `floating.style.left` (or CSS transform).
- Re-computes on window resize and scroll (via `autoUpdate` from Floating UI).
- Cleans up `autoUpdate` listener in `hostDisconnected`.

---

## Rules

1. Never position overlay elements with hard-coded CSS `top`/`left` values — use `PositioningController`.
2. Always include `flip` middleware so overlays reposition when viewport space is insufficient.
3. Always include `shift` middleware to keep overlays within viewport boundaries.
4. Clean up `autoUpdate` listeners in `hostDisconnected` to prevent memory leaks.
5. Test positioning with: overlay near viewport edge, overlay in scrollable container, overlay in transformed parent.
