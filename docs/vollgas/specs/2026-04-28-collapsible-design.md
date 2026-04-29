# Collapsible Component Design

Date: 2026-04-28

## Context

Grund UI is a headless, accessible Lit web component library. The Accordion implementation is the local reference for compound component structure, context registration, event naming, and panel visibility behavior.

Base UI's Collapsible provides the behavior target: root/trigger/panel anatomy, controlled and uncontrolled open state, disabled gating, optional mounted panels, `hidden="until-found"`, transition data attributes, and panel dimension CSS variables.

The local Shopify Web Components reference does not include a direct collapsible primitive. Its useful lessons are web-component-oriented property/event APIs, guarded custom element definitions, lifecycle events, and command-style extensibility. Collapsible v1 should not implement a Polaris-style external command trigger, but should avoid API choices that block one later.

## Decision

Build Collapsible as a dedicated Stateful Simple Compound component plus a reusable `PresenceController`.

Do not reuse Accordion internals. Collapsible has exactly one open/closed state, no repeated items, no roving focus, and no selection set. Reusing Accordion would leak item/value concepts into a simpler disclosure primitive.

Do not build on native `<details>/<summary>` for v1. The component needs Base UI-style root/trigger/panel anatomy, explicit controlled state, direct ARIA element references, and predictable panel presence behavior.

## Component Shape

Add `src/components/collapsible/` with flat component files:

- `collapsible.ts`: root/provider element.
- `collapsible-trigger.ts`: trigger element.
- `collapsible-panel.ts`: panel element.
- `collapsible.context.ts`: root context contract and context symbol.
- `collapsible.engine.ts`: DOM-free, Lit-free open-state resolver.
- `types.ts`: public event detail types, host snapshot, and transition status types.
- `index.ts`: public barrel export.
- `tests/`: component test files.

Add `src/controllers/presence.controller.ts` because Collapsible v1 intentionally includes exit-transition-safe unmounting. Update the planned controller registry in `vollgas/refs/component-shapes.md` to mark `PresenceController` as existing once implemented.

## Public API

### `<grund-collapsible>`

Properties:

- `open?: boolean`: controlled open state. When defined, user interaction emits a request event but does not mutate internal state.
- `defaultOpen = false`: initial uncontrolled open state.
- `disabled = false`: disables trigger-driven interaction.

Event:

- `grund-open-change`: dispatched from the root for user or programmatic open-state requests. Uses `bubbles: true, composed: false`, matching existing Grund event conventions.

Event detail:

```ts
export interface CollapsibleOpenChangeDetail {
  open: boolean;
  reason: 'trigger-press' | 'programmatic';
  trigger: HTMLElement | null;
}
```

`CollapsibleOpenChangeReason` is the exported union `'trigger-press' | 'programmatic'`.

Controlled mode mirrors existing Grund UI conventions: the event reports the requested state, and the consumer must update `open`. Uncontrolled mode mutates internal state and emits the same event.

### `<grund-collapsible-trigger>`

The trigger has no public state properties in v1. It consumes root context and renders:

```html
<button part="trigger" type="button">
  <slot></slot>
</button>
```

Host state hooks:

- `data-open`
- `data-disabled`

The inner button reflects the current state through `aria-expanded` and `aria-disabled`. It links to the panel with `ariaControlsElements` after both parts are registered.

### `<grund-collapsible-panel>`

Properties:

- `keepMounted = false`: keep panel DOM rendered while closed.
- `hiddenUntilFound = false`: keep panel searchable with `hidden="until-found"` and open on `beforematch`.

Host state hooks:

- `data-open`
- `data-disabled`
- `data-starting-style`
- `data-ending-style`

CSS custom properties:

- `--grund-collapsible-panel-height`
- `--grund-collapsible-panel-width`

The panel renders a single structural part:

```html
<div part="panel">
  <slot></slot>
</div>
```

## Context Contract

