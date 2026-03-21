import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { RovingFocusController } from '../../../controllers/roving-focus.controller.js';
import { AccordionController } from '../controller/accordion.controller.js';
import { AccordionRegistry } from '../registry/accordion.registry.js';
import { accordionRootContext } from '../context/accordion.context.js';

import type { AccordionRootContext } from '../context/accordion.context.js';
import type { AccordionHostSnapshot, AccordionValueChangeDetail } from '../types.js';

/**
 * Root accordion container. Provides context to accordion items.
 *
 * @element grund-accordion
 * @slot - Accordion items
 * @fires {CustomEvent<AccordionValueChangeDetail>} grund-value-change - When the expanded set changes
 */
export class GrundAccordion extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  @property({ type: Array, hasChanged: () => true })
  value: string[] | undefined = undefined;

  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  defaultValue: string[] | undefined = undefined;

  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) disabled = false;
  @property() orientation: 'vertical' | 'horizontal' = 'vertical';
  @property({ type: Boolean, attribute: 'loop-focus' }) loopFocus = true;
  @property({ type: Boolean, attribute: 'keep-mounted' }) keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) hiddenUntilFound = false;

  @provide({ context: accordionRootContext })
  @state()
  protected rootCtx!: AccordionRootContext;

  private controller = new AccordionController();
  private registry = new AccordionRegistry();
  private rovingFocus!: RovingFocusController;

  override connectedCallback(): void {
    super.connectedCallback();
    this.rovingFocus = new RovingFocusController(this, {
      orientation: this.orientation,
      loop: this.loopFocus,
      getItems: () =>
        this.registry.items
          .map((r) => r.trigger?.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]') ?? null)
          .filter((t): t is HTMLElement => t !== null),
    });
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: AccordionHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      multiple: this.multiple,
      disabled: this.disabled,
    };
    this.controller.syncFromHost(snapshot);

    this.rovingFocus?.update({
      orientation: this.orientation,
      loop: this.loopFocus,
    });

    this.dataset.orientation = this.orientation;

    // Recreate context on first render or when state-bearing properties change.
    // Note: handleToggle() also recreates context directly because internal
    // controller state changes don't trigger willUpdate (no reactive prop changes).
    if (
      !this.hasUpdated ||
      changed.has('value') ||
      changed.has('defaultValue') ||
      changed.has('multiple') ||
      changed.has('disabled') ||
      changed.has('orientation') ||
      changed.has('keepMounted') ||
      changed.has('hiddenUntilFound')
    ) {
      this.rootCtx = this.createRootContext();
    }
  }

  private createRootContext(): AccordionRootContext {
    return {
      isExpanded: (value: string) => this.controller.isExpanded(value),
      disabled: this.disabled,
      orientation: this.orientation,
      keepMounted: this.keepMounted,
      hiddenUntilFound: this.hiddenUntilFound,
      requestToggle: (itemValue: string, itemDisabled: boolean) => {
        this.handleToggle(itemValue, itemDisabled);
      },
      registerItem: (item: HTMLElement, value: string) => {
        this.registry.registerItem(item, value);
      },
      unregisterItem: (item: HTMLElement) => {
        this.registry.unregisterItem(item);
      },
      indexOf: (item: HTMLElement) => this.registry.indexOf(item),
      attachTrigger: (item: HTMLElement, trigger: HTMLElement) => {
        this.registry.attachTrigger(item, trigger);
      },
      detachTrigger: (item: HTMLElement) => {
        this.registry.detachTrigger(item);
      },
      attachPanel: (item: HTMLElement, panel: HTMLElement) => {
        this.registry.attachPanel(item, panel);
      },
      detachPanel: (item: HTMLElement) => {
        this.registry.detachPanel(item);
      },
    };
  }

  private handleToggle(itemValue: string, itemDisabled: boolean): void {
    const result = this.controller.requestToggle({
      type: 'toggle',
      itemValue,
      itemDisabled,
    });

    if (result === null) return;

    const isOpen = result.includes(itemValue);

    this.dispatchEvent(
      new CustomEvent<AccordionValueChangeDetail>('grund-value-change', {
        detail: { value: result, itemValue, open: isOpen },
        bubbles: true,
        composed: false,
      }),
    );

    // Must recreate context here because toggle changes internal controller
    // state (expandedValues) without changing any reactive property, so
    // willUpdate's guard won't detect the change on the next render cycle.
    this.rootCtx = this.createRootContext();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-accordion')) {
  customElements.define('grund-accordion', GrundAccordion);
}
