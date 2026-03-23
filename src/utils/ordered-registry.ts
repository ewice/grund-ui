/** @internal */
export interface OrderedRecord {
  element: HTMLElement;
}

/**
 * Generic DOM-ordered list of records. Insertion order matches document order.
 * No Lit dependency, no framework dependency.
 * @internal
 */
export class OrderedRegistry<TRecord extends OrderedRecord> {
  private _entries: TRecord[] = [];

  get entries(): readonly TRecord[] {
    return [...this._entries];
  }

  insert(record: TRecord): void {
    const idx = this._entries.findIndex(
      (existing) =>
        existing.element.compareDocumentPosition(record.element) &
        Node.DOCUMENT_POSITION_PRECEDING,
    );
    if (idx === -1) {
      this._entries.push(record);
    } else {
      this._entries.splice(idx, 0, record);
    }
  }

  remove(predicate: (record: TRecord) => boolean): void {
    this._entries = this._entries.filter((r) => !predicate(r));
  }

  find(predicate: (record: TRecord) => boolean): TRecord | undefined {
    return this._entries.find(predicate);
  }

  findIndex(predicate: (record: TRecord) => boolean): number {
    return this._entries.findIndex(predicate);
  }
}
