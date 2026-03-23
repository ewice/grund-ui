import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { RovingFocusController } from '../../../controllers/roving-focus.controller.js';
import { tabsRootContext } from '../context/tabs.context.js';

import type { TabsRootContext } from '../context/tabs.context.js';

/**
 * Tablist container. Manages roving focus and keyboard activation.
 *
 * @element grund-tabs-list
 * @slot - Tab buttons and optional indicator
 * @csspart list - The tablist wrapper (the host element)
 */
export class GrundTabsList extends LitElement {
  static override styles = css`:host { display: block; }`;

  @property({ type: Boolean, attribute: 'activate-on-focus' }) activateOnFocus = true;
  @property({ type: Boolean, attribute: 'loop-focus' }) loopFocus = true;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  private rovingFocus?: RovingFocusController;

  override connectedCallback(): void {
    super.connectedCallback();

    if (import.meta.env.DEV) {
      if (!this.closest('grund-tabs')) {
        console.warn('[grund-tabs-list] Must be a child of <grund-tabs>.');
      }
    }

    // RovingFocusController registers its keydown listener in hostConnected(), which
    // fires synchronously inside super.connectedCallback() above. Our listener is added
    // after, so it always fires second — by which time the controller has already moved
    // focus and we can safely read document.activeElement.
    this.rovingFocus = new RovingFocusController(this, {
      orientation: this.ctx?.orientation ?? 'horizontal',
      loop: this.loopFocus,
      getItems: () =>
        Array.from(this.querySelectorAll<HTMLElement>('grund-tab:not([data-disabled])'))
          .map((t) => t.shadowRoot?.querySelector<HTMLElement>('[part="tab"]') ?? null)
          .filter((b): b is HTMLElement => b !== null),
    });

    this.addEventListener('keydown', this.handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.handleKeydown);
  }

  override willUpdate(): void {
    this.rovingFocus?.update({
      orientation: this.ctx?.orientation ?? 'horizontal',
      loop: this.loopFocus,
    });

    if (this.ctx) {
      this.setAttribute('role', 'tablist');
      this.setAttribute('aria-orientation', this.ctx.orientation);
      this.dataset.orientation = this.ctx.orientation;
      this.toggleAttribute('data-disabled', this.ctx.disabled);
      this.dataset.activationDirection = this.ctx.activationDirection;
    }
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    const orientation = this.ctx?.orientation ?? 'horizontal';
    const isHorizontal = orientation === 'horizontal';

    const navKeys = isHorizontal
      ? ['ArrowLeft', 'ArrowRight', 'Home', 'End']
      : ['ArrowUp', 'ArrowDown', 'Home', 'End'];

    const isNavKey = navKeys.includes(event.key);
    const isConfirmKey = event.key === 'Enter' || event.key === ' ';

    if (!isNavKey && !isConfirmKey) return;
    event.preventDefault();

    if (isNavKey && this.activateOnFocus) {
      // Arrow key in auto-activation mode: RovingFocusController already moved focus.
      const tabHost = document.activeElement;
      if (tabHost && this.contains(tabHost)) {
        const value = (tabHost as { value?: string })?.value;
        if (value) this.ctx?.activateTab(value);
      }
    }

    if (isConfirmKey) {
      // Enter/Space activates the focused tab regardless of activateOnFocus mode.
      const tabHost = document.activeElement;
      if (tabHost && this.contains(tabHost)) {
        const value = (tabHost as { value?: string })?.value;
        if (value) this.ctx?.activateTab(value);
      }
    }
  };

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-tabs-list')) {
  customElements.define('grund-tabs-list', GrundTabsList);
}
