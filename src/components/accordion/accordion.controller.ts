import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Options for configuring an `AccordionController`. */
export interface AccordionControllerOptions {
  /** Whether one or multiple items can be open at a time. */
  type?: 'single' | 'multiple';
  /** Whether the open item can be closed by clicking it again (single mode only). */
  collapsible?: boolean;
}

/**
 * Reactive controller that manages accordion expand/collapse state.
 * Handles single vs. multiple selection modes and collapsible behaviour.
 */
export class AccordionController implements ReactiveController {
  private host: ReactiveControllerHost;
  private type: 'single' | 'multiple';
  private collapsible: boolean;
  private disabledItems = new Set<string>();

  /** The set of currently expanded item values. */
  expandedItems = new Set<string>();

  constructor(host: ReactiveControllerHost, options: AccordionControllerOptions = {}) {
    this.host = host;
    this.type = options.type ?? 'single';
    this.collapsible = options.collapsible ?? false;
    this.host.addController(this);
  }

  hostConnected() {}

  /** Updates controller options; call this in the host's `willUpdate` to keep state in sync. */
  updateOptions(options: AccordionControllerOptions) {
    if (options.type !== undefined) this.type = options.type;
    if (options.collapsible !== undefined) this.collapsible = options.collapsible;
  }

  /** Replaces the set of item values that should be treated as disabled. */
  setDisabledItems(disabled: Set<string>) {
    this.disabledItems = disabled;
  }

  /**
   * Toggles the expanded state of the item with the given value.
   * Respects single/multiple mode and collapsible setting.
   * No-ops if the item is disabled.
   */
  toggle(value: string) {
    if (this.disabledItems.has(value)) return;

    if (this.type === 'single') {
      if (this.expandedItems.has(value)) {
        if (this.collapsible) {
          this.expandedItems.delete(value);
        }
      } else {
        this.expandedItems.clear();
        this.expandedItems.add(value);
      }
    } else {
      if (this.expandedItems.has(value)) {
        this.expandedItems.delete(value);
      } else {
        this.expandedItems.add(value);
      }
    }

    this.host.requestUpdate();
  }

  /** Returns `true` if the item with the given value is currently expanded. */
  isExpanded(value: string): boolean {
    return this.expandedItems.has(value);
  }
}