The root provides a minimal context to trigger and panel elements:

```ts
export interface CollapsibleRootContext {
  open: boolean;
  disabled: boolean;
  requestToggle(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void;
  registerTrigger(trigger: HTMLElement): void;
  unregisterTrigger(trigger: HTMLElement): void;
  registerPanel(panel: HTMLElement): void;
  unregisterPanel(panel: HTMLElement): void;
  getTriggerElement(): HTMLElement | null;
  getPanelElement(): HTMLElement | null;
}
```

Registration should use context callbacks only. Do not use `querySelectorAll` or `closest` for discovery. Dev-mode warnings should flag trigger or panel elements used outside `<grund-collapsible>`.

## Presence Controller

`PresenceController` is a shared Reactive Controller for show/hide components that remove DOM when closed but need exit transitions to complete.

API:

```ts
export type PresenceStatus = 'idle' | 'starting' | 'ending';

export class PresenceController implements ReactiveController {
  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: {
      isPresent: () => boolean;
      getTransitionElement?: () => HTMLElement | null;
      onExitComplete?: () => void;
      onStatusChange?: (status: PresenceStatus) => void;
    },
  );

  get present(): boolean;
  get status(): PresenceStatus;
}
```

Behavior:

- When `isPresent()` changes to true, `present` becomes true immediately and `status` briefly becomes `starting`.
- When `isPresent()` changes to false, `present` stays true while `status` is `ending`.
- During `ending`, listen for `transitionend` and `animationend` on `getTransitionElement?.() ?? host`.
- If no transition or animation is active, complete exit after a microtask.
- If the component reopens while exit is pending, cancel exit and return to `starting` or `idle`.
- Remove every event listener on disconnect.

Collapsible v1 should use the controller only in `grund-collapsible-panel`. The panel should pass the inner `part="panel"` element as the transition element so consumer transitions applied through `::part(panel)` can be observed reliably. Existing Accordion and Tabs behavior should not be refactored in the same change.

## Accessibility

Collapsible follows a disclosure pattern, not an accordion pattern.

- The root has no required ARIA role.
- The trigger is a native button.
- Native button behavior handles pointer, Enter, and Space activation.
- The trigger button has `aria-expanded` matching root open state.
- The trigger button uses `ariaControlsElements = [panelHost]` when a panel is registered.
- The panel's inner `part="panel"` element has `role="region"`.
- The panel's inner `part="panel"` element uses `ariaLabelledByElements = [triggerHost]` when a trigger is registered.
- No roving focus controller is needed.
- Tab order remains normal; focus is never trapped.
- Disabled state prevents trigger requests and is exposed through `aria-disabled` plus `data-disabled`.

Use Element Reference API relationships instead of string IDREFs. This avoids the cross-shadow issue documented in `vollgas/refs/aria-linking.md`.

## Panel Visibility

Panel rendering rules:

- Open: render the panel, remove `hidden`, expose `data-open`.
- Closing while presence exit is active: render the panel without `hidden`, expose `data-ending-style`, and let consumer CSS animate the exit.
- Closed with `keepMounted` (and not `hiddenUntilFound`): render the panel with `hidden`, expose no `data-open`.
- Closed with `hiddenUntilFound` (regardless of `keepMounted`): render the panel with `hidden="until-found"`. `hiddenUntilFound` takes precedence over `keepMounted` because `hidden="until-found"` is strictly more useful — it keeps DOM and makes content searchable.
- Closed by default (neither `keepMounted` nor `hiddenUntilFound`): render while `PresenceController.present` is true, then return `nothing` after exit completes.

This matches the Accordion panel visibility logic exactly (`accordion-panel.ts`).

`hiddenUntilFound` behavior:

- The panel listens for `beforematch`.
- On `beforematch`, it calls `requestToggle` with reason `programmatic`. Since `beforematch` only fires on `hidden="until-found"` elements (which are always collapsed), this always results in an open action.
- The listener must be added and removed symmetrically.

