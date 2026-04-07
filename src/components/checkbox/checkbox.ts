import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';
import type { PropertyValues } from 'lit';

import { FormController } from '../../controllers/form.controller';
import { checkboxContext } from './checkbox.context';
import type { CheckboxContext } from './checkbox.context';
import type { CheckedChangeDetail } from './types';
import { checkboxGroupContext } from '../checkbox-group/checkbox-group.context.js';
import type { CheckboxGroupContext } from '../checkbox-group/checkbox-group.context.js';
import { disabledContext } from '../../context/disabled.context.js';

export class GrundCheckbox extends LitElement {
  public static formAssociated = true;

  public static override readonly shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  public static override readonly styles = css`
    :host {
      display: inline;
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

  @property({ type: Boolean })
  public parent = false;

  @property({ attribute: 'aria-label' })
  public override ariaLabel: string | null = null;

  @property({ attribute: 'aria-labelledby' })
  public ariaLabelledBy: string | null = null;

  @property({ attribute: 'aria-describedby' })
  public ariaDescribedBy: string | null = null;

  @state()
  private _internalChecked = false;

  @consume({ context: disabledContext, subscribe: true })
  @state()
  private _ancestorDisabled = false;

  @consume({ context: checkboxGroupContext, subscribe: true })
  @state()
  private groupCtx?: CheckboxGroupContext;

  @provide({ context: checkboxContext })
  @state()
  protected _ctx: CheckboxContext = { checked: false, indeterminate: false };

  private readonly _internals = this.attachInternals();
  private readonly _form = new FormController(this, this._internals);

  private readonly _handleHostClick = (e: MouseEvent): void => {
    if (this.shadowRoot?.contains(e.composedPath()[0] as Node)) {
      return;
    }
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
    if (!this.hasUpdated) {
      this._internalChecked = this.defaultChecked;
    }

    if (import.meta.env.DEV) {
      if (this.hasUpdated && this.parent && !this.groupCtx) {
        console.warn(
          '[grund-checkbox] parent=true has no effect outside <grund-checkbox-group>. ' +
            'Wrap in a <grund-checkbox-group> with allValues set.',
        );
      }
    }

    const effective = this._effectiveChecked;
    const effectiveIndeterminate = this._effectiveIndeterminate;

    this.toggleAttribute('data-checked', !effectiveIndeterminate && effective);
    this.toggleAttribute('data-unchecked', !effectiveIndeterminate && !effective);
    this.toggleAttribute('data-indeterminate', effectiveIndeterminate);
    this.toggleAttribute('data-disabled', this._effectiveDisabled);
    this.toggleAttribute('data-required', this.required);
    this.toggleAttribute('data-readonly', this.readOnly);

    if (!(this.parent && this.groupCtx)) {
      if (!effectiveIndeterminate && effective) {
        this._form.setValue(this.value);
      } else {
        this._form.setValue(null);
      }
    }

    if (this.required && !effective) {
      const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('[part="button"]');
      this._form.setValidity({ valueMissing: true }, 'Please check this box.', btn ?? undefined);
    } else {
      this._form.setValidity({}, '');
    }

    if (
      changed.has('checked') ||
      changed.has('_internalChecked') ||
      changed.has('indeterminate') ||
      changed.has('groupCtx') ||
      !this.hasUpdated
    ) {
      this._ctx = { checked: effective, indeterminate: effectiveIndeterminate };
    }
  }

  protected override updated(_changed: PropertyValues): void {
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('[part="button"]');

    if (!btn) {
      return;
    }

    if (this.ariaLabel) {
      btn.ariaLabelledByElements = [];
    } else if (this.ariaLabelledBy) {
      btn.ariaLabelledByElements = this._resolveReferencedElements(this.ariaLabelledBy);
    } else if (!this.ariaLabel) {
      btn.ariaLabelledByElements = this._getAssociatedLabels();
    }

    if (this.ariaDescribedBy) {
      btn.ariaDescribedByElements = this._resolveReferencedElements(this.ariaDescribedBy);
    } else {
      btn.ariaDescribedByElements = [];
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
      this._internalChecked = state === this.value;
      this.checked = undefined;
    }
  }

  /** @internal */
  public formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  private get _effectiveDisabled(): boolean {
    return this.disabled || this._ancestorDisabled;
  }

  private get _effectiveIndeterminate(): boolean {
    if (this.groupCtx && this.parent) {
      return this.groupCtx.getParentState() === 'indeterminate';
    }
    return this.indeterminate;
  }

  private get _effectiveChecked(): boolean {
    if (this.groupCtx) {
      if (this.parent) {
        return this.groupCtx.getParentState() === 'checked';
      }

      return this.groupCtx.isChecked(this.value);
    }
    return this.checked ?? this._internalChecked;
  }

  private _handleClick(): void {
    if (this._effectiveDisabled || this.readOnly) {
      return;
    }

    if (this.groupCtx) {
      const newChecked = this.parent
        ? this.groupCtx.getParentState() !== 'checked'
        : !this.groupCtx.isChecked(this.value);
      this.dispatchEvent(
        new CustomEvent<CheckedChangeDetail>('grund-checked-change', {
          detail: { checked: newChecked },
          bubbles: true,
          composed: false,
        }),
      );
      this.groupCtx.requestToggle(this.value, this.parent);
      return;
    }

    const newChecked = this.indeterminate ? true : !this._effectiveChecked;

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

  private _resolveReferencedElements(value: string): HTMLElement[] {
    return value
      .split(/\s+/)
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => this.ownerDocument?.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
  }

  private _getAssociatedLabels(): HTMLLabelElement[] {
    const labels = new Set<HTMLLabelElement>();

    for (const label of Array.from(this._internals.labels ?? [])) {
      if (label instanceof HTMLLabelElement) {
        labels.add(label);
      }
    }

    if (this.id) {
      const selector = `label[for="${CSS.escape(this.id)}"]`;
      for (const label of Array.from(this.ownerDocument?.querySelectorAll(selector) ?? [])) {
        if (label instanceof HTMLLabelElement) {
          labels.add(label);
        }
      }
    }

    const wrappingLabel = this.closest('label');
    if (wrappingLabel instanceof HTMLLabelElement) {
      labels.add(wrappingLabel);
    }

    return Array.from(labels);
  }

  protected override render() {
    const ariaChecked = this._effectiveIndeterminate ? 'mixed' : String(this._effectiveChecked);

    return html`
      <button
        part="button"
        type="button"
        role="checkbox"
        aria-checked=${ariaChecked}
        aria-label=${this.ariaLabel ?? nothing}
        ?disabled=${this._effectiveDisabled}
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
