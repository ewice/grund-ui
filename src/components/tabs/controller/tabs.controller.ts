import type { TabsHostSnapshot } from '../types.js';

/**
 * Pure state and action resolution for tabs.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class TabsController {
  public activeValue: string | null = null;
  public previousValue: string | null = null;

  private isControlled = false;
  private isSeeded = false;
  private disabled = false;

  public syncFromHost(snapshot: TabsHostSnapshot): void {
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.value !== undefined;

    if (this.isControlled) {
      // snapshot.value is string | null when isControlled (undefined is excluded above)
      this.activeValue = snapshot.value ?? null;
    } else if (!this.isSeeded && snapshot.defaultValue !== null) {
      this.activeValue = snapshot.defaultValue;
      this.isSeeded = true;
    }
  }

  /**
   * Seeds the initial active value without going through the disabled check.
   * Used by the root's registerTab callback for first-render auto-selection —
   * disabled blocks user interaction, not initial state seeding.
   * @internal
   */
  public seed(value: string): void {
    this.previousValue = null;
    this.activeValue = value;
    this.isSeeded = true;
  }

  public requestActivation(value: string): string | null {
    if (this.disabled) {
      return null;
    }

    if (!this.isControlled) {
      this.previousValue = this.activeValue;
      this.activeValue = value;
    }

    return value;
  }

  public isActive(value: string): boolean {
    return this.activeValue === value;
  }
}
