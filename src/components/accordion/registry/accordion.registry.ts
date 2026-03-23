import { OrderedRegistry } from '../../../utils/ordered-registry.js';
import type { OrderedRecord } from '../../../utils/ordered-registry.js';

export interface AccordionItemRecord extends OrderedRecord {
  item: HTMLElement;   // same reference as element — kept for API compatibility
  value: string;
  trigger: HTMLElement | null;
  panel: HTMLElement | null;
}

/**
 * Ordered child tracking and trigger↔panel linking for accordion items.
 * @internal
 */
export class AccordionRegistry extends OrderedRegistry<AccordionItemRecord> {
  /** Alias for `entries` — preserves existing public API. */
  get items(): readonly AccordionItemRecord[] {
    return this.entries;
  }

  registerItem(item: HTMLElement, value: string): void {
    this.insert({ element: item, item, value, trigger: null, panel: null });
  }

  unregisterItem(item: HTMLElement): void {
    this.remove((r) => r.item === item);
  }

  attachTrigger(item: HTMLElement, trigger: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.trigger = trigger;
  }

  attachPanel(item: HTMLElement, panel: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.panel = panel;
  }

  detachTrigger(item: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.trigger = null;
  }

  detachPanel(item: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.panel = null;
  }

  getRecord(item: HTMLElement): AccordionItemRecord | undefined {
    return this.find((r) => r.item === item);
  }

  indexOf(item: HTMLElement): number {
    return this.findIndex((r) => r.item === item);
  }
}
