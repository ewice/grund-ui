import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { CheckboxGroupEngine } from './checkbox-group.engine';
import { CheckboxGroupRegistry } from './checkbox-group.registry';
import { checkboxGroupContext } from './checkbox-group.context';
import { disabledContext } from '../../context/disabled.context';
import { normalizeCheckboxGroupValues, checkboxGroupValuesEqual } from './checkbox-group.normalize';

import type { CheckboxGroupContext } from './checkbox-group.context';
import type { CheckboxGroupRegistration } from './checkbox-group.registry';
import type { CheckboxGroupValueChangeDetail } from './types';

/**
 * Groups multiple `<grund-checkbox>` elements with shared toggle state.
 * Supports controlled and uncontrolled modes, a parent "select-all" checkbox,
 * and accessible group labelling.
 *
 * @element grund-checkbox-group
 *
 * @slot - `<grund-checkbox>` children. Include exactly one `<grund-checkbox parent>` for select-all behavior.
 *
 * @fires {CustomEvent<CheckboxGroupValueChangeDetail>} grund-value-change - Fired when the set of checked values changes. Not cancelable.
 *
 * @csspart group - The `role="group"` container that receives `aria-label`, `ariaLabelledByElements`, and `ariaDescribedByElements`.
 */
export class GrundCheckboxGroup extends LitElement {
  public static override readonly styles = css`
    :host {
      display: block; /* block: checkbox-group is a block-level container */
    }
  `;

  @property({
    type: Array,
    hasChanged: (next: string[] | undefined, prev: string[] | undefined) => {
      if ((next === undefined) !== (prev === undefined)) return true;
      return !checkboxGroupValuesEqual(next, prev);
    },
  })
  public value: string[] | undefined = undefined;

  @property({ type: Array, attribute: 'default-value', hasChanged: (next, prev) => !checkboxGroupValuesEqual(next, prev) })
  public defaultValue: string[] = [];

  /**
   * @deprecated Child values are now derived from registered `<grund-checkbox>` children. Remove this prop. Will be removed in v1.
   */
  @property({ type: Array, attribute: 'all-values', hasChanged: (next, prev) => !checkboxGroupValuesEqual(next, prev) })
  public allValues: string[] = [];

  @property({ type: Boolean }) public disabled = false;

  @property({ attribute: 'aria-label' }) public override ariaLabel: string | null = null;

  @property({ attribute: 'aria-labelledby' }) public ariaLabelledBy: string | null = null;

  @property({ attribute: 'aria-describedby' }) public ariaDescribedBy: string | null = null;

  /**
   * Accessible label for the group. Applied as `aria-label` on the `role="group"` container.
   * Takes precedence over `ariaLabel`. Prefer `ariaLabelledBy` when the label is rendered
   * as a visible element in the DOM.
   */
  @property() public label = '';

  @provide({ context: checkboxGroupContext })
  @state()
  protected groupCtx!: CheckboxGroupContext;

  @provide({ context: disabledContext })
  @state()
  protected disabledCtx = false;

  private readonly engine = new CheckboxGroupEngine();
  private readonly registry = new CheckboxGroupRegistry();

  private _hasWarnedDeprecatedAllValues = false;
  private _registryDirty = false;

  private readonly _isChecked = (value: string) => this.engine.isChecked(value);

  private readonly _getParentState = () => this.engine.getParentState();

  private readonly _requestToggle = (value: string, parent: boolean): void => {
    this._handleToggle(value, parent);
  };

  private readonly _registerItem = (element: HTMLElement, record: CheckboxGroupRegistration): void => {
    if (import.meta.env.DEV) {
      if (!record.parent) {
        const existing = this.registry.get(element);
        if (existing?.value !== record.value && this.registry.selectableValues().includes(record.value)) {
          console.warn(
            '[grund-checkbox-group]',
            `duplicate value "${record.value}" registered. Each <grund-checkbox> in a group must have a unique value.`,
          );
        }
      }
      if (record.parent && this.registry.hasParent() && !this.registry.get(element)?.parent) {
        console.warn(
          '[grund-checkbox-group]',
          'Multiple parent checkboxes detected. Only one parent checkbox is supported per group.',
        );
      }
    }
    this.registry.register(element, record);
    this._registryDirty = true;
    this.requestUpdate();
  };

  private readonly _unregisterItem = (element: HTMLElement): void => {
    if (!this.registry.get(element)) {
      return;
    }
    this.registry.unregister(element);
    this._registryDirty = true;
    this.requestUpdate();
  };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (import.meta.env.DEV && !this._hasWarnedDeprecatedAllValues && this.allValues.length > 0) {
      this._hasWarnedDeprecatedAllValues = true;
      console.warn(
        '[grund-checkbox-group]',
        'allValues is deprecated. Child values are now derived from registered <grund-checkbox> elements. Remove the allValues prop. Will be removed in v1.',
      );
    }

    this._syncEngine();

    this.toggleAttribute('data-disabled', this.disabled);
    this.disabledCtx = this.disabled;

    if (
      !this.hasUpdated ||
      this._registryDirty ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('allValues') ||
      changed.has('disabled')
    ) {
      this._registryDirty = false;
      this._publishGroupContext();
    }
  }

  private _syncEngine(): void {
    const selectableValues = this.registry.selectableValues();
    const allValues = selectableValues.length > 0 ? selectableValues : normalizeCheckboxGroupValues(this.allValues);
    this.engine.syncFromHost({
      value: this.value !== undefined ? normalizeCheckboxGroupValues(this.value) : undefined,
      defaultValue: normalizeCheckboxGroupValues(this.defaultValue),
      allValues,
      disabled: this.disabled,
    });
  }

  private _publishGroupContext(): void {
    this.groupCtx = {
      isChecked: this._isChecked,
      getParentState: this._getParentState,
      requestToggle: this._requestToggle,
      registerItem: this._registerItem,
      unregisterItem: this._unregisterItem,
    };
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

    if (result.persisted) {
      this._publishGroupContext();
    }
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
      <div part="group" role="group" aria-label=${this.label || this.ariaLabel || nothing}>
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-checkbox-group')) {
  customElements.define('grund-checkbox-group', GrundCheckboxGroup);
}
