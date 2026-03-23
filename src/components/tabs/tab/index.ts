import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { tabsRootContext } from '../context/tabs.context.js';
import type { TabsRootContext } from '../context/tabs.context.js';

/**
 * Individual tab button in a tablist.
 *
 * @element grund-tab
 * @slot - Tab label
 * @csspart tab - The inner button element
 */
export class GrundTab extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property() value = '';
  @property({ type: Boolean }) disabled = false;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  private isRegistered = false;
  private previousValue = '';

  override connectedCallback(): void {
    super.connectedCallback();
    if (import.meta.env.DEV) {
      if (!this.closest('grund-tabs-list')) {
        console.warn('[grund-tab] Must be a child of <grund-tabs-list>.');
      }
    }
    // ctx is not available here — @consume fires after connectedCallback.
    // Registration is handled in willUpdate when ctx first becomes available.
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isRegistered) {
      this.ctx?.unregisterTab(this.value);
      this.isRegistered = false;
    }
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    // Set data-disabled BEFORE registering so the root's firstNonDisabled() sees
    // the correct disabled state during initial auto-selection.
    this.toggleAttribute('data-disabled', this.disabled);

    if (this.ctx && !this.isRegistered) {
      this.ctx.registerTab(this);
      this.isRegistered = true;
      this.previousValue = this.value;
    }

    // Re-register if value changed after initial registration
    if (this.isRegistered && changed.has('value') && this.previousValue !== this.value) {
      this.ctx?.unregisterTab(this.previousValue);
      this.ctx?.registerTab(this);
      this.previousValue = this.value;
    }

    if (import.meta.env.DEV) {
      if (this.ctx) {
        const registry = this.ctx.getRegistry();
        const matches = registry.entries.filter((r) => r.value === this.value);
        if (matches.length > 1) {
          console.warn(
            `[grund-tab] Duplicate value "${this.value}". Each tab must have a unique value.`,
          );
        }
      }
    }

    const isActive = this.ctx?.activeValue === this.value;
    this.toggleAttribute('data-selected', isActive);
    if (this.ctx) {
      this.dataset.orientation = this.ctx.orientation;
      this.dataset.activationDirection = this.ctx.activationDirection;
      this.dataset.index = String(this.ctx.getRegistry().indexOfValue(this.value));
    }
  }

  override firstUpdated(): void {
    if (import.meta.env.DEV) {
      if (this.ctx) {
        const record = this.ctx.getRegistry().getByValue(this.value);
        if (!record?.panel) {
          console.warn(
            `[grund-tab] No <grund-tabs-panel value="${this.value}"> found.`,
          );
        }
      }
    }
  }

  private handleClick(): void {
    if (this.disabled || this.ctx?.disabled) return;
    this.ctx?.activateTab(this.value);
  }

  override updated(): void {
    // Set ariaControlsElements after render using the Element Reference API
    // (Chrome 135+, Safari 16.4+, Firefox 136+ — all major browsers).
    // No IDs or cross-shadow IDREF resolution needed.
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>('[part="tab"]');
    if (!btn || !this.ctx) return;
    const record = this.ctx.getRegistry().getByValue(this.value);
    if (record?.panel) {
      // Cast needed until TypeScript DOM lib includes these properties.
      (btn as any).ariaControlsElements = [record.panel];
    }
  }

  override render() {
    const isActive = this.ctx?.activeValue === this.value;
    return html`
      <button
        part="tab"
        role="tab"
        aria-selected="${isActive}"
        aria-disabled="${this.disabled}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </button>
    `;
    // No aria-controls attribute — ariaControlsElements is set imperatively in updated().
    // No id on host or button — element references need no IDs.
  }
}

if (!customElements.get('grund-tab')) {
  customElements.define('grund-tab', GrundTab);
}
