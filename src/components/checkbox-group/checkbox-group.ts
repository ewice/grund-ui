import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { CheckboxGroupEngine } from './checkbox-group.engine';
import { checkboxGroupContext } from './checkbox-group.context';
import { disabledContext } from '../../context/disabled.context';

import type { CheckboxGroupContext } from './checkbox-group.context';
import type { CheckboxGroupValueChangeDetail, CheckboxGroupHostSnapshot } from './types';

export class GrundCheckboxGroup extends LitElement {
  public static override readonly styles = css`
    :host {
      display: block;
    }
  `;

  @property({ type: Array, hasChanged: () => true })
  public value: string[] | undefined = undefined;

  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  public defaultValue: string[] = [];

  @property({ type: Array, attribute: 'all-values', hasChanged: () => true })
  public allValues: string[] = [];

  @property({ type: Boolean }) public disabled = false;

  @property({ attribute: 'aria-label' }) public override ariaLabel: string | null = null;

  @property({ attribute: 'aria-labelledby' }) public ariaLabelledBy: string | null = null;

  @property({ attribute: 'aria-describedby' }) public ariaDescribedBy: string | null = null;

  @provide({ context: checkboxGroupContext })
  @state()
  protected groupCtx!: CheckboxGroupContext;

  @provide({ context: disabledContext })
  @state()
  protected disabledCtx = false;

  private readonly engine = new CheckboxGroupEngine();

  private readonly _isChecked = (value: string) => this.engine.isChecked(value);

  private readonly _getParentState = () => this.engine.getParentState();

  private readonly _requestToggle = (value: string, parent: boolean): void => {
    this._handleToggle(value, parent);
  };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: CheckboxGroupHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      allValues: this.allValues,
      disabled: this.disabled,
    };
    this.engine.syncFromHost(snapshot);

    this.toggleAttribute('data-disabled', this.disabled);
    this.disabledCtx = this.disabled;

    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('allValues') ||
      changed.has('disabled')
    ) {
      this._publishGroupContext();
    }
  }

  private _publishGroupContext(): void {
    this.groupCtx = {
      isChecked: this._isChecked,
      getParentState: this._getParentState,
      requestToggle: this._requestToggle,
    };
  }

  private _handleToggle(itemValue: string, parent: boolean): void {
    const toggleResult = parent
      ? this.engine.requestToggleAll()
      : this.engine.requestToggle(itemValue);

    if (toggleResult === null) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<CheckboxGroupValueChangeDetail>('grund-value-change', {
        detail: {
          value: toggleResult.value,
          itemValue,
          checked: toggleResult.checked,
        },
        bubbles: true,
        composed: false,
      }),
    );

    this._publishGroupContext();
  }

  protected override updated(): void {
    const group = this.shadowRoot?.querySelector<HTMLElement>('[part="group"]');
    if (!group) {
      return;
    }

    if (this.ariaLabelledBy) {
      group.ariaLabelledByElements = this._resolveReferencedElements(this.ariaLabelledBy);
    } else {
      group.ariaLabelledByElements = [];
    }

    if (this.ariaDescribedBy) {
      group.ariaDescribedByElements = this._resolveReferencedElements(this.ariaDescribedBy);
    } else {
      group.ariaDescribedByElements = [];
    }
  }

  private _resolveReferencedElements(value: string): HTMLElement[] {
    return value
      .split(/\s+/)
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => this.ownerDocument?.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
  }

  protected override render() {
    return html`
      <div part="group" role="group" aria-label=${this.ariaLabel ?? nothing}>
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-checkbox-group')) {
  customElements.define('grund-checkbox-group', GrundCheckboxGroup);
}
