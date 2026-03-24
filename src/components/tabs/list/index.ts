import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { RovingFocusController } from '../../../controllers/roving-focus.controller.js';
import { tabsRootContext } from '../context/tabs.context.js';

import type { TabsRootContext } from '../context/tabs.context.js';

/**
 * Container for tab triggers. Manages keyboard navigation via roving tabindex.
 *
 * @element grund-tabs-list
 * @slot - Tab elements
 * @csspart list - The tablist wrapper
 */
export class GrundTabsList extends LitElement {
  static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  @property({ type: Boolean, attribute: 'activate-on-focus' }) activateOnFocus = true;
  @property({ type: Boolean, attribute: 'loop-focus' }) loopFocus = true;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  // Class field initializer — ensures exactly one controller instance per element lifetime.
  // Constructing in connectedCallback would create a new instance (and duplicate keydown
  // listeners) on every disconnect+reconnect cycle. willUpdate syncs the live options.
  private readonly rovingFocus = new RovingFocusController(this, {
    orientation: 'horizontal',
    loop: true,
    getItems: () => this.getTabButtons(),
  });

  private handleFocusin = this.onFocusin.bind(this);

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('focusin', this.handleFocusin);

    if (import.meta.env.DEV && !this.closest('grund-tabs')) {
      console.warn('[grund-tabs-list] Must be used inside <grund-tabs>. Wrap this element in <grund-tabs>.');
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('focusin', this.handleFocusin);
  }

  override willUpdate(_changed: Map<PropertyKey, unknown>): void {
    this.rovingFocus?.update({
      orientation: this.ctx?.orientation ?? 'horizontal',
      loop: this.loopFocus,
    });

    if (this.ctx) {
      this.dataset.orientation = this.ctx.orientation;
      this.toggleAttribute('data-disabled', this.ctx.disabled);
      this.dataset.activationDirection = this.ctx.activationDirection;
    }
  }

  private getTabButtons(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>('grund-tab'))
      .map((tab) => (tab as any).triggerElement as HTMLElement | undefined)
      .filter((el): el is HTMLElement => el != null);
  }

  private handleSlotchange(): void {
    this.rovingFocus?.update({ getItems: () => this.getTabButtons() });
    this.rovingFocus?.sync();
  }

  private onFocusin(event: FocusEvent): void {
    if (!this.activateOnFocus || !this.ctx) return;

    const tabEl = event.composedPath().find(
      (el) => el instanceof HTMLElement && el.tagName === 'GRUND-TAB',
    ) as HTMLElement | undefined;

    if (tabEl) {
      const value = (tabEl as any).value as string;
      if (value && value !== this.ctx.activeValue) {
        this.ctx.requestActivation(value);
      }
    }
  }

  override render() {
    return html`
      <div
        part="list"
        role="tablist"
        aria-orientation="${this.ctx?.orientation ?? 'horizontal'}"
      >
        <slot @slotchange="${this.handleSlotchange}"></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-tabs-list')) {
  customElements.define('grund-tabs-list', GrundTabsList);
}
