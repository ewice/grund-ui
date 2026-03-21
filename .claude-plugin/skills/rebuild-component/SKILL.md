---
name: "rebuild-component"
description: "Use to bring an existing component up to current standards. Audits against CLAUDE.md, ref docs, and vocabulary, then produces a rebuild plan via superpowers:writing-plans. Planning skill only — does not implement."
---

## Overview

Audits the existing component, produces a gap list, and generates a rebuild plan. The plan guides complete reimplementation using the current pipeline, with existing tests as the regression baseline. This skill produces a plan — not code.

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
- `.claude-plugin/refs/lit-patterns.md`
- `.claude-plugin/refs/headless-contract.md`
- `.claude-plugin/refs/ssr-contract.md`

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
