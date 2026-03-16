import type { ReactiveController, ReactiveControllerHost } from 'lit';


/** Configuration for an ARIA element reflection link. */
export interface AriaLinkOptions {
  /** Returns the element that gets the ARIA property set. */
  source: () => Element | null;
  /** Returns the element that is referenced by the ARIA property. */
  target: () => Element | null;
  /** The ARIA relationship type to establish. */
  type: 'controls' | 'labelledby';
}


/**
 * Reactive controller that manages ARIA element reflection between two elements.
 * Links source to target via `ariaControlsElements` or `ariaLabelledByElements`.
 *
 * Re-evaluates on every host update. Only re-links when source or target changes.
 *
 * @example
 * ```ts
 * private ariaLink = new AriaLinkController(this, {
 *   source: () => this.triggerButton,
 *   target: () => this.itemCtx?.registeredPanel?.shadowRoot
 *     ?.querySelector('[part="panel"]') ?? null,
 *   type: 'controls',
 * });
 * ```
 */
export class AriaLinkController implements ReactiveController {
  private host: ReactiveControllerHost;
  private options: AriaLinkOptions;
  private linkedSource: Element | null = null;
  private linkedTarget: Element | null = null;

  constructor(host: ReactiveControllerHost, options: AriaLinkOptions) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  public hostUpdated(): void {
    const source = this.options.source();
    const target = this.options.target();

    if (!source || !target) {
      this.clearLink();
      return;
    }
    if (source === this.linkedSource && target === this.linkedTarget) return;

    this.clearLink();
    this.writeLink(source, target);

    this.linkedSource = source;
    this.linkedTarget = target;
  }

  public hostDisconnected(): void {
    this.clearLink();
  }

  private writeLink(source: Element, target: Element): void {
    if (this.options.type === 'controls') {
      // TODO: remove cast when ariaControlsElements lands in TS DOM lib
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (source as any).ariaControlsElements = [target];
      return;
    }

    // TODO: remove cast when ariaLabelledByElements lands in TS DOM lib
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (source as any).ariaLabelledByElements = [target];
  }

  private clearLink(): void {
    if (!this.linkedSource) return;

    if (this.options.type === 'controls') {
      // TODO: remove cast when ariaControlsElements lands in TS DOM lib
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.linkedSource as any).ariaControlsElements = [];
      this.linkedSource.removeAttribute('aria-controls');
    } else {
      // TODO: remove cast when ariaLabelledByElements lands in TS DOM lib
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.linkedSource as any).ariaLabelledByElements = [];
      this.linkedSource.removeAttribute('aria-labelledby');
    }

    this.linkedSource = null;
    this.linkedTarget = null;
  }
}
