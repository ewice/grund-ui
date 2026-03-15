import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Direction to move focus within a roving focus group. */
export type FocusDirection = 'next' | 'previous' | 'first' | 'last';

/**
 * Manages keyboard-driven focus movement within a container element.
 * Implements the roving focus pattern used by WAI-ARIA composites like
 * Accordion, Tabs, Menu, RadioGroup, and Listbox.
 *
 * @example
 * ```ts
 * class MyTrigger extends LitElement {
 *   rovingFocus = new RovingFocusController(this, {
 *     containerSelector: 'my-component',
 *     itemSelector: 'my-trigger',
 *     getFocusTarget: (el) => el.shadowRoot?.querySelector('button') ?? null,
 *     isDisabled: (el) => el.hasAttribute('disabled'),
 *   });
 * }
 * ```
 */
export class RovingFocusController implements ReactiveController {
  private host: ReactiveControllerHost & Element;
  private options: RovingFocusOptions;

  constructor(host: ReactiveControllerHost & Element, options: RovingFocusOptions) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  hostConnected() {}

  /**
   * Moves focus to the target item in the given direction within the container.
   * Disabled items are skipped. Navigation wraps at both ends.
   */
  moveFocus(direction: FocusDirection): void {
    const container = this.host.closest(this.options.containerSelector);
    if (!container) return;

    const allItems = Array.from(container.querySelectorAll(this.options.itemSelector)) as Element[];

    const enabledItems = allItems.filter((item) => !this.options.isDisabled(item));
    if (enabledItems.length === 0) return;

    const currentIndex = enabledItems.indexOf(this.host);
    const target = this._resolveTarget(enabledItems, currentIndex, direction);
    this.options.getFocusTarget(target)?.focus();
  }

  private _resolveTarget(
    items: Element[],
    currentIndex: number,
    direction: FocusDirection,
  ): Element {
    const len = items.length;
    switch (direction) {
      case 'next':
        return items[(currentIndex + 1) % len];
      case 'previous':
        return items[(currentIndex - 1 + len) % len];
      case 'first':
        return items[0];
      case 'last':
        return items[len - 1];
    }
  }
}

/** Configuration for a roving focus group. */
export interface RovingFocusOptions {
  /** CSS selector for the container element that owns this focus group. */
  containerSelector: string;
  /** CSS selector for individual focusable items within the container. */
  itemSelector: string;
  /** Returns the actual focusable element within an item (e.g. a shadow root button). */
  getFocusTarget: (item: Element) => HTMLElement | null;
  /** Returns true if the item should be skipped during keyboard navigation. */
  isDisabled: (item: Element) => boolean;
}
