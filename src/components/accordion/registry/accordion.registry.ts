export interface AccordionItemRecord {
  item: HTMLElement;
  value: string;
  trigger: HTMLElement | null;
  panel: HTMLElement | null;
}

/**
 * Ordered child tracking and trigger↔panel linking for accordion items.
 * No Lit dependency — pure DOM-order registry.
 * @internal
 */
export class AccordionRegistry {
  private records: AccordionItemRecord[] = [];

  get items(): AccordionItemRecord[] {
    return this.records;
  }

  registerItem(item: HTMLElement, value: string): void {
    // Insert in DOM order using compareDocumentPosition
    const record: AccordionItemRecord = { item, value, trigger: null, panel: null };
    const insertIndex = this.records.findIndex(
      (existing) =>
        existing.item.compareDocumentPosition(item) &
        Node.DOCUMENT_POSITION_PRECEDING,
    );
    if (insertIndex === -1) {
      this.records.push(record);
    } else {
      this.records.splice(insertIndex, 0, record);
    }
  }

  unregisterItem(item: HTMLElement): void {
    this.records = this.records.filter((r) => r.item !== item);
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
    return this.records.find((r) => r.item === item);
  }

  indexOf(item: HTMLElement): number {
    return this.records.findIndex((r) => r.item === item);
  }
}
