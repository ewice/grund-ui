import { SelectionEngine } from '../../../controllers/selection.engine.js';

import type { AccordionHostSnapshot } from '../types.js';

/**
 * Pure state and action resolution for the accordion.
 * Delegates selection-state management to SelectionEngine.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class AccordionEngine {
  private readonly selection = new SelectionEngine();

  // Getter so callers always read the live Set without caching a stale reference.
  public get expandedValues(): ReadonlySet<string> {
    return this.selection.selectedValues;
  }

  public syncFromHost(snapshot: AccordionHostSnapshot): void {
    this.selection.syncFromHost({
      value: snapshot.value,
      defaultValue: snapshot.defaultValue,
      multiple: snapshot.multiple,
      disabled: snapshot.disabled,
    });
  }

  public requestToggle(itemValue: string, itemDisabled: boolean): string[] | null {
    return this.selection.requestToggle(itemValue, itemDisabled);
  }

  public isExpanded(itemValue: string): boolean {
    return this.selection.isSelected(itemValue);
  }

  public isEffectivelyDisabled(itemDisabled: boolean): boolean {
    return this.selection.isDisabled(itemDisabled);
  }
}
