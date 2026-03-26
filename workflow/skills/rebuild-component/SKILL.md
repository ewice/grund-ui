---
name: "rebuild-component"
description: "Audit→plan shortcut: audits an existing component against current standards and produces a gap list fed directly into superpowers:writing-plans. Use instead of running brainstorming + writing-plans manually when the goal is standards alignment, not new features. Planning only — does not implement."
---

## Overview

Audits the existing component against current standards, produces a structured gap list, and feeds it directly into `superpowers:writing-plans`. This is a **shortcut** for the `brainstorming → writing-plans` workflow when the goal is standards alignment rather than new feature design. The plan guides reimplementation using the generation pipeline, with existing tests as the regression baseline. This skill produces a plan — not code.

**When to use which:**
- **`/rebuild-component`** — bring an existing component up to current standards (audit-driven, no new features)
- **`superpowers:brainstorming` → `superpowers:writing-plans`** — new features, design exploration, or changes that need creative problem-solving

## Usage

```
/rebuild-component accordion
```

## Implementation

### Step 1 — Read current state

Read all files in `src/components/{name}/`, test file(s), and the stories file. Understand the existing implementation before auditing.

### Step 2 — Read current standards

Read:
- `CLAUDE.md` — architecture and component design rules
- `docs/vocabulary.md` — naming registry
- `workflow/refs/lit-patterns.md`
- `workflow/refs/headless-contract.md`
- `workflow/refs/ssr-contract.md`

If a component spec exists at `docs/specs/{name}.spec.md`: read it.

### Step 3 — Audit

Compare the existing component against current standards. For each layer, produce a gap list:

| Layer | Examples of gaps |
|---|---|
| Types | Missing `HostSnapshot`, wrong event detail shape, non-vocabulary names |
| Context | Unstable context object (recreated each cycle), missing action callbacks |
| Controller | DOM access in controller, no `syncFromHost`, missing `hostDisconnected` cleanup |
| Elements | Missing `exportparts`, `data-*` set in event handlers not `willUpdate`, no dev-mode warnings |
| Tests | Missing keyboard contract, no memory leak test, no RTL coverage, no reparenting test |
| Stories | Missing Controlled story, no `play` function, `tags: ['autodocs']` absent |

For each gap: classify as blocker (must fix before rebuild passes review) or cosmetic (nice to have).

### Step 4 — Produce rebuild plan

Invoke `superpowers:writing-plans`. Provide:
- The gap list as the spec input
- The instruction to follow the generation pipeline: `/scaffold` → `/build-controller` → `/build-elements` → `/build-stories` → `/validate-build`
- A baseline task at the start: "Run existing tests — document all failures as known baseline"

### Step 5 — Handoff

Present the gap list and the plan path to the engineer. **Do not implement.**

The engineer follows the plan using `superpowers:executing-plans` or `superpowers:subagent-driven-development`. The existing component remains in place until the rebuild passes all pipeline gates.

## Common Mistakes

- **Implementing changes directly.** This skill produces a plan, not code. Use `superpowers:writing-plans` to hand off.
- **Ignoring the existing tests.** The existing test suite is the regression baseline — the rebuild must pass it.
- **Rebuilding without a spec.** If `docs/specs/{name}.spec.md` does not exist, run `/component-spec {name}` first to produce one.