## Headless Styling Contract

Shadow DOM styles remain headless. Each element may only include the allowed `:host { display: ... }` rule with a justification comment.

Consumers own all visuals and transitions. The component only exposes state hooks:

- `data-open` for the open steady state (absence indicates closed or transitioning).
- `data-starting-style` for opening start styles.
- `data-ending-style` for exit styles.
- `--grund-collapsible-panel-height` and `--grund-collapsible-panel-width` for dimension-based animations.

The component should measure the rendered panel `scrollHeight` and `scrollWidth` once per open (in `updated()` when the panel mounts) and set the CSS variables on the `<grund-collapsible-panel>` host. No `ResizeObserver` is needed — the variables are animation target snapshots, not live layout values. The panel flows at its natural height when open; the variables only matter during transitions. The inner panel part inherits those variables, so consumers can write `grund-collapsible-panel::part(panel) { height: var(--grund-collapsible-panel-height); }`. Storybook should show consumer-owned CSS for height transitions and reduced-motion handling.

## Vocabulary And Exports

Update `docs/vocabulary.md`:

- Add component tags: `grund-collapsible`, `grund-collapsible-trigger`, `grund-collapsible-panel`.
- Reuse existing part names: `trigger`, `panel`.
- Add data attributes: `data-starting-style`, `data-ending-style`.
- Add event detail entry for `grund-open-change` with Collapsible detail shape.
- Add CSS custom properties: `--grund-collapsible-panel-height`, `--grund-collapsible-panel-width`.

Update exports:

- `src/index.ts`
- `package.json` exports map with `./collapsible`
- generated Custom Elements Manifest after implementation.

## Testing Plan

Engine tests:

- Uncontrolled initial state from `defaultOpen`.
- Controlled state from `open`.
- Disabled gating returns no state change.
- Toggle request resolution.

Root tests:

- Context propagation to trigger and panel.
- Controlled mode emits `grund-open-change` without mutating internal state.
- Uncontrolled mode mutates state and emits `grund-open-change`.
- Host data attributes reflect open and disabled states.

Trigger tests:

- Renders native button with `part="trigger"` and `type="button"`.
- Click requests toggle when enabled.
- Click does nothing when disabled.
- `aria-expanded`, `aria-disabled`, and `ariaControlsElements` stay synchronized.

Panel tests:

- Default closed panel unmounts after presence exit.
- `keep-mounted` keeps panel DOM with `hidden`.
- `hidden-until-found` keeps panel DOM with `hidden="until-found"`.
- `beforematch` requests open.
- `ariaLabelledByElements` links to trigger host.
- Data attributes and CSS variables update when open/closed.

PresenceController tests:

- Enters immediately.
- Exits after transition or animation end.
- Falls back after a microtask when no transition or animation is active.
- Cancels pending exit when reopened.
- Removes listeners on disconnect.

Storybook stories:

- Default.
- Controlled.
- Disabled.
- Keep mounted.
- Hidden until found.
- Animated height.
- Reduced motion CSS.

## Non-Goals

- No Polaris-style external `commandFor` trigger in v1.
- No Accordion or Tabs refactor in the Collapsible implementation change.
- No visual styles, colors, spacing, or transition CSS in component Shadow DOM.
- No render replacement API equivalent to Base UI's React `render` prop.
- No roving focus or composite widget behavior.

## Open Follow-Up

After Collapsible ships, evaluate whether Accordion and Tabs panels should adopt `PresenceController` in a separate focused change.

Evaluate extracting a shared `PanelController` that composes `PresenceController` internally and owns panel visibility resolution (`keepMounted`, `hiddenUntilFound`, presence state), `beforematch` listener management, dimension measurement, and data attribute syncing. `PresenceController` stays standalone for non-panel use cases (toasts, dialogs, popovers). Extract after a third consumer confirms the pattern.
