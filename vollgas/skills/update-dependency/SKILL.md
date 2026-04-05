---
name: "update-dependency"
description: "Use to update a dependency version. Reads changelog for breaking changes, creates a migration checklist, applies the update, validates the full library, and audits for cross-component side effects."
---

## Overview

Safe dependency update: read before touching, verify after changing, validate the library end-to-end. Never bump a version without reading the changelog first.

## Usage

```
/update-dependency lit@4.0.0
/update-dependency @lit/context@2.0.0
```

## Implementation

### Step 1 — Read the changelog

Search for `{dependency} {version} changelog release notes` or read the CHANGELOG.md at the package's repository. Identify:
- Breaking changes (API removals, renames, behavior changes)
- Deprecations introduced
- Migration guides (official or community)

If no changelog is found: proceed cautiously and test thoroughly.

### Step 2 — Evaluate impact

```bash
grep -r "from '{dependency}" src/ --include="*.ts" -l
grep -r "from \"{dependency}" src/ --include="*.ts" -l
```

For each file that imports from the dependency: read the imports and note which APIs are used. Check each against the breaking change list from Step 1.

### Step 3 — Create migration checklist

Write a checklist of every file + change needed:
```
- src/controllers/aria-link.controller.ts: rename ariaControlsEl → ariaControlsElements
- src/components/accordion/root/accordion.ts: update context import path
```

If no breaking changes: proceed directly to Step 4 with no checklist.

### Step 4 — Apply version bump

```bash
npm install {dependency}@{version}
```

### Step 5 — Apply migrations

Work through the checklist file by file. For each file changed:
- Make the edit
- Run `npm run test:run -- {affected component path}` to confirm no regression

### Step 6 — Security audit

```bash
npm audit
```

Report any new vulnerabilities. If high-severity vulnerabilities are introduced: stop and surface to the engineer before proceeding.

### Step 7 — Full validation

```bash
npm run test:run
```

Distinguish migration bugs (introduced by this update — fix them) from pre-existing failures (document but do not fix here).

Run `/validate-build --cross-browser`.

### Step 8 — Cross-component check

Run `/audit-cross-component -- {description of any subtle behavioral change introduced by this version}` to verify no unexpected side effects across the library.

### Step 9 — Commit

```bash
git add package.json package-lock.json <migrated files>
git commit -m "chore: update {dependency} to {version}"
```

## Common Mistakes

- **Skipping the changelog read.** Breaking changes exist in minor versions of pre-1.0 packages and some post-1.0 packages.
- **Not grepping all import sites.** A single missed import will surface as a cryptic runtime error.
- **Fixing pre-existing test failures.** Only fix regressions introduced by this update — pre-existing failures are a separate concern.
- **Ignoring npm audit results.** A dependency update that introduces a high-severity vulnerability must not be merged.
