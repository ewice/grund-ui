import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import {
  accordionItemContext,
  type AccordionItemContextValue,
} from '../../context/accordion.context';
import { accordionPanelStyles } from './accordion.styles';

/**
 * The collapsible content region of an accordion item.
 * Manages `hidden`, `role="region"`, and `aria-labelledby`.
 *
 * @element grund-accordion-panel
 * @slot - The panel content
 */
@customElement('grund-accordion-panel')
export class GrundAccordionPanel extends LitElement {
  static override styles = accordionPanelStyles;

  @consume({ context: accordionItemContext, subscribe: true })
  private itemCtx?: AccordionItemContextValue;

  override updated() {
    const expanded = this.itemCtx?.expanded ?? false;
    if (!expanded) {
      this.setAttribute('hidden', '');
    } else {
      this.removeAttribute('hidden');
    }
  }

  override render() {
    return html`
      <div
        part="panel"
        role="region"
        id=${this.itemCtx?.panelId ?? ''}
        aria-labelledby=${this.itemCtx?.triggerId ?? ''}
      >
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-panel': GrundAccordionPanel;
  }
}
