# SSR Contract

Rules for server-side rendering safety, deterministic IDs, and hydration correctness.
Loaded by generation skills and the `lit-reviewer`.

---

## Rules

1. Never access `document`, `window`, `navigator`, `location`, or `screen` in constructors, class field initializers, or static fields. These globals only exist in browser context and throw during SSR. Move all DOM access to `connectedCallback` or later lifecycle methods.

2. **ID generation strategy** (replaces `crypto.randomUUID()` from previous guidelines):
   - Accept an optional `id` property from consumers: `@property() id?: string`.
   - If `id` is provided, use it as-is.
   - If not provided and a deterministic ID can be derived (e.g., from a `value` prop), derive it: `this._id = \`grund-\${this.tagName.toLowerCase()}-\${this.value}\``.
   - Fall back to `crypto.randomUUID().slice(0, 8)` **only** in client-only code paths (i.e., inside `connectedCallback` or `firstUpdated`, never in constructors or field initializers).
   - Rationale: `crypto.randomUUID()` generates a different value each render during SSR, causing hydration mismatches where the server-generated ID differs from the client-generated ID.

3. Never call `attachShadow()` directly. Use Lit's default shadow root creation (via `createRenderRoot()`). Manual `attachShadow()` calls prevent Declarative Shadow DOM (DSD) output during SSR.

4. The `render()` method MUST produce identical output on the server and on the client's first render. Never branch `render()` on `typeof window !== 'undefined'`, `this.isConnected`, or any client-only condition that would differ between SSR and hydration.

5. Computed properties used inside `render()` MUST be derivable without DOM access. If a property requires querying the DOM (e.g., element dimensions), do not use it in `render()` — update it in `updated()` and trigger a re-render.

6. For `@lit-labs/ssr` compatibility: test that the component's initial `render()` output is valid HTML that can be serialised to a string without errors. See the SSR smoke test pattern in `refs/test-patterns.md`.

---

## ID Strategy — Full Example

```ts
// ✅ SSR-safe ID strategy
class GrundAccordionItem extends LitElement {
  @property() value: string = '';

  // Derived deterministically from value — stable across SSR and hydration
  private get _panelId() {
    return `grund-accordion-panel-${this.value}`;
  }

  private get _triggerId() {
    return `grund-accordion-trigger-${this.value}`;
  }
}

// ❌ NOT SSR-safe — generates new ID each render, causes hydration mismatch
class GrundAccordionItem extends LitElement {
  // Runs during class instantiation — will differ between server and client
  private _id = crypto.randomUUID().slice(0, 8);
}
```

---

## Anti-Patterns

| Anti-pattern | Why wrong | Correct approach |
|---|---|---|
| `document.querySelector(...)` in constructor | Throws during SSR | Move to `connectedCallback` |
| `crypto.randomUUID()` as class field initializer | Differs between SSR and client | Use deterministic ID from `value` prop |
| `typeof window !== 'undefined'` in `render()` | Different output on server vs client | Keep render pure, move side effects to lifecycle |
| `attachShadow()` manual call | Prevents DSD generation | Use Lit default shadow root |
