/**
 * Wraps `ElementInternals` for form-associated custom elements.
 *
 * Every form control in Grund UI delegates form interactions through this
 * controller rather than using `ElementInternals` directly.
 *
 * @internal
 */
export class FormController {
  constructor(
    _host: HTMLElement,
    private readonly _internals: ElementInternals,
  ) {}

  /** Submit a value to the owning form. Call in `willUpdate`. */
  public setValue(value: string | FormData | null): void {
    this._internals.setFormValue(value);
  }

  /** Set or clear validity. Anchor is the element shown on `reportValidity()`. */
  public setValidity(
    flags: ValidityStateFlags,
    message: string,
    anchor?: HTMLElement,
  ): void {
    this._internals.setValidity(flags, message, anchor);
  }

  public get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  public get validity(): ValidityState {
    return this._internals.validity;
  }

  public get validationMessage(): string {
    return this._internals.validationMessage;
  }

  public get willValidate(): boolean {
    return this._internals.willValidate;
  }

  public checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  public reportValidity(): boolean {
    return this._internals.reportValidity();
  }
}
