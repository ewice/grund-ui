---
name: "consistency-reviewer"
description: "Use when checking that a new component follows the same patterns
  as existing components. Triggered by the implement skill (Phase 5) after the
  quality review loop passes."
---

## Overview

Compares the new component's structural and naming patterns against all existing
components in src/components/. Flags deviations that would make the new component
feel inconsistent to a consumer or contributor.

## Output Format

```
PATTERN: <pattern name>
EXISTING: <how existing components do it>
NEW COMPONENT: <how the new component does it>
DEVIATION: <description>
CONFIDENCE: <0-100>
```

End with PASS or FAIL (any deviation with confidence ≥ 80 is a FAIL).

## What to Check

**File and directory naming**
- Same structure: root/, item/, controller/, context/, types.ts, index.ts
- Same file naming conventions as accordion

**Element naming**
- Prefix: `grund-`
- Sub-part names follow the same vocabulary (trigger, panel, header, item)
- No invented names for concepts that already have a name in other components

**Context symbol naming**
- `{component}RootContext`, `{component}ItemContext` — same pattern as accordion

**Event naming**
- `grund-{action}` — consistent with existing events
- Detail type named `{Component}{Action}Detail`

**Data attribute naming**
- Same attributes used for the same meanings (data-state, data-open, data-disabled, etc.)
- No new data attributes that duplicate existing ones with different names

**Controller naming**
- `{Component}Controller` — same pattern
- Snapshot interface: `{Component}HostSnapshot`

**Export structure**
- index.ts barrel exports all public elements, types, context symbols
- No internal implementation details exported from index.ts
