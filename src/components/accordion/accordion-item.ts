import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';
import {
  accordionContext,
  accordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from './accordion.context';
import { generateId } from '../../utils/id';
import { accordionItemStyles } from './accordion.styles';

/**
 * A single item within an accordion. Groups a header/trigger with its panel
 * and provides per-item context to children.
 *
 * @element grund-accordion-item
 * @slot - The accordion header and panel
 */
@customElement('grund-accordion-item')
export class GrundAccordionItem extends LitElement {
  public static override styles = accordionItemStyles;

  /** Unique value identifying this item. */
  @property() public value: string = generateId('accordion-item');

  /** Disables this item, preventing it from being expanded or collapsed. */
  @property({ type: Boolean, reflect: true }) public disabled = false;

  /** Reflects the current expanded state as an HTML attribute for CSS selectors. */
  @property({ type: Boolean, reflect: true }) public expanded = false;

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  private registeredTriggerElement: Element | null = null;
  private registeredPanelElement: Element | null = null;
  private registered = false;
  private hasSettled = false;

  /** Base UI-style alias for the current expanded state. */
  public get open(): boolean {
    return this.expanded;
  }

  /** The currently registered trigger element. */
  public get registeredTrigger(): Element | null {
    return this.registeredTriggerElement;
  }

  /** The currently registered panel element. */
  public get registeredPanel(): Element | null {
    return this.registeredPanelElement;
  }

  private registerTrigger = (trigger: Element) => {
    this.registeredTriggerElement = trigger;
    this.requestUpdate();
  };

  private unregisterTrigger = () => {
    this.registeredTriggerElement = null;
    this.requestUpdate();
  };

  private registerPanel = (panel: Element) => {
    this.registeredPanelElement = panel;
    this.requestUpdate();
  };

  private unregisterPanel = () => {
    this.registeredPanelElement = null;
    this.requestUpdate();
  };

  @provide({ context: accordionItemContext })
  protected itemCtx: AccordionItemContextValue = this.buildItemCtx();

  private buildItemCtx(): AccordionItemContextValue {
    const index = this.accordionCtx?.getItemIndex(this) ?? -1;
    const resolvedDisabled = this.disabled || (this.accordionCtx?.disabled ?? false);
    const expanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;

    return {
      value: this.value,
      index,
      disabled: resolvedDisabled,
      expanded,
      orientation: this.accordionCtx?.orientation ?? 'vertical',
      keepMounted: this.accordionCtx?.keepMounted ?? false,
      hiddenUntilFound: this.accordionCtx?.hiddenUntilFound ?? false,
      open: () => this.accordionCtx?.openItem(this.value),
      registerTrigger: this.registerTrigger,
      unregisterTrigger: this.unregisterTrigger,
      registerPanel: this.registerPanel,
      unregisterPanel: this.unregisterPanel,
      registeredTrigger: this.registeredTriggerElement,
      registeredPanel: this.registeredPanelElement,
    };
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.accordionCtx?.unregisterItem(this);
    this.registered = false;
  }

  public override willUpdate() {
    if (this.accordionCtx && !this.registered) {
      this.accordionCtx.registerItem(this);
      this.registered = true;
    }

    this.expanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;
    this.itemCtx = this.buildItemCtx();

    this.toggleAttribute('data-open', this.expanded);
    this.toggleAttribute('data-disabled', this.itemCtx.disabled);

    if (this.itemCtx.index >= 0) {
      this.dataset.index = String(this.itemCtx.index);
    } else {
      delete this.dataset.index;
    }
  }

  public override updated(changedProperties: PropertyValues) {
    if (this.hasSettled && changedProperties.has('expanded')) {
      this.dispatchEvent(
        new CustomEvent('grund-open-change', {
          detail: {
            open: this.expanded,
            value: this.value,
            index: this.itemCtx.index,
          },
          bubbles: true,
          composed: false,
        }),
      );
    }

    this.hasSettled = true;
  }

  public override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-item': GrundAccordionItem;
  }
}
