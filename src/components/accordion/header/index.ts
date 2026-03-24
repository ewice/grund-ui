import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { accordionItemContext } from '../context/accordion.context.js';

import type { AccordionItemContext } from '../context/accordion.context.js';

/**
 * Heading wrapper for an accordion item trigger.
 *
 * @element grund-accordion-header
 * @slot - Trigger element
 */
export class GrundAccordionHeader extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  @property({ type: Number }) level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  @consume({ context: accordionItemContext, subscribe: true })
  @state()
  private itemCtx?: AccordionItemContext;

  override willUpdate(): void {
    this.setAttribute('role', 'heading');
    this.setAttribute('aria-level', String(this.level));

    if (import.meta.env.DEV) {
      if (!this.itemCtx) {
        console.warn(
          '[grund-accordion-header] Must be used inside <grund-accordion-item>. ' +
          'Wrap this element in <grund-accordion-item value="...">.',
        );
      }
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-accordion-header')) {
  customElements.define('grund-accordion-header', GrundAccordionHeader);
}
