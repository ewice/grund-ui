import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Shared heading element that renders the correct `<h1>`–`<h6>` tag.
 * Zero visual styles (headless).
 *
 * @element grund-heading
 * @slot - The heading content
 * @csspart heading - The rendered heading element
 */
@customElement('grund-heading')
export class GrundHeading extends LitElement {
  /** Heading level rendered in the DOM (1–6). Defaults to 3. */
  @property({ type: Number }) public level: 1 | 2 | 3 | 4 | 5 | 6 = 3;

  public override render() {
    switch (this.level) {
      case 1:
        return html`<h1 part="heading"><slot></slot></h1>`;
      case 2:
        return html`<h2 part="heading"><slot></slot></h2>`;
      case 3:
        return html`<h3 part="heading"><slot></slot></h3>`;
      case 4:
        return html`<h4 part="heading"><slot></slot></h4>`;
      case 5:
        return html`<h5 part="heading"><slot></slot></h5>`;
      case 6:
        return html`<h6 part="heading"><slot></slot></h6>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-heading': GrundHeading;
  }
}
