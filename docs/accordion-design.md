# Accordion — Component Design

High-level design reference for reimplementing the accordion component.

---

## Component Structure

```
<grund-accordion>                    
  <grund-accordion-item>            
    <grund-accordion-header>      
      <grund-accordion-trigger>      
    </grund-accordion-header>
    <grund-accordion-panel>   
  </grund-accordion-item>
</grund-accordion>
```

---

## Elements & Public API

### `<grund-accordion>` — Root

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string[] \| undefined` | `undefined` | — |
| `defaultValue` | `string[] \| undefined` | `undefined` | `default-value` |
| `multiple` | `boolean` | `false` | `multiple` |
| `disabled` | `boolean` | `false` | `disabled` |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | `orientation` |
| `loopFocus` | `boolean` | `true` | `loop-focus` |
| `keepMounted` | `boolean` | `false` | `keep-mounted` |
| `hiddenUntilFound` | `boolean` | `false` | `hidden-until-found` |

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-value-change` | `{ value: string[], itemValue: string, open: boolean }` | Expanded set changed |

---

### `<grund-accordion-item>` — Item

| Property | Type | Default | Attribute |
|---|---|---|---|
| `value` | `string` | auto-generated | `value` |
| `disabled` | `boolean` | `false` | `disabled` |

**Events:**

| Event | Detail | When |
|---|---|---|
| `grund-open-change` | `{ open: boolean, value: string, index: number }` | Item open state changes (after mount) |

**Data attributes:** `data-open`, `data-disabled`, `data-index`

---

### `<grund-accordion-header>` — Header

| Property | Type | Default | Attribute |
|---|---|---|---|
| `level` | `1–6` | `3` | `level` |

---

### `<grund-accordion-trigger>` — Trigger

No public properties. Renders an inner `<button>`.

**CSS parts:** `trigger`
**ARIA:** `aria-expanded`, `aria-controls`
**Data attributes:** `data-open`, `data-disabled`, `data-orientation`, `data-index`

---

### `<grund-accordion-panel>` — Panel

| Property | Type | Default | Attribute |
|---|---|---|---|
| `keepMounted` | `boolean` | `false` | `keep-mounted` |
| `hiddenUntilFound` | `boolean` | `false` | `hidden-until-found` |

**CSS parts:** `panel`
**ARIA:** `role="region"`, `aria-labelledby`
**Data attributes:** `data-open`, `data-disabled`, `data-orientation`, `data-index`
**Visibility:** Supports `hidden="until-found"` for browser find-in-page.

---

## Controlled vs Uncontrolled

- **Uncontrolled:** `defaultValue` seeds once → internal state updates on interaction
- **Controlled:** `value` drives state → only events fire, consumer must update `value`
- **Single/multiple:** `multiple=false` allows max one open; `multiple=true` allows many
