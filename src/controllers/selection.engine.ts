export interface SelectionSnapshot {
  value: string[] | undefined;
  defaultValue: string[] | undefined;
  multiple: boolean;
  disabled: boolean;
}

export class SelectionEngine {
  private _selectedValues = new Set<string>();

  public get selectedValues(): ReadonlySet<string> {
    return this._selectedValues;
  }

  private isControlled = false;
  private isSeeded = false;
  private multiple = false;
  private disabled = false;

  public syncFromHost(snapshot: SelectionSnapshot): void {
    this.multiple = snapshot.multiple;
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.value !== undefined;

    if (this.isControlled) {
      this._selectedValues = new Set(snapshot.value);
    } else if (!this.isSeeded) {
      this.isSeeded = true;
      if (snapshot.defaultValue != null && snapshot.defaultValue.length > 0) {
        this._selectedValues = new Set(snapshot.defaultValue);
      }
    }
  }

  public requestToggle(value: string, itemDisabled: boolean): string[] | null {
    if (this.disabled || itemDisabled) {
      return null;
    }

    const wasSelected = this._selectedValues.has(value);
    let nextValues: Set<string>;

    if (wasSelected) {
      nextValues = new Set(this._selectedValues);
      nextValues.delete(value);
    } else {
      nextValues = this.multiple ? new Set([...this._selectedValues, value]) : new Set([value]);
    }

    if (!this.isControlled) {
      this._selectedValues = nextValues;
    }

    return Array.from(nextValues);
  }

  public requestSet(values: string[]): string[] | null {
    if (this.disabled) {
      return null;
    }

    const nextValues = new Set(values);

    if (
      nextValues.size === this._selectedValues.size &&
      [...nextValues].every((v) => this._selectedValues.has(v))
    ) {
      return null;
    }

    if (!this.isControlled) {
      this._selectedValues = nextValues;
    }

    return Array.from(nextValues);
  }

  public isSelected(value: string): boolean {
    return this._selectedValues.has(value);
  }
}
