# ARIA Linking — Element Reference API

Cross-shadow ARIA relationships in Grund UI.

---

## The Problem

IDREF attributes (`aria-controls="panel-1"`, `aria-labelledby="trigger-1"`) resolve IDs
within the same root (document or shadow root). A `<button aria-controls="panel-1">` inside
one shadow root cannot reference an element with `id="panel-1"` in a different shadow root or
in the light DOM. The string lookup is scoped — the browser finds nothing.

Compound web components hit this by design: the trigger button lives inside
`<grund-tab>`'s shadow root, the panel div lives inside `<grund-tabs-panel>`'s shadow root,
and the host elements live in the consumer's light DOM.

## The Solution

The **Element Reference API** (`ariaControlsElements`, `ariaLabelledByElements`, etc.)
replaces string ID references with direct DOM object references. No ID lookup, no scoping
constraint. Setting `button.ariaControlsElements = [panelHostElement]` works regardless of
which shadow root the button or panel element belongs to.

**Browser support:** Chrome 135+, Edge 135+, Safari 16.4+, Firefox 136+, all major mobile.

## Pattern

### Where to set element references

Set in `updated()` — after Lit has rendered the shadow DOM and the target element is
available in the registry. Do NOT set in `render()` (the element doesn't exist yet) or
`willUpdate()` (shadow DOM not yet updated).

```ts
override updated(): void {
  const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('[part="tab"]');
  if (!btn || !this.ctx) return;

  const record = this.ctx.getRegistry().getByValue(this.value);
  if (record?.panel) {
    btn.ariaControlsElements = [record.panel];
  }
}
```

### Where to get the target element

From the registry via context. The registry holds direct element references for all
registered tabs and panels. No `document.getElementById()`, no `querySelectorAll`.

### Timing: what if the target isn't registered yet?

Tabs connect before panels in document order, so `ariaLabelledByElements` on the panel
(pointing to the tab host) is always resolvable on first render.

`ariaControlsElements` on the tab (pointing to the panel host) may not be resolvable on
first render if the panel hasn't registered yet. Solution: the root element recreates
context after `registerPanel`, which triggers a reactive update on all tab consumers.
Their `updated()` re-runs and sets the now-available panel reference.

### TypeScript types

As of TypeScript 5.9, `ariaControlsElements` and `ariaLabelledByElements` may not be in
the DOM lib types. Use a type assertion until they are:

```ts
(btn as any).ariaControlsElements = [panelElement];
```

Remove the assertion once TypeScript ships the types.

## Available Element Reference Properties

| Property | Replaces | Direction |
|---|---|---|
| `ariaControlsElements` | `aria-controls` | Widget → controlled region |
| `ariaLabelledByElements` | `aria-labelledby` | Region → labelling element |
| `ariaDescribedByElements` | `aria-describedby` | Element → description |
| `ariaActiveDescendantElement` | `aria-activedescendant` | Composite → focused child |
| `ariaOwnsElements` | `aria-owns` | Parent → owned children |

Use only the properties needed. Each takes an array of elements (or a single element for
non-list properties like `ariaActiveDescendantElement`).

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| `aria-controls="panel-1"` across shadow roots | IDREF doesn't resolve cross-shadow | `ariaControlsElements = [panelEl]` |
| Setting element refs in `render()` | Target may not exist in DOM yet | Set in `updated()` |
| `document.getElementById()` to find target | Breaks encapsulation, can't cross shadow | Registry lookup via context |
| Setting `id` solely for ARIA linking | Unnecessary with element references | Remove if no other consumer needs the ID |

## Migration Note

The accordion currently uses IDREF linking (trigger ↔ panel within the item context).
Both elements share the same parent shadow root via the item element, so the IDREFs happen
to resolve. However, the pattern should be migrated to element references for consistency
and to be safe against future structural refactors. Flag this as a follow-up task.
