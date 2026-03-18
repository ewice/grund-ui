import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { normalizeAccordionValues } from '../../utils/accordion/engine';
import type { AccordionContextValue } from './context';
import type {
  AccordionHostSnapshot,
  GrundAccordionItemLike,
  GrundAccordionItemSnapshot,
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
      registerItem: (_item: GrundAccordionItemLike) => {},
      unregisterItem: (_item: GrundAccordionItemLike) => {},
      renameExpandedValue: (previousValue: string, nextValue: string) =>
        this.renameExpandedValue(previousValue, nextValue),
      attachTrigger: (_item: GrundAccordionItemLike, _trigger: Element | null) => {},
      detachTrigger: (_item: GrundAccordionItemLike) => {},
      attachPanel: (_item: GrundAccordionItemLike, _panel: Element | null) => {},
      detachPanel: (_item: GrundAccordionItemLike) => {},
      getItemState: (_item: GrundAccordionItemLike): GrundAccordionItemSnapshot | undefined =>
        undefined,
      getItemIndex: (_item: GrundAccordionItemLike) => -1,
      toggle: (value: string) => this.requestToggle(value),
      openItem: (value: string) => this.requestOpen(value),
    };
  }

  private normalizeInputValues(value: string | string[], multiple: boolean): string[] {
    const values = Array.isArray(value) ? value : [value];
    return normalizeAccordionValues(values, { multiple });
  }

  private requestToggle(_value: string): void {}

  private requestOpen(_value: string): void {}
}
