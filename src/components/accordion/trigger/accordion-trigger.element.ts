import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { accordionItemContext } from '../context/accordion.context.js';

import type { AccordionItemContext } from '../context/accordion.context.js';

/**
 * Button that toggles an accordion panel open/closed.
 *
 * @element grund-accordion-trigger
 * @slot - Trigger label content
 * @csspart trigger - The inner button element
 */
export class GrundAccordionTrigger extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  @consume({ context: accordionItemContext, subscribe: true })
  @state()
  private itemCtx?: AccordionItemContext;

  override connectedCallback(): void {
    super.connectedCallback();
    // Defer registration to let context settle
    this.updateComplete.then(() => {
      this.itemCtx?.attachTrigger(this);
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.itemCtx?.detachTrigger(this);
  }

  override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.itemCtx) {
        console.warn(
          '[grund-accordion-trigger] Must be used inside <grund-accordion-item>. ' +
          'Wrap this element in <grund-accordion-item value="...">.',
        );
      }
    }

    if (this.itemCtx) {
      this.toggleAttribute('data-open', this.itemCtx.expanded);
      this.toggleAttribute('data-disabled', this.itemCtx.disabled);
      this.dataset.orientation = this.itemCtx.orientation;
      this.dataset.index = String(this.itemCtx.index);
    }
  }

  private handleClick(): void {
    if (this.itemCtx?.disabled) return;
    this.itemCtx?.toggle();
  }

  override render() {
    const ctx = this.itemCtx;
    return html`
      <button
        part="trigger"
        id="${ctx?.triggerId ?? ''}"
        aria-expanded="${ctx?.expanded ?? false}"
        aria-controls="${ctx?.panelId ?? ''}"
        aria-disabled="${ctx?.disabled ?? false}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-accordion-trigger')) {
  customElements.define('grund-accordion-trigger', GrundAccordionTrigger);
}
