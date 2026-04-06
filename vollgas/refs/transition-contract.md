# Transition Contract

How consumers animate open/close transitions. `PresenceController` design.
Loaded by the implementation plan for overlay and show/hide components.

---

## The Core Contract

Components expose `data-open` (boolean presence attribute) on their panel/content element.
Consumers write all CSS transitions keyed on this attribute.

```css
/* Consumer's stylesheet — the component provides zero transition CSS */
grund-accordion-panel::part(panel) {
  overflow: hidden;
  transition: height 200ms ease;
}
grund-accordion-panel:not([data-open])::part(panel) {
  height: 0;
}
```

---

## The Exit Animation Problem

When `keepMounted=false` (the default), a closed panel is removed from the DOM.
If the consumer has added a CSS exit animation, the element is removed *before* the animation plays.

`PresenceController` solves this: it keeps the element in the DOM until the animation/transition completes.

---

## PresenceController Design

Build in `src/controllers/presence.controller.ts` when building the first overlay component.

**API:**

```ts
class PresenceController implements ReactiveController {
  constructor(
    host: ReactiveControllerHost & Element,
    options: {
      isPresent: () => boolean; // true = should be visible
      onExitComplete?: () => void; // called when exit animation finishes
    }
  );

  /** Whether the element should currently be in the DOM */
  get present(): boolean;
}
```

**Behaviour:**
- When `isPresent()` returns `true`: `present` is `true` immediately.
- When `isPresent()` returns `false`: `present` stays `true`, listens for `transitionend`/`animationend` on the host, then sets `present` to `false` and calls `onExitComplete()`.
- If no transition/animation is running (instant close), sets `present` to `false` immediately after one microtask.

**Usage in a panel element:**

```ts
private _presence = new PresenceController(this, {
  isPresent: () => this.itemCtx?.expanded ?? false,
  onExitComplete: () => this.requestUpdate(),
});

render() {
  if (!this._presence.present) return nothing;
  return html`<div part="panel" role="region"><slot></slot></div>`;
}
```

---

## `keepMounted` Interaction

- `keepMounted=true`: Element stays in DOM always. `PresenceController` not needed. CSS transitions work naturally.
- `keepMounted=false` (default): Use `PresenceController` to delay DOM removal.

---

## `prefers-reduced-motion`

Components do not add `@media (prefers-reduced-motion)` rules — consumers own all CSS.
However, components SHOULD expose a `data-reduced-motion` attribute or CSS custom property
so consumers can conditionally disable animations:

```css
@media (prefers-reduced-motion: reduce) {
  grund-accordion-panel::part(panel) {
    transition: none;
  }
}
```

Document in Storybook: show a motion-safe story variant with the above CSS applied.

---

## `hidden="until-found"` Interaction

When `hiddenUntilFound=true`, the panel uses `hidden="until-found"` instead of `data-open`.
The browser reveals the panel when find-in-page matches content inside it.
The component handles `beforematch` event to update internal expanded state.

```ts
// In panel element
@property({ type: Boolean }) hiddenUntilFound = false;

render() {
  if (this.itemCtx?.expanded) {
    return html`<div part="panel" role="region"><slot></slot></div>`;
  }
  if (this.hiddenUntilFound || this.accordionCtx?.hiddenUntilFound) {
    return html`<div part="panel" role="region" hidden="until-found"
      @beforematch=${this._handleBeforeMatch}><slot></slot></div>`;
  }
  if (!this._presence.present) return nothing;
  return html`<div part="panel" role="region"><slot></slot></div>`;
}
```

---

## Rules

1. Components expose `data-open` (boolean presence attribute) as the sole animation hook. No transition CSS in Shadow DOM.
2. When `keepMounted=false`, use `PresenceController` to delay DOM removal until animation completes.
3. When `keepMounted=true`, `PresenceController` is not needed — CSS transitions work naturally.
4. Document motion-safe patterns in Storybook stories.
5. `hidden="until-found"` support requires handling the `beforematch` event and updating component state.
