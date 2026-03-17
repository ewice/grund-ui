import type {
  GrundAccordionItemLike,
  GrundAccordionItemSnapshot,
} from './types';


interface AccordionItemRecord {
  item: GrundAccordionItemLike;
  value: string;
  disabled: boolean;
  index: number;
  trigger: Element | null;
  panel: Element | null;
}


/**
 * Maintains ordered accordion item records.
 *
 * The registry owns structural relationships; consumers only receive snapshots.
 */
export class AccordionRegistry {
  private records: AccordionItemRecord[] = [];

  private recordByItem = new Map<GrundAccordionItemLike, AccordionItemRecord>();

  public registerItem(item: GrundAccordionItemLike): void {
    const existing = this.recordByItem.get(item);
    if (existing) {
      this.syncOrder();
      return;
    }

    const record = this.createRecord(item);
    this.records = this.reconcileRecords([...this.records, record]);
    this.recordByItem.set(item, record);
  }

  public unregisterItem(item: GrundAccordionItemLike): void {
    const record = this.recordByItem.get(item);
    if (!record) {
      return;
    }

    this.recordByItem.delete(item);
    this.records = this.reconcileRecords(this.records.filter((current) => current !== record));
  }

  public attachTrigger(item: GrundAccordionItemLike, trigger: Element | null): void {
    const record = this.recordByItem.get(item);
    if (!record) {
      return;
    }

    record.trigger = trigger;
  }

  public detachTrigger(item: GrundAccordionItemLike): void {
    this.attachTrigger(item, null);
  }

  public attachPanel(item: GrundAccordionItemLike, panel: Element | null): void {
    const record = this.recordByItem.get(item);
    if (!record) {
      return;
    }

    record.panel = panel;
  }

  public detachPanel(item: GrundAccordionItemLike): void {
    this.attachPanel(item, null);
  }

  public syncOrder(): void {
    this.records = this.reconcileRecords(this.records);
  }

  public get itemOrder(): string[] {
    return this.records.map((record) => record.value);
  }

  public get disabledValues(): ReadonlySet<string> {
    return new Set(
      this.records
        .filter((record) => record.disabled)
        .map((record) => record.value),
    );
  }

  public getItemState(item: GrundAccordionItemLike): GrundAccordionItemSnapshot | undefined {
    const record = this.recordByItem.get(item);
    if (!record) {
      return undefined;
    }

    return this.snapshot(record);
  }

  private createRecord(item: GrundAccordionItemLike): AccordionItemRecord {
    return {
      item,
      value: item.value,
      disabled: item.disabled ?? false,
      index: -1,
      trigger: null,
      panel: null,
    };
  }

  private reconcileRecords(records: AccordionItemRecord[]): AccordionItemRecord[] {
    const previousOrder = new Map(records.map((record, index) => [record, index]));
    const orderedRecords = [...records].sort((left, right) => {
      const position = left.item.compareDocumentPosition(right.item);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return (previousOrder.get(left) ?? 0) - (previousOrder.get(right) ?? 0);
    });

    const seenValues = new Set<string>();
    for (const record of orderedRecords) {
      const value = record.item.value;
      if (seenValues.has(value)) {
        throw new Error(`Duplicate accordion item value "${value}" is not allowed.`);
      }
      seenValues.add(value);
    }

    orderedRecords.forEach((record, index) => {
      this.syncRecord(record);
      record.index = index;
    });
    return orderedRecords;
  }

  private syncRecord(record: AccordionItemRecord): void {
    record.value = record.item.value;
    record.disabled = record.item.disabled ?? false;
  }

  private snapshot(record: AccordionItemRecord): GrundAccordionItemSnapshot {
    return {
      value: record.value,
      index: record.index,
      disabled: record.disabled,
      trigger: record.trigger,
      panel: record.panel,
    };
  }
}
