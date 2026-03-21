---
name: "consistency-reviewer"
description: "DEPRECATED — scope merged into api-reviewer. Do not use."
---

## Overview

Compares the component's structural and naming patterns against all existing
components in `src/components/`. Flags deviations that would make the component
feel inconsistent to a consumer or contributor.

## Output Format

Return findings as JSON lines:

```json
{"pattern": "Event naming", "existing": "grund-change, grund-value-change", "new_component": "grund-tab-select", "deviation": "Verb differs from established pattern (change vs select)", "confidence": 85, "severity": "warning"}
```

End with `PASS` or `FAIL(blockers=N, warnings=M)`.

## What to Check

### File and directory naming
- Same structure: root/, item/, controller/, context/, types.ts, index.ts
- Same file naming conventions as accordion

### Element naming
- Prefix: `grund-`
- Sub-part names follow the same vocabulary (trigger, panel, header, item)
- No invented names for concepts that already have a name in other components

### Context symbol naming
- `{component}RootContext`, `{component}ItemContext` — same pattern as accordion

### Event naming
- `grund-{action}` — consistent with existing events
- Detail type named `Grund{Component}{Action}Detail`

### Data attribute naming
- Same attributes for the same meanings (data-state, data-open, data-disabled)
- No new data attributes that duplicate existing ones with different names

### Controller naming
- `{Component}Controller` — same pattern
- Snapshot interface: `{Component}HostSnapshot`

### Export structure
- index.ts barrel exports all public elements, types, context symbols
- No internal implementation details exported from index.ts
