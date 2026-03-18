import type { ReactiveController, ReactiveControllerHost } from 'lit';
import {
  normalizeAccordionValues,
  resolveAccordionAction,
} from '../../utils/accordion/engine';
import type { AccordionContextValue } from './context';
import type {
  AccordionHostSnapshot,
  GrundAccordionChangeDetail,
  GrundAccordionItemLike,
  GrundAccordionItemSnapshot,
  GrundAccordionValueChangeDetail,
} from './types';

const DEFAULT_SNAPSHOT: AccordionHostSnapshot = {
  multiple: false,
  value: undefined,
  defaultValue: undefined,
  disabled: false,
  orientation: 'vertical',
  loopFocus: true,
  keepMounted: false,
  hiddenUntilFound: false,
};

export class AccordionRootController implements ReactiveController {
  public readonly contextValue: AccordionContextValue;

  private readonly host: ReactiveControllerHost;

  private expandedValues = new Set<string>();

  private latestHostSnapshot: AccordionHostSnapshot = DEFAULT_SNAPSHOT;

  private defaultValueSeeded = false;

  private records: GrundAccordionItemSnapshotRecord[] = [];

  private recordByItem = new Map<GrundAccordionItemLike, GrundAccordionItemSnapshotRecord>();

  public constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
    this.contextValue = this.createContextValue();
  }

  public syncFromHost(input: AccordionHostSnapshot): void {
    this.latestHostSnapshot = input;

    if (input.value !== undefined) {
      this.expandedValues = new Set(this.normalizeInputValues(input.value, input.multiple));
    } else if (!this.defaultValueSeeded && input.defaultValue !== undefined) {
      this.expandedValues = new Set(this.normalizeInputValues(input.defaultValue, input.multiple));
      this.defaultValueSeeded = true;
    } else {
      this.expandedValues = new Set(
        normalizeAccordionValues([...this.expandedValues], { multiple: input.multiple }),
      );
    }

    this.contextValue.orientation = input.orientation;
    this.contextValue.loopFocus = input.loopFocus;
    this.contextValue.disabled = input.disabled;
    this.contextValue.keepMounted = input.keepMounted;
    this.contextValue.hiddenUntilFound = input.hiddenUntilFound;
    this.contextValue.expandedItems = this.expandedValues;
  }

  public renameExpandedValue(previousValue: string, nextValue: string): void {
    if (previousValue === nextValue || !this.expandedValues.has(previousValue)) {
      return;
    }

    const renamedValues = [...this.expandedValues].map((value) =>
      value === previousValue ? nextValue : value,
    );

    this.expandedValues = new Set(
      normalizeAccordionValues(renamedValues, { multiple: this.latestHostSnapshot.multiple }),
    );
    this.contextValue.expandedItems = this.expandedValues;
  }

  private createContextValue(): AccordionContextValue {
    return {
      orientation: this.latestHostSnapshot.orientation,
      loopFocus: this.latestHostSnapshot.loopFocus,
      disabled: this.latestHostSnapshot.disabled,
      keepMounted: this.latestHostSnapshot.keepMounted,
      hiddenUntilFound: this.latestHostSnapshot.hiddenUntilFound,
      expandedItems: this.expandedValues,
      requestToggle: (value: string) => this.requestToggle(value),
      requestOpen: (value: string) => this.requestOpen(value),
      registerItem: (item: GrundAccordionItemLike) => this.registerItem(item),
      unregisterItem: (item: GrundAccordionItemLike) => this.unregisterItem(item),
      renameExpandedValue: (previousValue: string, nextValue: string) =>
        this.renameExpandedValue(previousValue, nextValue),
      attachTrigger: (item: GrundAccordionItemLike, trigger: Element | null) =>
        this.attachTrigger(item, trigger),
      detachTrigger: (item: GrundAccordionItemLike) => this.attachTrigger(item, null),
      attachPanel: (item: GrundAccordionItemLike, panel: Element | null) =>
        this.attachPanel(item, panel),
      detachPanel: (item: GrundAccordionItemLike) => this.attachPanel(item, null),
      getItemState: (item: GrundAccordionItemLike): GrundAccordionItemSnapshot | undefined =>
        this.getItemState(item),
      getItemIndex: (item: GrundAccordionItemLike) => this.getItemIndex(item),
      toggle: (value: string) => this.requestToggle(value),
      openItem: (value: string) => this.requestOpen(value),
    };
  }

  private normalizeInputValues(value: string | string[], multiple: boolean): string[] {
    const values = Array.isArray(value) ? value : [value];
    return normalizeAccordionValues(values, { multiple });
  }

  private registerItem(item: GrundAccordionItemLike): void {
    const existing = this.recordByItem.get(item);
    if (existing) {
      this.syncItemOrder();
      return;
    }

    const record: GrundAccordionItemSnapshotRecord = {
      item,
      value: item.value,
      index: -1,
      disabled: item.disabled ?? false,
      trigger: null,
      panel: null,
    };

    this.records = [...this.records, record];
    this.recordByItem.set(item, record);
    this.syncItemOrder();
  }

  private unregisterItem(item: GrundAccordionItemLike): void {
    const record = this.recordByItem.get(item);
    if (!record) {
      return;
    }

    this.recordByItem.delete(item);
    this.records = this.records.filter((current) => current !== record);
    this.syncItemOrder();
  }

  private attachTrigger(item: GrundAccordionItemLike, trigger: Element | null): void {
    const record = this.recordByItem.get(item);
    if (!record) {
      return;
    }

    record.trigger = trigger;
  }

  private attachPanel(item: GrundAccordionItemLike, panel: Element | null): void {
    const record = this.recordByItem.get(item);
    if (!record) {
      return;
    }

    record.panel = panel;
  }

  private getItemState(item: GrundAccordionItemLike): GrundAccordionItemSnapshot | undefined {
    const record = this.recordByItem.get(item);
    if (!record) {
      return undefined;
    }

    return this.snapshotRecord(record);
  }

  private getItemIndex(item: GrundAccordionItemLike): number {
    return this.recordByItem.get(item)?.index ?? -1;
  }

  private requestToggle(value: string): void {
    this.applyAction('toggle', value);
  }

  private requestOpen(value: string): void {
    this.applyAction('open', value);
  }

  private applyAction(action: 'toggle' | 'open', value: string): void {
    if (this.latestHostSnapshot.disabled) {
      return;
    }

    const result = resolveAccordionAction({
      action: { type: action, value },
      expandedValues: [...this.expandedValues],
      itemOrder: this.records.map((record) => record.value),
      disabledValues: new Set(
        this.records.filter((record) => record.disabled).map((record) => record.value),
      ),
      multiple: this.latestHostSnapshot.multiple,
    });

    if (!result.changed) {
      return;
    }

    if (this.latestHostSnapshot.value === undefined) {
      this.expandedValues = new Set(result.nextValues);
      this.contextValue.expandedItems = this.expandedValues;
      this.requestHostUpdate();
    }

    this.dispatchToggleEvents(result.value, result.expanded, result.nextValues);
  }

  private dispatchToggleEvents(value: string, expanded: boolean, nextValues: string[]): void {
    this.dispatchHostEvent(
      new CustomEvent<GrundAccordionChangeDetail>('grund-change', {
        detail: { value, expanded },
        bubbles: true,
        composed: false,
      }),
    );

    this.dispatchHostEvent(
      new CustomEvent<GrundAccordionValueChangeDetail>('grund-value-change', {
        detail: {
          value: nextValues,
          itemValue: value,
          open: expanded,
        },
        bubbles: true,
        composed: false,
      }),
    );
  }

  private dispatchHostEvent(event: Event): void {
    (this.host as AccordionControllerEventHost).dispatchEvent(event);
  }

  private requestHostUpdate(): void {
    (this.host as ReactiveControllerHost).requestUpdate();
  }

  private syncItemOrder(): void {
    const previousOrder = new Map(this.records.map((record, index) => [record, index]));
    this.records = [...this.records].sort((left, right) => {
      const position = left.item.compareDocumentPosition(right.item);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return (previousOrder.get(left) ?? 0) - (previousOrder.get(right) ?? 0);
    });

    this.records.forEach((record, index) => {
      record.value = record.item.value;
      record.disabled = record.item.disabled ?? false;
      record.index = index;
    });
  }

  private snapshotRecord(record: GrundAccordionItemSnapshotRecord): GrundAccordionItemSnapshot {
    return {
      value: record.value,
      index: record.index,
      disabled: record.disabled,
      trigger: record.trigger,
      panel: record.panel,
    };
  }
}

interface AccordionControllerEventHost extends ReactiveControllerHost {
  dispatchEvent(event: Event): boolean;
}

interface GrundAccordionItemSnapshotRecord extends GrundAccordionItemSnapshot {
  item: GrundAccordionItemLike;
  trigger: Element | null;
  panel: Element | null;
}
