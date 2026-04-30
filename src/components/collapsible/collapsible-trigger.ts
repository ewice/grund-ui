import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { collapsibleRootContext } from './collapsible.context';

import type { CollapsibleRootContext } from './collapsible.context';

export class GrundCollapsibleTrigger extends LitElement {
  public static override readonly styles = css`
    /* Headless — only display mode for layout participation */
    :host { display: block; }
  `;

  @consume({ context: collapsibleRootContext, subscribe: true })
  @state()
  private rootCtx?: CollapsibleRootContext;

  private isTriggerRegistered = false;

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isTriggerRegistered) {
      this.rootCtx?.unregisterTrigger(this);
      this.isTriggerRegistered = false;
    }
  }

  protected override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.rootCtx) {
        console.warn(
          '[grund-collapsible-trigger] Must be used inside <grund-collapsible>.',
        );
      }
    }

    if (this.rootCtx && !this.isTriggerRegistered) {
      this.rootCtx.registerTrigger(this);
      this.isTriggerRegistered = true;
    }

    if (this.rootCtx) {
      this.toggleAttribute('data-open', this.rootCtx.open);
      this.toggleAttribute('data-disabled', this.rootCtx.disabled);
    }
  }

  private handleClick(): void {
    if (this.rootCtx?.disabled) return;
    this.rootCtx?.requestToggle('trigger-press', this);
  }

  protected override render() {
    const ctx = this.rootCtx;
    const panelEl = ctx?.getPanelElement() ?? null;

    return html`
      <button
        part="trigger"
        type="button"
        aria-expanded="${ctx?.open ? 'true' : 'false'}"
        aria-disabled="${ctx?.disabled ? 'true' : 'false'}"
        .ariaControlsElements=${panelEl ? [panelEl] : []}
        @click=${this.handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-collapsible-trigger')) {
  customElements.define('grund-collapsible-trigger', GrundCollapsibleTrigger);
}
