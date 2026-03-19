import type { GrundAccordionItemLike, GrundAccordionItemSnapshot } from '../types';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import { AccordionItemRecord } from './types';
import { GrundAccordionPanel } from '../panel/accordion-panel';

export class AccordionRegistry {
  private records = new Map<string, AccordionItemRecord>();

  public registerItem(item: GrundAccordionItemLike): void {
    const value = item.value;

    if (this.records.has(value)) {
      throw new Error(`Duplicate accordion item value "${value}" is not allowed.`);
    }

    this.records.set(value, {
      item,
      disabled: item.disabled ?? false,
      trigger: null,
      panel: null,
    });
  }

  public unregisterItem(item: GrundAccordionItemLike): void {
    this.records.delete(item.value);
  }

  public attachTrigger(item: GrundAccordionItemLike, trigger: GrundAccordionTrigger | null): void {
    this.setRecordField(item, 'trigger', trigger);
  }

  public detachTrigger(item: GrundAccordionItemLike): void {
    this.setRecordField(item, 'trigger', null);
  }

  public attachPanel(item: GrundAccordionItemLike, panel: GrundAccordionPanel | null): void {
    this.setRecordField(item, 'panel', panel);
  }

  public detachPanel(item: GrundAccordionItemLike): void {
    this.setRecordField(item, 'panel', null);
  }

  private setRecordField<K extends 'trigger' | 'panel'>(
    item: GrundAccordionItemLike,
    field: K,
    value: AccordionItemRecord[K],
  ): void {
    const record = this.records.get(item.value);

    if (!record) {
      return;
    }

    if (record[field] === value) {
      return;
    }

    record[field] = value;
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

  public syncOrder(): void {
    for (const [key, record] of this.records.entries()) {
      record.disabled = record.item.disabled ?? false;

      if (key !== record.item.value) {
        this.records.delete(key);
        this.records.set(record.item.value, record);
      }
    }
  }

  public get itemOrder(): string[] {
    return this.orderedRecords.map((r) => r.item.value);
  }

  public get disabledValues(): ReadonlySet<string> {
    return new Set(
      [...this.records.values()].filter((r) => r.disabled).map((r) => r.item.value),
    );
  }

  public getItemState(item: GrundAccordionItemLike): GrundAccordionItemSnapshot | undefined {
    const ordered = this.orderedRecords;
    const index = ordered.findIndex((r) => r.item === item);

    if (index === -1) {
      return undefined;
    }

    return this.snapshot(ordered[index], index);
  }

  public getOrderedTriggers(): GrundAccordionTrigger[] {
    return this.orderedRecords
      .map((r) => r.trigger)
      .filter((t): t is GrundAccordionTrigger => t !== null);
  }

  private snapshot(record: AccordionItemRecord, index: number): GrundAccordionItemSnapshot {
    return {
      value: record.item.value,
      index,
      disabled: record.disabled,
      trigger: record.trigger,
      panel: record.panel,
    };
  }
}
