# JSDoc / CEM Contract

JSDoc serves IDE tooltips and the Custom Elements Manifest (CEM). Use JSDoc syntax, not TSDoc.

## Required on every custom element

```ts
/**
 * One-sentence description.
 *
 * @element grund-{name}
 * @slot - Default slot description
 * @fires {CustomEvent<DetailType>} grund-{action} - When and why
 * @csspart name - What this part wraps
 * @cssproperty --grund-{component}-{name} - What this property controls
 */
```

## Rules

- No `{Type}` in `@param`/`@returns` — TypeScript is canonical
- Document why and constraints, not what. Omit where self-evident.
- First sentence under ~80 chars
- Booleans: "Whether ..." — never "True if ..."
- `@internal` on non-public exports
- `@deprecated` always includes migration path
