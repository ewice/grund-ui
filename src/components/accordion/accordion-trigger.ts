import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import {
  accordionContext,
  accordionItemContext,
  type AccordionContextValue,
  type AccordionItemContextValue,
} from '../../context/accordion.context';
import { Keys } from '../../utils/keyboard';
import { RovingFocusController } from '../../controllers/roving-focus.controller';
import { accordionTriggerStyles } from './accordion.styles';

/**
 * The interactive button that expands or collapses an accordion item.
 * Handles click and keyboard events and exposes `aria-expanded` / `aria-controls`.
 *
 * @element grund-accordion-trigger
 * @slot - The trigger label content
 */
@customElement('grund-accordion-trigger')
export class GrundAccordionTrigger extends LitElement {
  static override styles = accordionTriggerStyles;

  @consume({ context: accordionContext, subscribe: true })
  private accordionCtx?: AccordionContextValue;

  // Public so RovingFocusController can read disabled state across sibling instances
  @consume({ context: accordionItemContext, subscribe: true })
  _itemCtx?: AccordionItemContextValue;

  private rovingFocus = new RovingFocusController(this, {
    containerSelector: 'grund-accordion',
    itemSelector: 'grund-accordion-trigger',
    getFocusTarget: (el) =>
      (el as GrundAccordionTrigger).shadowRoot?.querySelector('button') ?? null,
    isDisabled: (el) => (el as GrundAccordionTrigger)._itemCtx?.disabled ?? false,
  });

  private handleClick() {
    if (this._itemCtx?.disabled) return;
    this.accordionCtx?.toggle(this._itemCtx?.value ?? '');
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this._itemCtx?.disabled) return;

    switch (e.key) {
      case Keys.ARROW_DOWN:
        e.preventDefault();
        this.rovingFocus.moveFocus('next');
        break;
      case Keys.ARROW_UP:
        e.preventDefault();
        this.rovingFocus.moveFocus('previous');
        break;
      case Keys.HOME:
        e.preventDefault();
        this.rovingFocus.moveFocus('first');
        break;
      case Keys.END:
        e.preventDefault();
        this.rovingFocus.moveFocus('last');
        break;
    }
  }

  override render() {
    const expanded = this._itemCtx?.expanded ?? false;
    const disabled = this._itemCtx?.disabled ?? false;

    return html`
      <button
        part="trigger"
        id=${this._itemCtx?.triggerId ?? ''}
        aria-expanded=${expanded}
        aria-controls=${this._itemCtx?.panelId ?? ''}
        ?disabled=${disabled}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion-trigger': GrundAccordionTrigger;
  }
}
