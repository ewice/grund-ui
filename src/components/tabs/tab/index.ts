import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { tabsRootContext } from '../context/tabs.context.js';

import type { TabsRootContext } from '../context/tabs.context.js';

/**
 * Individual tab trigger. Renders an accessible button inside shadow DOM.
 *
 * @element grund-tab
 * @slot - Tab label content
 * @csspart tab - The inner button element
 */
export class GrundTab extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  @property()
  value: string = '';

  @property({ type: Boolean })
  disabled: boolean = false;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  /** Exposes the inner button for RovingFocusController on the list to manage tabindex. */
  get triggerElement(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector<HTMLButtonElement>('[part="tab"]') ?? null;
  }

  private isRegistered = false;

  override connectedCallback(): void {
    super.connectedCallback();

    if (import.meta.env.DEV) {
      if (!this.value) {
        console.warn(
          '[grund-tab] value is required for tab-panel association. Set value="..." on this element.',
        );
      }
      if (!this.closest('grund-tabs-list')) {
        console.warn(
          '[grund-tab] Must be used inside <grund-tabs-list>. Wrap this element in <grund-tabs-list>.',
        );
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isRegistered) {
      this.ctx?.unregisterTab(this.value);
      this.isRegistered = false;
    }
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (!this.ctx) return;

    const wasRegistered = this.isRegistered;

    if (!this.isRegistered) {
      this.ctx.registerTab(this.value, this);
      this.ctx.setDisabled(this.value, this.disabled);
      this.isRegistered = true;
    }

    // Only sync disabled change if it was already registered — avoids double-call on first render
    if (changed.has('disabled') && wasRegistered) {
      this.ctx.setDisabled(this.value, this.disabled);
    }

    const isActive = this.ctx.activeValue === this.value;
    const mergedDisabled = this.ctx.disabled || this.disabled;

    this.toggleAttribute('data-selected', isActive);
    this.toggleAttribute('data-disabled', mergedDisabled);
    this.dataset.orientation = this.ctx.orientation;
    this.dataset.activationDirection = this.ctx.activationDirection;
    this.dataset.index = String(this.ctx.indexOf(this.value));
  }

  override updated(): void {
    if (!this.ctx) return;
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('[part="tab"]');
    if (!btn) return;

    const panelEl = this.ctx.getPanelElement(this.value);
    (btn as any).ariaControlsElements = panelEl ? [panelEl] : [];
  }

  private handleClick(): void {
    if (this.ctx?.disabled || this.disabled) return;
    this.ctx?.requestActivation(this.value);
  }

  override render() {
    const isActive = this.ctx?.activeValue === this.value;
    const mergedDisabled = (this.ctx?.disabled ?? false) || this.disabled;

    return html`
      <button
        part="tab"
        role="tab"
        aria-selected="${isActive}"
        aria-disabled="${mergedDisabled}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-tab')) {
  customElements.define('grund-tab', GrundTab);
}
