# Review Findings — checkbox-group

Date: 2026-04-06
Branch: main (checkbox-group implementation)
Rounds: 1 (all blockers resolved after round 1 fixes)

## Findings

### Finding 1
- **Reviewer:** accessibility-reviewer
- **Description:** Group-disabled state not reflected to assistive technology on inner button — when `grund-checkbox-group` is disabled but individual `grund-checkbox` has `disabled=false`, the inner `<button>` had no native `disabled` attribute and no `aria-disabled`. Screen readers announced the control as operable despite the JS click guard silently blocking interaction.
- **Resolution:** fixed — `grund-checkbox` now consumes `disabledContext` and computes `_effectiveDisabled = this.disabled || this._ancestorDisabled`. The button's native `?disabled` binding and `data-disabled` attribute both use `_effectiveDisabled`.
- **Round:** 1

### Finding 2
- **Reviewer:** accessibility-reviewer
- **Description:** `data-disabled` on the checkbox host element only reflected the checkbox's own `disabled` prop, not group-disabled state. Consumers styling via `[data-disabled]` would not see the disabled visual treatment when the group was disabled.
- **Resolution:** fixed — `data-disabled` now uses `_effectiveDisabled` (covered by Finding 1 fix).
- **Round:** 1

### Finding 3
- **Reviewer:** api-reviewer
- **Description:** Missing `"./checkbox-group"` entry in `package.json` exports map. The component was exported from `src/index.ts` but had no subpath export for consumers importing directly from the package.
- **Resolution:** fixed — added `"./checkbox-group": "./dist/components/checkbox-group/index.js"` to the exports map.
- **Round:** 1

### Finding 4
- **Reviewer:** api-reviewer
- **Description:** `CheckboxGroupValueChangeDetail.checked` JSDoc was misleading for parent toggle-all actions. The doc said "the new checked state of the triggering checkbox" but for parent toggles, `checked` reflects whether all `allValues` are now checked — not a single triggering checkbox's state.
- **Resolution:** fixed — JSDoc updated to document both child-toggle and parent-toggle-all semantics on `checked` and `itemValue`.
- **Round:** 1

### Finding 5
- **Reviewer:** api-reviewer
- **Description:** `grund-checkbox-group` class JSDoc and `value` property lacked documentation of the controlled vs. uncontrolled mode contract.
- **Resolution:** fixed — class JSDoc expanded with explicit controlled/uncontrolled documentation. JSDoc added to all four public properties (`value`, `defaultValue`, `allValues`, `disabled`).
- **Round:** 1

### Finding 6
- **Reviewer:** headless-reviewer
- **Description:** `:host { display: block }` in `checkbox-group.ts` was missing its required justification comment. The headless contract requires every `:host { display }` rule to include a `/* block: ... */` comment.
- **Resolution:** fixed — comment added, then aligned to codebase standard text (`/* block: this element is a block-level container */`).
- **Round:** 1

### Finding 7
- **Reviewer:** lit-reviewer
- **Description:** `groupCtx` field on `GrundCheckbox` was `protected` instead of `private`. Rule 16 explicitly requires `@consume()` context subscriptions to always be `private`.
- **Resolution:** fixed — changed to `private groupCtx`.
- **Round:** 1

### Finding 8
- **Reviewer:** lit-reviewer
- **Description:** No dev-mode warning when `parent=true` is set on a `grund-checkbox` without a `grund-checkbox-group` parent. Rule 20 requires compound elements that can be structurally misused to warn in dev mode.
- **Resolution:** fixed — dev-mode warning added in `willUpdate`, guarded by `this.hasUpdated` to avoid false positives during initial context propagation.
- **Round:** 1

### Finding 9
- **Reviewer:** lit-reviewer / code-quality-reviewer
- **Description:** `CheckboxGroupEngine.syncFromHost` used an anonymous inline type instead of the exported `CheckboxGroupHostSnapshot` type. Inconsistent with the HostSnapshot pattern (Rule 5) and the accordion engine reference.
- **Resolution:** fixed — `CheckboxGroupHostSnapshot` imported and used as the parameter type.
- **Round:** 1

### Finding 10
- **Reviewer:** code-quality-reviewer
- **Description:** `groupCtx_disabled` used inconsistent snake_case naming. Every other root element providing `disabledContext` uses `disabledCtx`. The raw `disabled: boolean` field on `CheckboxGroupContext` was also a Rule 38 anti-pattern (consumers reimplementing disabled composition instead of using `disabledContext`).
- **Resolution:** fixed — renamed to `disabledCtx`. Removed `disabled` from `CheckboxGroupContext` entirely; disabled propagation now flows exclusively through `disabledContext`.
- **Round:** 1

### Finding 11
- **Reviewer:** test-reviewer
- **Description:** No event ordering test verifying that `grund-checked-change` fires before `grund-value-change`. The spec explicitly documents this ordering contract.
- **Resolution:** fixed — test added: pushes event names into an array and asserts `['grund-checked-change', 'grund-value-change']`.
- **Round:** 1

### Finding 12
- **Reviewer:** test-reviewer
- **Description:** No test for parent checkbox form value exclusion. When `parent=true` inside a group, the checkbox should not submit a form value.
- **Resolution:** fixed — test added using `FormData` to verify parent checkbox value is absent while checked children are present.
- **Round:** 1

### Finding 13
- **Reviewer:** test-reviewer
- **Description:** No form submission test for regular checkboxes in a group. Each non-parent checkbox should submit its value independently via `ElementInternals`.
- **Resolution:** fixed — test added using `FormData.getAll()` to verify only the checked checkbox's value is submitted.
- **Round:** 1
