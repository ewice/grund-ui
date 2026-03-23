import { OrderedRegistry } from '../../../utils/ordered-registry.js';
import type { OrderedRecord } from '../../../utils/ordered-registry.js';

export interface TabsRecord extends OrderedRecord {
  value: string;
  // element (inherited from OrderedRecord) IS the <grund-tab> host element.
  panel: HTMLElement | null;
}

/**
 * Value-keyed ordered registry for tabs and panels.
 * Supports any registration order — tab or panel may connect first.
 * @internal
 */
export class TabsRegistry extends OrderedRegistry<TabsRecord> {
  registerTab(tab: HTMLElement, value: string): void {
    const existing = this.getByValue(value);
    if (existing) {
      // Record exists (panel registered first) — remove stub and re-insert with correct element.
      this.remove((r) => r.value === value);
      this.insert({ ...existing, element: tab });
    } else {
      this.insert({ element: tab, value, panel: null });
    }
  }

  unregisterTab(value: string): void {
    this.remove((r) => r.value === value);
  }

  attachPanel(value: string, panel: HTMLElement): void {
    const existing = this.getByValue(value);
    if (existing) {
      existing.panel = panel;
    } else {
      // Tab not yet registered — create a stub record with a placeholder element.
      // The element will be replaced when registerTab is called.
      // Use panel element as temporary placeholder so insert doesn't throw.
      this.insert({ element: panel, value, panel });
    }
  }

  detachPanel(value: string): void {
    const record = this.getByValue(value);
    if (!record) return;
    if (record.element === record.panel) {
      // Stub record (panel registered before tab) — remove entirely rather than leaving zombie.
      this.remove((r) => r.value === value);
    } else {
      record.panel = null;
    }
  }

  getByValue(value: string): TabsRecord | undefined {
    return this.find((r) => r.value === value);
  }

  indexOfValue(value: string): number {
    return this.findIndex((r) => r.value === value);
  }

  firstNonDisabled(): TabsRecord | undefined {
    return this.find(
      (r) => !r.element.hasAttribute('data-disabled') && r.element !== r.panel,
    );
  }
}
