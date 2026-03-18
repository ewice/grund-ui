import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { RovingFocusController } from '../../../controllers/roving-focus.controller';
import { AccordionController } from '../controller/accordion.controller';
import { accordionContext, type AccordionContextValue } from '../context';
import type {
  AccordionHostSnapshot,
  GrundAccordionOrientation,
} from '../types';
import type { GrundAccordionTrigger } from '../trigger/accordion-trigger';
import { accordionStyles } from './accordion.styles';

/**
 * Root accordion container. Manages expand/collapse state and provides
 * context to all descendant elements.
 *
 * @element grund-accordion
 * @fires {CustomEvent<{value: string, expanded: boolean}>} grund-change - Fired when an item is expanded or collapsed
 * @fires {CustomEvent<{value: string[], itemValue: string, open: boolean}>} grund-value-change - Fired with the next expanded value array
 */
@customElement('grund-accordion')
export class GrundAccordion extends LitElement {
  public static override readonly styles = accordionStyles;

  /** The initially expanded item value(s) in uncontrolled mode. */
  @property({ attribute: 'default-value' })
  public defaultValue?: string | string[];

  /** Disables all items in the accordion. */
  @property({ type: Boolean })
  public disabled = false;

  /** Whether closed panels use `hidden="until-found"` so page search can reveal them. */
  @property({ type: Boolean, attribute: 'hidden-until-found' })
  public hiddenUntilFound = false;

  /** Whether closed panels remain mounted by default. */
  @property({ type: Boolean, attribute: 'keep-mounted' })
  public keepMounted = false;

  /** Whether roving focus wraps when the end of the list is reached. */
  @property({ type: Boolean, attribute: 'loop-focus' })
  public loopFocus = true;

  /** Controls which arrow keys move focus between triggers. */
  @property({ type: String, reflect: true })
  public orientation: GrundAccordionOrientation = 'vertical';

  /** Permits multiple items to be open simultaneously. */
  @property({ type: Boolean, reflect: true })
  public multiple = false;

  /** The currently expanded item value(s) in controlled mode. */
  @property({ attribute: false })
  public value?: string | string[];

  private readonly controller = new AccordionController(this);

  @provide({ context: accordionContext })
  protected accordionCtx: AccordionContextValue = this.controller.contextValue;

  private readonly rovingFocus = new RovingFocusController<GrundAccordionTrigger>(this, {
    getItems: () => this.controller.triggers,
    getFocusTarget: (element) => element.triggerButton,
    isDisabled: (element) => element.disabled,
    orientation: () => this.orientation,
    loop: () => this.loopFocus,
  });

  private buildHostSnapshot(): AccordionHostSnapshot {
    return {
      multiple: this.multiple,
      value: this.value,
      defaultValue: this.defaultValue,
      disabled: this.disabled,
      orientation: this.orientation,
      loopFocus: this.loopFocus,
      keepMounted: this.keepMounted,
      hiddenUntilFound: this.hiddenUntilFound,
    };
  }

  public override willUpdate(_changedProperties: PropertyValues) {
    this.controller.syncFromHost(this.buildHostSnapshot());
    this.dataset.orientation = this.orientation;
    this.toggleAttribute('data-disabled', this.disabled);
    this.accordionCtx = this.controller.contextValue;
  }

  public override render() {
    return html`<div @keydown=${this.rovingFocus.handleKeyDown}><slot></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'grund-accordion': GrundAccordion;
  }
}
