import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import type { PropertyValues } from 'lit';

import { FormController } from '../../controllers/form.controller';
import { checkboxContext } from './checkbox.context';
import type { CheckboxContext } from './checkbox.context';
import type { CheckedChangeDetail } from './types';

/**
 * A headless form-associated checkbox with checked, unchecked, and indeterminate states.
 * Supports controlled mode (`checked` prop) and uncontrolled mode (`defaultChecked` prop).
 * In controlled mode, `grund-checked-change` fires but the displayed state does not change
 * automatically — the consumer must update the `checked` property.
 *
 * @element grund-checkbox
 * @slot - Label text and optional <grund-checkbox-indicator> child
 * @fires {CustomEvent<CheckedChangeDetail>} grund-checked-change - When checked state changes via user interaction. In controlled mode, also update the `checked` property to reflect the new value.
 * @csspart button - The inner <button role="checkbox"> element
 */
export class GrundCheckbox extends LitElement {
  public static formAssociated = true;

  public static override readonly shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  public static override readonly styles = css`
    :host {
      display: inline; /* inline: checkbox + label is an inline-level control */
    }
  `;

  /** Controlled checked value. `undefined` enables uncontrolled mode. */
  @property({ type: Boolean })
  public checked: boolean | undefined = undefined;

  /** Seeds uncontrolled checked state on first render only. */
  @property({ type: Boolean, attribute: 'default-checked' })
  public defaultChecked = false;

  /** Whether the checkbox is in the indeterminate (mixed) state. Always controlled. */
  @property({ type: Boolean })
  public indeterminate = false;

  /** Form field name. */
  @property()
  public name = '';

  /** Form submission value when checked. */
  @property()
  public value = 'on';

  /** Whether the checkbox is disabled. */
  @property({ type: Boolean })
  public disabled = false;

  /** Whether the checkbox is required for form submission. */
  @property({ type: Boolean })
  public required = false;

  /** Whether the checkbox is read-only (visible but not interactable). */
  @property({ type: Boolean, attribute: 'read-only' })
  public readOnly = false;

  @state()
  private _internalChecked = false;

  @provide({ context: checkboxContext })
  @state()
  protected _ctx: CheckboxContext = { checked: false, indeterminate: false };

  private readonly _internals = this.attachInternals();
  // Not using SelectionEngine — checkbox is a single boolean, not a set of selected values.
  // Not using RovingFocusController — standalone form control, not a composite widget.
  private readonly _form = new FormController(this, this._internals);

  // Arrow function keeps the same reference for add/removeEventListener.
  // Handles label-for association: the browser dispatches click on the host element, not the inner
  // button, so we need a host-level listener. Guard against double-fire from button clicks that
  // bubble up through the shadow boundary by checking the composed event path.
  private readonly _handleHostClick = (e: MouseEvent): void => {
    if (this.shadowRoot?.contains(e.composedPath()[0] as Node)) return;
    this._handleClick();
  };

  public override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this._handleHostClick);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleHostClick);
  }

  protected override willUpdate(changed: PropertyValues): void {
    // Seed uncontrolled state from defaultChecked on first render only.
    if (!this.hasUpdated) {
      this._internalChecked = this.defaultChecked;
    }

    const effective = this._effectiveChecked;

    // Data attributes — indeterminate takes visual precedence over checked.
    this.toggleAttribute('data-checked', !this.indeterminate && effective);
    this.toggleAttribute('data-unchecked', !this.indeterminate && !effective);
    this.toggleAttribute('data-indeterminate', this.indeterminate);
    this.toggleAttribute('data-disabled', this.disabled);
    this.toggleAttribute('data-required', this.required);
    this.toggleAttribute('data-readonly', this.readOnly);

    if (!this.indeterminate && effective) {
      this._form.setValue(this.value);
    } else {
      this._form.setValue(null);
    }

    // Validity: required fails when unchecked (indeterminate counts as unchecked).
    if (this.required && !effective) {
      const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('[part="button"]');
      this._form.setValidity(
        { valueMissing: true },
        'Please check this box.',
        btn ?? undefined,
      );
    } else {
      this._form.setValidity({}, '');
    }

    // Recreate the context reference so @provide notifies consumers when checkbox state changes.
    if (
      changed.has('checked') ||
      changed.has('_internalChecked') ||
      changed.has('indeterminate') ||
      !this.hasUpdated
    ) {
      this._ctx = { checked: effective, indeterminate: this.indeterminate };
    }
  }

  /** @internal */
  public formResetCallback(): void {
    this._internalChecked = this.defaultChecked;
    this.checked = undefined;
    this.indeterminate = false;
  }

  /** @internal */
  public formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state === 'string') {
      // Browser restores the submitted value — if it matches our value, the checkbox was checked.
      this._internalChecked = state === this.value;
      this.checked = undefined;
    }
  }

  /** @internal */
  public formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  private get _effectiveChecked(): boolean {
    return this.checked ?? this._internalChecked;
  }

  private _handleClick(): void {
    if (this.disabled || this.readOnly) {
      return;
    }

    // Indeterminate click always resolves to checked:true (consumer must clear indeterminate).
    const newChecked = this.indeterminate ? true : !this._effectiveChecked;

    if (this.checked === undefined) {
      // Uncontrolled: update internal state.
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
    const ariaChecked = this.indeterminate ? 'mixed' : String(this._effectiveChecked);

    return html`
      <button
        part="button"
        type="button"
        role="checkbox"
        aria-checked=${ariaChecked}
        ?disabled=${this.disabled}
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

export { GrundCheckboxIndicator } from './checkbox-indicator.js';
export type { CheckedChangeDetail } from './types.js';
