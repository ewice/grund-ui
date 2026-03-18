import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import {
  accordionContext,
  accordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from '../context';
import { AriaLinkController } from '../../../controllers/aria-link.controller';
import { accordionTriggerStyles } from './accordion-trigger.styles';
import type { GrundAccordionPanel } from '../panel/accordion-panel';

/**
 * The interactive button that expands or collapses an accordion item.
 * Handles click events and exposes `aria-expanded`.
 *
 * @element grund-accordion-trigger
 * @slot - The trigger label content
 */
@customElement('grund-accordion-trigger')
export class GrundAccordionTrigger extends LitElement {
  public static override styles = accordionTriggerStyles;

  private accordionCtx?: AccordionContextValue;
  private itemCtx?: AccordionItemContextValue;

  // @ts-expect-error -- ContextConsumer is registered for side effects; TS cannot see that read
  private accordionConsumer = new ContextConsumer(this, {
    context: accordionContext,
    callback: (ctx) => {
      this.accordionCtx = ctx;
      this.requestUpdate();
    },
    subscribe: true,
  });

  // @ts-expect-error -- ContextConsumer is registered for side effects; TS cannot see that read
  private itemConsumer = new ContextConsumer(this, {
    context: accordionItemContext,
    callback: (ctx) => {
      if (this.itemCtx && this.itemCtx.value !== ctx.value) {
        this.itemCtx.unregisterTrigger();
      }
      this.itemCtx = ctx;
      ctx.registerTrigger(this);
      this.requestUpdate();
    },
    subscribe: true,
  });

  /** Whether this trigger's item is disabled (via item or parent accordion). */
  public get disabled(): boolean {
    return this.itemCtx?.disabled ?? false;
  }

  /** The inner button element. */
  public get triggerButton(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector('button') ?? null;
  }

  // @ts-expect-error -- controller registered for side effects; TS cannot see that read
  private ariaLink = new AriaLinkController(this, {
    source: () => this.triggerButton,
    target: () => {
      const panel = this.itemCtx?.registeredPanel as GrundAccordionPanel | null;

      return panel?.shadowRoot?.querySelector('[part="panel"]') ?? null;
    },
    type: 'controls',
  });

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.itemCtx?.unregisterTrigger();
  }

  private handleClick() {
    if (this.disabled) return;
    this.accordionCtx?.requestToggle(this.itemCtx?.value ?? '');
  }

  public override willUpdate() {
    const expanded = this.itemCtx?.expanded ?? false;
    this.toggleAttribute('data-panel-open', expanded);
    this.toggleAttribute('data-disabled', this.disabled);
    this.toggleAttribute('disabled', this.disabled);
  }

  public override render() {
    const expanded = this.itemCtx?.expanded ?? false;
    return html`
      <button
        part="trigger"
        aria-expanded=${expanded}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-trigger': GrundAccordionTrigger;
  }
}
