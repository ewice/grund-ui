import type { ReactiveController, ReactiveControllerHost } from 'lit';


/** Direction to move focus within a roving focus group. */
export type FocusDirection = 'next' | 'previous' | 'first' | 'last';


/** Configuration for a roving focus group. */
export interface RovingFocusOptions<T = unknown> {
  /** Returns the ordered list of all items in the group. */
  getItems: () => T[];
  /** Returns the focusable element within an item. */
  getFocusTarget: (item: T) => HTMLElement | null;
  /** Whether the item should be skipped during keyboard navigation. */
  isDisabled: (item: T) => boolean;
  /** Navigation orientation. Defaults to `'vertical'`. */
  orientation?: 'vertical' | 'horizontal' | (() => 'vertical' | 'horizontal');
  /** Whether focus wraps when the end of the list is reached. Defaults to `true`. */
  loop?: boolean | (() => boolean);
}


/**
 * Manages keyboard-driven focus movement within a container element.
 * Implements the roving tabindex pattern for WAI-ARIA composites such as
 * Accordion, Tabs, Menu, RadioGroup, and Listbox.
 *
 * Lives on the container element, not on individual items. Attach
 * `handleKeyDown` to the container's `@keydown` listener.
 */
export class RovingFocusController<T = unknown> implements ReactiveController {
  private host: ReactiveControllerHost;
  private options: RovingFocusOptions<T>;
  private _activeTarget: HTMLElement | null = null;

  constructor(host: ReactiveControllerHost, options: RovingFocusOptions<T>) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  public hostUpdated(): void {
    this.syncTabindex();
  }

  public hostDisconnected(): void {}

  /**
   * Handle keyboard navigation. Attach to a container: `@keydown=${this.rovingFocus.handleKeyDown}`.
   *
   * Calls `preventDefault()` for navigation keys. Does not call `stopPropagation()`.
   * Uses `e.composedPath()` to resolve the event origin across shadow boundaries.
   */
  public handleKeyDown = (e: KeyboardEvent): void => {
    const direction = this.mapKeyToDirection(e.key);
    if (!direction) return;

    const items = this.options.getItems();
    const enabledItems = items.filter((item) => !this.options.isDisabled(item));
    if (enabledItems.length === 0) return;

    const focusedElement = e.composedPath()[0] as Element;
    const currentIndex = enabledItems.findIndex(
      (item) => this.options.getFocusTarget(item) === focusedElement,
    );
    if (currentIndex === -1) return;

    e.preventDefault();

    const target = this.resolveTarget(enabledItems, currentIndex, direction);
    const currentFocusTarget = focusedElement as HTMLElement;
    const newFocusTarget = this.options.getFocusTarget(target);

    if (currentFocusTarget) {
      currentFocusTarget.tabIndex = -1;
    }
    if (newFocusTarget) {
      newFocusTarget.tabIndex = 0;
      newFocusTarget.focus();
      this._activeTarget = newFocusTarget;
    }
  };

  private syncTabindex(): void {
    const items = this.options.getItems();
    const enabledItems: T[] = [];

    for (const item of items) {
      const target = this.options.getFocusTarget(item);
      if (!target) continue;
      if (this.options.isDisabled(item)) {
        target.tabIndex = -1;
      } else {
        enabledItems.push(item);
        target.tabIndex = -1;
      }
    }

    if (enabledItems.length === 0) return;

    // Determine which target gets tabIndex=0.
    // Prefer the active target only when it currently has DOM focus and is still
    // in the enabled set. Otherwise fall back to the first enabled item so that
    // dynamic item changes (e.g. prepending a new item) are reflected correctly.
    const activeHasFocus = this._activeTarget !== null &&
      (document.activeElement === this._activeTarget ||
        document.activeElement?.shadowRoot?.activeElement === this._activeTarget);
    const activeIsEnabled = activeHasFocus &&
      enabledItems.some((item) => this.options.getFocusTarget(item) === this._activeTarget);

    const roving = activeIsEnabled
      ? this._activeTarget
      : this.options.getFocusTarget(enabledItems[0]);

    if (roving) {
      roving.tabIndex = 0;
      if (!activeIsEnabled) {
        this._activeTarget = roving;
      }
    }
  }

  private mapKeyToDirection(key: string): FocusDirection | null {
    const orientation = this.resolveOrientation();

    if (orientation === 'vertical') {
      if (key === 'ArrowDown') return 'next';
      if (key === 'ArrowUp') return 'previous';
    } else {
      if (key === 'ArrowRight') return 'next';
      if (key === 'ArrowLeft') return 'previous';
    }
    if (key === 'Home') return 'first';
    if (key === 'End') return 'last';
    return null;
  }

  private resolveTarget(items: T[], currentIndex: number, direction: FocusDirection): T {
    const len = items.length;
    const loop = this.resolveLoop();

    switch (direction) {
      case 'next':
        if (currentIndex === len - 1 && !loop) return items[currentIndex];
        return items[(currentIndex + 1) % len];
      case 'previous':
        if (currentIndex === 0 && !loop) return items[currentIndex];
        return items[(currentIndex - 1 + len) % len];
      case 'first': return items[0];
      case 'last': return items[len - 1];
    }
  }

  private resolveOrientation(): 'vertical' | 'horizontal' {
    const { orientation } = this.options;
    return typeof orientation === 'function' ? orientation() : (orientation ?? 'vertical');
  }

  private resolveLoop(): boolean {
    const { loop } = this.options;
    return typeof loop === 'function' ? loop() : (loop ?? true);
  }
}
