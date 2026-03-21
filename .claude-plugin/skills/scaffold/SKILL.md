---
name: "scaffold"
description: "Use after /component-spec to create directory structure, types.ts, context interfaces, and barrel exports. Runs api-reviewer and headless-reviewer on scaffold output. Next step after /component-spec."
---

## Overview

Creates the file skeleton: directories, `types.ts` with all public interfaces, `context/` interfaces, and barrel `index.ts` files. No logic — just structure and types. Reviewer gate ensures the API surface is correct before any logic is written.

## Usage

```
/scaffold accordion
```

## Implementation

### Step 1 — Read spec and context

Read `docs/specs/{name}.spec.md`, `docs/vocabulary.md`, `.claude-plugin/refs/lit-patterns.md`, and `.claude-plugin/refs/headless-contract.md`.

### Step 2 — Create directories

Based on category from the spec:

| Category | Directories to create |
|---|---|
| composite-widget | `root/`, `item/`, `controller/`, `registry/`, `context/`, plus each sub-part from spec |
| form-control | `root/`, `controller/`, `context/` |
| overlay | `root/`, `trigger/`, `content/`, `controller/`, `context/` |
| collection | `root/`, `item/`, `controller/`, `context/` |
| feedback | `root/`, `controller/`, `context/` |
| simple | `root/` only |

All under `src/components/{name}/`.

Note: git does not track empty directories. Directories will become tracked when stub files are written in Steps 3–5.

### Step 3 — Write `types.ts`

Create `src/components/{name}/types.ts`:
- `*Detail` interface for every event in the spec (exported)
- `HostSnapshot` interface for the root element (controlled/uncontrolled pattern)
- Category-specific interfaces (e.g., option types for collection)
- No Lit-specific types (`PropertyValues`, `LitElement`) — framework-agnostic only

### Step 4 — Write context interfaces

Create `src/components/{name}/context/index.ts`:
- Context key (`Symbol`)
- Context interface: state fields (read-only) and action callbacks (use vocabulary registry names)
- Export both from `context/index.ts`

### Step 5 — Write element stubs

For each element directory in the spec (e.g., `root/`, `item/`, `trigger/`, `panel/`), create a minimal stub file `src/components/{name}/{part}/index.ts`:

```ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('grund-{name}-{part}')
export class Grund{Name}{Part}Element extends LitElement {
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

### Step 6 — Write barrel `index.ts`

Create `src/components/{name}/index.ts`:
- Re-export all element classes from their stub files
- Re-export all public types from `types.ts`

### Step 7 — Run reviewer gate (parallel)

Read `.claude-plugin/reviewers/api-reviewer/SKILL.md` and `.claude-plugin/reviewers/headless-reviewer/SKILL.md`. Use each file's content as the Agent prompt. Dispatch both as parallel Agent calls:

- **api-reviewer**: prompt = `api-reviewer` SKILL.md content; read and inject as context: `types.ts` content, `context/index.ts` content, component spec content, `docs/vocabulary.md` content
- **headless-reviewer**: prompt = `headless-reviewer` SKILL.md content; read and inject as context: `types.ts` content, component spec content, `.claude-plugin/refs/headless-contract.md` content

Collect findings. Fix all blockers before proceeding. Note warnings for follow-up.

### Step 8 — Commit

```bash
git add src/components/{name}/
git commit -m "feat({name}): scaffold — types, context interfaces, directory structure"
```

**Next step: `/build-controller {name}`.**
