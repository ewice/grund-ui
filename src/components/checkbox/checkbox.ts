import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';

import { disabledContext } from '../../context/disabled.context';
import { FormController } from '../../controllers/form.controller';
import { checkboxContext } from './context/checkbox.context';
import type { CheckboxContext } from './context/checkbox.context';
import type { CheckedChangeDetail } from './types';

/**
 * A form-associated checkbox control with checked, unchecked, and indeterminate states.
 *
 * Set `checked` for controlled mode; omit it (or set `undefined`) for uncontrolled
 * mode seeded by `defaultChecked`. In controlled mode, update `checked` in your
 * `grund-checked-change` handler.
 *
 * @element grund-checkbox
 * @slot - Label content and optional `<grund-checkbox-indicator>`
 * @fires {CustomEvent<CheckedChangeDetail>} grund-checked-change - Checked state changes on interaction
 * @csspart button - The inner `<button role="checkbox">`
 */
export class GrundCheckbox extends LitElement {
  /** @internal */
  public static formAssociated = true;

  public static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  public static override readonly styles = css`
    :host {
      display: inline; /* inline: checkbox is an inline control */
    }
  `;

  @property({ type: Boolean })
  public checked: boolean | undefined = undefined;

  @property({ type: Boolean, attribute: 'default-checked' })
  public defaultChecked = false;

  @property({ type: Boolean })
  public indeterminate = false;

  @property()
  public name = '';

  @property()
  public value = 'on';

  @property({ type: Boolean })
  public disabled = false;

  @property({ type: Boolean })
  public required = false;

  @property({ type: Boolean, attribute: 'read-only' })
  public readOnly = false;

  @state()
  private _internalChecked = false;

  @consume({ context: disabledContext, subscribe: true })
  @state()
  private _ancestorDisabled = false;

  @state()
  private _fieldsetDisabled = false;

  @provide({ context: checkboxContext })
  @state()
  protected _checkboxCtx: CheckboxContext = { checked: false, indeterminate: false };

  // Form-associated elements are inherently client-only — attachInternals()
  // requires a real DOM element and cannot run during SSR.
  private _internals = this.attachInternals();
  private _form = new FormController(this, this._internals);

  private get _effectiveChecked(): boolean {
    return this.checked ?? this._internalChecked;
  }

  private get _effectiveDisabled(): boolean {
    return this._ancestorDisabled || this._fieldsetDisabled || this.disabled;
  }

  protected override willUpdate(): void {
    if (!this.hasUpdated) {
      this._internalChecked = this.defaultChecked;
    }

    const checked = this._effectiveChecked;
    const disabled = this._effectiveDisabled;

    // Data attributes — set in willUpdate per headless-contract Rule 22
    this.toggleAttribute('data-checked', checked && !this.indeterminate);
    this.toggleAttribute('data-unchecked', !checked && !this.indeterminate);
    this.toggleAttribute('data-indeterminate', this.indeterminate);
    this.toggleAttribute('data-disabled', disabled);
    this.toggleAttribute('data-required', this.required);
    this.toggleAttribute('data-readonly', this.readOnly);

    // Context for indicator — only recreate when values change
    if (
      this._checkboxCtx.checked !== checked ||
      this._checkboxCtx.indeterminate !== this.indeterminate
    ) {
      this._checkboxCtx = { checked, indeterminate: this.indeterminate };
    }

    // Form value — set in willUpdate per form-participation Rule 2
    if (this.name) {
      this._form.setValue(checked ? this.value : null);
    }

    // Validation
    if (this.required && !checked) {
      this._form.setValidity(
        { valueMissing: true },
        'Please check this box.',
        this.shadowRoot?.querySelector('button') ?? undefined,
      );
    } else {
      this._form.setValidity({}, '');
    }
  }

  /** @internal Called when the parent `<form>` is reset. */
  public formResetCallback(): void {
    this._internalChecked = this.defaultChecked;
    this.requestUpdate();
  }

  /** @internal Called for browser autofill or bfcache restore. */
  public formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state === 'string') {
      this._internalChecked = state === this.value;
      this.requestUpdate();
    }
  }

  /** @internal Called when ancestor `<fieldset disabled>` changes. */
  public formDisabledCallback(disabled: boolean): void {
    this._fieldsetDisabled = disabled;
  }

  private _handleClick(): void {
    if (this._effectiveDisabled || this.readOnly) {
      return;
    }

    const newChecked = !this._effectiveChecked;

    if (this.checked === undefined) {
      this._internalChecked = newChecked;
    }

    this.dispatchEvent(
      new CustomEvent<CheckedChangeDetail>('grund-checked-change', {
        detail: { checked: newChecked },
        bubbles: true,
        composed: false,
      }),
    );
  }

  protected override render() {
    const checked = this._effectiveChecked;
    const ariaChecked = this.indeterminate ? 'mixed' : String(checked);

    return html`
      <button
        part="button"
        type="button"
        role="checkbox"
        aria-checked=${ariaChecked}
        ?disabled=${this._effectiveDisabled}
        aria-required=${this.required || nothing}
        aria-readonly=${this.readOnly || nothing}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-checkbox')) {
  customElements.define('grund-checkbox', GrundCheckbox);
}
