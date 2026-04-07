import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { RovingFocusController } from '../../controllers/roving-focus.controller';
import { tabsRootContext } from './tabs.context';
import { disabledContext } from '../../context/disabled.context';
import { GrundTab } from './tab';

import type { TabsRootContext } from './tabs.context';

/**
 * Container for tab triggers. Manages keyboard navigation via roving tabindex.
 *
 * @element grund-tabs-list
 * @slot - Tab elements
 * @csspart list - The tablist wrapper
 */
export class GrundTabsList extends LitElement {
  public static override styles = css`
    :host {
      display: block; /* block: this element is a block-level container */
    }
  `;

  @property({ type: Boolean, attribute: 'activate-on-focus' }) public activateOnFocus = true;
  @property({ type: Boolean, attribute: 'loop-focus' }) public loopFocus = true;

  @consume({ context: tabsRootContext, subscribe: true })
  @state()
  private ctx?: TabsRootContext;

  @consume({ context: disabledContext, subscribe: true })
  @state()
  private ancestorDisabled = false;

  // Class field initializer — ensures exactly one controller instance per element lifetime.
  // Constructing in connectedCallback would create a new instance (and duplicate keydown
  // listeners) on every disconnect+reconnect cycle. willUpdate syncs the live options.
  private readonly rovingFocus = new RovingFocusController(this, {
    orientation: 'horizontal',
    loop: true,
    getItems: () => this.getTabButtons(),
  });

  private handleFocusin = this.onFocusin.bind(this);

  public override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('focusin', this.handleFocusin);

    if (import.meta.env.DEV && !this.closest('grund-tabs')) {
      console.warn(
        '[grund-tabs-list] Must be used inside <grund-tabs>. Wrap this element in <grund-tabs>.',
      );
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('focusin', this.handleFocusin);
  }

  protected override willUpdate(_changed: Map<PropertyKey, unknown>): void {
    this.rovingFocus?.update({
      orientation: this.ctx?.orientation ?? 'horizontal',
      loop: this.loopFocus,
    });

    if (this.ctx) {
      this.dataset.orientation = this.ctx.orientation;
      this.toggleAttribute('data-disabled', this.ancestorDisabled);
      this.dataset.activationDirection = this.ctx.activationDirection;
    }
  }

  private getTabButtons(): HTMLButtonElement[] {
    return Array.from(this.querySelectorAll('grund-tab'))
      .filter((el): el is GrundTab => el instanceof GrundTab)
      .map((tab) => tab.triggerElement)
      .filter((el): el is HTMLButtonElement => el != null);
  }

  private handleSlotchange(): void {
    this.rovingFocus?.update({ getItems: () => this.getTabButtons() });
    this.rovingFocus?.sync();
  }

  private onFocusin(event: FocusEvent): void {
    if (!this.activateOnFocus || !this.ctx) {
      return;
    }

    const tabEl = event.composedPath().find((el): el is GrundTab => el instanceof GrundTab);

    if (tabEl) {
      const { value } = tabEl;
      if (value && value !== this.ctx.activeValue) {
        this.ctx.requestActivation(value);
      }
    }
  }

  protected override render() {
    return html`
      <div part="list" role="tablist" aria-orientation="${this.ctx?.orientation ?? 'horizontal'}">
        <slot @slotchange="${this.handleSlotchange}"></slot>
      </div>
    `;
  }
}

if (!customElements.get('grund-tabs-list')) {
  customElements.define('grund-tabs-list', GrundTabsList);
}
