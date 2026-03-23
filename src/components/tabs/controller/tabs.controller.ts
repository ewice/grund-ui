/**
 * Snapshot of host properties passed to TabsController.syncFromHost().
 * @internal
 */
export interface TabsHostSnapshot {
  value: string | null | undefined;
  defaultValue: string | null;
  disabled: boolean;
}

/**
 * Pure activation state machine for tabs.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class TabsController {
  activeValue: string | null = null;

  private isControlled = false;
  private isSeeded = false;
  private disabled = false;

  syncFromHost(snapshot: TabsHostSnapshot): void {
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.value !== undefined;

    if (this.isControlled) {
      this.activeValue = snapshot.value ?? null;
    } else if (!this.isSeeded && snapshot.defaultValue !== null) {
      this.activeValue = snapshot.defaultValue;
      this.isSeeded = true;
    }
  }

  requestActivate(value: string, isDisabled: boolean): string | null {
    if (this.disabled || isDisabled) return null;
    if (value === this.activeValue) return null;

    if (!this.isControlled) {
      this.activeValue = value;
    }

    return value;
  }
}
