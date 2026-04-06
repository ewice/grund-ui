import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { CheckboxGroupEngine } from './checkbox-group.engine';
import { checkboxGroupContext } from './checkbox-group.context';
import { disabledContext } from '../../context/disabled.context';

import type { CheckboxGroupContext } from './checkbox-group.context';
import type { CheckboxGroupValueChangeDetail, CheckboxGroupHostSnapshot } from './types';

/**
 * Root checkbox group container. Coordinates checked state across child `grund-checkbox` elements.
 *
 * Supports controlled mode (`value` prop set) and uncontrolled mode (`value` is `undefined`,
 * state seeded by `defaultValue`). In controlled mode, `grund-value-change` fires on each
 * interaction but the displayed state does not change automatically — the consumer must update
 * the `value` property.
 *
 * Consumers should provide an accessible grouping container (e.g., `<fieldset>` with `<legend>`,
 * or `aria-labelledby` on the host element) since this element does not add any ARIA grouping role.
 *
 * @element grund-checkbox-group
 * @slot - Checkbox group items (grund-checkbox elements)
 * @fires {CustomEvent<CheckboxGroupValueChangeDetail>} grund-value-change - When any child checkbox toggles
 */
export class GrundCheckboxGroup extends LitElement {
  public static override styles = css`
    :host {
      display: block; /* block: group container wrapping checkbox items */
    }
  `;

  /** Controlled checked values. `undefined` enables uncontrolled mode (seeded by `defaultValue`). */
  // hasChanged: () => true — ensures Lit re-runs when a mutated array reference is re-set.
  @property({ type: Array, hasChanged: () => true })
  public value: string[] | undefined = undefined;

  /** Seeds uncontrolled checked state on first render only. Ignored when `value` is set. */
  // hasChanged: () => true — ensures Lit re-runs when a mutated array reference is re-set.
  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  public defaultValue: string[] = [];

  /** All possible checkbox values. Required for the parent checkbox to derive its state (checked / unchecked / indeterminate). */
  // hasChanged: () => true — ensures Lit re-runs when a mutated array reference is re-set.
  @property({ type: Array, attribute: 'all-values', hasChanged: () => true })
  public allValues: string[] = [];

  /** Whether all checkboxes in the group are disabled. */
  @property({ type: Boolean }) public disabled = false;

  @provide({ context: checkboxGroupContext })
  @state()
  protected groupCtx!: CheckboxGroupContext;

  @provide({ context: disabledContext })
  @state()
  protected disabledCtx = false;

  private readonly engine = new CheckboxGroupEngine();

  // Stable bound callbacks — defined as class fields so object identity is preserved across
  // createGroupContext() calls. Lit context consumers re-render when context reference changes;
  // stable callbacks avoid triggering unnecessary re-renders on unrelated state updates.
  private readonly _isChecked = (value: string) => this.engine.isChecked(value);

  private readonly _getParentState = () => this.engine.getParentState();

  private readonly _requestToggle = (value: string, parent: boolean): void => {
    this.handleToggle(value, parent);
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

    // Recreate context on first render or when state-bearing properties change.
    // Note: handleToggle() also recreates context directly because internal
    // engine state changes don't trigger willUpdate (no reactive prop changes).
    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('allValues') ||
      changed.has('disabled')
    ) {
      this.groupCtx = this.createGroupContext();
    }
  }

  private createGroupContext(): CheckboxGroupContext {
    return {
      isChecked: this._isChecked,
      getParentState: this._getParentState,
      requestToggle: this._requestToggle,
    };
  }

  private handleToggle(itemValue: string, parent: boolean): void {
    let result: string[] | null;
    let checked: boolean;

    if (parent) {
      result = this.engine.requestToggleAll();
      if (result === null) return;
      checked =
        result.length === this.allValues.length && this.allValues.every((v) => result!.includes(v));
    } else {
      result = this.engine.requestToggle(itemValue);
      if (result === null) return;
      checked = result.includes(itemValue);
    }

    this.dispatchEvent(
      new CustomEvent<CheckboxGroupValueChangeDetail>('grund-value-change', {
        detail: { value: result, itemValue, checked },
        bubbles: true,
        composed: false,
      }),
    );

    // Must recreate context here because toggle changes internal engine state
    // (checkedValues) without changing any reactive property, so willUpdate's
    // guard won't detect the change on the next render cycle.
    this.groupCtx = this.createGroupContext();
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-checkbox-group')) {
  customElements.define('grund-checkbox-group', GrundCheckboxGroup);
}
