---
name: "build-stories"
description: "Use after /build-elements to create Storybook stories covering all spec variants, play functions, and RTL story. Runs test-reviewer on stories. Final step before /validate-build."
---

## Overview

Builds the full Storybook story file: all spec variants, keyboard play functions, RTL story, and autodoc annotations. test-reviewer gate ensures coverage is complete.

## Usage

```
/build-stories accordion
```

## Implementation

### Step 1 — Read spec and patterns

Read `docs/specs/{name}.spec.md` and `.claude-plugin/refs/test-patterns.md`.

### Step 2 — Write stories

Write `stories/{name}.stories.ts`.

**Required stories:**
- `Default` — minimal usage (zero configuration beyond slotted content)
- `Controlled` — `value` prop driven externally with an event listener showing state
- `Disabled` — root-level disabled and individual item disabled (if applicable)
- `RTL` — wrap in `<div dir="rtl">` (all components, skip only if spec explicitly has no RTL behavior)
- One story per major spec variant (e.g., `Multiple` for accordion, `Modal` vs `NonModal` for dialog)

**Required on at least one story — `play` function covering:**
- Keyboard navigation: Tab to enter, Arrow keys, Enter/Space activate, Escape dismiss (where applicable)
- State verification after interaction using `within(canvasElement).getByRole(...)`

**Required on every story:**
- Correct autodoc: `@element`, `@slot`, `@csspart`, `@fires` on the element class
- `args` mapping to real component properties
- `argTypes` for Controls panel (boolean, select where applicable)
- Story `name` as plain English description of the variant

### Step 3 — Dispatch `test-reviewer`

Read `.claude-plugin/reviewers/test-reviewer/SKILL.md`. Use its content as the Agent prompt. Dispatch as Agent call. Read and inject as context: story file content, unit test file content, component spec content, `.claude-plugin/refs/test-patterns.md` content.

Fix all blockers. Re-review after fixes.

### Step 4 — Commit

```bash
git add stories/{name}.stories.ts
git commit -m "feat({name}): stories — all variants, play functions, autodoc annotations"
```

**Next step: `/validate-build`.**
