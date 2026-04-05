# Headless Contract

Rules for zero-style enforcement, `::part()` API, slot design, and `data-*` attributes.
Loaded by generation skills and the `headless-reviewer`.

---

## Rules

### Zero Styles

1. The Shadow DOM stylesheet for every element MUST be either: (a) completely empty, OR (b) contain only a `:host { display: ... }` rule with a comment justifying the choice.
2. Never add `color`, `font`, `background`, `border`, `padding`, `margin`, `width`, `height`, `opacity`, `transform`, or any visual property to any Shadow DOM stylesheet.
3. Never add `transition` or `animation` CSS to Shadow DOM stylesheets. Transitions belong to consumers, not components.

### `:host` Display Strategy

4. Use `:host { display: block }` for elements that wrap block-level content (panels, containers, root elements).
5. Use `:host { display: inline }` for elements that wrap inline content.
6. NEVER use `display: contents` on an element that has or provides a semantic ARIA role. `display: contents` removes the element's layout box and can cause browsers to strip it from the accessibility tree.
7. Every `:host { display: ... }` rule MUST include a brief comment: `/* block: this element is a block-level container */`.

### `::part()` API

8. Every interactive element and every structural container in the Shadow DOM MUST have a `part` attribute.
9. Part names: lowercase, hyphenated nouns only. Examples: `trigger`, `panel-content`, `close-button`. No verbs (`activate`), no state adjectives (`open-panel`).
10. Part granularity targets: (a) the outermost shadow element, (b) any element that receives interactive states (`:hover`, `:focus`, `[disabled]`), (c) any element that carries decorative or slottable content. Not every internal `<div>` needs a part.
11. Every part name MUST be registered in `docs/vocabulary.md` before use.
12. Part names MUST be documented with `@csspart` JSDoc tag on the element class.

### `exportparts` Contract

13. `exportparts` is only required when a custom element renders another custom element with `part` attributes **inside its own shadow DOM** (i.e., as a shadow tree child, not slotted). In slot-based compound components — where consumers provide child elements in their own markup — each element is in the consumer's light DOM and its parts are already directly accessible. `exportparts` has no effect on slotted content.
14. Verify applicability before declaring `exportparts`: ask "is the element with `part` attributes created by this element's shadow template, or provided by the consumer?" If provided by the consumer (slotted), no `exportparts` is needed.
15. `exportparts` value format: comma-separated list of part names. If renaming, use `inner-name: outer-name` syntax. Prefer no renaming — use the same part name throughout the tree.

### Slot Design

16. The primary content slot is always unnamed (default slot): `<slot></slot>`.
17. Named slots (`<slot name="icon">`) are for distinct, optional content regions only. Use sparingly.
18. Provide meaningful fallback content inside named slots where a sensible default exists.
19. Every slot MUST be documented with `@slot` JSDoc tag. Include expected content type even though it is not enforced at runtime.
20. Never use slots to pass structured data. Slots are for rendered content only. Use properties for data.

### `data-*` Attribute API

21. All state-based styling hooks use `data-*` attributes. Never use bare unprefixed attributes (e.g., `expanded`, `selected`, `active`) as CSS hooks.
22. `data-*` attributes are set in `willUpdate`, not in response to DOM events or method calls directly.
23. Every `data-*` attribute exposed as public API MUST be registered in `docs/vocabulary.md`.
24. Standard attributes used across all components (set by their respective controllers/elements):

| Attribute | Values | Set by |
|---|---|---|
| `data-open` | boolean presence | Host in `willUpdate` |
| `data-disabled` | boolean presence | Host in `willUpdate` |
| `data-orientation` | `"vertical"` / `"horizontal"` | Root and sub-parts in `willUpdate` |
| `data-index` | string number | Item element in `willUpdate` |

### CSS Custom Properties

25. CSS custom properties exposed by components are limited to structural and timing concerns (z-index, transition duration, gap). Never expose color, typography, or visual properties — consumers own those.
26. Every CSS custom property MUST be documented with `@cssproperty` JSDoc tag and included in the Custom Elements Manifest via `custom-elements-manifest.config.mjs`.
27. CSS custom property naming: `--grund-{component}-{property}`. Example: `--grund-accordion-panel-transition-duration`.

### Accessible Names on Container Roles

28. Shadow elements with `role="group"`, `role="toolbar"`, `role="radiogroup"`, or `role="listbox"` MUST have an accessible name. Expose a `label` property on the host element and bind it as `aria-label` on the container:

    ```ts
    @property() public label = '';
    // in render():
    html`<div role="group" aria-label=${this.label || nothing}>`
    ```

    Document in JSDoc that consumers should supply a label, e.g. via the `label` property or a visible heading referenced with `aria-labelledby` on the host element.

### Forced Colors Mode

29. Every interactive state (focused, hovered, selected, expanded, disabled, checked) MUST be communicated through something other than color alone: border, outline, text decoration, or an icon/symbol.
30. Parts MUST be stylable under `@media (forced-colors: active)`. Test: apply forced colors simulation in browser devtools and verify all interactive states remain visually distinguishable.

---

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| CSS in Shadow DOM stylesheet beyond `:host { display }` | Couples visual concerns to component | Move all styles to consumer |
| `display: contents` on semantic element | Strips accessibility tree | Use `display: block` |
| Part name as verb or state adjective | Unstable, semantically wrong | Noun-only part names |
| `exportparts` on slotted compound layer | Has no effect on slotted children; consumer styles their own elements directly | Only use `exportparts` when the element renders sub-elements in its own shadow template |
| Bare `expanded` attribute as CSS hook | Inconsistent, not part of public API | Use `data-open` |
| CSS custom property for color | Headless contract violation | Consumers provide all colors |
| `role="group"` / `role="toolbar"` with no accessible name | Screen readers announce "group" with no context | Expose `label` property, bind to `aria-label` on the container (Rule 28) |
