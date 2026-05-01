import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ifDefined } from 'lit/directives/if-defined.js';
import { PresenceController } from '../../controllers/presence.controller';
import { collapsibleRootContext } from './collapsible.context';

import type { CollapsibleRootContext } from './collapsible.context';

/**
 * The collapsible content region.
 *
 * @element grund-collapsible-panel
 * @slot - Panel content
 * @csspart panel - The collapsible content region.
 * @cssproperty --grund-collapsible-panel-height - Current animated height of the panel in pixels.
 * @cssproperty --grund-collapsible-panel-width - Current animated width of the panel in pixels.
 */
export class GrundCollapsiblePanel extends LitElement {
  public static override readonly styles = css`
    /* block: this element is a block-level container */
    :host {
      display: block;
    }
  `;

  @property({ type: Boolean, attribute: 'keep-mounted' }) public keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) public hiddenUntilFound = false;

  @property({ attribute: 'data-open', reflect: true, type: Boolean })
  private hostOpen = false;

  @property({ attribute: 'data-disabled', reflect: true, type: Boolean })
  private hostDisabled = false;



  @consume({ context: collapsibleRootContext, subscribe: true })
  @state()
  private rootCtx?: CollapsibleRootContext;

  private isPanelAttached = false;
  private hasMeasuredOpen = false;
  private beforematchTarget: HTMLElement | null = null;

  private getPanelDiv(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null;
  }

  private readonly presence = new PresenceController(this, {
    isPresent: () => this.rootCtx?.open ?? false,
    getTransitionElement: () => this.getPanelDiv(),
    onStatusChange: () => {
      this.syncPresenceAttributes();
    },
  });

  private handleBeforematch = (): void => {
    this.rootCtx?.requestOpen('programmatic', null);
  };

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isPanelAttached) {
      this.rootCtx?.detachPanel(this);
      this.isPanelAttached = false;
    }
    this.clearBeforematchListener();
  }

  protected override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.rootCtx) {
        console.warn('[grund-collapsible-panel] Must be used inside <grund-collapsible>.');
      }
    }

    if (this.rootCtx && !this.isPanelAttached) {
      this.rootCtx.attachPanel(this);
      this.isPanelAttached = true;
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

  private syncPresenceAttributes(): void {
    // Imperative attribute toggle — avoids scheduling a Lit update during
    // willUpdate/onStatusChange, which would trigger the "change-in-update" warning.
    this.toggleAttribute('data-starting-style', this.presence.status === 'starting');
    this.toggleAttribute('data-ending-style', this.presence.status === 'ending');
  }

  protected override updated(): void {
    this.updateBeforematchListener();

    if (!this.rootCtx?.open) {
      this.hasMeasuredOpen = false;
      return;
    }

    if (!this.hasMeasuredOpen) {
      const panelEl = this.getPanelDiv();
      if (panelEl) {
        this.style.setProperty('--grund-collapsible-panel-height', `${panelEl.scrollHeight}px`);
        this.style.setProperty('--grund-collapsible-panel-width', `${panelEl.scrollWidth}px`);
        this.hasMeasuredOpen = true;
      }
    }
  }

  private updateBeforematchListener(): void {
    const nextTarget = this.getPanelDiv();
    if (this.beforematchTarget === nextTarget) {
      return;
    }

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
    if (!ctx) {
      return nothing;
    }

    const isOpen = ctx.open;

    if (!isOpen && !this.presence.present) {
      if (!this.keepMounted && !this.hiddenUntilFound) {
        return nothing;
      }
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
        hidden="${ifDefined(hidden)}"
      >
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-collapsible-panel')) {
  customElements.define('grund-collapsible-panel', GrundCollapsiblePanel);
}
