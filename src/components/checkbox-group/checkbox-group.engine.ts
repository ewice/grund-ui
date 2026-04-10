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
  private readonly _registeredChildren = new Map<string, boolean>();

  public get checkedValues(): ReadonlySet<string> {
    return this.selection.selectedValues;
  }

  private get _effectiveAllValues(): string[] {
    if (this._registeredChildren.size > 0) {
      return Array.from(this._registeredChildren.entries())
        .filter(([, parent]) => !parent)
        .map(([value]) => value);
    }
    return this._allValues;
  }

  public registerChild(value: string, parent: boolean): void {
    this._registeredChildren.set(value, parent);
  }

  public unregisterChild(value: string): void {
    this._registeredChildren.delete(value);
  }

  public syncFromHost(snapshot: CheckboxGroupHostSnapshot): void {
    if (import.meta.env.DEV) {
      if (snapshot.allValues.length > 0) {
        console.warn(
          '[grund-checkbox-group]',
          'allValues is deprecated. Child values are now derived from registered <grund-checkbox> elements. Remove the allValues prop.',
        );
      }
    }
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
    const effectiveValues = this._effectiveAllValues;
    const allValuesSet = new Set(effectiveValues);

    let targetValues: string[];

    if (parentState === 'checked') {
      // Uncheck all: keep values not in allValues
      targetValues = Array.from(current).filter((v) => !allValuesSet.has(v));
    } else {
      // Check all: union of current values and allValues
      const merged = new Set([...current, ...effectiveValues]);
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
    const effectiveValues = this._effectiveAllValues;

    if (effectiveValues.length === 0) {
      return 'unchecked';
    }

    const checkedCount = effectiveValues.filter((v) => this.checkedValues.has(v)).length;

    if (checkedCount === 0) {
      return 'unchecked';
    }

    if (checkedCount === effectiveValues.length) {
      return 'checked';
    }

    return 'indeterminate';
  }
}
