---
name: "accessibility-reviewer"
description: "Use when reviewing a component's accessibility implementation against
  the WAI-ARIA APG pattern. Triggered by the implement skill (Phase 3) or manually
  on any component before release."
---

## Overview

Verifies ARIA roles, attributes, and keyboard contract against the relevant
WAI-ARIA APG pattern. Does not check visual styles — only semantics and keyboard.

## Output Format

Same structure as guidelines-reviewer findings. End with PASS or FAIL.

## Checklist

**Identify the APG pattern first.** Check the component spec or infer from the
compound structure. Common patterns: accordion, tabs, dialog, disclosure, listbox,
combobox, tree.

**Roles**
- [ ] Every element has the correct role per the APG pattern
- [ ] No ARIA roles applied to elements that already carry the correct implicit role

**Required ARIA attributes**
- [ ] aria-expanded present and correct on triggers (accordion, disclosure, tree)
- [ ] aria-controls wired via AriaLinkController (not manual id strings)
- [ ] aria-labelledby wired via AriaLinkController where the APG requires it
- [ ] aria-selected / aria-checked correct for selection patterns (tabs, listbox)
- [ ] aria-disabled reflects disabled state (not just HTML disabled attribute)
- [ ] aria-orientation present on containers that support both axes

**Keyboard contract** — verify against the specific APG pattern:
- [ ] Enter/Space: activate trigger
- [ ] Arrow keys: move focus within composite widget (RovingFocusController)
- [ ] Home/End: jump to first/last item
- [ ] Tab: exits the widget to next page-level focusable element
- [ ] Escape: closes panel / dismisses (where APG requires it)

**Focus management**
- [ ] RovingFocusController used on container (not manual tabindex manipulation)
- [ ] tabindex="0" on exactly one item at a time within a composite widget
- [ ] tabindex="-1" on all other items within the composite widget
- [ ] Focus moves to opened panel content where APG requires it (e.g. dialog)

**Shadow DOM boundaries**
- [ ] Keyboard events dispatched with `{ bubbles: true, composed: true }`
- [ ] AriaLinkController used (handles cross-shadow ARIA id linking)

**@csspart**
- [ ] Every interactive and structural shadow element has @csspart documented
- [ ] Part names are semantic (e.g. `trigger`, `panel`, `header`) not structural (e.g. `div`)
