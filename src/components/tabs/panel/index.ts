// STUB — full implementation in Task 9
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { tabsRootContext } from '../context/tabs.context.js';
import type { TabsRootContext } from '../context/tabs.context.js';

export class GrundTabsPanel extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property() value = '';
  @property({ type: Boolean, attribute: 'keep-mounted' }) keepMounted = false;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  private isRegistered = false;

  // id can be set in connectedCallback since it doesn't require ctx.
  override connectedCallback() {
    super.connectedCallback();
    this.id = `grund-tabs-panel-${this.value}`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.isRegistered) {
      this.ctx?.unregisterPanel(this.value);
      this.isRegistered = false;
    }
  }

  // Registration deferred to willUpdate — ctx not available in connectedCallback.
  override willUpdate() {
    if (this.ctx && !this.isRegistered) {
      this.ctx.registerPanel(this);
      this.isRegistered = true;
    }
  }

  override render() {
    const active = this.ctx?.activeValue === this.value;
    if (!active && !this.keepMounted) return nothing;
    return active
      ? html`<div part="panel" role="tabpanel" tabindex="0"><slot></slot></div>`
      : html`<div part="panel" hidden><slot></slot></div>`;
    // ariaLabelledByElements set in updated() in full implementation (Task 9)
  }
}

if (!customElements.get('grund-tabs-panel')) {
  customElements.define('grund-tabs-panel', GrundTabsPanel);
}
