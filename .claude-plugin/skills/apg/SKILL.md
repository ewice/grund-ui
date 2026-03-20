---
name: "apg"
description: "Use when you need the WAI-ARIA Authoring Practices Guide contract
  for a specific pattern — keyboard interactions, required roles, states, and
  properties. Invoke before writing a component spec."
---

## Overview

Fetches the WAI-ARIA APG pattern page and extracts the accessibility contract
as a structured block. Output is used directly by `new-component` when
constructing the spec.

## Usage

Invoke with the pattern name:

```
/apg accordion
/apg tabs
/apg dialog
/apg disclosure
/apg combobox
/apg listbox
/apg tree
/apg menu
```

## Implementation

### Step 1 — Resolve the APG URL

Map the pattern name to its canonical APG URL:

| Pattern | URL path |
|---|---|
| accordion | `/patterns/accordion/` |
| tabs | `/patterns/tabs/` |
| dialog | `/patterns/dialog-modal/` |
| disclosure | `/patterns/disclosure/` |
| combobox | `/patterns/combobox/` |
| listbox | `/patterns/listbox/` |
| tree | `/patterns/treeview/` |
| menu | `/patterns/menu-button/` |
| radio | `/patterns/radio/` |
| checkbox | `/patterns/checkbox/` |
| switch | `/patterns/switch/` |
| slider | `/patterns/slider/` |
| spinbutton | `/patterns/spinbutton/` |
| breadcrumb | `/patterns/breadcrumb/` |
| carousel | `/patterns/carousel/` |
| feed | `/patterns/feed/` |
| grid | `/patterns/grid/` |
| link | `/patterns/link/` |
| toolbar | `/patterns/toolbar/` |
| tooltip | `/patterns/tooltip/` |

Full base: `https://www.w3.org/WAI/ARIA/apg`

If the pattern is not listed, attempt
`https://www.w3.org/WAI/ARIA/apg/patterns/{pattern-name}/` and note that it
may not exist.

### Step 2 — Fetch and extract

Use the WebFetch tool on the resolved URL. From the response extract:

1. **Keyboard interactions table** — every key, its effect, and any conditions
2. **ARIA roles** — the role of each element in the pattern
3. **Required states and properties** — `aria-*` attributes that must be present
4. **Optional states and properties** — `aria-*` attributes that may be present
5. **Notes** — any pattern-specific constraints called out in the APG text

### Step 3 — Output as structured block

Format the result as a fenced block that can be pasted into a spec:

```
## APG Contract: {Pattern Name}
Source: {URL}

### Elements and Roles
- {element description}: role="{role}"

### Required ARIA Attributes
- {element}: {attribute} — {what it must express}

### Keyboard Interactions
| Key | Effect | Condition |
|-----|--------|-----------|
| {key} | {effect} | {condition or "always"} |

### Compound Structure
{Description of how elements relate — which contains which, which links to which}

### Notes
- {any constraints, warnings, or implementation notes from the APG}
```

### Step 4 — Flag gaps

After outputting the contract, flag anything the APG leaves ambiguous or
underspecified that the engineer will need to decide:

- Focus placement after open/close (if not stated)
- Whether items can be navigated while one is open
- Controlled vs. uncontrolled behaviour (APG does not specify this — always flag)
- Any pattern notes marked "optional" that this library should decide on

## Example output (accordion)

```
## APG Contract: Accordion
Source: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/

### Elements and Roles
- Accordion container: no required role (landmark optional)
- Header: role="heading" (via <h2>–<h6> or role="heading" + aria-level)
- Trigger button: role="button" (implicit via <button>)
- Panel: role="region" (when panel is expanded, labelled by trigger)

### Required ARIA Attributes
- Trigger: aria-expanded="true|false"
- Trigger: aria-controls="{panel-id}" (when panel is mounted)
- Panel: aria-labelledby="{trigger-id}" (when role="region")

### Keyboard Interactions
| Key | Effect | Condition |
|-----|--------|-----------|
| Enter / Space | Toggle expand/collapse | Focus on trigger |
| Tab | Move focus to next focusable element | - |
| Shift+Tab | Move focus to previous focusable element | - |
| ArrowDown | Move focus to next trigger | Optional; vertical orientation |
| ArrowUp | Move focus to previous trigger | Optional; vertical orientation |
| Home | Move focus to first trigger | Optional |
| End | Move focus to last trigger | Optional |

### Compound Structure
Accordion > [Header > Trigger] + Panel (one pair per item)
Trigger and Panel are siblings under a shared item container.
Trigger links to panel via aria-controls/aria-labelledby.

### Notes
- role="region" on the panel is recommended only when the accordion has 6 or
  fewer items; for longer accordions it adds excessive landmark noise.
- The APG marks Arrow key navigation as "optional" — this library implements
  it via RovingFocusController to align with established usage patterns.

### Gaps to decide
- Controlled vs. uncontrolled: APG does not specify. Decide defaultValue/value
  API in the spec.
- Multiple: APG allows but does not require. Decide whether multiple=true is
  supported.
- keepMounted / hiddenUntilFound: library-specific. Not in APG.
```
