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

  @state()
  private _internalChecked = false;

  @consume({ context: disabledContext, subscribe: true })
  @state()
  private ancestorDisabled = false;

  @provide({ context: switchContext })
  @state()
  protected ctx: SwitchContext = { checked: false, disabled: false, readOnly: false, required: false };

  private readonly internals = this.attachInternals();
  private readonly form = new FormController(this, this.internals);

  private readonly handleHostClick = (e: MouseEvent): void => {
    if (this.shadowRoot?.contains(e.composedPath()[0] as Node)) {
      return;
    }
    this.toggle();
  };

  private get effectiveChecked(): boolean {
    return this.checked ?? this._internalChecked;
  }

  private get effectiveDisabled(): boolean {
    return this.disabled || this.ancestorDisabled;
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this.handleHostClick);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleHostClick);
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (!this.hasUpdated) {
      this._internalChecked = this.defaultChecked;
    }

    this.toggleAttribute('data-checked', this.effectiveChecked);
    this.toggleAttribute('data-unchecked', !this.effectiveChecked);
    this.toggleAttribute('data-disabled', this.effectiveDisabled);
    this.toggleAttribute('data-readonly', this.readOnly);
    this.toggleAttribute('data-required', this.required);

    if (this.effectiveChecked) {
      this.form.setValue(this.value);
    } else {
      this.form.setValue(null);
    }

    if (
      changed.has('checked') || changed.has('_internalChecked') || changed.has('disabled') ||
      changed.has('readOnly') || changed.has('required') || changed.has('ancestorDisabled') ||
      !this.hasUpdated
    ) {
      if (this.required && !this.effectiveChecked) {
        const input = this.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
        this.form.setValidity({ valueMissing: true }, 'Please turn this on.', input ?? undefined);
      } else {
        this.form.setValidity({}, '');
      }

      this.ctx = {
        checked: this.effectiveChecked,
        disabled: this.effectiveDisabled,
        readOnly: this.readOnly,
        required: this.required,
      };
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (!this.hasUpdated || changed.has('ariaLabel') || changed.has('ariaLabelledBy') || changed.has('ariaDescribedBy')) {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]');
      if (!input) {return;}

      if (this.ariaLabel) {
        input.ariaLabelledByElements = [];
      } else if (this.ariaLabelledBy) {
        input.ariaLabelledByElements = resolveReferencedElements(this.ariaLabelledBy, this);
      } else {
        input.ariaLabelledByElements = this.getAssociatedLabels();
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

  private handleInputChange(e: Event): void {
    if (this.effectiveDisabled || this.readOnly) {
      (e.target as HTMLInputElement).checked = this.effectiveChecked;
      return;
    }
    const newChecked = (e.target as HTMLInputElement).checked;
    this.setChecked(newChecked);
  }

  private toggle(): void {
    if (this.effectiveDisabled || this.readOnly) {return;}
    this.setChecked(!this.effectiveChecked);
  }

  private setChecked(newChecked: boolean): void {
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

  private getAssociatedLabels(): HTMLLabelElement[] {
    const labels = new Set<HTMLLabelElement>();
    for (const label of Array.from(this.internals.labels ?? [])) {
      if (label instanceof HTMLLabelElement) {labels.add(label);}
    }
    if (this.id) {
      const selector = `label[for="${CSS.escape(this.id)}"]`;
      for (const label of Array.from(this.ownerDocument?.querySelectorAll(selector) ?? [])) {
        if (label instanceof HTMLLabelElement) {labels.add(label);}
      }
    }
    const wrappingLabel = this.closest('label');
    if (wrappingLabel instanceof HTMLLabelElement) {labels.add(wrappingLabel);}
    return Array.from(labels);
  }

  protected override render() {
    return html`
      <input
        type="checkbox"
        role="switch"
        part="input"
        .checked=${this.effectiveChecked}
        ?disabled=${this.effectiveDisabled}
        ?required=${this.required}
        .name=${this.name ?? nothing}
        .value=${this.value}
        aria-label=${this.ariaLabel ?? nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        @change=${this.handleInputChange}
      />
      <slot></slot>
    `;
  }
}

if (!customElements.get('grund-switch')) {
  customElements.define('grund-switch', GrundSwitch);
}
