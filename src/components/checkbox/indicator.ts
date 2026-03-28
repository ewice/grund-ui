import { css, html, LitElement } from 'lit';

export class GrundCheckboxIndicator extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline; /* inline: indicator is an inline element */
    }
  `;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-checkbox-indicator')) {
  customElements.define('grund-checkbox-indicator', GrundCheckboxIndicator);
}
