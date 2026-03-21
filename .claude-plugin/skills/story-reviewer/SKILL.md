---
name: "story-reviewer"
description: "DEPRECATED — replaced by .claude-plugin/reviewers/test-reviewer/. Do not use."
---

## Overview

For a headless library, Storybook is the primary consumer-facing demo surface.
Stories document the keyboard contract, demonstrate all variants, and serve as
the source for autodoc. This reviewer checks that the story file matches the
spec's Stories section and meets the library's documentation standard.

## Output Format

Return findings as JSON lines:

```json
{"file": "stories/{name}.stories.ts", "line": 12, "rule": "Missing variant", "finding": "Spec defines a 'Controlled' story but no story with that name exists in the file", "confidence": 95, "severity": "blocker", "fix": "Add a Controlled story that binds grund-change and updates value externally"}
```

Severity levels: `blocker` (missing required story or broken autodoc),
`warning` (story present but incomplete or misleading), `suggestion` (improvement
to demo quality).

End with `PASS` or `FAIL(blockers=N, warnings=M)`.

## What to check

### Spec coverage

Read the spec file (at `docs/specs/{name}.spec.md` or `docs/superpowers/specs/`)
and find the `## Stories` section. Every story listed there must exist in the
file with a matching or clearly equivalent name. Flag any that are absent.

Required stories for every compound component (even if not in the spec):
- `Default` — basic usage, all items in their default state
- `Disabled` — `disabled` on root

### Keyboard contract documentation

Every story that exercises interaction (Default, any open/close story) must
include a comment block or `parameters.docs.description` string that lists the
keyboard interactions. The content must match the spec's `## ARIA Contract /
Keyboard interactions` table. Flag if:
- No keyboard interactions are documented anywhere in the file
- The documented keys don't match the spec's keyboard table

### Autodoc annotations

Each story must have a JSDoc comment above the export describing what it
demonstrates. The `meta` object must include:
- `title` in the format `"Components/{ComponentName}"`
- `component` set to the root element tag name or class
- `tags: ['autodocs']`

Flag if any of these are missing.

### Element names and imports

- Element class imports must match the actual export names from the component's
  `index.ts`
- Custom element tag names used in story templates must match the `@element`
  declarations (`grund-{name}`, `grund-{name}-item`, etc.)
- No hardcoded inline styles in story templates — stories are demos, not style
  guides; consumer CSS belongs in the story's `decorators`, not `style=""`

### Controlled story correctness

If a `Controlled` story exists, verify:
- It listens to the correct event (e.g. `@grund-change`) via `addEventListener`
  or Lit template syntax
- It updates the `value` property on the root element in response
- A comment explains that the consumer is responsible for updating `value`

### No implementation leakage

Stories must not import from internal paths (`/controller/`, `/context/`,
`/registry/`). Only the public barrel export (`index.ts`) should be imported.
