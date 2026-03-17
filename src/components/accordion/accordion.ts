import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import {
  type AccordionActionType,
  normalizeAccordionValues,
  resolveAccordionAction,
} from '../../utils/accordion/engine';
import { RovingFocusController } from '../../controllers/roving-focus.controller';
import {
  accordionContext,
  type AccordionContextValue,
} from './accordion.context';
import { AccordionRegistry } from './accordion.registry';
import type {
  GrundAccordionChangeDetail,
  GrundAccordionValueChangeDetail,
  GrundAccordionOrientation,
  GrundAccordionItemLike,
} from './types';
import type { GrundAccordionTrigger } from './accordion-trigger';
import { accordionStyles } from './accordion.styles';

declare module './accordion.context' {
  interface AccordionContextValue {
    expandedItems: ReadonlySet<string>;
    toggle: (value: string) => void;
    openItem: (value: string) => void;
    getItemIndex: (item: GrundAccordionItemLike) => number;
  }
}

interface AccordionContextBridge extends AccordionContextValue {
  expandedItems: ReadonlySet<string>;
  toggle: (value: string) => void;
  openItem: (value: string) => void;
  getItemIndex: (item: GrundAccordionItemLike) => number;
}

type AccordionRegisteredItem = GrundAccordionItemLike & {
  registeredTrigger: GrundAccordionTrigger | null;
};


/**
 * Root accordion container. Manages expand/collapse state and provides
 * context to all descendant elements.
 *
 * @element grund-accordion
 * @fires {CustomEvent<{value: string, expanded: boolean}>} grund-change - Fired when an item is expanded or collapsed
 * @fires {CustomEvent<{value: string[], itemValue: string, open: boolean}>} grund-value-change - Fired with the next expanded value array
 */
@customElement('grund-accordion')
export class GrundAccordion extends LitElement {
  public static override styles = accordionStyles;

  /** Permits multiple items to be open simultaneously. */
  @property({ type: Boolean, reflect: true })
  public multiple = false;

  /** Disables all items in the accordion. */
  @property({ type: Boolean })
  public disabled = false;

  /** Controls which arrow keys move focus between triggers. */
  @property({ type: String, reflect: true })
  public orientation: GrundAccordionOrientation = 'vertical';

  /** Whether roving focus wraps when the end of the list is reached. */
  @property({ type: Boolean, attribute: 'loop-focus' })
  public loopFocus = true;

  /** Whether closed panels remain mounted by default. */
  @property({ type: Boolean, attribute: 'keep-mounted' })
  public keepMounted = false;

  /** Whether closed panels use `hidden="until-found"` so page search can reveal them. */
  @property({ type: Boolean, attribute: 'hidden-until-found' })
  public hiddenUntilFound = false;

  /** The initially expanded item value(s) in uncontrolled mode. */
  @property({ attribute: 'default-value' })
  public defaultValue?: string | string[];

  /** The currently expanded item value(s) in controlled mode. */
  @property({ attribute: false })
  public value?: string | string[];

  private registry = new AccordionRegistry();

  private registeredItems: AccordionRegisteredItem[] = [];

  private expandedValues = new Set<string>();

  private defaultValueSeeded = false;

  @provide({ context: accordionContext })
  protected accordionCtx: AccordionContextBridge = this.buildCtx();

  private rovingFocus = new RovingFocusController<GrundAccordionTrigger>(this, {
    getItems: () => this.registeredTriggers,
    getFocusTarget: (element) => element.triggerButton,
    isDisabled: (element) => element.disabled,
    orientation: () => this.orientation,
    loop: () => this.loopFocus,
  });

  /** Derives the ordered trigger list from registered items. */
  private get registeredTriggers(): GrundAccordionTrigger[] {
    return this.registeredItems
      .map((item) => item.registeredTrigger)
      .filter((trigger): trigger is GrundAccordionTrigger => trigger != null);
  }

  private get itemOrder(): string[] {
    return this.registry.itemOrder;
  }

  private get disabledValues(): ReadonlySet<string> {
    if (!this.disabled) {
      return this.registry.disabledValues;
    }

    return new Set(this.itemOrder);
  }

  private sortByDom = (left: GrundAccordionItemLike, right: GrundAccordionItemLike) => {
    const position = left.compareDocumentPosition(right);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  };

