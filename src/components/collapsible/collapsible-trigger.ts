import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ifDefined } from 'lit/directives/if-defined.js';
import { collapsibleRootContext } from './collapsible.context';

import type { CollapsibleRootContext } from './collapsible.context';

/**
 * The interactive button element that toggles the collapsible.
 *
 * @element grund-collapsible-trigger
 * @slot - Trigger label or content
 * @csspart trigger - The interactive button element that toggles the collapsible.
 */
export class GrundCollapsibleTrigger extends LitElement {
  public static override readonly styles = css`
    /* Headless — only display mode for layout participation */
    :host {
      display: block;
    }
  `;

  @consume({ context: collapsibleRootContext, subscribe: true })
  @state()
  private rootCtx?: CollapsibleRootContext;

  @property({ attribute: 'data-open', reflect: true, type: Boolean })
  private hostOpen = false;

  @property({ attribute: 'data-disabled', reflect: true, type: Boolean })
  private hostDisabled = false;

  private isTriggerAttached = false;

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isTriggerAttached) {
      this.rootCtx?.detachTrigger(this);
      this.isTriggerAttached = false;
    }
  }

  protected override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.rootCtx) {
        console.warn('[grund-collapsible-trigger] Must be used inside <grund-collapsible>.');
      }
    }

    if (this.rootCtx && !this.isTriggerAttached) {
      this.rootCtx.attachTrigger(this);
      this.isTriggerAttached = true;
    }

    if (this.rootCtx) {
      if (this.hostOpen !== this.rootCtx.open) {
        this.hostOpen = this.rootCtx.open;
      }
      if (this.hostDisabled !== this.rootCtx.disabled) {
        this.hostDisabled = this.rootCtx.disabled;
      }
    }
  }

  private handleClick(): void {
    if (this.rootCtx?.disabled) {
      return;
    }
    this.rootCtx?.requestToggle('trigger-press');
  }

  protected override render() {
    const ctx = this.rootCtx;
    const panelEl = ctx?.panelElement ?? null;

    return html`
      <button
        part="trigger"
        type="button"
        aria-expanded="${ctx?.open ? 'true' : 'false'}"
        aria-disabled="${ifDefined(ctx?.disabled ? 'true' : undefined)}"
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
