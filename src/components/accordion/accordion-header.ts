import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { accordionHeaderStyles } from './accordion.styles';

/**
 * Semantic heading wrapper for an accordion item's trigger.
 * Renders the appropriate `<h1>`–`<h6>` element based on the `level` property.
 *
 * @element grund-accordion-header
 * @slot - The trigger element (typically `<grund-accordion-trigger>`)
 */
@customElement('grund-accordion-header')
export class GrundAccordionHeader extends LitElement {
  static override styles = accordionHeaderStyles;

  /** Heading level rendered in the DOM (1–6). Defaults to 3. */
  @property({ type: Number }) level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  override render() {
    switch (this.level) {
      case 1:
        return html`<h1 part="heading"><slot></slot></h1>`;
      case 2:
        return html`<h2 part="heading"><slot></slot></h2>`;
      case 4:
        return html`<h4 part="heading"><slot></slot></h4>`;
      case 5:
        return html`<h5 part="heading"><slot></slot></h5>`;
      case 6:
        return html`<h6 part="heading"><slot></slot></h6>`;
      default:
        return html`<h3 part="heading"><slot></slot></h3>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-header': GrundAccordionHeader;
  }
}
