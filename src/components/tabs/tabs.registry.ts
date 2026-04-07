export interface TabsRecord {
  value: string;
  tab: WeakRef<HTMLElement> | null;
  panel: WeakRef<HTMLElement> | null;
  disabled: boolean;
}

export class TabsRegistry {
  private readonly records = new Map<string, TabsRecord>();

  public registerTab(value: string, tab: HTMLElement): void {
    const existing = this.records.get(value);
    if (existing) {
      existing.tab = new WeakRef(tab);
    } else {
      this.records.set(value, {
        value,
        tab: new WeakRef(tab),
        panel: null,
        disabled: false,
      });
    }
  }

  public unregisterTab(value: string): void {
    const record = this.records.get(value);

    if (!record) {
      return;
    }

    record.tab = null;

    if (record.panel === null) {
      this.records.delete(value);
    }
  }

  public registerPanel(value: string, panel: HTMLElement): void {
    const existing = this.records.get(value);
    if (existing) {
      existing.panel = new WeakRef(panel);
    } else {
      this.records.set(value, {
        value,
        tab: null,
        panel: new WeakRef(panel),
        disabled: false,
      });
    }
  }

  public unregisterPanel(value: string): void {
    const record = this.records.get(value);

    if (!record) {
      return;
    }

    record.panel = null;

    if (record.tab === null) {
      this.records.delete(value);
    }
  }

  public setDisabled(value: string, disabled: boolean): void {
    const record = this.records.get(value);
    if (record) {
      record.disabled = disabled;
    }
  }

  public getRecord(value: string): TabsRecord | undefined {
    return this.records.get(value);
  }

  public getOrderedValues(): string[] {
    const withTabs = Array.from(this.records.values()).filter((r) => r.tab?.deref() != null);

    withTabs.sort((a, b) => {
      const aTab = a.tab!.deref()!;
      const bTab = b.tab!.deref()!;
      const pos = aTab.compareDocumentPosition(bTab);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    return withTabs.map((r) => r.value);
  }

  public getDisabledValues(): Set<string> {
    const disabled = new Set<string>();
    for (const record of this.records.values()) {
      if (record.disabled) {
        disabled.add(record.value);
      }
    }
    return disabled;
  }

  public indexOf(value: string): number {
    return this.getOrderedValues().indexOf(value);
  }

  public getTabElement(value: string): HTMLElement | null {
    return this.records.get(value)?.tab?.deref() ?? null;
  }

  public getPanelElement(value: string): HTMLElement | null {
    return this.records.get(value)?.panel?.deref() ?? null;
  }
}
