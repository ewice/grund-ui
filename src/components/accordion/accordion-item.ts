import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';
import {
  accordionContext,
  accordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from './context';
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

  /** Disables this item, preventing it from being expanded or collapsed. */
  @property({ type: Boolean, reflect: true })
  public disabled = false;

  /** Unique value identifying this item. */
  @property()
  public value: string = generateId('accordion-item');

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  @provide({ context: accordionItemContext })
  protected itemCtx: AccordionItemContextValue = this.buildItemCtx();

  private registeredTriggerElement: Element | null = null;
  private registeredPanelElement: Element | null = null;
  private registered = false;
  private hasSettled = false;
  private expanded = false;
  private expandedChanged = false;
  private lastValue = this.value;
  private lastDisabled = this.disabled;

  private buildItemCtx(): AccordionItemContextValue {
    const index = this.accordionCtx?.getItemIndex(this) ?? -1;
    const resolvedDisabled = this.disabled || (this.accordionCtx?.disabled ?? false);

    return {
      value: this.value,
      index,
      disabled: resolvedDisabled,
      expanded: this.expanded,
      orientation: this.accordionCtx?.orientation ?? 'vertical',
      keepMounted: this.accordionCtx?.keepMounted ?? false,
      hiddenUntilFound: this.accordionCtx?.hiddenUntilFound ?? false,
      open: () => this.accordionCtx?.requestOpen(this.value),
      registerTrigger: (trigger: Element) => {
        if (this.registeredTriggerElement === trigger) {
          return;
        }

        this.registeredTriggerElement = trigger;
        this.accordionCtx?.attachTrigger(this, trigger);
        this.requestUpdate();
      },
      unregisterTrigger: () => {
        if (this.registeredTriggerElement == null) {
          return;
        }

        this.registeredTriggerElement = null;
        this.accordionCtx?.detachTrigger(this);
        this.requestUpdate();
      },
      registerPanel: (panel: Element) => {
        if (this.registeredPanelElement === panel) {
          return;
        }

        this.registeredPanelElement = panel;
        this.accordionCtx?.attachPanel(this, panel);
        this.requestUpdate();
      },
      unregisterPanel: () => {
        if (this.registeredPanelElement == null) {
          return;
        }

        this.registeredPanelElement = null;
        this.accordionCtx?.detachPanel(this);
        this.requestUpdate();
      },
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
    const valueChanged = this.lastValue !== this.value;
    const syncStructure = this.registered && (valueChanged || this.lastDisabled !== this.disabled);

    if (this.accordionCtx && valueChanged) {
      this.accordionCtx.renameExpandedValue(this.lastValue, this.value);
    }

    if (this.accordionCtx && syncStructure) {
      this.accordionCtx.unregisterItem(this);
      this.registered = false;
    }

    if (this.accordionCtx && !this.registered) {
      this.accordionCtx.registerItem(this);
      this.registered = true;
    }

    if (this.accordionCtx) {
      if (this.registeredTriggerElement) {
        this.accordionCtx.attachTrigger(this, this.registeredTriggerElement);
      } else {
        this.accordionCtx.detachTrigger(this);
      }

      if (this.registeredPanelElement) {
        this.accordionCtx.attachPanel(this, this.registeredPanelElement);
      } else {
        this.accordionCtx.detachPanel(this);
      }
    }

    const nextExpanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;
    this.expandedChanged = nextExpanded !== this.expanded;
    this.expanded = nextExpanded;
    this.itemCtx = this.buildItemCtx();

    this.toggleAttribute('expanded', this.expanded);
    this.toggleAttribute('data-open', this.expanded);
    this.toggleAttribute('data-disabled', this.itemCtx.disabled);

    if (this.itemCtx.index >= 0) {
      this.dataset.index = String(this.itemCtx.index);
    } else {
      delete this.dataset.index;
    }

    this.lastValue = this.value;
    this.lastDisabled = this.disabled;
  }

  public override updated() {
    if (this.hasSettled && this.expandedChanged) {
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

    this.expandedChanged = false;
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
