import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { tabsRootContext } from '../context/tabs.context.js';

import type { TabsRootContext } from '../context/tabs.context.js';

/**
 * Visual indicator that tracks the active tab's position via CSS custom properties.
 * Position inside `<grund-tabs-list>`. Consumer uses the exposed custom properties
 * to animate or style the indicator relative to the active tab.
 *
 * @element grund-tabs-indicator
 * @csspart indicator - The indicator element
 * @cssproperty --grund-tabs-indicator-width - Width of the active tab
 * @cssproperty --grund-tabs-indicator-height - Height of the active tab
 * @cssproperty --grund-tabs-indicator-left - Distance from list left edge to active tab left edge
 * @cssproperty --grund-tabs-indicator-top - Distance from list top edge to active tab top edge
 * @cssproperty --grund-tabs-indicator-right - Distance from list right edge to active tab right edge
 * @cssproperty --grund-tabs-indicator-bottom - Distance from list bottom edge to active tab bottom edge
 */
export class GrundTabsIndicator extends LitElement {
  static override styles = css`
    /* Intentional exceptions: indicator cannot function without absolute positioning */
    :host {
      display: block;
      position: absolute;
      pointer-events: none;
    }
  `;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  private listObserver?: ResizeObserver;
  private tabObserver?: ResizeObserver;

  /** The `<grund-tabs-list>` this indicator is inside. Located in connectedCallback. */
  private listEl: Element | null = null;

  /** The active tab element being observed, used to detect when the active tab changes. */
  private observedTab: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    this.listEl = this.closest('grund-tabs-list');

    if (import.meta.env.DEV && !this.listEl) {
      console.warn(
        '[grund-tabs-indicator] Must be used inside <grund-tabs-list>. Wrap this element in <grund-tabs-list>.',
      );
    }

    if (this.listEl) {
      this.listObserver = new ResizeObserver(() => this.measure());
      this.listObserver.observe(this.listEl);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.listObserver?.disconnect();
    this.tabObserver?.disconnect();
    this.listObserver = undefined;
    this.tabObserver = undefined;
    this.observedTab = null;
  }

  override willUpdate(): void {
    if (!this.ctx) return;
    this.dataset.orientation = this.ctx.orientation;
    this.dataset.activationDirection = this.ctx.activationDirection;
  }

  override updated(): void {
    if (!this.ctx) return;

    const activeValue = this.ctx.activeValue;
    const activeTab = activeValue ? this.ctx.getTabElement(activeValue) : null;

    // Swap the tab observer when the active tab changes
    if (activeTab !== this.observedTab) {
      this.tabObserver?.disconnect();
      this.tabObserver = undefined;
      this.observedTab = activeTab;

      if (activeTab) {
        this.tabObserver = new ResizeObserver(() => this.measure());
        this.tabObserver.observe(activeTab);
      }
    }

    this.measure();
  }

  private measure(): void {
    const indicatorDiv = this.shadowRoot?.querySelector<HTMLElement>('[part="indicator"]');
    if (!indicatorDiv || !this.listEl || !this.ctx?.activeValue) return;

    const activeTab = this.ctx.getTabElement(this.ctx.activeValue);
    if (!activeTab) return;

    const listRect = this.listEl.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    indicatorDiv.style.setProperty('--grund-tabs-indicator-width', `${tabRect.width}px`);
    indicatorDiv.style.setProperty('--grund-tabs-indicator-height', `${tabRect.height}px`);
    indicatorDiv.style.setProperty('--grund-tabs-indicator-left', `${tabRect.left - listRect.left}px`);
    indicatorDiv.style.setProperty('--grund-tabs-indicator-top', `${tabRect.top - listRect.top}px`);
    indicatorDiv.style.setProperty('--grund-tabs-indicator-right', `${listRect.right - tabRect.right}px`);
    indicatorDiv.style.setProperty('--grund-tabs-indicator-bottom', `${listRect.bottom - tabRect.bottom}px`);
  }

  override render() {
    return html`<div part="indicator"></div>`;
  }
}

if (!customElements.get('grund-tabs-indicator')) {
  customElements.define('grund-tabs-indicator', GrundTabsIndicator);
}
