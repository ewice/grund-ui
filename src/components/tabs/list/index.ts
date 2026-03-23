// STUB — full implementation in Task 7
import { LitElement, html, css } from 'lit';

export class GrundTabsList extends LitElement {
  static override styles = css`:host { display: block; }`;
  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-tabs-list')) {
  customElements.define('grund-tabs-list', GrundTabsList);
}
