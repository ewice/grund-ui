import { LitElement, html } from 'lit';
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
 * and provides per-item context (value, disabled, expanded, IDs) to children.
 *
 * @element grund-accordion-item
 * @slot - The accordion header and panel
 */
@customElement('grund-accordion-item')
export class GrundAccordionItem extends LitElement {
  static override styles = accordionItemStyles;

  /** Unique value identifying this item. Auto-generated if not provided. */
  @property() value: string = generateId('accordion-item');

  /** Disables this item, preventing it from being expanded or collapsed. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Reflects the current expanded state as an HTML attribute for CSS selectors. */
  @property({ type: Boolean, reflect: true }) expanded = false;

  private triggerId = generateId('trigger');
  private panelId = generateId('panel');

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  @provide({ context: accordionItemContext })
  itemCtx: AccordionItemContextValue = this._buildItemCtx();

  private _buildItemCtx(): AccordionItemContextValue {
    return {
      value: this.value,
      disabled: this.disabled || (this.accordionCtx?.disabled ?? false),
      expanded: this.accordionCtx?.expandedItems.has(this.value) ?? false,
      triggerId: this.triggerId,
      panelId: this.panelId,
    };
  }

  override willUpdate() {
    this.expanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;
    this.itemCtx = this._buildItemCtx();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-item': GrundAccordionItem;
  }
}
