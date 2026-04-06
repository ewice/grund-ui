import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface RovingFocusOptions {
  orientation: 'vertical' | 'horizontal';
  loop: boolean;
  getItems: () => HTMLElement[];
}

/**
 * Keyboard-driven roving tabindex for composite widgets.
 * Arrow keys move focus within the widget. Tab exits.
 * @internal
 */
export class RovingFocusController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private options: RovingFocusOptions;
  private handleKeydown = this.onKeydown.bind(this);

  constructor(host: ReactiveControllerHost & HTMLElement, options: RovingFocusOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  public hostConnected(): void {
    this.host.addEventListener('keydown', this.handleKeydown);
    this.syncTabIndexes();
  }

  public hostDisconnected(): void {
    this.host.removeEventListener('keydown', this.handleKeydown);
  }

  public update(options: Partial<RovingFocusOptions>): void {
    const defined = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined));
    Object.assign(this.options, defined);
  }

  public sync(): void {
    this.syncTabIndexes();
  }

  private syncTabIndexes(): void {
    const items = this.options.getItems();
    if (items.length === 0) return;

    const currentIndex = items.findIndex((item) => item.tabIndex === 0);
    const activeIndex =
      currentIndex >= 0 ? currentIndex : items.findIndex((item) => !this.isDisabled(item));

    items.forEach((item, i) => {
      item.tabIndex = i === activeIndex ? 0 : -1;
    });
  }

  private onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    const items = this.options.getItems().filter((item) => !this.isDisabled(item));
    if (items.length === 0) return;

    const { key } = e;
    const { orientation, loop } = this.options;
    const isRtl = getComputedStyle(this.host).direction === 'rtl';

    let direction: 'next' | 'prev' | 'first' | 'last' | null = null;

    if (orientation === 'vertical') {
      if (key === 'ArrowDown') direction = 'next';
      else if (key === 'ArrowUp') direction = 'prev';
    } else {
      if (key === 'ArrowRight') direction = isRtl ? 'prev' : 'next';
      else if (key === 'ArrowLeft') direction = isRtl ? 'next' : 'prev';
    }

    if (key === 'Home') direction = 'first';
    else if (key === 'End') direction = 'last';

    if (!direction) return;

    e.preventDefault();

    const currentFocused = items.find(
      (item) => item === document.activeElement || item === e.composedPath()[0],
    );
    const currentIndex = currentFocused ? items.indexOf(currentFocused) : -1;

    let nextIndex: number;
    switch (direction) {
      case 'next':
        nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) nextIndex = loop ? 0 : items.length - 1;
        break;
      case 'prev':
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) nextIndex = loop ? items.length - 1 : 0;
        break;
      case 'first':
        nextIndex = 0;
        break;
      case 'last':
        nextIndex = items.length - 1;
        break;
    }

    const target = items[nextIndex];
    if (target) {
      const allItems = this.options.getItems();
      allItems.forEach((item) => {
        item.tabIndex = item === target ? 0 : -1;
      });
      target.focus();
    }
  }

  private isDisabled(item: HTMLElement): boolean {
    return item.hasAttribute('data-disabled') || item.ariaDisabled === 'true';
  }
}
