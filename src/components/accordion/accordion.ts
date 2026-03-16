import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { AccordionController } from './accordion.controller';
import { accordionContext, type AccordionContextValue } from './accordion.context';
import { RovingFocusController } from '../../controllers/roving-focus.controller';
import type { GrundAccordionItem } from './accordion-item';
import type { GrundAccordionTrigger } from './accordion-trigger';
import { accordionStyles } from './accordion.styles';

/**
 * Root accordion container. Manages expand/collapse state and provides
 * context to all descendant accordion elements.
 *
 * @element grund-accordion
 * @fires {CustomEvent<{value: string, expanded: boolean}>} grund-change - Fired when an item is expanded or collapsed
 * @fires {CustomEvent<{value: string[], itemValue: string, open: boolean}>} grund-value-change - Fired with the next expanded value array
 */
@customElement('grund-accordion')
export class GrundAccordion extends LitElement {
  public static override styles = accordionStyles;

  /** Controls whether one or multiple items can be open simultaneously. */
  @property({ type: String }) public type: 'single' | 'multiple' = 'single';

  /** Base UI-style alias for `type="multiple"`. */
  @property({ type: Boolean, reflect: true }) public multiple = false;

  /** Disables all items in the accordion. */
  @property({ type: Boolean }) public disabled = false;

  /** In single mode, allows the open item to be closed by clicking it again. */
  @property({ type: Boolean }) public collapsible = false;

  /** Controls which arrow keys move focus between triggers. */
  @property({ type: String, reflect: true })
  public orientation: 'vertical' | 'horizontal' = 'vertical';

  /** Whether roving focus wraps when the end of the list is reached. */
  @property({ type: Boolean, attribute: 'loop-focus' }) public loopFocus = true;

  /** Whether closed panels remain mounted by default. */
  @property({ type: Boolean, attribute: 'keep-mounted' }) public keepMounted = false;

  /** Whether closed panels use `hidden="until-found"` so page search can reveal them. */
  @property({ type: Boolean, attribute: 'hidden-until-found' }) public hiddenUntilFound = false;

  /**
   * The value of the initially expanded item (uncontrolled mode).
   * Use `.defaultValue` property binding for array values in multiple mode.
   */
  @property({ attribute: 'default-value' }) public defaultValue?: string | string[];

  /**
   * Controlled mode: the currently expanded item value(s).
   * When set (not `undefined`), the component enters controlled mode.
   * Property-only - no attribute reflection.
   */
  @property({ attribute: false }) public value?: string | string[];

  private registeredItems: Element[] = [];

  private isItemDisabled = (value: string): boolean => {
    if (this.disabled) return true;

    const item = this.registeredItems.find(
      (element) => (element as GrundAccordionItem).value === value,
    );

    return (item as GrundAccordionItem | undefined)?.disabled ?? false;
  };

  private controller = new AccordionController(this, {
    isDisabled: this.isItemDisabled,
  });

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
      .map((item) => (item as GrundAccordionItem).registeredTrigger)
      .filter((trigger): trigger is GrundAccordionTrigger => trigger != null);
  }

  private get selectionType(): 'single' | 'multiple' {
    return this.multiple ? 'multiple' : this.type;
  }

  @provide({ context: accordionContext })
  protected accordionCtx: AccordionContextValue = this.buildCtx();

  private registerItem = (item: Element) => {
    this.registeredItems.push(item);
    this.requestUpdate();
  };

  private unregisterItem = (item: Element) => {
    this.registeredItems = this.registeredItems.filter((registered) => registered !== item);
    this.requestUpdate();
  };

  private getItemIndex = (item: Element) => this.registeredItems.indexOf(item);

  private sortByDom = (a: Element, b: Element) => {
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  };

  private buildCtx(): AccordionContextValue {
    return {
      type: this.selectionType,
      orientation: this.orientation,
      loopFocus: this.loopFocus,
      disabled: this.disabled,
      collapsible: this.collapsible,
      keepMounted: this.keepMounted,
      hiddenUntilFound: this.hiddenUntilFound,
      expandedItems: this.controller.expandedValues,
      registerItem: this.registerItem,
      unregisterItem: this.unregisterItem,
      getItemIndex: this.getItemIndex,
      toggle: (value: string) => this.requestToggle(value),
      openItem: (value: string) => this.requestOpen(value),
    };
  }

  private defaultValueSeeded = false;

  public override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('multiple')) {
      const nextType = this.multiple ? 'multiple' : 'single';
      if (this.type !== nextType) {
        this.type = nextType;
      }
    } else if (changedProperties.has('type')) {
      const nextMultiple = this.type === 'multiple';
      if (this.multiple !== nextMultiple) {
        this.multiple = nextMultiple;
      }
    }

    this.registeredItems.sort(this.sortByDom);
    this.controller.updateOptions({
      type: this.selectionType,
      collapsible: this.collapsible,
    });

    if (this.value !== undefined) {
      this.controller.setExpanded(new Set(this.normalizeValues(this.value)));
    } else if (!this.defaultValueSeeded && this.defaultValue !== undefined) {
      this.controller.setExpanded(new Set(this.normalizeValues(this.defaultValue)));
      this.defaultValueSeeded = true;
    }

    this.dataset.orientation = this.orientation;
    this.toggleAttribute('data-disabled', this.disabled);
    this.accordionCtx = this.buildCtx();
  }

  public override render() {
    return html`<div @keydown=${this.rovingFocus.handleKeyDown}><slot></slot></div>`;
  }

  private normalizeValues(value: string | string[]): string[] {
    const values = Array.isArray(value) ? value : [value];
    return this.selectionType === 'multiple' ? values : values.slice(0, 1);
  }

  private requestToggle(value: string): void {
    const result = this.value !== undefined
      ? this.controller.previewToggle(value)
      : this.controller.toggle(value);

    if (!result) return;
    this.dispatchToggleEvents(result.value, result.expanded);
  }

  private requestOpen(value: string): void {
    if (this.controller.isExpanded(value)) return;

    const result = this.value !== undefined
      ? this.controller.previewToggle(value)
      : this.controller.toggle(value);

    if (!result || !result.expanded) return;
    this.dispatchToggleEvents(result.value, true);
  }

  private dispatchToggleEvents(value: string, expanded: boolean): void {
    this.dispatchEvent(
      new CustomEvent('grund-change', {
        detail: { value, expanded },
        bubbles: true,
        composed: false,
      }),
    );

    this.dispatchEvent(
      new CustomEvent('grund-value-change', {
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
    const nextValues = new Set(this.controller.expandedValues);

    if (expanded) {
      if (this.selectionType === 'single') {
        nextValues.clear();
      }
      nextValues.add(value);
    } else {
      nextValues.delete(value);
    }

    const orderedValues = this.registeredItems
      .map((item) => (item as GrundAccordionItem).value)
      .filter((itemValue) => nextValues.has(itemValue));

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
