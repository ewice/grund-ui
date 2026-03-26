import type { ToggleGroupHostSnapshot } from '../types.js';

/**
 * Pure state and action resolution for the toggle group.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class ToggleGroupController {
  public pressedValues = new Set<string>();

  private isControlled = false;
  private isSeeded = false;
  private multiple = false;
  private disabled = false;

  public syncFromHost(snapshot: ToggleGroupHostSnapshot): void {
    this.multiple = snapshot.multiple;
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.value !== undefined;

    if (this.isControlled) {
      this.pressedValues = new Set(snapshot.value);
    } else if (!this.isSeeded && snapshot.defaultValue.length > 0) {
      this.pressedValues = new Set(snapshot.defaultValue);
      this.isSeeded = true;
    }
  }

  /** Returns the new value set, or null if the action was blocked. */
  public requestToggle(value: string, toggleDisabled: boolean): string[] | null {
    if (this.disabled || toggleDisabled) return null;

    const isCurrentlyPressed = this.pressedValues.has(value);
    let nextValues: Set<string>;

    if (isCurrentlyPressed) {
      nextValues = new Set(this.pressedValues);
      nextValues.delete(value);
    } else {
      nextValues = this.multiple
        ? new Set([...this.pressedValues, value])
        : new Set([value]);
    }

    if (!this.isControlled) {
      this.pressedValues = nextValues;
    }

    return Array.from(nextValues);
  }

  public isPressed(value: string): boolean {
    return this.pressedValues.has(value);
  }
}
