import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { accordionItemContext, type AccordionItemContextValue } from '../context';
import { AriaLinkController } from '../../../controllers/aria-link.controller';
import { OpenStateController } from '../../../controllers/open-state.controller';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import { accordionPanelStyles } from './accordion-panel.styles';

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
  @property({ type: Boolean, attribute: 'keep-mounted' })
  public keepMounted = false;

  /** Whether this panel uses `hidden="until-found"` while closed. */
  @property({ type: Boolean, attribute: 'hidden-until-found' })
  public hiddenUntilFound = false;

  @consume({ context: accordionItemContext, subscribe: true })
  private itemCtx?: AccordionItemContextValue;

  constructor() {
    super();
    this.addController(
      new OpenStateController(this, {
        isOpen: () => this.itemCtx?.expanded ?? false,
      }),
    );
    this.addController(
      new AriaLinkController(this, {
        source: () => this.shadowRoot?.querySelector('[part="panel"]') ?? null,
        target: () => {
          const trigger = this.itemCtx?.registeredTrigger as GrundAccordionTrigger | null;

          return trigger?.triggerButton ?? null;
        },
        type: 'labelledby',
      }),
    );
  }

  private onItemContextChanged(prev?: AccordionItemContextValue): void {
    if (prev && prev.value !== this.itemCtx?.value) {
      prev.unregisterPanel();
    }
    this.itemCtx?.registerPanel(this);
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();
    this.itemCtx?.unregisterPanel();
  }

  public override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('itemCtx')) {
      this.onItemContextChanged(changedProperties.get('itemCtx'));
    }

    const expanded = this.itemCtx?.expanded ?? false;
    const hiddenUntilFound = this.resolveHiddenUntilFound();

    this.toggleAttribute('data-open', expanded);
    this.toggleAttribute('data-disabled', this.itemCtx?.disabled ?? false);
    this.toggleAttribute('data-hidden-until-found', hiddenUntilFound);
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
      : this.keepMounted || (this.itemCtx?.keepMounted ?? false);

    if (!expanded && !keepMounted) {
      return nothing;
    }

    if (!expanded && hiddenUntilFound) {
      return html`
        <div part="panel" role="region" hidden="until-found" @beforematch=${this.handleBeforeMatch}>
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
