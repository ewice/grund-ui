import { OrderedRegistry } from '../../../utils/ordered-registry.js';
import type { OrderedRecord } from '../../../utils/ordered-registry.js';

export interface ToggleGroupRecord extends OrderedRecord {
  value: string;
}

/**
 * Ordered child tracking for registered `<grund-toggle>` elements.
 * @internal
 */
export class ToggleGroupRegistry extends OrderedRegistry<ToggleGroupRecord> {
  public get toggles(): readonly ToggleGroupRecord[] {
    return this.entries;
  }

  public register(toggle: HTMLElement, value: string): void {
    this.insert({ element: toggle, value });
  }

  public unregister(toggle: HTMLElement): void {
    this.remove((r) => r.element === toggle);
  }
}
