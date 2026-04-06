import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ifDefined } from 'lit/directives/if-defined.js';

import { accordionItemContext } from './accordion.context';

import type { AccordionItemContext } from './accordion.context';

/**
 * Collapsible content region of an accordion item.
 *
 * @element grund-accordion-panel
 * @slot - Panel content
 * @csspart panel - The panel container
 */
export class GrundAccordionPanel extends LitElement {
  public static override styles = css`
    :host {
      display: block; /* block: this element is a block-level container */
    }
  `;

  @property({ type: Boolean, attribute: 'keep-mounted' }) public keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) public hiddenUntilFound = false;

  @consume({ context: accordionItemContext, subscribe: true })
  @state()
  private itemCtx?: AccordionItemContext;

  private isPanelRegistered = false;

  private handleBeforematch = (): void => {
    this.itemCtx?.toggle();
  };

  public override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('beforematch', this.handleBeforematch);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.itemCtx?.detachPanel(this);
    this.isPanelRegistered = false;
    this.removeEventListener('beforematch', this.handleBeforematch);
  }

  protected override willUpdate(): void {
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

  // TODO(aria-linking): Migrate aria-labelledby from legacy IDREF to Element Reference API
  // (ariaLabelledByElements on the panel div) once the item context exposes a getTriggerElement()
  // method. The current IDREF cannot resolve across shadow root boundaries (aria-linking.md).
  protected override render() {
    const ctx = this.itemCtx;
    if (!ctx) return nothing;

    if (!ctx.expanded) {
      if (!this.effectiveKeepMounted && !this.effectiveHiddenUntilFound) {
        return nothing;
      }
    }

    const hidden = ctx.expanded ? undefined : this.effectiveHiddenUntilFound ? 'until-found' : '';

    return html`
      <div
        part="panel"
        id="${ctx.panelId}"
        role="region"
        aria-labelledby="${ctx.triggerId}"
        hidden="${ifDefined(hidden)}"
      >
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-accordion-panel')) {
  customElements.define('grund-accordion-panel', GrundAccordionPanel);
}
