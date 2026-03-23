// STUB — full implementation in Task 8
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { tabsRootContext } from '../context/tabs.context.js';
import type { TabsRootContext } from '../context/tabs.context.js';

export class GrundTab extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property() value = '';
  @property({ type: Boolean }) disabled = false;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  private isRegistered = false;

  // ctx is not available in connectedCallback — @consume fires after connectedCallback.
  // Registration is deferred to willUpdate, guarded by isRegistered, same pattern as
  // GrundAccordionItem.
  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.isRegistered) {
      this.ctx?.unregisterTab(this.value);
      this.isRegistered = false;
    }
  }

  override willUpdate() {
    // Set data-disabled before registering so firstNonDisabled() in the root
    // can read the correct disabled state during initial auto-selection.
    this.toggleAttribute('data-disabled', this.disabled);
    if (this.ctx && !this.isRegistered) {
      this.ctx.registerTab(this);
      this.isRegistered = true;
    }
    const active = this.ctx?.activeValue === this.value;
    this.toggleAttribute('data-selected', active);
    if (this.ctx) {
      this.dataset.index = String(this.ctx.getRegistry().indexOfValue(this.value));
    }
  }

  override render() {
    return html`<button part="tab" @click=${() => this.ctx?.activateTab(this.value)}>
      <slot></slot>
    </button>`;
  }
}

if (!customElements.get('grund-tab')) {
  customElements.define('grund-tab', GrundTab);
}
