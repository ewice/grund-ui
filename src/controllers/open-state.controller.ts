import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Configuration for open/closed state management. */
export interface OpenStateOptions {
  /** Returns whether the host should be in the open state. */
  isOpen: () => boolean;
}

/**
 * Reactive controller that manages `data-state` on the host element.
 * Sets `data-state="open"` or `data-state="closed"` based on the `isOpen` callback.
 *
 * @example
 * ```ts
 * private openState = new OpenStateController(this, {
 *   isOpen: () => this.itemCtx?.expanded ?? false,
 * });
 * ```
 */
export class OpenStateController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private options: OpenStateOptions;

  constructor(host: ReactiveControllerHost & HTMLElement, options: OpenStateOptions) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  public hostUpdated(): void {
    this.host.dataset.state = this.options.isOpen() ? 'open' : 'closed';
  }

  public hostDisconnected(): void {
    delete this.host.dataset.state;
  }
}
