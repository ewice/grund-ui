---
name: "deprecate"
description: "Use to mark a public API element as deprecated. Adds @deprecated JSDoc with migration path, dev-mode console.warn, updates CEM, and generates a migration guide stub. Never removes — deprecation is a warning phase."
---

## Overview

Marks an API as deprecated without breaking existing consumers. Deprecation and removal are always separate commits — this skill handles only the deprecation phase.

## Usage

```
/deprecate accordion -- value property renamed to selectedValue in next major
/deprecate grund-accordion-indicator -- replaced by CSS ::part(indicator) styling
```

## Implementation

### Step 1 — Identify the API

Confirm:
1. What is being deprecated (property, event, element, slot, CSS custom property)?
2. What replaces it? (If nothing replaces it, document that it will be removed.)
3. Which version targets removal? (Check current semver in `package.json`.)

### Step 2 — Add `@deprecated` JSDoc

In the relevant element class, update the JSDoc:

For a deprecated property:
```ts
/**
 * @deprecated Use `selectedValue` instead. Will be removed in v2.0.
 */
@property() value?: string;
```

For a deprecated element class:
```ts
/**
 * @deprecated Replaced by CSS `::part(indicator)` styling. Will be removed in v2.0.
 * @element grund-accordion-indicator
 */
export class GrundAccordionIndicatorElement extends LitElement {
```

### Step 3 — Add dev-mode warning

For a deprecated property — warn when set (in `willUpdate`):
```ts
override willUpdate(changed: PropertyValues) {
  if (import.meta.env.DEV && changed.has('value')) {
    console.warn('[grund-accordion] `value` is deprecated. Use `selectedValue` instead. Will be removed in v2.0.');
  }
  super.willUpdate(changed);
}
```

For a deprecated element — warn in `connectedCallback`:
```ts
override connectedCallback() {
  super.connectedCallback();
  if (import.meta.env.DEV) {
    console.warn('[grund-accordion-indicator] This element is deprecated. Use CSS ::part(indicator) instead. Will be removed in v2.0.');
  }
}
```

### Step 4 — Update CEM

```bash
npm run analyze
git add custom-elements.json
```

Verify the `@deprecated` tag appears in the CEM output for the affected element or member.

### Step 5 — Write migration guide stub

If `docs/migration/` does not exist: create the directory.

Create or append to `docs/migration/v{N}.md`:
```markdown
## Deprecated: `value` on `<grund-accordion>`

**Migration:** Replace `value` with `selectedValue`. The API is identical.

**Removal target:** v2.0
```

### Step 6 — Commit

```bash
git add <affected element files> custom-elements.json docs/migration/
git commit -m "deprecate(<component>): <what> — use <replacement> instead"
```

## Common Mistakes

- **Removing the deprecated API in the same commit.** Deprecation and removal are separate commits (often separate releases).
- **Forgetting the CEM update.** The `@deprecated` tag must appear in `custom-elements.json` for tooling to surface it to consumers.
- **No migration path.** Every deprecation must say what to use instead or when it will be removed.
