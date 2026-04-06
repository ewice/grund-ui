# Accessibility Contract

Concrete accessibility rules for Grund UI reviewers and generation skills.
This contract focuses on what the library itself can and must guarantee in a headless component system.

---

## Rules

### Roles and Semantics

1. Match the APG pattern role contract when an APG pattern applies. If no APG pattern applies, prefer native semantics over custom ARIA roles.
2. Do not add redundant `role` attributes to elements that already have the correct implicit semantics.
3. Structural roles (`tablist`, `tab`, `tabpanel`, `listbox`, `option`, `toolbar`, `radiogroup`, `menu`, `menuitem`, etc.) must persist regardless of visibility state. The `hidden` attribute already removes elements from the accessibility tree; removing the role as well is redundant and brittle.
4. Containers that require an accessible name by pattern or semantics must expose one. Examples include `group`, `toolbar`, `radiogroup`, and `listbox` when the pattern requires a label.

### Accessible Names, States, and Relationships

5. Every interactive element must have a descriptive accessible name.
6. Required ARIA state attributes must reflect the real component state. Common examples: `aria-expanded`, `aria-selected`, `aria-pressed`, `aria-checked`, `aria-disabled`, `aria-busy`, and `aria-orientation`.
7. Cross-shadow ARIA relationships must use the Element Reference API (`ariaControlsElements`, `ariaLabelledByElements`, `ariaDescribedByElements`, `ariaActiveDescendantElement`) when available. IDREF attributes are only valid when both elements live in the same root.
8. Relationship targets must exist and remain synchronized after dynamic updates. A stale or missing target is an accessibility bug even if the initial render looked correct.
9. Prefer state attribute updates over `aria-live` for ordinary state changes. Screen readers already announce changes to attributes like `aria-expanded` and `aria-selected`.

### Keyboard Access

10. All interactive functionality must be operable with keyboard only.
11. Implement the APG-required key contract for the pattern: Enter and Space for activation, Arrow keys for composite navigation, Home and End where required, Escape where dismissal is required.
12. `Tab` must exit non-modal widgets. Never trap focus in a non-modal component.
13. Modal overlays must trap focus while open and restore focus when closed.
14. Container-level `keydown` handlers that call `preventDefault()` or trigger activation must verify that the event originated from the intended interactive target. Never hijack keyboard input from arbitrary descendants.

### Focus Management

15. Use one explicit focus strategy per pattern: roving tabindex, `aria-activedescendant`, native focus, or a focus trap for modal overlays.
16. In roving tabindex widgets, exactly one item is tabbable (`tabIndex=0`) at a time. All other managed items must be `tabIndex=-1`.
17. Focus must never land on disabled or hidden items. Focus recovery after removal, close, or state change must follow the APG pattern.
18. Horizontal composite widgets must reverse `ArrowLeft` and `ArrowRight` behavior in RTL contexts.

### Screen Reader and Live Region Behavior

19. Error announcements use `role="alert"` or an assertive live region only when immediate interruption is appropriate. Informational updates use `role="status"` or a polite live region.
20. Do not create multiple competing live regions inside one component family unless the pattern explicitly requires them.
21. Do not announce duplicate information. If a state change is already conveyed through role/name/state updates, do not also announce the same change through `aria-live` unless the APG pattern requires it.

### Headless Library Boundary

22. Block on accessibility issues the library itself owns: semantics, focus behavior, keyboard behavior, relationships, naming, and screen-reader behavior.
23. For visual accessibility criteria that the consumer styling layer may own, block only when the library itself makes compliance impossible. Otherwise warn and point to the missing contract or styling obligation.
24. Touch target sizing follows WCAG 2.2 `2.5.8 Target Size (Minimum)` at AA: 24×24 CSS pixels minimum when the library itself renders or constrains the interactive hit target. Use 44×44 as stronger guidance, not as the AA minimum.
25. If the library renders its own visual states, it must not rely on color alone and must remain distinguishable in forced-colors mode. If consumers own styles, the library must still expose the state hooks and DOM structure needed for compliant styling.
26. If the library owns animation or timed interaction behavior, it must not make reduced-motion or pause/stop expectations impossible to satisfy.

---

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| `aria-controls="panel-1"` across shadow roots | IDREF does not resolve across roots | Use `ariaControlsElements = [panelEl]` (Rule 7) |
| Removing `role="tabpanel"` when hidden | Breaks semantics when consumers override visibility | Keep the role stable; `hidden` already removes it from the tree (Rule 3) |
| Container `keydown` handler activates on any descendant | Hijacks keyboard input from nested controls | Filter by intended interactive target before acting (Rule 14) |
| Two items in a roving widget have `tabIndex=0` | Focus order becomes ambiguous | Keep exactly one managed tabbable item (Rule 16) |
| Non-modal dropdown traps focus | Prevents normal page navigation | Let `Tab` exit the widget (Rule 12) |
| Live region announces "expanded" while `aria-expanded` also changes | Duplicate announcement noise | Rely on role/state updates unless pattern requires live region output (Rule 21) |
| Reviewer blocks 44×44 touch target on a headless primitive with consumer-owned sizing | Conflates library responsibility with app styling | Treat 24×24 AA as the library-owned minimum when size is internal; otherwise warn about the consumer contract (Rules 23–24) |
