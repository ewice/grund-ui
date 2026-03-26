import type { AccordionHostSnapshot } from '../types.js';

export interface AccordionAction {
  type: 'toggle';
  itemValue: string;
  itemDisabled: boolean;
}

/**
 * Pure state and action resolution for the accordion.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class AccordionController {
  public expandedValues = new Set<string>();

  private isControlled = false;
  private isSeeded = false;
  private multiple = false;
  private disabled = false;

  public syncFromHost(snapshot: AccordionHostSnapshot): void {
    this.multiple = snapshot.multiple;
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.value !== undefined;

    if (this.isControlled) {
      this.expandedValues = new Set(snapshot.value);
    } else if (!this.isSeeded && snapshot.defaultValue !== undefined) {
      this.expandedValues = new Set(snapshot.defaultValue);
      this.isSeeded = true;
    }
  }

  public requestToggle(action: AccordionAction): string[] | null {
    if (this.disabled || action.itemDisabled) {
      return null;
    }

    const isCurrentlyExpanded = this.expandedValues.has(action.itemValue);
    let nextValues: Set<string>;

    if (isCurrentlyExpanded) {
      nextValues = new Set(this.expandedValues);
      nextValues.delete(action.itemValue);
    } else {
      if (this.multiple) {
        nextValues = new Set(this.expandedValues);
        nextValues.add(action.itemValue);
      } else {
        nextValues = new Set([action.itemValue]);
      }
    }

    if (!this.isControlled) {
      this.expandedValues = nextValues;
    }

    return Array.from(nextValues);
  }

  public isExpanded(itemValue: string): boolean {
    return this.expandedValues.has(itemValue);
  }
}
