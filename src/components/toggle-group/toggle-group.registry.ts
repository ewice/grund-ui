import { OrderedRegistry } from '../../utils/ordered-registry';

import type { ToggleGroupRecord } from './types';

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
