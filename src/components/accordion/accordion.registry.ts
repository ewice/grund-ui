import { OrderedRegistry } from '../../utils/ordered-registry';
import type { OrderedRecord } from '../../utils/ordered-registry';

export interface AccordionItemRecord extends OrderedRecord {
  item: HTMLElement; // same reference as element — kept for API compatibility
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
  public get items(): readonly AccordionItemRecord[] {
    return this.entries;
  }

  public registerItem(item: HTMLElement, value: string): void {
    this.insert({ element: item, item, value, trigger: null, panel: null });
  }

  public unregisterItem(item: HTMLElement): void {
    this.remove((r) => r.item === item);
  }

  public attachTrigger(item: HTMLElement, trigger: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.trigger = trigger;
  }

  public attachPanel(item: HTMLElement, panel: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.panel = panel;
  }

  public detachTrigger(item: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.trigger = null;
  }

  public detachPanel(item: HTMLElement): void {
    const record = this.getRecord(item);
    if (record) record.panel = null;
  }

  public getRecord(item: HTMLElement): AccordionItemRecord | undefined {
    return this.find((r) => r.item === item);
  }

  public indexOf(item: HTMLElement): number {
    return this.findIndex((r) => r.item === item);
  }
}
