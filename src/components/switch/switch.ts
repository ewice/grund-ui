import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';
import type { PropertyValues } from 'lit';
import { FormController } from '../../controllers/form.controller';
import { switchContext } from './switch.context';
import type { SwitchContext } from './switch.context';
import type { CheckedChangeDetail } from './types';
import { disabledContext } from '../../context/disabled.context';
import { resolveReferencedElements } from '../../utils/resolve-referenced-elements';

/**
 * A form-associated switch toggle component. Renders a native checkbox input
 * with role="switch" in shadow DOM. Slots a <grund-switch-thumb> for visual
 * indication.
 *
 * @element grund-switch
 * @slot - Default slot for <grund-switch-thumb> and label content
 * @fires {CustomEvent<CheckedChangeDetail>} grund-checked-change - When the switch is toggled
 * @csspart input - The native <input type="checkbox" role="switch">
 */
export class GrundSwitch extends LitElement {
  public static formAssociated = true;
  public static override readonly shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
  public static override readonly styles = css`
    :host {
      display: inline-block;
    }
  `;

  // Public reactive properties
  @property({ type: Boolean })
  public checked: boolean | undefined = undefined;

  @property({ type: Boolean, attribute: 'default-checked' })
  public defaultChecked = false;

  @property({ type: Boolean })
  public disabled = false;

  @property({ type: Boolean, attribute: 'read-only' })
  public readOnly = false;

  @property({ type: Boolean })
  public required = false;

  @property()
  public name = '';

  @property()
  public value = 'on';

  @property({ attribute: 'aria-label' })
  public ariaLabel: string | null = null;

  @property({ attribute: 'aria-labelledby' })
  public ariaLabelledBy: string | null = null;

  @property({ attribute: 'aria-describedby' })
  public ariaDescribedBy: string | null = null;

  // Host data attributes — reflected reactive private properties
  @property({ type: Boolean, attribute: 'data-checked', reflect: true })
  private hostChecked = false;

  @property({ type: Boolean, attribute: 'data-unchecked', reflect: true })
  private hostUnchecked = false;

  @property({ type: Boolean, attribute: 'data-disabled', reflect: true })
  private hostDisabled = false;

  @property({ type: Boolean, attribute: 'data-readonly', reflect: true })
  private hostReadOnly = false;

  @property({ type: Boolean, attribute: 'data-required', reflect: true })
  private hostRequired = false;

  // Internal state
  @state()
  private _internalChecked = false;

  @consume({ context: disabledContext, subscribe: true })
  @state()
  private _ancestorDisabled = false;

  @provide({ context: switchContext })
  @state()
  protected _ctx: SwitchContext = { checked: false, disabled: false, readOnly: false, required: false };

  private readonly _internals = this.attachInternals();
  private readonly _form = new FormController(this, this._internals);

  private readonly _handleHostClick = (e: MouseEvent): void => {
    if (this.shadowRoot?.contains(e.composedPath()[0] as Node)) {
      return;
    }
    this._toggle();
  };

  // Computed values
  private get _effectiveChecked(): boolean {
    return this.checked ?? this._internalChecked;
  }

  private get _effectiveDisabled(): boolean {
    return this.disabled || this._ancestorDisabled;
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this._handleHostClick);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleHostClick);
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!this.hasUpdated) {
      this._internalChecked = this.defaultChecked;
    }

    this.hostChecked = this._effectiveChecked;
    this.hostUnchecked = !this._effectiveChecked;
    this.hostDisabled = this._effectiveDisabled;
    this.hostReadOnly = this.readOnly;
    this.hostRequired = this.required;

    if (this._effectiveChecked) {
      this._form.setValue(this.value);
    } else {
      this._form.setValue(null);
    }

    if (changed.has('required') || changed.has('checked') || changed.has('_internalChecked') || changed.has('_ancestorDisabled') || changed.has('disabled') || !this.hasUpdated) {
      if (this.required && !this._effectiveChecked) {
        const input = this.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
        this._form.setValidity({ valueMissing: true }, 'Please turn this on.', input ?? undefined);
      } else {
        this._form.setValidity({}, '');
      }
    }

    if (
      changed.has('checked') || changed.has('_internalChecked') || changed.has('disabled') ||
      changed.has('readOnly') || changed.has('required') || changed.has('_ancestorDisabled') ||
      !this.hasUpdated
    ) {
      this._ctx = {
        checked: this._effectiveChecked,
        disabled: this._effectiveDisabled,
        readOnly: this.readOnly,
        required: this.required,
      };
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (!this.hasUpdated || changed.has('ariaLabel') || changed.has('ariaLabelledBy') || changed.has('ariaDescribedBy')) {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
      if (!input) return;

      if (this.ariaLabel) {
        input.ariaLabelledByElements = [];
      } else if (this.ariaLabelledBy) {
        input.ariaLabelledByElements = resolveReferencedElements(this.ariaLabelledBy, this);
      } else {
        input.ariaLabelledByElements = this._getAssociatedLabels();
      }

      if (this.ariaDescribedBy) {
        input.ariaDescribedByElements = resolveReferencedElements(this.ariaDescribedBy, this);
      } else {
        input.ariaDescribedByElements = [];
      }
    }
  }

  public formResetCallback(): void {
    this._internalChecked = this.defaultChecked;
    this.checked = undefined;
  }

  public formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state === 'string') {
      this._internalChecked = state === this.value;
      this.checked = undefined;
    }
  }

  public formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  private _handleInputChange(e: Event): void {
    const newChecked = (e.target as HTMLInputElement).checked;
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

  private _toggle(): void {
    if (this._effectiveDisabled || this.readOnly) return;
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

  private _getAssociatedLabels(): HTMLLabelElement[] {
    const labels = new Set<HTMLLabelElement>();
    for (const label of Array.from(this._internals.labels ?? [])) {
      if (label instanceof HTMLLabelElement) labels.add(label);
    }
    if (this.id) {
      const selector = `label[for="${CSS.escape(this.id)}"]`;
      for (const label of Array.from(this.ownerDocument?.querySelectorAll(selector) ?? [])) {
        if (label instanceof HTMLLabelElement) labels.add(label);
      }
    }
    const wrappingLabel = this.closest('label');
    if (wrappingLabel instanceof HTMLLabelElement) labels.add(wrappingLabel);
    return Array.from(labels);
  }

  protected override render() {
    return html`
      <input
        type="checkbox"
        role="switch"
        part="input"
        .checked=${this._effectiveChecked}
        ?disabled=${this._effectiveDisabled}
        ?required=${this.required}
        .name=${this.name || nothing}
        .value=${this.value}
        aria-label=${this.ariaLabel || nothing}
        @change=${this._handleInputChange}
      />
      <slot></slot>
    `;
  }
}

if (!customElements.get('grund-switch')) {
  customElements.define('grund-switch', GrundSwitch);
}
