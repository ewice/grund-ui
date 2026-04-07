import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ifDefined } from 'lit/directives/if-defined.js';

import { tabsRootContext } from './tabs.context';

import type { TabsRootContext } from './tabs.context';

/**
 * Content panel associated with a tab by matching value.
 *
 * @element grund-tabs-panel
 * @slot - Panel content
 * @csspart panel - The panel container
 */
export class GrundTabsPanel extends LitElement {
  public static override styles = css`
    :host {
      display: block; /* block: this element is a block-level container */
    }
  `;

  @property()
  public value: string = '';

  @property({ type: Boolean, attribute: 'keep-mounted' })
  public keepMounted: boolean = false;

  @property({ type: Boolean, attribute: 'hidden-until-found' })
  public hiddenUntilFound: boolean = false;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  private isRegistered = false;

  private handleBeforematch = (): void => {
    this.ctx?.requestActivation(this.value);
  };

  public override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('beforematch', this.handleBeforematch);

    if (import.meta.env.DEV) {
      if (!this.value) {
        console.warn(
          '[grund-tabs-panel] value is required for tab-panel association. Set value="..." on this element.',
        );
      }
      if (!this.closest('grund-tabs')) {
        console.warn(
          '[grund-tabs-panel] Must be used inside <grund-tabs>. Wrap this element in <grund-tabs>.',
        );
      }
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isRegistered) {
      this.ctx?.unregisterPanel(this.value);
      this.isRegistered = false;
    }
    this.removeEventListener('beforematch', this.handleBeforematch);
  }

  protected override willUpdate(): void {
    if (!this.ctx) {
      return;
    }

    if (!this.isRegistered) {
      this.ctx.registerPanel(this.value, this);
      this.isRegistered = true;
    }

    const isActive = this.ctx.activeValue === this.value;
    this.toggleAttribute('data-selected', isActive);
    this.dataset.orientation = this.ctx.orientation;
    this.dataset.activationDirection = this.ctx.activationDirection;
  }

  protected override updated(): void {
    const panelDiv = this.shadowRoot?.querySelector<HTMLElement>('[part="panel"]');
    if (!this.ctx || !panelDiv) {
      return;
    }

    // Clear to [] when the tab is not in the DOM (e.g. dynamic tab removal) to avoid
    // stale references pointing to disconnected elements — mirrors ariaControlsElements
    // clearing in <grund-tab>.
    const tabEl = this.ctx.getTabElement(this.value);
    panelDiv.ariaLabelledByElements = tabEl ? [tabEl] : [];
  }

  protected override render() {
    if (!this.ctx) {
      return nothing;
    }

    const isActive = this.ctx.activeValue === this.value;

    if (!isActive && !this.keepMounted && !this.hiddenUntilFound) {
      return nothing;
    }

    const hidden = isActive ? undefined : this.hiddenUntilFound ? 'until-found' : '';

    return html`
      <div
        part="panel"
        role="tabpanel"
        tabindex="${ifDefined(isActive ? '0' : undefined)}"
        hidden="${ifDefined(hidden)}"
      >
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-tabs-panel')) {
  customElements.define('grund-tabs-panel', GrundTabsPanel);
}
