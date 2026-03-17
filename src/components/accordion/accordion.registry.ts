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
      this.syncRecord(existing);
      this.syncOrder();
      return;
    }

    const record: AccordionItemRecord = {
      item,
      value: item.value,
      disabled: item.disabled ?? false,
      index: -1,
      trigger: null,
      panel: null,
    };
    this.recordByItem.set(item, record);
    this.records.push(record);
    this.syncOrder();
  }

  public unregisterItem(item: GrundAccordionItemLike): void {
    const record = this.recordByItem.get(item);
    if (!record) {
      return;
    }

    this.recordByItem.delete(item);
    this.records = this.records.filter((current) => current !== record);
    this.syncOrder();
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
    const previousOrder = new Map(this.records.map((record, index) => [record, index]));
    this.records.sort((left, right) => {
      const position = left.item.compareDocumentPosition(right.item);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return (previousOrder.get(left) ?? 0) - (previousOrder.get(right) ?? 0);
    });

    this.records.forEach((record, index) => {
      this.syncRecord(record);
      record.index = index;
    });
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
