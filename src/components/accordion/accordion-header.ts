import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { accordionHeaderStyles } from './accordion.styles';
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
