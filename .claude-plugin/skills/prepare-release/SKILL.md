---
name: "prepare-release"
description: "Use to cut a release. Determines semver from CEM diff, generates changelog, validates all components, verifies migration guides for breaking changes, and outputs a publish command or release PR. Does not publish without explicit confirmation."
---

## Overview

End-to-end release preparation: semver determination → changelog → full validation → output. Does not publish — presents the command and awaits engineer approval.

## Usage

```
/prepare-release
/prepare-release --dry-run
```

## Implementation

### Step 1 — Determine semver

```bash
git diff origin/main...HEAD -- custom-elements.json
```

Read the CEM diff. Classify the highest-impact change:
- **Major** — any removed or renamed public property, event, element, `::part()` name, or slot
- **Minor** — new public property, event, element, part, or slot; no removals
- **Patch** — bug fixes, internal refactors, documentation; no API surface changes

**CEM snapshot diff (breaking change safety net):** If a previous release tag exists, diff the current CEM against the last release's CEM to catch accidental API removals:

```bash
# Get CEM from last release tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
if [ -n "$LAST_TAG" ]; then
  git show "$LAST_TAG:custom-elements.json" > /tmp/cem-previous.json 2>/dev/null
  # Compare public API surface: element names, property names, event names, part names
  node --input-type=module <<'DIFF'
  import { readFileSync } from 'fs';
  const prev = JSON.parse(readFileSync('/tmp/cem-previous.json', 'utf8'));
  const curr = JSON.parse(readFileSync('custom-elements.json', 'utf8'));
  const getNames = (cem) => (cem.modules || []).flatMap(m =>
    (m.declarations || []).filter(d => d.customElement).map(d => d.name)
  );
  const removed = getNames(prev).filter(n => !getNames(curr).includes(n));
  if (removed.length) {
    console.error('REMOVED elements:', removed.join(', '));
    process.exit(1);
  }
  console.log('CEM snapshot diff: no removals detected');
DIFF
fi
```

If removals are detected in a non-major release: **stop** and surface to the engineer.

If `@changesets/cli` is configured (`package.json` has `@changesets/cli`): run `npx changeset version` and follow its output instead of the above.

### Step 2 — Generate changelog

Read `git log --oneline origin/main...HEAD`. Group commits by type (`feat`, `fix`, `docs`, `chore`, `refactor`).

Write or prepend to `CHANGELOG.md`:
```markdown
## [v{N}] — {YYYY-MM-DD}

### Breaking Changes
- {entry for each major change — include migration path reference}

### New Features
- {entry for each minor addition}

### Bug Fixes
- {entry for each fix commit}
```

### Step 3 — Verify breaking changes have migration guides

For every breaking change in Step 1: confirm a migration guide entry exists in `docs/migration/v{N}.md`. If missing: write the stub using `/deprecate`'s migration guide format before proceeding.

### Step 3.5 — Smallest diff audit

Run `/smallest-diff --base origin/main` to verify the release branch is clean. Flag any dead code, speculative additions, or diff noise that slipped through per-component reviews.

### Step 4 — Full library validation

```bash
npm run test:run
```

Then run `/validate-build --cross-browser`. All 6 steps (lint, build, tests, CEM, bundle, cross-browser) must pass.

If any step fails: **stop**. Fix failures before proceeding — do not release with failing validation.

### Step 5 — Subpath exports check

Read `package.json` → `exports`. For each subpath entry: verify the referenced file exists in the build output. Run:

```bash
node --input-type=module <<'EOF'
import './dist/index.js';
console.log('exports OK');
EOF
```

Report any import errors.

### Step 6 — Dependency audit

```bash
npm audit --audit-level=high
```

No high-severity vulnerabilities allowed in a release. If found: stop and surface to the engineer.

### Step 7 — Output publish command or release PR

Present the following to the engineer and **await explicit approval before running**:

**Option A — Publish directly:**
```bash
npm version {patch|minor|major}
npm publish
```

**Option B — Release PR:**
```bash
git add package.json CHANGELOG.md docs/migration/
git commit -m "chore: release v{N}"
gh pr create --title "Release v{N}" --body "$(cat CHANGELOG.md | head -60)"
```

Do not run either option until the engineer explicitly confirms.

## Common Mistakes

- **Publishing without explicit confirmation.** Always await engineer approval. Present the command; do not execute it.
- **Missing migration guides.** Every breaking change must have a documented migration path before release.
- **Skipping cross-browser validation.** Releases must pass the full `--cross-browser` test suite.
- **Releasing with a dirty CEM.** Run `npm run analyze` and commit the result before running this skill if any API has changed.
