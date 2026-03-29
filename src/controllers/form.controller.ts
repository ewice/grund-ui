import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Wraps `ElementInternals` for form-associated custom elements.
 *
 * Usage:
 * ```ts
 * class GrundCheckbox extends LitElement {
 *   static formAssociated = true;
 *   private _internals = this.attachInternals();
 *   private _form = new FormController(this, this._internals);
 * }
 * ```
 *
 * Form lifecycle callbacks (`formResetCallback`, `formStateRestoreCallback`,
 * `formDisabledCallback`) must be defined on the element and delegate to
 * the controller as needed.
 *
 * @internal
 */
export class FormController implements ReactiveController {
  private readonly _internals: ElementInternals;

  constructor(host: ReactiveControllerHost, internals: ElementInternals) {
    this._internals = internals;
    host.addController(this);
  }

  public hostConnected(): void {}
  public hostDisconnected(): void {}

  /**
   * Sets the element's form value. Call in `willUpdate` when the submitted
   * value changes. Pass `null` to remove the value from form submission.
   */
  public setValue(value: string | File | FormData | null): void {
    this._internals.setFormValue(value);
  }

  /**
   * Sets validity state. Pass an empty object and empty string to mark valid.
   * Pass `{ valueMissing: true }` with a message to mark invalid.
   *
   * @param anchor - Shadow element used to anchor the browser validation popup.
   */
  public setValidity(
    flags: ValidityStateFlags,
    message: string,
    anchor?: HTMLElement,
  ): void {
    this._internals.setValidity(flags, message, anchor);
  }

  public get validity(): ValidityState {
    return this._internals.validity;
  }

  public get validationMessage(): string {
    return this._internals.validationMessage;
  }
}
