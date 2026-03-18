import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ContextConsumer } from '@lit/context';
import { accordionItemContext, type AccordionItemContextValue } from './accordion.context';
import { AriaLinkController } from '../../controllers/aria-link.controller';
import type { GrundAccordionTrigger } from './accordion-trigger';
import { accordionPanelStyles } from './accordion.styles';

/**
 * The collapsible content region of an accordion item.
 * Uses `data-state` for visibility and `role="region"` for accessibility.
 *
 * @element grund-accordion-panel
 * @slot - The panel content
 * @csspart panel - The region element wrapping panel content
 */
@customElement('grund-accordion-panel')
export class GrundAccordionPanel extends LitElement {
  public static override styles = accordionPanelStyles;

  /** Whether this panel stays mounted while closed. */
  @property({ type: Boolean, attribute: 'keep-mounted' }) public keepMounted = false;

  /** Whether this panel uses `hidden="until-found"` while closed. */
  @property({ type: Boolean, attribute: 'hidden-until-found' }) public hiddenUntilFound = false;

  private itemCtx?: AccordionItemContextValue;

  // @ts-expect-error -- ContextConsumer is registered for side effects; TS cannot see that read
  private itemConsumer = new ContextConsumer(this, {
    context: accordionItemContext,
    callback: (ctx) => {
      if (this.itemCtx && this.itemCtx.value !== ctx.value) {
        this.itemCtx.unregisterPanel();
      }
      this.itemCtx = ctx;
      ctx.registerPanel(this);
      this.requestUpdate();
    },
    subscribe: true,
  });

  // @ts-expect-error -- controller registered for side effects; TS cannot see that read
  private ariaLink = new AriaLinkController(this, {
    source: () => this.shadowRoot?.querySelector('[part="panel"]') ?? null,
    target: () => {
      const trigger = this.itemCtx?.registeredTrigger as GrundAccordionTrigger | null;

      return trigger?.triggerButton ?? null;
    },
    type: 'labelledby',
  });

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.itemCtx?.unregisterPanel();
  }

  public override willUpdate() {
    const expanded = this.itemCtx?.expanded ?? false;
    const hiddenUntilFound = this.resolveHiddenUntilFound();

    this.toggleAttribute('data-open', expanded);
    this.toggleAttribute('data-disabled', this.itemCtx?.disabled ?? false);
    this.toggleAttribute('data-hidden-until-found', hiddenUntilFound);
    this.dataset.state = expanded ? 'open' : 'closed';
    this.dataset.orientation = this.itemCtx?.orientation ?? 'vertical';

    if ((this.itemCtx?.index ?? -1) >= 0) {
      this.dataset.index = String(this.itemCtx?.index);
    } else {
      delete this.dataset.index;
    }
  }

  public override render() {
    const expanded = this.itemCtx?.expanded ?? false;
    const hiddenUntilFound = this.resolveHiddenUntilFound();
    const keepMounted = hiddenUntilFound
      ? true
      : (this.keepMounted || (this.itemCtx?.keepMounted ?? false));

    if (!expanded && !keepMounted) {
      return nothing;
    }

    if (!expanded && hiddenUntilFound) {
      return html`
        <div
          part="panel"
          role="region"
          hidden="until-found"
          @beforematch=${this.handleBeforeMatch}
        >
          <slot></slot>
        </div>
      `;
    }

    return html`
      <div part="panel" role="region">
        <slot></slot>
      </div>
    `;
  }

  private resolveHiddenUntilFound(): boolean {
    return this.hiddenUntilFound || (this.itemCtx?.hiddenUntilFound ?? false);
  }

  private handleBeforeMatch = () => {
    this.itemCtx?.open();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-panel': GrundAccordionPanel;
  }
}
