# Avatar — Design Spec

**Date:** 2026-04-19
**Status:** Approved (brainstorm), pending implementation plan
**References:** [Base UI Avatar](https://base-ui.com/react/components/avatar.md), [Polaris `s-avatar`](https://shopify.dev/docs/api/app-home/web-components/media-and-visuals/avatar)

---

## 1. Goal

Add a headless, accessible Avatar primitive to Grund UI, matching Base UI's compound API
(`Root` / `Image` / `Fallback`) with web-component-native idioms. v1 ships only the primitive
— no avatar group, no color hashing.

## 2. Category

Avatar does not fit any existing entry in `vollgas/refs/component-shapes.md`:

- Not composite (no items, no keyboard nav)
- Not form/overlay/collection/feedback
- Not strictly Simple — it has internal state (image loading status) shared across compound parts

Treat as a new shape: **Stateful Simple Compound**. As part of this work, add a corresponding
section to `component-shapes.md` describing the pattern: compound parts sharing context-driven
state, no roving focus, no engine-as-state-machine, optional registry omitted when only one
of each sub-part is expected.

## 3. Public API

### `<grund-avatar>` (root)

| Surface | Value |
|---|---|
| Properties | none |
| Reflected attributes | `data-status="idle \| loading \| loaded \| error"` |
| Events | `grund-status-change` → `{ status: AvatarStatus }`, `bubbles: true, composed: false` |
| Parts | `root` |
| Slots | default (intended for `<grund-avatar-image>` and `<grund-avatar-fallback>`) |
| ARIA | none added by the component |

### `<grund-avatar-image>`

Renders an internal `<img>` inside its shadow DOM. The following attributes are reflected
1:1 onto the internal `<img>`:

`src`, `alt`, `srcset`, `sizes`, `crossorigin`, `referrerpolicy`, `decoding`, `loading`, `fetchpriority`

| Surface | Value |
|---|---|
| Visibility | The internal `<img>` is always mounted in shadow DOM whenever `src` is set, so the browser can fetch and resolve it. The host element is visually hidden (`:host { display: none }`) unless `data-status="loaded"` is set on it. The element reflects its own `data-status` from the consumed context in `willUpdate`. |
| Parts | `image` |
| Dev warnings | (a) missing `alt` attribute; (b) more than one `<grund-avatar-image>` inside a `<grund-avatar>`. |

**Why the internal `<img>` stays mounted while loading:** unmounting it would cancel
in-flight fetches and re-trigger them on remount. The visibility toggle is purely visual,
gated by the host's own `data-status`.

### `<grund-avatar-fallback>`

| Surface | Value |
|---|---|
| Properties | `delay` (number, ms; default `0`) — milliseconds to wait before showing fallback content. Prevents flash when image loads quickly from cache. |
| Visibility | rendered when `status !== 'loaded'` AND `delay` has elapsed since the element connected (or since `delay` last changed). |
| Parts | `fallback` |
| Slots | default (initials, icon, anything) |
| Dev warnings | more than one `<grund-avatar-fallback>` inside a `<grund-avatar>`. |
| ARIA | none added by the component (see §6). |

### Types

```ts
export type AvatarStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface AvatarStatusChangeDetail {
  status: AvatarStatus;
}
```

## 4. File layout

```
src/components/avatar/
├── avatar.ts              // root element, @provide context, owns status
├── avatar-image.ts        // renders internal <img>, reports status to root
├── avatar-fallback.ts     // conditional render, supports `delay`
├── avatar.context.ts      // context interface + symbol
├── avatar.engine.ts       // status reducer + delay logic, pure, no DOM
├── types.ts               // AvatarStatus, AvatarStatusChangeDetail
├── index.ts               // barrel export
└── tests/
    ├── avatar.test.ts
    ├── avatar-image.test.ts
    ├── avatar-fallback.test.ts
    ├── avatar-a11y.test.ts
    └── avatar.engine.test.ts
```

No `avatar.registry.ts` — only one image and one fallback are expected, enforced via
dev warnings.

## 5. State & data flow

```
<grund-avatar>
  ├─ AvatarEngine: { status, setStatus(next) }
  ├─ @provide AvatarContext = { status, setStatus }
  ├─ willUpdate: write data-status, dispatch grund-status-change on change
  │
  ├─ <grund-avatar-image>
  │    @consume AvatarContext
  │    On internal <img>:
  │      • src set & not yet loaded → setStatus('loading')
  │      • src absent              → setStatus('idle')
  │      • load event              → setStatus('loaded')
  │      • error event             → setStatus('error')
  │
  └─ <grund-avatar-fallback>
       @consume AvatarContext
       Renders content when status !== 'loaded' AND delayPassed.
       delayPassed timer starts on first non-loaded status (or on connectedCallback if
       initial status is non-loaded). Cleared on disconnect.
```

The engine is independently testable: `new AvatarEngine()`, call `setStatus`, assert
the resulting status. Delay logic lives in the fallback element (it's a DOM-lifecycle
concern), but the timer-gating reducer is pure and tested in isolation.

## 6. Accessibility

Avatar takes a **pass-through** stance, matching Base UI:

- The component adds **no** `role`, `aria-label`, or `aria-hidden` of its own.
- Accessible name comes from the consumer-provided `alt` on `<grund-avatar-image>`. A broken
  `<img>` still exposes its `alt` to assistive technology, so the name persists when the
  image fails.
- Initials/icons in the fallback slot will be announced by AT if visible. Consumers who
  also provide an alt-bearing image and want to avoid double-announcement should add
  `aria-hidden="true"` to their fallback content.
- Initials-only avatars (no `<grund-avatar-image>` at all): the slotted initials are the
  only announced content. Consumers who want a richer label can wrap the avatar with
  their own labelling element.

**Documented patterns** (Storybook + JSDoc):

```html
<!-- Image with fallback initials, name carried by alt -->
<grund-avatar>
  <grund-avatar-image src="/jane.jpg" alt="Jane Doe"></grund-avatar-image>
  <grund-avatar-fallback aria-hidden="true">JD</grund-avatar-fallback>
</grund-avatar>

<!-- Initials only, announced literally -->
<grund-avatar>
  <grund-avatar-fallback>JD</grund-avatar-fallback>
</grund-avatar>
```

**Dev warning** (`avatar-image.ts`): missing `alt`. Format:
`[grund-avatar-image] missing alt attribute. Provide alt="" if decorative.`

## 7. SSR

- No random IDs needed — Avatar exposes no IDREF-driven ARIA relationships.
- All elements render statically on the server. The internal `<img>` ships with whatever
  `src` was set; status starts as `'loading'` (with `src`) or `'idle'` (without). Fallback
  is visible on first paint when status starts non-loaded, eliminating any client-side
  flash for initials-only avatars.
- See `vollgas/refs/ssr-contract.md` for the lifecycle rules being followed.

## 8. Headless / styling contract

- `::part(root)`, `::part(image)`, `::part(fallback)` exposed for consumer styling.
- `[data-status]` on `<grund-avatar>` for status-driven CSS (`[data-status="loaded"]`,
  etc.).
- Zero visual styles in the components themselves. The only declarative styles are
  `:host { display: none }` defaults on `<grund-avatar-image>` and `<grund-avatar-fallback>`,
  flipped to `display: contents` (or equivalent) when their own `data-status` / delay
  conditions are satisfied. These are structural — they implement the visibility contract,
  not a look.

See `vollgas/refs/headless-contract.md`.

## 9. Tests (per `vollgas/refs/test-patterns.md`)

**Engine:**
- Status transitions: `idle → loading → loaded`, `idle → loading → error`, etc.
- `setStatus` no-op when status unchanged.

**Component:**
- Rendering: image visible when loaded; fallback visible otherwise.
- Image with valid `src` → fires `grund-status-change` with `loaded`.
- Image with broken `src` → fires `grund-status-change` with `error`, fallback shows.
- No `<grund-avatar-image>` → status stays `idle`, fallback shows immediately.
- `delay` on fallback defers visibility; cleared on disconnect.
- `data-status` reflected on root.
- Image attributes (`src`, `alt`, `srcset`, etc.) reach the internal `<img>`.
- Dev warnings fire under `import.meta.env.DEV`: missing alt, duplicate image,
  duplicate fallback.

**A11y:**
- Internal `<img alt="...">` is exposed to AT.
- Fallback content is announced when no aria-hidden is set.
- Snapshot of accessibility tree under representative configurations.

**SSR:**
- Server-rendered markup is identical to client first-paint for: image-with-src,
  image-with-broken-src, no-image initials-only.

## 10. Out of scope (v1)

- `<grund-avatar-group>` — overlapping/stacked avatars with overflow indicator.
- Color-hashing helper for initials.
- Built-in initials derivation from a `name` attribute.
- Image preloading or fetch deduplication.

These are tracked as potential follow-ups; revisit after consumer feedback.

## 11. Refs touched

This implementation will update:

- `vollgas/refs/component-shapes.md` — add "Stateful Simple Compound" section and an entry
  to the Component Readiness Matrix.

No other refs need changes; existing contracts (headless, SSR, JSDoc, accessibility,
test patterns, lit-patterns) cover everything.
