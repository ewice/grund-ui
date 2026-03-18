import type { GrundAccordionItemLike, GrundAccordionItemSnapshot } from '../types';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import { AccordionItemRecord } from './types';

/**
 * Maintains ordered accordion item records.
 *
 * The registry owns structural relationships; consumers only receive snapshots.
 */
export class AccordionRegistry {
  private records = new Map<string, AccordionItemRecord>();

  public registerItem(item: GrundAccordionItemLike): void {
    const value = item.value;

    if (this.records.has(value)) {
      throw new Error(`Duplicate accordion item value "${value}" is not allowed.`);
    }

    this.records.set(value, {
      item,
      value,
      disabled: item.disabled ?? false,
      trigger: null,
      panel: null,
    });
  }

  public unregisterItem(item: GrundAccordionItemLike): void {
    this.records.delete(item.value);
  }

  public attachTrigger(item: GrundAccordionItemLike, trigger: Element | null): void {
    this.updateRecordTrigger(item, trigger);
  }

  public detachTrigger(item: GrundAccordionItemLike): void {
    this.updateRecordTrigger(item, null);
  }

  private updateRecordTrigger(item: GrundAccordionItemLike, trigger: Element | null): void {
    const record = this.records.get(item.value);

    if (!record) {
      return;
    }

    record.trigger = trigger;
  }

  public attachPanel(item: GrundAccordionItemLike, panel: Element | null): void {
    const record = this.records.get(item.value);
    
    if (!record) {
      return;
    }

    record.panel = panel;
  }

  public detachPanel(item: GrundAccordionItemLike): void {
    this.attachPanel(item, null);
  }

  public syncOrder(): void {
    for (const record of this.records.values()) {
      record.value = record.item.value;
      record.disabled = record.item.disabled ?? false;
    }
  }

  public get itemOrder(): string[] {
    return this.orderedRecords.map((record) => record.value);
  }

  public get disabledValues(): ReadonlySet<string> {
    return new Set(
      [...this.records.values()].filter((record) => record.disabled).map((record) => record.value),
    );
  }

  public getItemState(item: GrundAccordionItemLike): GrundAccordionItemSnapshot | undefined {
    const record = this.records.get(item);
    if (!record) {
      return undefined;
    }

    return this.snapshot(record);
  }

  public getOrderedTriggers(): GrundAccordionTrigger[] {
    this.syncOrder();
    return this.orderedRecords.flatMap((record) =>
      record.trigger == null ? [] : [record.trigger as GrundAccordionTrigger],
    );
  }

  private get orderedRecords(): AccordionItemRecord[] {
    return [...this.records.values()].toSorted((a, b) => {
      const position = a.item.compareDocumentPosition(b.item);

      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }

      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }

      return 0;
    });
  }

  private snapshot(record: AccordionItemRecord): GrundAccordionItemSnapshot {
    return {
      value: record.value,
      index: this.orderedRecords.indexOf(record),
      disabled: record.disabled,
      trigger: record.trigger,
      panel: record.panel,
    };
  }
}
