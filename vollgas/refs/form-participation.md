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
