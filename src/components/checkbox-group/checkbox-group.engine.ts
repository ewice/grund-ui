import { SelectionEngine } from '../../controllers/selection.engine';
import type { CheckboxGroupHostSnapshot, CheckboxGroupToggleResult } from './types';

export class CheckboxGroupEngine {
  private readonly selection = new SelectionEngine();
  private selectableValues: string[] = [];

  public get checkedValues(): ReadonlySet<string> {
    return this.selection.selectedValues;
  }

  public syncFromHost(snapshot: CheckboxGroupHostSnapshot): void {
    this.selectableValues = [...snapshot.selectableValues];
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
    const selectableValuesSet = new Set(this.selectableValues);

    let targetValues: string[];

    if (parentState === 'checked') {
      targetValues = Array.from(current).filter((v) => !selectableValuesSet.has(v));
    } else {
      const merged = new Set([...current, ...this.selectableValues]);
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
    if (this.selectableValues.length === 0) {
      return 'unchecked';
    }

    const checkedCount = this.selectableValues.filter((v) => this.checkedValues.has(v)).length;

    if (checkedCount === 0) {
      return 'unchecked';
    }

    if (checkedCount === this.selectableValues.length) {
      return 'checked';
    }

    return 'indeterminate';
  }
}
