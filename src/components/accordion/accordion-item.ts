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

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  private registeredTriggerElement: Element | null = null;
  private registeredPanelElement: Element | null = null;
  private registered = false;
  private hasSettled = false;
  private _expanded = false;
  private expandedChanged = false;
  private _lastValue = this.value;
  private _lastDisabled = this.disabled;

  /** Base UI-style alias for the current expanded state. */
  public get open(): boolean {
    return this._expanded;
  }

  /** The currently registered trigger element. */
  public get registeredTrigger(): Element | null {
    return this.registeredTriggerElement;
  }

  /** The currently registered panel element. */
  public get registeredPanel(): Element | null {
    return this.registeredPanelElement;
  }

  @provide({ context: accordionItemContext })
  protected itemCtx: AccordionItemContextValue = this.buildItemCtx();

  private buildItemCtx(): AccordionItemContextValue {
    const index = this.accordionCtx?.getItemIndex(this) ?? -1;
    const resolvedDisabled = this.disabled || (this.accordionCtx?.disabled ?? false);

    return {
      value: this.value,
      index,
      disabled: resolvedDisabled,
      expanded: this._expanded,
      orientation: this.accordionCtx?.orientation ?? 'vertical',
      keepMounted: this.accordionCtx?.keepMounted ?? false,
      hiddenUntilFound: this.accordionCtx?.hiddenUntilFound ?? false,
      open: () => this.accordionCtx?.requestOpen(this.value),
      registerTrigger: (trigger: Element) => {
        if (this.registeredTriggerElement === trigger) {
          return;
        }

        this.registeredTriggerElement = trigger;
        this.requestUpdate();
      },
      unregisterTrigger: () => {
        if (this.registeredTriggerElement == null) {
          return;
        }

        this.registeredTriggerElement = null;
        this.requestUpdate();
      },
      registerPanel: (panel: Element) => {
        if (this.registeredPanelElement === panel) {
          return;
        }

        this.registeredPanelElement = panel;
        this.requestUpdate();
      },
      unregisterPanel: () => {
        if (this.registeredPanelElement == null) {
          return;
        }

        this.registeredPanelElement = null;
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
    const syncStructure = this.registered && (
      this._lastValue !== this.value || this._lastDisabled !== this.disabled
    );

    if (this.accordionCtx && syncStructure) {
      this.accordionCtx.unregisterItem(this);
      this.registered = false;
    }

    if (this.accordionCtx && !this.registered) {
      this.accordionCtx.registerItem(this);
      this.registered = true;
    }

    const nextExpanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;
    this.expandedChanged = nextExpanded !== this._expanded;
    this._expanded = nextExpanded;
    this.itemCtx = this.buildItemCtx();

    this.toggleAttribute('expanded', this._expanded);
    this.toggleAttribute('data-open', this._expanded);
    this.toggleAttribute('data-disabled', this.itemCtx.disabled);

    if (this.itemCtx.index >= 0) {
      this.dataset.index = String(this.itemCtx.index);
    } else {
      delete this.dataset.index;
    }

    this._lastValue = this.value;
    this._lastDisabled = this.disabled;
  }

  public override updated() {
    if (this.hasSettled && this.expandedChanged) {
      this.dispatchEvent(
        new CustomEvent('grund-open-change', {
          detail: {
            open: this._expanded,
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
