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

Read `docs/specs/{name}.spec.md`, `.claude-plugin/refs/lit-patterns.md`, and `.claude-plugin/refs/headless-contract.md`.

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

### Step 5 — Write barrel `index.ts`

Create `src/components/{name}/index.ts`:
- Re-export all element classes (placeholders for now — the files don't exist yet)
- Re-export all public types from `types.ts`

Also add SSR-safe ID helpers and define guard to every element stub:
- Accept optional `id` property (`@property() id?: string`)
- When the component has a `value` prop, derive deterministic IDs: `` `grund-${tagName}-${value}` ``. For components without `value`, fall back to `crypto.randomUUID().slice(0, 8)` only inside `connectedCallback` — never in constructors or field initializers
- Wrap `customElements.define(...)` with `if (!customElements.get('grund-{name}'))` guard

### Step 6 — Run reviewer gate (parallel)

Read `.claude-plugin/reviewers/api-reviewer/SKILL.md` and `.claude-plugin/reviewers/headless-reviewer/SKILL.md`. Use each file's content as the Agent prompt. Dispatch both as parallel Agent calls:

- **api-reviewer**: prompt = `api-reviewer` SKILL.md content; pass `types.ts`, `context/index.ts`, the component spec, and `docs/vocabulary.md`
- **headless-reviewer**: prompt = `headless-reviewer` SKILL.md content; pass `types.ts`, the component spec, and `.claude-plugin/refs/headless-contract.md`

Collect findings. Fix all blockers before proceeding. Note warnings for follow-up.

### Step 7 — Commit

```bash
git add src/components/{name}/
git commit -m "feat({name}): scaffold — types, context interfaces, directory structure"
```

**Next step: `/build-controller {name}`.**
