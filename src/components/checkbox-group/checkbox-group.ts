import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { CheckboxGroupEngine } from './checkbox-group.engine';
import { checkboxGroupContext } from './checkbox-group.context';
import { disabledContext } from '../../context/disabled.context';

import type { CheckboxGroupContext } from './checkbox-group.context';
import type { CheckboxGroupValueChangeDetail, CheckboxGroupHostSnapshot } from './types';

/**
 * Root checkbox group container. Provides context to child checkbox elements.
 *
 * @element grund-checkbox-group
 * @slot - Checkbox group items
 * @fires {CustomEvent<CheckboxGroupValueChangeDetail>} grund-value-change - When any child checkbox toggles
 */
export class GrundCheckboxGroup extends LitElement {
  public static override styles = css`
    :host {
      display: block;
    }
  `;

  // hasChanged: () => true — ensures Lit re-runs when a mutated array reference is re-set.
  @property({ type: Array, hasChanged: () => true })
  public value: string[] | undefined = undefined;

  // hasChanged: () => true — ensures Lit re-runs when a mutated array reference is re-set.
  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  public defaultValue: string[] = [];

  // hasChanged: () => true — ensures Lit re-runs when a mutated array reference is re-set.
  @property({ type: Array, attribute: 'all-values', hasChanged: () => true })
  public allValues: string[] = [];

  @property({ type: Boolean }) public disabled = false;

  @provide({ context: checkboxGroupContext })
  @state()
  protected groupCtx!: CheckboxGroupContext;

  @provide({ context: disabledContext })
  @state()
  protected groupCtx_disabled = false;

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
    this.groupCtx_disabled = this.disabled;

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
      disabled: this.disabled,
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
