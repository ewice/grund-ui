---
name: "build-stories"
description: "Use after /build-elements to create Storybook stories covering all spec variants, play functions, and RTL story. Runs test-reviewer and api-reviewer on stories. Final step before /validate-build."
---

## Overview

Builds the full Storybook story file: all spec variants, keyboard play functions, RTL story, and autodoc annotations. Reviewer gate ensures coverage and documentation alignment.

## Usage

```
/build-stories accordion
```

## Implementation

### Step 1 — Read spec and patterns

Read `docs/specs/{name}.spec.md`, `workflow/refs/test-patterns.md`, and `workflow/refs/consumer-dx.md`.

### Step 2 — Write stories

Write `stories/{name}.stories.ts`.

**`Meta` export (required at top of file):**

```ts
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Components/{Name}',
  component: 'grund-{name}',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;
```

`tags: ['autodocs']` enables the autodoc page that reads `@element`, `@slot`, `@csspart`, and `@fires` tags.

**Required stories:**
- `Default` — minimal usage (zero configuration beyond slotted content)
- `Controlled` — `value` prop driven externally with an event listener showing state
- `Disabled` — root-level disabled and individual item disabled (if applicable)
- `RTL` — wrap in `<div dir="rtl">` (all components, skip only if spec explicitly has no RTL behavior)
- One story per major spec variant (e.g., `Multiple` for accordion, `Modal` vs `NonModal` for dialog)

**Required on `Default` story (or add a dedicated `KeyboardNavigation` story) — `play` function using `@storybook/test`:**

```ts
import { within, userEvent, expect } from '@storybook/test';

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /first item/i });
    await userEvent.click(trigger);
    // assert expanded state — check aria-expanded, data-open, or both:
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowDown}');
    // assert focus moved to next trigger
  },
};
```

The `play` function must cover:
- Keyboard navigation: Tab to enter, Arrow keys between items, Enter/Space to activate, Escape to dismiss (where applicable)
- State verification: assert `aria-expanded`, `data-open`, or focus position after each key interaction

**Required on every story:**
- Correct autodoc: verify `@element`, `@slot`, `@csspart`, `@fires` JSDoc tags are present on the element class source file (not in the story file) — the `meta.tags: ['autodocs']` renders them
- `args` mapping to real component properties
- `argTypes` for Controls panel — `boolean` props use `control: 'boolean'`; string-union props use `control: 'select'` with an `options` array:
  ```ts
  argTypes: {
    disabled: { control: 'boolean' },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
  }
  ```
- Story `name` as plain English description of the variant

### Step 3 — Dispatch reviewers (parallel)

Read `workflow/reviewers/test-reviewer/SKILL.md` and `workflow/reviewers/api-reviewer/SKILL.md`. Use each file's content as the Agent prompt. Dispatch both as parallel Agent calls:

- **test-reviewer**: inject story file, unit test file, component spec, `workflow/refs/test-patterns.md`. Note: this is the first run where the `test-reviewer` sees both unit tests AND story files together. It will re-evaluate unit test checklist items (1–15) in addition to story coverage items (16–17).
- **api-reviewer**: inject story file, element files, `types.ts`, `workflow/refs/api-contract.md`, component spec, `docs/vocabulary.md`, `workflow/refs/consumer-dx.md`. Focus: argTypes alignment with public properties, public JSDoc/autodoc completeness, and consumer-dx compliance:
  - `Default` story uses zero configuration beyond slotted content (consumer-dx Rule 4)
  - A composition story exists — `AsLink` or `CustomTrigger` — showing render delegation via slot (consumer-dx Rule 14-15)
  - Advanced properties (`keepMounted`, `hiddenUntilFound`, `loopFocus`) are secondary stories, not the default (consumer-dx Rule 5)

Fix all blockers from both reviewers. Follow the patch loop rules in `workflow/refs/reviewer-dispatch.md`.

### Step 4 — Commit

```bash
git add stories/{name}.stories.ts
git commit -m "feat({name}): stories — all variants, play functions, autodoc annotations"
```

**Next step: `/validate-build`.**
