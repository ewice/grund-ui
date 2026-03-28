/**
 * Wraps `ElementInternals` for form-associated custom elements.
 *
 * @internal
 */
export class FormController {
  constructor(
    _host: HTMLElement,
    private readonly _internals: ElementInternals,
  ) {}

  /** Submit a value to the owning form. Call in `willUpdate`. */
  setValue(value: string | FormData | null): void {
    this._internals.setFormValue(value);
  }

  /** Set or clear validity. Anchor is the element shown on `reportValidity()`. */
  setValidity(
    flags: ValidityStateFlags,
    message: string,
    anchor?: HTMLElement,
  ): void {
    this._internals.setValidity(flags, message, anchor);
  }

  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }

  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  get willValidate(): boolean {
    return this._internals.willValidate;
  }

  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  reportValidity(): boolean {
    return this._internals.reportValidity();
  }
}
