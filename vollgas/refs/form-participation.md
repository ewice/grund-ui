# Form Participation

Full `ElementInternals` API reference and `FormController` design.
Loaded by the implementation plan when component category is `form-control`.

---

## Overview

Form-associated custom elements use the `ElementInternals` API to participate in HTML forms.
All form controls MUST use the shared `FormController` rather than raw `ElementInternals`.
`FormController` lives in `src/controllers/form.controller.ts` — build it with the first form control.

---

## Required Setup

```ts
class GrundSwitch extends LitElement {
  // 1. Required static field
  static formAssociated = true;

  // 2. Attach internals in constructor
  private _internals = this.attachInternals();

  // 3. Use FormController (wraps all ElementInternals calls)
  private _form = new FormController(this, this._internals);
}
```

---

## FormController Design

`FormController` wraps all `ElementInternals` interactions. Implement these capabilities:

### `setFormValue(value)`

Called in `willUpdate` whenever the component's value changes. Submits value to the form.

```ts
// Simple value
this._form.setValue('on'); // for Switch

// Complex value (multiple fields)
const data = new FormData();
data.append(this.name, this.value);
this._form.setValue(data);
```

### Validation Constraint API

```ts
// Valid state
this._form.setValidity({}, '');

// Invalid state
this._form.setValidity(
  { valueMissing: true },
  'Please check this box.',
  this.shadowRoot!.querySelector('input') ?? undefined
);
```

### Form Callbacks

```ts
// Called when parent <form> resets
formResetCallback() {
  this.checked = false; // restore to default
  this._form.setValue(null);
}

// Called for browser autofill or back-forward cache restore
formStateRestoreCallback(state: string | File | FormData, reason: 'restore' | 'autocomplete') {
  if (typeof state === 'string') {
    this.value = state;
  }
}

// Called when ancestor <fieldset disabled> changes
formDisabledCallback(disabled: boolean) {
  this.disabled = disabled;
}
```

### Label Association

`ElementInternals` automatically associates `<label for="id">` with the component.
The component must have an `id` attribute for this to work.

For internal visual labels, use `aria-labelledby` pointing to a shadow element with an ID,
OR use `aria-label` directly on the interactive shadow element.

---

## Indeterminate State (Checkbox)

```ts
@property({ type: Boolean }) indeterminate = false;

willUpdate(changed: PropertyValues) {
  if (changed.has('indeterminate') || changed.has('checked')) {
    if (this.indeterminate) {
      this._form.setValidity({}, ''); // indeterminate is not invalid
      // Visual state via data-indeterminate attribute
    }
  }
}
```

---

## Rules

1. Every form-associated custom element MUST declare `static formAssociated = true`.
2. `setFormValue()` MUST be called in `willUpdate` when `value` or `checked` changes, not in event handlers.
3. `formResetCallback()` MUST restore the element to its `defaultValue` or `defaultChecked` state.
4. `formDisabledCallback()` MUST propagate the `disabled` state to the component's visual and interactive state.
5. `formStateRestoreCallback()` MUST restore state from the provided value string for browser autofill scenarios.
6. Validation MUST use `setValidity()` with the appropriate `ValidityStateFlags`. Do not use custom validity without setting the correct built-in flags.
7. Use `FormController` — never use raw `ElementInternals` directly in element classes.
8. Composite groups (multi-valued selection) submit through children, not the group element. See "Composite Groups (Children Submit)" below.

---

## Composite Groups (Children Submit)

### When this pattern applies

Use this pattern for multi-valued selection where each option maps to a separate form field — for example, `name="proto"` repeated across N checkboxes. This is distinct from single-valued controls (checkbox, switch) that own one `name` on the root element and submit a single value via `setFormValue`.

### What the group does NOT do

The group element (`grund-checkbox-group`) does NOT:

- Declare `static formAssociated = true`
- Call `setFormValue` or manage form submission
- Register its own `name` attribute
- Use `ElementInternals` at the group level

The group is not a form control — it is a coordination container.

### What the group IS responsible for

- **Propagating `disabled`:** When the group is disabled, it must propagate that state to all child elements so they are excluded from form submission.
- **Excluding parent/select-all pseudo-values:** A parent or "select all" checkbox must not submit its own value to the form. Only the real option checkboxes should appear in `FormData`. The parent checkbox value must be excluded from form submission.
- **Children own `formResetCallback`:** Because the group does not participate in form reset, each child checkbox must implement `formResetCallback` correctly on its own to restore its default state when the form resets.

### Test coverage

`src/components/checkbox-group/tests/checkbox-group.form.test.ts` pins the contract that children submit independently on their own `name`. The parent-value exclusion rule is covered by lines 84–102 in `src/components/checkbox-group/tests/checkbox-group.parent-checkbox.test.ts`.
