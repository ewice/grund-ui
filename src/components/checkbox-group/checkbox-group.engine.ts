import { SelectionEngine } from '../../controllers/selection.engine';
import type { CheckboxGroupHostSnapshot } from './types.js';

export interface CheckboxGroupToggleResult {
  value: string[];
  checked: boolean;
}

/**
 * Pure state and action resolution for the checkbox group.
 * Wraps SelectionEngine in multi-mode and adds parent-checkbox state derivation.
 * No DOM access, no Lit dependency — independently testable.
 * @internal
 */
export class CheckboxGroupEngine {
  private readonly selection = new SelectionEngine();
  private _allValues: string[] = [];

  public get checkedValues(): ReadonlySet<string> {
    return this.selection.selectedValues;
  }

  public syncFromHost(snapshot: CheckboxGroupHostSnapshot): void {
    this._allValues = [...snapshot.allValues];
    this.selection.syncFromHost({
      value: snapshot.value,
      defaultValue: snapshot.defaultValue,
      multiple: true,
      disabled: snapshot.disabled,
    });
  }

  public requestToggle(itemValue: string): CheckboxGroupToggleResult | null {
    const value = this.selection.requestToggle(itemValue, false);

    if (value === null) {
      return null;
    }

    return {
      value,
      checked: value.includes(itemValue),
    };
  }

  public requestToggleAll(): CheckboxGroupToggleResult | null {
    const parentState = this.getParentState();
    const current = this.selection.selectedValues;
    const allValuesSet = new Set(this._allValues);

    let targetValues: string[];

    if (parentState === 'checked') {
      // Uncheck all: keep values not in allValues
      targetValues = Array.from(current).filter((v) => !allValuesSet.has(v));
    } else {
      // Check all: union of current values and allValues
      const merged = new Set([...current, ...this._allValues]);
      targetValues = Array.from(merged);
    }

    const value = this.selection.requestSet(targetValues);

    if (value === null) {
      return null;
    }

    return {
      value,
      checked: parentState !== 'checked',
    };
  }

  public isChecked(value: string): boolean {
    return this.selection.isSelected(value);
  }

  public getParentState(): 'checked' | 'unchecked' | 'indeterminate' {
    if (this._allValues.length === 0) {
      return 'unchecked';
    }

    const checkedCount = this._allValues.filter((v) => this.checkedValues.has(v)).length;

    if (checkedCount === 0) {
      return 'unchecked';
    }

    if (checkedCount === this._allValues.length) {
      return 'checked';
    }

    return 'indeterminate';
  }
}
