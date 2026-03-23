import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { tabsRootContext } from '../context/tabs.context.js';
import type { TabsRootContext } from '../context/tabs.context.js';

/**
 * Content panel associated with a tab by matching value.
 *
 * @element grund-tabs-panel
 * @slot - Panel content
 * @csspart panel - The tabpanel container
 */
export class GrundTabsPanel extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property() value = '';
  @property({ type: Boolean, attribute: 'keep-mounted' }) keepMounted = false;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  private isRegistered = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (import.meta.env.DEV) {
      if (!this.closest('grund-tabs')) {
        console.warn('[grund-tabs-panel] Must be a child of <grund-tabs>.');
      }
    }
    // id can be set here — doesn't require ctx.
    if (this.value) {
      this.id = `grund-tabs-panel-${this.value}`;
    }
    // ctx not available here — registration deferred to willUpdate.
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isRegistered) {
      this.ctx?.unregisterPanel(this.value);
      this.isRegistered = false;
    }
  }

  override willUpdate(): void {
    if (this.ctx && !this.isRegistered) {
      this.ctx.registerPanel(this);
      this.isRegistered = true;
    }

    const isActive = this.ctx?.activeValue === this.value;
    this.toggleAttribute('data-selected', isActive);
    if (this.ctx) {
      this.dataset.orientation = this.ctx.orientation;
      this.dataset.activationDirection = this.ctx.activationDirection;
    }
  }

  override updated(): void {
    // Set ariaLabelledByElements after render using the Element Reference API.
    // The tab host element is in the registry by the time the panel renders
    // (tabs connect before panels in document order).
    const div = this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]');
    if (!div || !this.ctx) return;
    const record = this.ctx.getRegistry().getByValue(this.value);
    if (record?.element && record.element !== this) {
      // Cast needed until TypeScript DOM lib includes these properties.
      (div as any).ariaLabelledByElements = [record.element];
    }
  }

  override render() {
    const isActive = this.ctx?.activeValue === this.value;

    if (isActive) {
      return html`
        <div part="panel" role="tabpanel" tabindex="0">
          <slot></slot>
        </div>
      `;
      // No aria-labelledby attribute — ariaLabelledByElements set imperatively in updated().
    }

    if (this.keepMounted) {
      return html`<div part="panel" hidden><slot></slot></div>`;
    }

    // Inactive + not keepMounted: render nothing. Slotted content is unassigned
    // and not displayed. The host element itself stays in the light DOM.
    return nothing;
  }
}

if (!customElements.get('grund-tabs-panel')) {
  customElements.define('grund-tabs-panel', GrundTabsPanel);
}
