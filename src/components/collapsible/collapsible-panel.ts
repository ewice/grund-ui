import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ifDefined } from 'lit/directives/if-defined.js';
import { PresenceController } from '../../controllers/presence.controller';
import { collapsibleRootContext } from './collapsible.context';

import type { CollapsibleRootContext } from './collapsible.context';

export class GrundCollapsiblePanel extends LitElement {
  public static override readonly styles = css`
    /* Headless — only display mode for layout participation */
    :host { display: block; }
  `;

  @property({ type: Boolean, attribute: 'keep-mounted' }) public keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) public hiddenUntilFound = false;

  @consume({ context: collapsibleRootContext, subscribe: true })
  @state()
  private rootCtx?: CollapsibleRootContext;

  private isPanelRegistered = false;
  private hasMeasuredOpen = false;
  private beforematchTarget: HTMLElement | null = null;

  private readonly presence = new PresenceController(this, {
    isPresent: () => this.rootCtx?.open ?? false,
    getTransitionElement: () => this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null,
    onStatusChange: () => {
      this.syncPresenceAttributes();
      this.requestUpdate();
    },
  });

  private handleBeforematch = (): void => {
    this.rootCtx?.requestOpen('programmatic', null);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isPanelRegistered) {
      this.rootCtx?.unregisterPanel(this);
      this.isPanelRegistered = false;
    }
    this.clearBeforematchListener();
  }

  protected override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.rootCtx) {
        console.warn('[grund-collapsible-panel] Must be used inside <grund-collapsible>.');
      }
    }

    if (this.rootCtx && !this.isPanelRegistered) {
      this.rootCtx.registerPanel(this);
      this.isPanelRegistered = true;
    }

    if (this.rootCtx) {
      this.toggleAttribute('data-open', this.rootCtx.open);
      this.toggleAttribute('data-disabled', this.rootCtx.disabled);
    }

    this.syncPresenceAttributes();
  }

  private syncPresenceAttributes(): void {
    this.toggleAttribute('data-starting-style', this.presence.status === 'starting');
    this.toggleAttribute('data-ending-style', this.presence.status === 'ending');
  }

  protected override updated(): void {
    this.updateBeforematchListener();

    if (!this.rootCtx?.open) {
      this.hasMeasuredOpen = false;
      return;
    }

    // Measure panel dimensions once per open for CSS variable animations.
    if (!this.hasMeasuredOpen) {
      const panelEl = this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]');
      if (panelEl) {
        this.style.setProperty('--grund-collapsible-panel-height', `${panelEl.scrollHeight}px`);
        this.style.setProperty('--grund-collapsible-panel-width', `${panelEl.scrollWidth}px`);
        this.hasMeasuredOpen = true;
      }
    }
  }

  private updateBeforematchListener(): void {
    const nextTarget = this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null;
    if (this.beforematchTarget === nextTarget) return;

    this.clearBeforematchListener();
    this.beforematchTarget = nextTarget;
    this.beforematchTarget?.addEventListener('beforematch', this.handleBeforematch);
  }

  private clearBeforematchListener(): void {
    this.beforematchTarget?.removeEventListener('beforematch', this.handleBeforematch);
    this.beforematchTarget = null;
  }

  protected override render() {
    const ctx = this.rootCtx;
    if (!ctx) return nothing;

    const isOpen = ctx.open;

    // Determine whether to render the panel
    if (!isOpen && !this.presence.present) {
      if (!this.keepMounted && !this.hiddenUntilFound) return nothing;
    }

    let hidden: string | undefined;
    if (!isOpen && !this.presence.present) {
      if (this.hiddenUntilFound) {
        hidden = 'until-found';
      } else if (this.keepMounted) {
        hidden = '';
      }
    }

    const triggerEl = ctx.getTriggerElement();

    return html`
      <div
        part="panel"
        role="region"
        .ariaLabelledByElements=${triggerEl ? [triggerEl] : []}
        hidden="${ifDefined(hidden !== undefined ? hidden : undefined)}"
      >
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-collapsible-panel')) {
  customElements.define('grund-collapsible-panel', GrundCollapsiblePanel);
}
