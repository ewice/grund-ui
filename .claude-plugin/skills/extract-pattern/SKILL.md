---
name: "extract-pattern"
description: "Use when a pattern appears in 2+ components to promote it to a shared controller or utility. Extracts inline code into src/controllers/ or src/utils/, updates all consumers, and updates the vocabulary registry."
---

## Overview

Second-use rule: implement inline on first use, extract on second. This skill handles the extraction: moves the inline pattern to a shared controller or utility, updates all consumers, and registers any new names in `docs/vocabulary.md`.

## Usage

```
/extract-pattern -- roving focus logic inline in both accordion and tabs
/extract-pattern -- open/close state management duplicated in dialog and popover
```

## Implementation

### Step 1 — Identify the pattern

Read the inline implementations in both components. Document:
- What state the pattern manages
- What its public interface is (methods, properties, events)
- Whether it belongs in `src/controllers/` (a `ReactiveController`) or `src/utils/` (a pure function)

**Controllers:** stateful, tied to element lifecycle, implement `ReactiveController`.
**Utilities:** pure functions, no Lit dependency, no element lifecycle.

### Step 2 — Check for prior art

Read `src/controllers/` and `src/utils/`. If a closely related implementation already exists: extend it rather than creating a new one.

### Step 3 — Write failing tests (RED)

Write `src/controllers/{name}.test.ts` or `src/utils/{name}.test.ts`. Tests must cover:
- The shared interface (all public methods)
- Both use cases that triggered extraction (one test case per originating component)
- Edge cases from either inline implementation

Run `npm run test:run -- src/controllers/` (or `src/utils/`) — confirm tests fail.

### Step 4 — Implement (GREEN)

Write `src/controllers/{name}.ts` or `src/utils/{name}.ts`:
- Follow `ReactiveController` pattern from `.claude-plugin/refs/lit-patterns.md` if it's a controller
- No DOM access in controllers (testable in Node without a browser)
- Constructor calls `host.addController(this)` for controllers
- `hostConnected()` / `hostDisconnected()` for setup and teardown

Run tests — confirm they pass.

### Step 5 — Update consumers

For each component that has the inline version:
1. Delete the inline code
2. Import the shared controller/utility
3. Wire it up

Run `npm run test:run -- src/components/{name}/` for each updated component — all tests must pass.

### Step 6 — Update vocabulary registry

If the extracted pattern introduces new action verbs, controller names, or method signatures: add them to `docs/vocabulary.md`.

### Step 7 — Run lit-reviewer

Read `.claude-plugin/reviewers/lit-reviewer/SKILL.md`. Use its content as the Agent prompt. Dispatch as Agent call. Read and inject as context: new shared file content, all updated consumer file contents, `.claude-plugin/refs/lit-patterns.md` content, `.claude-plugin/refs/ssr-contract.md` content.

Fix all blockers. Re-review after fixes. Max 2 iterations.

### Step 8 — Commit

```bash
git add src/controllers/{name}.ts src/utils/{name}.ts src/components/*/
git commit -m "refactor: extract {name} to shared {controller|utility}"
```

**Next step: `/validate-build`.**
