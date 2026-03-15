import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { AccordionController } from './accordion.controller';
import { accordionContext, type AccordionContextValue } from './accordion.context';
import { accordionStyles } from './accordion.styles';

/**
 * Root accordion container. Manages expand/collapse state and provides
 * context to all descendant accordion elements.
 *
 * @element grund-accordion
 * @fires {CustomEvent<{value: string | string[], expanded: boolean}>} grund-accordion-change - Fired when an item is expanded or collapsed
 */
@customElement('grund-accordion')
export class GrundAccordion extends LitElement {
  static override styles = accordionStyles;

  /** Controls whether one or multiple items can be open simultaneously. */
  @property({ type: String }) type: 'single' | 'multiple' = 'single';

  /** Disables all items in the accordion. */
  @property({ type: Boolean }) disabled = false;

  /** In single mode, allows the open item to be closed by clicking it again. */
  @property({ type: Boolean }) collapsible = false;

  /**
   * The value(s) of the initially expanded item(s).
   * Use a string for single mode, or an array for multiple mode.
   * Changing this after initial render resets the expanded state.
   */
  @property() value?: string | string[];

  private controller = new AccordionController(this);

  @provide({ context: accordionContext })
  accordionCtx: AccordionContextValue = this._buildCtx();

  private _buildCtx(): AccordionContextValue {
    return {
      type: this.type,
      disabled: this.disabled,
      collapsible: this.collapsible,
      expandedItems: this.controller.expandedItems,
      toggle: (value: string) => {
        this.controller.updateOptions({ type: this.type, collapsible: this.collapsible });
        this.controller.toggle(value);

        this.dispatchEvent(
          new CustomEvent('grund-accordion-change', {
            detail: {
              value: this.type === 'single' ? value : [...this.controller.expandedItems],
              expanded: this.controller.isExpanded(value),
            },
            bubbles: true,
            composed: true,
          }),
        );
      },
    };
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('value') && this.value !== undefined) {
      const values = Array.isArray(this.value) ? this.value : [this.value];
      this.controller.expandedItems = new Set(values);
    }

    const disabledValues = new Set<string>();
    this.querySelectorAll('grund-accordion-item').forEach((item) => {
      if (item.hasAttribute('disabled')) {
        const value = item.getAttribute('value');
        if (value) {
          disabledValues.add(value);
        }
      }
    });
    this.controller.setDisabledItems(disabledValues);

    this.controller.updateOptions({ type: this.type, collapsible: this.collapsible });
    this.accordionCtx = this._buildCtx();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion': GrundAccordion;
  }
}
