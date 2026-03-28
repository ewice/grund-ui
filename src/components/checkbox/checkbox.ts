import { css, html, LitElement } from 'lit';

export class GrundCheckbox extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline; /* inline: checkbox is an inline control */
    }
  `;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-checkbox')) {
  customElements.define('grund-checkbox', GrundCheckbox);
}
