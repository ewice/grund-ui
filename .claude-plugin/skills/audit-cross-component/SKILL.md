---
name: "audit-cross-component"
description: "Use when a bug or pattern issue may affect multiple components. Dispatches one subagent per component to check for the same issue. Returns consolidated findings. Called by /fix-bug (Step 5) and /update-dependency (Step 8), or invoked directly."
---

## Overview

Single-issue audit across the entire component library. Each component gets a focused subagent. Prevents a fix from landing in only one place when the same bug or anti-pattern exists elsewhere.

## Usage

```
/audit-cross-component -- aria-controls links missing when AriaLinkController is not attached
/audit-cross-component -- crypto.randomUUID() called in class field initializers (SSR unsafe)
/audit-cross-component -- event listeners not cleaned up in hostDisconnected
```

## Implementation

### Step 1 — Define the issue

Write a one-sentence description of the pattern to find:
- What file, code structure, or idiom to look for
- What a correct implementation looks like
- Whether the issue is in elements, controllers, utilities, or all

### Step 2 — List all components

List all directories under `src/components/`. Also check `src/controllers/` and `src/utils/` if the issue is in shared code.

### Step 3 — Dispatch subagents (parallel)

For each component directory, dispatch one Agent subagent with this prompt:

> "Read all TypeScript files in `src/components/{name}/`. Check for: {issue description}. Report AFFECTED (with file path and line number) or CLEAN. Do not fix — report only."

Dispatch all subagents simultaneously.

### Step 4 — Collect findings

Aggregate results:

```
## Cross-Component Audit: {issue description}

### Affected
- `accordion`: src/components/accordion/root/index.ts:42 — {description}
- `tabs`: src/components/tabs/trigger/index.ts:17 — {description}

### Clean
- `dialog`, `switch`, `separator`

### Summary
2/5 components affected.
```

### Step 5 — Handoff

If invoked by `/fix-bug` or `/update-dependency`: return findings to the caller for fixing.

If invoked directly: present findings to the engineer and await decision on next steps.
