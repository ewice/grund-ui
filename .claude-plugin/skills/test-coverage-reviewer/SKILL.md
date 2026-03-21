---
name: "test-coverage-reviewer"
description: "DEPRECATED — replaced by .claude-plugin/reviewers/test-reviewer/. Do not use."
---

## Overview

Maps spec requirements to test cases. Does not run tests — test execution is
handled by the `validate-build` skill.

## Output Format

Return findings as JSON lines:

```json
{"requirement": "ArrowDown moves focus to next trigger", "test": "moves focus to next trigger on ArrowDown", "file": "src/components/tabs/root/tabs.test.ts:145", "status": "COVERED"}
```

```json
{"requirement": "Controlled mode: internal state does not change on interaction", "test": null, "file": null, "status": "MISSING"}
```

Status values: `COVERED`, `MISSING`.

End with `PASS` or `FAIL(missing=N)`.

## Checklist

### Every public property must have tests for:
- Initial default value
- Setting the property dynamically at runtime
- Reflecting as an HTML attribute (if reflect: true)

### Keyboard navigation — every key in the APG pattern:
- Each key dispatched with `{ bubbles: true, composed: true }`
- Assertion made after `await flush(el)`, not before

### Events:
- At least one test asserts the detail shape (not just that the event fired)
- Controlled mode: event fires but internal state does not change
- Uncontrolled mode: internal state changes and event fires

### Controlled / uncontrolled modes tested separately

### Dynamic registration:
- Add a child element after initial render and assert it registers correctly
- Remove a child element and assert it unregisters correctly

### ARIA correctness:
- At least one test per ARIA attribute that changes with state

### Test mechanics (verify these are followed):
- Uses `@open-wc/testing-helpers/pure` (not `@open-wc/testing`)
- `flush(el)` called after every state-triggering action before asserting
- Context consumer tests use a minimal LitElement wrapper (see
  `TestAccordionRootState` in the accordion tests as the pattern)
- Test descriptions read as plain English specifications
