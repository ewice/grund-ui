import type { CollapsibleHostSnapshot } from './types';

/**
 * Pure state and action resolution for the collapsible.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class CollapsibleEngine {
  private _isOpen = false;
  private isControlled = false;
  private isSeeded = false;
  private disabled = false;

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public syncFromHost(snapshot: CollapsibleHostSnapshot): void {
    this.disabled = snapshot.disabled;
    this.isControlled = snapshot.open !== undefined;

    if (this.isControlled) {
      this._isOpen = snapshot.open!;
    } else if (!this.isSeeded) {
      this.isSeeded = true;
      this._isOpen = snapshot.defaultOpen;
    }
  }

  /**
   * Returns the requested open state, or `null` if disabled.
   * In uncontrolled mode, mutates internal state.
   * In controlled mode, returns the requested state without mutating.
   */
  public requestOpen(options?: { ignoreDisabled?: boolean }): boolean | null {
    return this.requestSetOpen(true, options);
  }

  public requestClose(options?: { ignoreDisabled?: boolean }): boolean | null {
    return this.requestSetOpen(false, options);
  }

  public requestToggle(options?: { ignoreDisabled?: boolean }): boolean | null {
    return this.requestSetOpen(!this._isOpen, options);
  }

  private requestSetOpen(
    nextOpen: boolean,
    options: { ignoreDisabled?: boolean } = {},
  ): boolean | null {
    if (this.disabled && !options.ignoreDisabled) {
      return null;
    }

    if (!this.isControlled) {
      this._isOpen = nextOpen;
    }

    return nextOpen;
  }
}
