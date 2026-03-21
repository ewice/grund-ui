/// <reference types="vite/client" />
import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';
import {
  accordionContext,
  accordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from '../context';
import { generateId } from '../../../utils/id';
import { accordionItemStyles } from './accordion-item.styles';

/** Sentinel value indicating no consumer-provided value was set. */
const NO_VALUE = '';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import type { GrundAccordionPanel } from '../panel/accordion-panel';

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
  public value: string = NO_VALUE;

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  @provide({ context: accordionItemContext })
  protected itemCtx: AccordionItemContextValue = this.buildItemCtx();

  private registeredTriggerElement: GrundAccordionTrigger | null = null;
  private registeredPanelElement: GrundAccordionPanel | null = null;
  private registered = false;
  private hasSettled = false;
  private expanded = false;
  private expandedChanged = false;

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
      registerTrigger: (trigger: GrundAccordionTrigger) => {
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
      registerPanel: (panel: GrundAccordionPanel) => {
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

  public override connectedCallback() {
    super.connectedCallback();

    if (this.value === NO_VALUE) {
      this.value = generateId('accordion-item');
    }
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.accordionCtx?.unregisterItem(this);
    this.registered = false;
  }

  public override willUpdate(changedProperties: PropertyValues): void {
    this.syncRegistration(changedProperties);
    this.syncExpandedState();
    this.syncAttributes();
  }

  private syncRegistration(changedProperties: PropertyValues): void {
    const valueChanged = changedProperties.has('value');
    const disabledChanged = changedProperties.has('disabled');
    const syncStructure = this.registered && (valueChanged || disabledChanged);

    if (this.accordionCtx && valueChanged) {
      this.accordionCtx.renameExpandedValue(changedProperties.get('value') as string, this.value);
    }

    if (this.accordionCtx && syncStructure) {
      this.accordionCtx.unregisterItem(this);
      this.registered = false;
    }

    if (this.accordionCtx && !this.registered) {
      this.accordionCtx.registerItem(this);
      this.registered = true;
    }

    if (import.meta.env.DEV && !this.registered && !this.accordionCtx) {
      // eslint-disable-next-line no-console
      console.warn('[grund-ui] <grund-accordion-item> must be a descendant of <grund-accordion>.');
    }
  }

  private syncExpandedState(): void {
    const nextExpanded = this.accordionCtx?.expandedItems.has(this.value) ?? false;
    this.expandedChanged = nextExpanded !== this.expanded;
    this.expanded = nextExpanded;
    this.itemCtx = this.buildItemCtx();
  }

  private syncAttributes(): void {
    this.toggleAttribute('data-open', this.expanded);
    this.toggleAttribute('data-disabled', this.itemCtx.disabled);

    if (this.itemCtx.index >= 0) {
      this.dataset.index = String(this.itemCtx.index);
    } else {
      delete this.dataset.index;
    }
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
