import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { accordionItemContext } from '../context/accordion.context.js';

import type { AccordionItemContext } from '../context/accordion.context.js';

/**
 * Collapsible content region of an accordion item.
 *
 * @element grund-accordion-panel
 * @slot - Panel content
 * @csspart panel - The panel container
 */
export class GrundAccordionPanel extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  @property({ type: Boolean, attribute: 'keep-mounted' }) keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) hiddenUntilFound = false;

  @consume({ context: accordionItemContext, subscribe: true })
  @state()
  private itemCtx?: AccordionItemContext;

  private isPanelRegistered = false;

  private handleBeforematch = (): void => {
    this.itemCtx?.toggle();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('beforematch', this.handleBeforematch);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.itemCtx?.detachPanel(this);
    this.isPanelRegistered = false;
    this.removeEventListener('beforematch', this.handleBeforematch);
  }

  override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.itemCtx) {
        console.warn(
          '[grund-accordion-panel] Must be used inside <grund-accordion-item>. ' +
          'Wrap this element in <grund-accordion-item value="...">.',
        );
      }
    }

    if (this.itemCtx && !this.isPanelRegistered) {
      this.itemCtx.attachPanel(this);
      this.isPanelRegistered = true;
    }

    if (this.itemCtx) {
      const expanded = this.itemCtx.expanded;
      this.toggleAttribute('data-open', expanded);
      this.toggleAttribute('data-disabled', this.itemCtx.disabled);
      this.dataset.state = expanded ? 'open' : 'closed';
      this.dataset.orientation = this.itemCtx.orientation;
      this.dataset.index = String(this.itemCtx.index);
    }
  }

  private get effectiveKeepMounted(): boolean {
    return this.keepMounted || (this.itemCtx?.keepMounted ?? false);
  }

  private get effectiveHiddenUntilFound(): boolean {
    return this.hiddenUntilFound || (this.itemCtx?.hiddenUntilFound ?? false);
  }

  override render() {
    const ctx = this.itemCtx;
    if (!ctx) return nothing;

    const expanded = ctx.expanded;

    // Not expanded: decide visibility strategy
    if (!expanded) {
      if (this.effectiveHiddenUntilFound) {
        return html`
          <div
            part="panel"
            id="${ctx.panelId}"
            role="region"
            aria-labelledby="${ctx.triggerId}"
            hidden="until-found"
          >
            <slot></slot>
          </div>
        `;
      }
      if (this.effectiveKeepMounted) {
        return html`
          <div
            part="panel"
            id="${ctx.panelId}"
            role="region"
            aria-labelledby="${ctx.triggerId}"
            hidden
          >
            <slot></slot>
          </div>
        `;
      }
      // Default: remove from DOM
      return nothing;
    }

    // Expanded
    return html`
      <div
        part="panel"
        id="${ctx.panelId}"
        role="region"
        aria-labelledby="${ctx.triggerId}"
      >
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-accordion-panel')) {
  customElements.define('grund-accordion-panel', GrundAccordionPanel);
}
