import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { tabsRootContext } from '../context/tabs.context.js';
import type { TabsRootContext } from '../context/tabs.context.js';

/**
 * Animated position tracker for the active tab.
 * Exposes the active tab's geometry as CSS custom properties.
 *
 * @element grund-tabs-indicator
 * @csspart indicator - The positioned indicator span
 * @cssproperty --grund-tabs-indicator-left - Distance from list left edge
 * @cssproperty --grund-tabs-indicator-right - Distance from list right edge
 * @cssproperty --grund-tabs-indicator-top - Distance from list top edge
 * @cssproperty --grund-tabs-indicator-bottom - Distance from list bottom edge
 * @cssproperty --grund-tabs-indicator-width - Width of the active tab
 * @cssproperty --grund-tabs-indicator-height - Height of the active tab
 */
export class GrundTabsIndicator extends LitElement {
  static override styles = css`:host { display: block; position: relative; }`;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  private listObserver: ResizeObserver | null = null;
  private tabObserver: ResizeObserver | null = null;
  private observedTab: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    if (import.meta.env.DEV) {
      if (!this.closest('grund-tabs-list')) {
        console.warn('[grund-tabs-indicator] Must be a child of <grund-tabs-list>.');
      }
    }

    const list = this.closest('grund-tabs-list') as HTMLElement | null;
    if (list) {
      this.listObserver = new ResizeObserver(() => this.measure());
      this.listObserver.observe(list);
    }

    this.updateTabObserver();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.listObserver?.disconnect();
    this.tabObserver?.disconnect();
    this.listObserver = null;
    this.tabObserver = null;
    this.observedTab = null;
  }

  override willUpdate(): void {
    if (this.ctx) {
      this.dataset.orientation = this.ctx.orientation;
      this.dataset.activationDirection = this.ctx.activationDirection;
    }
    this.updateTabObserver();
    this.measure();
  }

  private updateTabObserver(): void {
    if (!this.ctx) return;
    const record = this.ctx.getRegistry().getByValue(this.ctx.activeValue ?? '');
    const activeTab = record?.element ?? null;
    if (activeTab === this.observedTab) return;

    this.tabObserver?.disconnect();
    this.observedTab = activeTab;
    if (activeTab) {
      this.tabObserver = new ResizeObserver(() => this.measure());
      this.tabObserver.observe(activeTab);
    }
  }

  private measure(): void {
    if (!this.ctx?.activeValue) return;
    const record = this.ctx.getRegistry().getByValue(this.ctx.activeValue);
    const tab = record?.element;
    const list = this.closest('grund-tabs-list') as HTMLElement | null;
    if (!tab || !list) return;

    const tabRect = tab.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();

    this.style.setProperty('--grund-tabs-indicator-left', `${tabRect.left - listRect.left}px`);
    this.style.setProperty('--grund-tabs-indicator-right', `${listRect.right - tabRect.right}px`);
    this.style.setProperty('--grund-tabs-indicator-top', `${tabRect.top - listRect.top}px`);
    this.style.setProperty('--grund-tabs-indicator-bottom', `${listRect.bottom - tabRect.bottom}px`);
    this.style.setProperty('--grund-tabs-indicator-width', `${tabRect.width}px`);
    this.style.setProperty('--grund-tabs-indicator-height', `${tabRect.height}px`);
  }

  override render() {
    return html`<span part="indicator"></span>`;
  }
}

if (!customElements.get('grund-tabs-indicator')) {
  customElements.define('grund-tabs-indicator', GrundTabsIndicator);
}