  private buildCtx(): AccordionContextBridge {
    return {
      orientation: this.orientation,
      loopFocus: this.loopFocus,
      disabled: this.disabled,
      keepMounted: this.keepMounted,
      hiddenUntilFound: this.hiddenUntilFound,
      requestToggle: (value: string) => this.requestToggle(value),
      requestOpen: (value: string) => this.requestOpen(value),
      registerItem: (item: GrundAccordionItemLike) => this.registerItem(item),
      unregisterItem: (item: GrundAccordionItemLike) => this.unregisterItem(item),
      attachTrigger: (item: GrundAccordionItemLike, trigger: Element | null) =>
        this.registry.attachTrigger(item, trigger),
      detachTrigger: (item: GrundAccordionItemLike) => this.registry.detachTrigger(item),
      attachPanel: (item: GrundAccordionItemLike, panel: Element | null) =>
        this.registry.attachPanel(item, panel),
      detachPanel: (item: GrundAccordionItemLike) => this.registry.detachPanel(item),
      getItemState: (item: GrundAccordionItemLike) => this.registry.getItemState(item),
      expandedItems: this.expandedValues,
      toggle: (value: string) => this.requestToggle(value),
      openItem: (value: string) => this.requestOpen(value),
      getItemIndex: (item: GrundAccordionItemLike) => this.registry.getItemState(item)?.index ?? -1,
    };
  }

  private registerItem = (item: GrundAccordionItemLike) => {
    this.registeredItems.push(item as AccordionRegisteredItem);
    this.registry.registerItem(item);
    this.requestUpdate();
  };

  private unregisterItem = (item: GrundAccordionItemLike) => {
    this.registeredItems = this.registeredItems.filter((registered) => registered !== item);
    this.registry.unregisterItem(item);
    this.requestUpdate();
  };

  public override willUpdate(_changedProperties: PropertyValues) {
    this.registeredItems.sort(this.sortByDom);
    this.registry.syncOrder();

    if (this.value !== undefined) {
      this.expandedValues = new Set(this.normalizeInputValues(this.value));
    } else if (!this.defaultValueSeeded && this.defaultValue !== undefined) {
      this.expandedValues = new Set(this.normalizeInputValues(this.defaultValue));
      this.defaultValueSeeded = true;
    } else {
      this.expandedValues = new Set(
        normalizeAccordionValues([...this.expandedValues], { multiple: this.multiple }),
      );
    }

    this.dataset.orientation = this.orientation;
    this.toggleAttribute('data-disabled', this.disabled);
    this.accordionCtx = this.buildCtx();
  }

  public override render() {
    return html`<div @keydown=${this.rovingFocus.handleKeyDown}><slot></slot></div>`;
  }

  private normalizeInputValues(value: string | string[]): string[] {
    const values = Array.isArray(value) ? value : [value];
    return normalizeAccordionValues(values, { multiple: this.multiple });
  }

  private applyAction(action: AccordionActionType, value: string): void {
    if (this.disabled) {
      return;
    }

    const result = resolveAccordionAction({
      action: { type: action, value },
      expandedValues: [...this.expandedValues],
      itemOrder: this.itemOrder,
      disabledValues: this.disabledValues,
      multiple: this.multiple,
    });

    if (!result.changed) {
      return;
    }

    if (this.value === undefined) {
      this.expandedValues = new Set(result.nextValues);
      this.requestUpdate();
    }

    this.dispatchToggleEvents(result.value, result.expanded);
  }

  private requestToggle(value: string): void {
    this.applyAction('toggle', value);
  }

  private requestOpen(value: string): void {
    this.applyAction('open', value);
  }

  private dispatchToggleEvents(value: string, expanded: boolean): void {
    this.dispatchEvent(
      new CustomEvent<GrundAccordionChangeDetail>('grund-change', {
        detail: { value, expanded },
        bubbles: true,
        composed: false,
      }),
    );

    this.dispatchEvent(
      new CustomEvent<GrundAccordionValueChangeDetail>('grund-value-change', {
        detail: {
          value: this.nextExpandedValues(value, expanded),
          itemValue: value,
          open: expanded,
        },
        bubbles: true,
        composed: false,
      }),
    );
  }

  private nextExpandedValues(value: string, expanded: boolean): string[] {
    const nextValues = new Set(this.expandedValues);

    if (expanded) {
      if (!this.multiple) {
        nextValues.clear();
      }
      nextValues.add(value);
    } else {
      nextValues.delete(value);
    }

    const orderedValues = this.itemOrder.filter((itemValue) => nextValues.has(itemValue));

    for (const itemValue of nextValues) {
      if (!orderedValues.includes(itemValue)) {
        orderedValues.push(itemValue);
      }
    }

    return orderedValues;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion': GrundAccordion;
  }
}
