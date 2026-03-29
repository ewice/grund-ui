---
name: "scaffold"
description: "Use after /component-spec to create directory structure, types.ts, context interfaces, and barrel exports. Validates structure only — reviewer gates run in /build-elements where there is real code to review. Next step after /component-spec."
---

## Overview

Creates the file skeleton: directories, `types.ts` with all public interfaces, `context/` interfaces, and barrel `checkbox.ts` files. No logic — just structure and types. Structural validation only — full reviewer gates run in `/build-elements` where there is real code to review.

## Usage

```
/scaffold accordion
```

## Implementation

### Step 0 — Pre-flight: verify required controllers exist

Before creating any files, check that every shared controller this category needs is
already implemented. Proceeding without them leads to a broken build deep into
`/build-elements` — better to surface the gap now.

1. Read `docs/specs/{name}.spec.md` and identify the component category.

2. Look up the required controllers for that category:

| Category | Required shared controllers | File to check |
|---|---|---|
| composite-widget | `RovingFocusController` | `src/controllers/roving-focus.controller.ts` |
| composite-widget (with set selection) | `SelectionEngine` | `src/controllers/selection.engine.ts` |
| form-control | `FormController` | `src/controllers/form.controller.ts` |
| overlay | `PresenceController` | `src/controllers/presence.controller.ts` |
| overlay (modal) | `FocusTrapController` | `src/controllers/focus-trap.controller.ts` |
| overlay (non-modal) | `FocusRestorationController` | `src/controllers/focus-restoration.controller.ts` |
| overlay (dismissable) | `OutsideClickController` | `src/controllers/outside-click.controller.ts` |
| overlay (modal) | `ScrollLockController` | `src/controllers/scroll-lock.controller.ts` |
| overlay (positioned) | `PositioningController` | `src/controllers/positioning.controller.ts` |
| collection (input retains focus) | `VirtualFocusController` | `src/controllers/virtual-focus.controller.ts` |
| feedback | `LiveRegionController` | `src/controllers/live-region.controller.ts` |
| simple | (none) | — |

   For overlay components, which sub-rows apply depends on the spec — a Tooltip needs
   `PresenceController` + `PositioningController` but not `FocusTrapController`. Read the
   spec and check only the controllers the spec actually requires.

3. For each required controller, verify its file exists in `src/controllers/`.

4. **If any required controller is missing — STOP. Do not create any directories or files.** Output:

   ```
   [scaffold] Cannot proceed — {ComponentName} ({category}) requires controllers that do not yet exist:

     • {MissingControllerName} → src/controllers/{file}.ts

   Build each missing controller first using /build-controller, guided by the spec in
   workflow/refs/component-shapes.md and the relevant refs/ documents.
   Then re-run /scaffold {name}.
   ```

5. If all required controllers exist: proceed to Step 1.

### Step 1 — Read spec and context

Read `docs/specs/{name}.spec.md`, `docs/vocabulary.md`, `workflow/refs/lit-patterns.md`, and `workflow/refs/headless-contract.md`.

### Step 2 — Create directories

Based on category from the spec:

| Category | Directories to create |
|---|---|
| composite-widget | `root/`, `item/`, `engine/`, `registry/`, `context/`, plus each sub-part from spec |
| form-control | `root/`, `engine/`, `context/` |
| overlay | `root/`, `trigger/`, `content/`, `engine/`, `context/` |
| collection | `root/`, `item/`, `engine/`, `context/` |
| feedback | `root/`, `engine/`, `context/` |
| simple | `root/` only |

All under `src/components/{name}/`.

Note: git does not track empty directories. Directories will become tracked when stub files are written in Steps 3–5.

### Step 3 — Write `types.ts`

Create `src/components/{name}/types.ts`:
- `*Detail` interface for every event in the spec (exported)
- `HostSnapshot` interface for the root element (controlled/uncontrolled pattern). Mark with `/** @internal */` — this interface is consumed only by the controller and must not appear in consumer-facing API docs.
- Category-specific interfaces (e.g., option types for collection)
- No Lit-specific types (`PropertyValues`, `LitElement`) — framework-agnostic only

### Step 4 — Write context interfaces

Create `src/components/{name}/context/{name}.context.ts`:
- Context key (`Symbol`)
- Context interface: state fields (read-only) and action callbacks (use vocabulary registry names)
- Export both from `{name}.context.ts`

**Context interface design rules (apply before writing any field):**

| Field type | Rule | Example |
|---|---|---|
| Disabled state | Handled by shared `disabledContext` — do NOT add to component-specific context interfaces | See Rule 38 in `refs/lit-patterns.md` |
| Configuration pass-through | Raw value is acceptable — items cannot derive it independently | `orientation: 'horizontal' \| 'vertical'` |
| Selection state | Query method over current values | `isExpanded: (value: string) => boolean` |
| Actions | Stable bound callback | `requestToggle: (value: string, itemDisabled: boolean) => void` |
| Registry data | Read-only projection only | `indexOf: (item: HTMLElement) => number` — never `getRegistry(): Registry` |

### Step 5 — Write element stubs

For each element directory in the spec (e.g., `root/`, `item/`, `trigger/`, `panel/`), create a minimal stub file `src/components/{name}/{part}/checkbox.ts`:

```ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('grund-{name}-{part}')
export class Grund{Name}{Part}Element extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;
  // Components with a `value` prop: derive deterministic IDs
  // private get _id() { return `grund-{name}-{part}-${this.value}`; }
  // Components without `value`: generate in connectedCallback only, never in constructors

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-{name}-{part}')) {
  customElements.define('grund-{name}-{part}', Grund{Name}{Part}Element);
}
```

These stubs are replaced by `/build-elements`. Their only purpose is to give TypeScript a resolvable import target and ensure `customElements.define()` is guarded.

### Step 6 — Write barrel `checkbox.ts`

Create `src/components/{name}/checkbox.ts`:
- Re-export all element classes from their stub files
- Re-export all public types from `types.ts`

### Step 7 — Structural validation

Verify before committing:
- All directories from the spec's category exist
- `types.ts` exports all event detail interfaces and `HostSnapshot`
- `context/{name}.context.ts` exports the context key and interface
- Barrel `checkbox.ts` re-exports all element classes and public types
- Every element stub has the `customElements.define()` guard
- All names in `types.ts` and `context/checkbox.ts` match vocabulary registry entries

No reviewer agents run at this step — element stubs have no logic to review. Full reviewer gates run in `/build-elements`.

### Step 8 — Commit

```bash
git add src/components/{name}/
git commit -m "feat({name}): scaffold — types, context interfaces, directory structure"
```

**Next step: `/build-engine {name}`.**
