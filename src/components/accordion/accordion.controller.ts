import type { ReactiveController, ReactiveControllerHost } from 'lit';


/** Toggle result returned by `toggle()` and `previewToggle()`. */
export interface ToggleResult {
  value: string;
  expanded: boolean;
}


/** Options for configuring an `AccordionController`. */
export interface AccordionControllerOptions {
  /** Whether one or multiple items can be open at a time. */
  type?: 'single' | 'multiple';
  /** Whether the open item can be closed by clicking it again (single mode only). */
  collapsible?: boolean;
  /** Returns true if the item with the given value should be treated as disabled. */
  isDisabled: (value: string) => boolean;
}


/**
 * Reactive controller that manages accordion expand/collapse state.
 * Handles single vs. multiple selection modes and collapsible behaviour.
 */
export class AccordionController implements ReactiveController {
  private host: ReactiveControllerHost;
  private type: 'single' | 'multiple';
  private collapsible: boolean;
  private isDisabledFn: (value: string) => boolean;
  private expandedItems = new Set<string>();

  /** The set of currently expanded item values (read-only view). */
  public get expandedValues(): ReadonlySet<string> {
    return this.expandedItems;
  }

  constructor(host: ReactiveControllerHost, options: AccordionControllerOptions) {
    this.host = host;
    this.type = options.type ?? 'single';
    this.collapsible = options.collapsible ?? false;
    this.isDisabledFn = options.isDisabled;
    this.host.addController(this);
  }

  /** Updates controller options; call this in the host's `willUpdate` to keep state in sync. */
  public updateOptions(options: { type?: 'single' | 'multiple'; collapsible?: boolean }): void {
    let changedType = false;

    if (options.type !== undefined) {
      this.type = options.type;
      changedType = true;
    }
    if (options.collapsible !== undefined) {
      this.collapsible = options.collapsible;
    }

    if (changedType) {
      this.expandedItems = this.normalizeExpanded(this.expandedItems);
    }
  }

  /** Replaces the internal expanded set. Used for controlled mode and initial value seeding. */
  public setExpanded(values: Set<string>): void {
    this.expandedItems = this.normalizeExpanded(values);
  }

  /**
   * Mutating toggle — updates internal state and returns the result.
   * Returns null if the item is disabled or the toggle is a no-op.
   * Used in uncontrolled mode.
   */
  public toggle(value: string): ToggleResult | null {
    if (this.isDisabledFn(value)) return null;

    if (this.type === 'single') {
      if (this.expandedItems.has(value)) {
        if (!this.collapsible) return null;
        this.expandedItems.delete(value);
        this.host.requestUpdate();
        return { value, expanded: false };
      }
      this.expandedItems.clear();
      this.expandedItems.add(value);
      this.host.requestUpdate();
      return { value, expanded: true };
    }

    // Multiple mode
    if (this.expandedItems.has(value)) {
      this.expandedItems.delete(value);
      this.host.requestUpdate();
      return { value, expanded: false };
    }
    this.expandedItems.add(value);
    this.host.requestUpdate();
    return { value, expanded: true };
  }

  /**
   * Non-mutating toggle — computes what WOULD happen without applying it.
   * Returns null if the item is disabled or the toggle would be a no-op.
   * Used in controlled mode to get the event detail without changing state.
   */
  public previewToggle(value: string): ToggleResult | null {
    if (this.isDisabledFn(value)) return null;

    if (this.type === 'single') {
      if (this.expandedItems.has(value)) {
        if (!this.collapsible) return null;
        return { value, expanded: false };
      }
      return { value, expanded: true };
    }

    // Multiple mode
    return { value, expanded: !this.expandedItems.has(value) };
  }

  /** Returns `true` if the item with the given value is currently expanded. */
  public isExpanded(value: string): boolean {
    return this.expandedItems.has(value);
  }

  public hostConnected(): void {}

  private normalizeExpanded(values: Iterable<string>): Set<string> {
    if (this.type === 'multiple') {
      return new Set(values);
    }

    const firstValue = values[Symbol.iterator]().next().value as string | undefined;
    return firstValue === undefined ? new Set() : new Set([firstValue]);
  }
}
