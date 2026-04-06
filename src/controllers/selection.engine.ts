/**
 * Snapshot of host properties passed to SelectionEngine.syncFromHost().
 * Normalised across all composite widgets — accordion, toggle-group, radio-group, etc.
 * @internal
 */
export interface SelectionSnapshot {
  /** Controlled value. `undefined` enables uncontrolled mode. */
  value: string[] | undefined;
  /**
   * Seed for uncontrolled mode. Applied once on first sync when non-empty.
   * Pass `undefined` or `[]` for no initial selection.
   */
  defaultValue: string[] | undefined;
  /** Allow multiple simultaneous selections. */
  multiple: boolean;
  /** Block all selection changes. */
  disabled: boolean;
}

/**
 * Pure selection-state machine shared across composite widgets.
 *
 * Manages a set of selected values with single/multiple mode,
 * controlled/uncontrolled behaviour, and disabled gating.
 * No DOM access, no Lit dependency — independently testable.
 *
 * Consumers (AccordionEngine, ToggleGroupEngine) wrap this with
 * domain-specific method names and delegate all state resolution here.
 * Add a new consumer here instead of duplicating the logic.
 *
 * @internal
 */
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
    } else if (
      !this.isSeeded &&
      snapshot.defaultValue != null &&
      snapshot.defaultValue.length > 0
    ) {
      this._selectedValues = new Set(snapshot.defaultValue);
      this.isSeeded = true;
    }
  }

  /** Returns the new selected-values array, or null if the action was blocked. */
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

  /** Returns the new selected-values array, or null if the action was blocked. */
  public requestSet(values: string[]): string[] | null {
    if (this.disabled) {
      return null;
    }

    const nextValues = new Set(values);

    if (!this.isControlled) {
      this._selectedValues = nextValues;
    }

    return Array.from(nextValues);
  }

  public isSelected(value: string): boolean {
    return this._selectedValues.has(value);
  }
}
