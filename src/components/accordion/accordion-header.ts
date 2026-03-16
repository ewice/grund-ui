import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { accordionHeaderStyles } from './accordion.styles';
import { accordionItemContext, type AccordionItemContextValue } from './accordion.context';
import '../heading/heading.js';

/**
 * Semantic heading wrapper for an accordion item's trigger.
 * Composes `<grund-heading>` internally.
 *
 * @element grund-accordion-header
 * @slot - The trigger element (typically `<grund-accordion-trigger>`)
 */
@customElement('grund-accordion-header')
export class GrundAccordionHeader extends LitElement {
  public static override styles = accordionHeaderStyles;

  /** Heading level rendered in the DOM (1-6). Defaults to 3. */
  @property({ type: Number }) public level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  @consume({ context: accordionItemContext, subscribe: true })
  private itemCtx?: AccordionItemContextValue;

  public override willUpdate() {
    this.toggleAttribute('data-open', this.itemCtx?.expanded ?? false);
    this.toggleAttribute('data-disabled', this.itemCtx?.disabled ?? false);

    if ((this.itemCtx?.index ?? -1) >= 0) {
      this.dataset.index = String(this.itemCtx?.index);
    } else {
      delete this.dataset.index;
    }
  }

  public override render() {
    return html`<grund-heading .level=${this.level} exportparts="heading">
      <slot></slot>
    </grund-heading>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-header': GrundAccordionHeader;
  }
}
