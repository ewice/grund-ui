import type { GrundAccordionItemLike, GrundAccordionItemSnapshot } from '../types';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import type { AccordionItemRecord } from './types';
import type { GrundAccordionPanel } from '../panel/accordion-panel';


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
    const updated = new Map<string, AccordionItemRecord>();

    for (const record of this.records.values()) {
      record.disabled = record.item.disabled ?? false;
      updated.set(record.item.value, record);
    }

    this.records = updated;
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
