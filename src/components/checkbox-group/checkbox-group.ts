import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { CheckboxGroupEngine } from './checkbox-group.engine';
import { CheckboxGroupRegistry } from './checkbox-group.registry';
import { checkboxGroupContext } from './checkbox-group.context';
import { disabledContext } from '../../context/disabled.context';
import { normalizeCheckboxGroupValues, checkboxGroupValuesEqual } from './utils';
import { resolveReferencedElements } from '../../utils/resolve-referenced-elements';

import type { CheckboxGroupContext } from './checkbox-group.context';
import type { CheckboxGroupRegistration } from './checkbox-group.registry';
import type { CheckboxGroupValueChangeDetail } from './types';

export class GrundCheckboxGroup extends LitElement {
  public static override readonly styles = css`
    :host {
      display: block;
    }
  `;

  // undefined means uncontrolled; any array (even []) means controlled — flipping between modes must trigger re-render regardless of content equality.
  @property({
    type: Array,
    hasChanged: (next: string[] | undefined, prev: string[] | undefined) => {
      if ((next === undefined) !== (prev === undefined)) { return true; }
      return !checkboxGroupValuesEqual(next, prev);
    },
  })
  public value: string[] | undefined = undefined;

  @property({ type: Array, attribute: 'default-value', hasChanged: (next, prev) => !checkboxGroupValuesEqual(next, prev) })
  public defaultValue: string[] = [];

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
  private readonly registry = new CheckboxGroupRegistry();
  private readonly contextApi: CheckboxGroupContext = {
    isChecked: (value) => this.engine.isChecked(value),
    getParentState: () => this.engine.getParentState(),
    requestToggle: (value, parent) => this._handleToggle(value, parent),
    registerItem: (element, record) => this._registerItem(element, record),
    unregisterItem: (element) => this._unregisterItem(element),
  };

  private _registryDirty = false;

  private _registerItem(element: HTMLElement, record: CheckboxGroupRegistration): void {
    this.registry.register(element, record);
    this._markRegistryDirty();
  }

  private _unregisterItem(element: HTMLElement): void {
    if (!this.registry.get(element)) {
      return;
    }

    this.registry.unregister(element);
    this._markRegistryDirty();
  }

  private _markRegistryDirty(): void {
    this._registryDirty = true;
    this.requestUpdate();
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    this._syncEngine();

    this.toggleAttribute('data-disabled', this.disabled);
    this.disabledCtx = this.disabled;

    if (
      !this.hasUpdated ||
      this._registryDirty ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('disabled')
    ) {
      this._registryDirty = false;
      this._updateGroupContext();
    }
  }

  private _syncEngine(): void {
    this.engine.syncFromHost({
      value: this.value !== undefined ? normalizeCheckboxGroupValues(this.value) : undefined,
      defaultValue: normalizeCheckboxGroupValues(this.defaultValue),
      selectableValues: this.registry.selectableValues(),
      disabled: this.disabled,
    });
  }

  private _updateGroupContext(): void {
    this.groupCtx = { ...this.contextApi };
  }

  private _handleToggle(itemValue: string, parent: boolean): void {
    const result = parent
      ? this.engine.requestToggleAll()
      : this.engine.requestToggle(itemValue);

    if (result === null) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<CheckboxGroupValueChangeDetail>('grund-value-change', {
        detail: { value: result.value, itemValue, checked: result.checked },
        bubbles: true,
        composed: false,
      }),
    );

    if (this.value === undefined) {
      this._updateGroupContext();
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (!this.hasUpdated || changed.has('ariaLabelledBy') || changed.has('ariaDescribedBy')) {
      const group = this.shadowRoot?.querySelector<HTMLElement>('[part="group"]');
      if (!group) {
        return;
      }

      if (this.ariaLabelledBy) {
        group.ariaLabelledByElements = resolveReferencedElements(this.ariaLabelledBy, this);
      } else {
        group.ariaLabelledByElements = [];
      }

      if (this.ariaDescribedBy) {
        group.ariaDescribedByElements = resolveReferencedElements(this.ariaDescribedBy, this);
      } else {
        group.ariaDescribedByElements = [];
      }
    }
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
