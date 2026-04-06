import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { accordionItemContext } from './accordion.context';

import type { AccordionItemContext } from './accordion.context';

/**
 * Button that toggles an accordion panel open/closed.
 *
 * @element grund-accordion-trigger
 * @slot - Trigger label content
 * @csspart trigger - The inner button element
 */
export class GrundAccordionTrigger extends LitElement {
  public static override styles = css`
    :host {
      display: block; /* block: this element is a block-level container */
    }
  `;

  @consume({ context: accordionItemContext, subscribe: true })
  @state()
  private itemCtx?: AccordionItemContext;

  private isTriggerRegistered = false;

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.itemCtx?.detachTrigger(this);
    this.isTriggerRegistered = false;
  }

  protected override willUpdate(): void {
    if (import.meta.env.DEV) {
      if (!this.itemCtx) {
        console.warn(
          '[grund-accordion-trigger] Must be used inside <grund-accordion-item>. ' +
            'Wrap this element in <grund-accordion-item value="...">.',
        );
      }
    }

    if (this.itemCtx && !this.isTriggerRegistered) {
      this.itemCtx.attachTrigger(this);
      this.isTriggerRegistered = true;
    }

    if (this.itemCtx) {
      this.toggleAttribute('data-open', this.itemCtx.expanded);
      this.toggleAttribute('data-disabled', this.itemCtx.disabled);
      this.dataset.orientation = this.itemCtx.orientation;
      this.dataset.index = String(this.itemCtx.index);
    }
  }

  private handleClick(): void {
    if (this.itemCtx?.disabled) return;
    this.itemCtx?.toggle();
  }

  // TODO(aria-linking): Migrate aria-controls from legacy IDREF to Element Reference API
  // (ariaControlsElements) once the item context exposes a getPanelElement() method.
  // The current IDREF cannot resolve across shadow root boundaries (aria-linking.md).
  protected override render() {
    const ctx = this.itemCtx;
    return html`
      <button
        part="trigger"
        type="button"
        id="${ctx?.triggerId ?? ''}"
        aria-expanded="${ctx?.expanded ?? false}"
        aria-controls="${ctx?.panelId ?? ''}"
        aria-disabled="${ctx?.disabled ?? false}"
        @click="${this.handleClick}"
      >
        <slot></slot>
      </button>
    `;
  }
}

if (!customElements.get('grund-accordion-trigger')) {
  customElements.define('grund-accordion-trigger', GrundAccordionTrigger);
}
