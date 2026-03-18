import type { ReactiveController } from 'lit';
import {
  normalizeAccordionValues,
  resolveAccordionAction,
} from '../../utils/accordion/engine';
import { AccordionRegistry } from './accordion.registry';
import type { AccordionContextValue } from './context';
import type { GrundAccordionTrigger } from './accordion-trigger';
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
  public contextValue: AccordionContextValue;

  private readonly host: AccordionRootControllerHost;

  private expandedValues = new Set<string>();

  private latestHostSnapshot: AccordionHostSnapshot = DEFAULT_SNAPSHOT;

  private defaultValueSeeded = false;

  private readonly registry = new AccordionRegistry();

  public constructor(host: AccordionRootControllerHost) {
    this.host = host;
    this.host.addController(this);
    this.contextValue = this.createContextValue();
  }

  public get triggers(): GrundAccordionTrigger[] {
    return this.registry.getOrderedTriggers();
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
    this.contextValue = this.createContextValue();
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
    this.registry.registerItem(item);
    this.requestHostUpdate();
  }

  private unregisterItem(item: GrundAccordionItemLike): void {
    this.registry.unregisterItem(item);
    this.requestHostUpdate();
  }

  private attachTrigger(item: GrundAccordionItemLike, trigger: Element | null): void {
    this.registry.attachTrigger(item, trigger);
  }

  private attachPanel(item: GrundAccordionItemLike, panel: Element | null): void {
    this.registry.attachPanel(item, panel);
  }

  private getItemState(item: GrundAccordionItemLike): GrundAccordionItemSnapshot | undefined {
    this.registry.syncOrder();
    return this.registry.getItemState(item);
  }

  private getItemIndex(item: GrundAccordionItemLike): number {
    return this.getItemState(item)?.index ?? -1;
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

    this.registry.syncOrder();
    const result = resolveAccordionAction({
      action: { type: action, value },
      expandedValues: [...this.expandedValues],
      itemOrder: this.registry.itemOrder,
      disabledValues: this.registry.disabledValues,
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
    this.host.dispatchEvent(event);
  }

  private requestHostUpdate(): void {
    this.host.requestUpdate();
  }
}

interface AccordionRootControllerHost {
  addController(controller: ReactiveController): void;
  requestUpdate(): void;
  dispatchEvent(event: Event): boolean;
}
