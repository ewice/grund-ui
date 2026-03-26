import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { RovingFocusController } from '../../../controllers/roving-focus.controller.js';
import { AccordionEngine } from '../engine/accordion.engine.js';
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
  public static override styles = css`
    :host { display: block; /* block: this element is a block-level container */ }
  `;

  // hasChanged: () => true — ensures Lit re-runs when a mutated array reference is re-set.
  @property({ type: Array, hasChanged: () => true })
  public value: string[] | undefined = undefined;

  // hasChanged: () => true — ensures Lit re-runs when a mutated array reference is re-set.
  @property({ type: Array, attribute: 'default-value', hasChanged: () => true })
  public defaultValue: string[] | undefined = undefined;

  @property({ type: Boolean }) public multiple = false;
  @property({ type: Boolean }) public disabled = false;
  @property() public orientation: 'vertical' | 'horizontal' = 'vertical';
  @property({ type: Boolean, attribute: 'loop-focus' }) public loopFocus = true;
  @property({ type: Boolean, attribute: 'keep-mounted' }) public keepMounted = false;
  @property({ type: Boolean, attribute: 'hidden-until-found' }) public hiddenUntilFound = false;

  @provide({ context: accordionRootContext })
  @state()
  protected rootCtx!: AccordionRootContext;

  private readonly engine = new AccordionEngine();
  private readonly registry = new AccordionRegistry();

  // Stable bound callbacks — defined as class fields so object identity is preserved across
  // createRootContext() calls. Lit context consumers re-render when context reference changes;
  // stable callbacks avoid triggering unnecessary re-renders on unrelated state updates.
  private readonly _isExpanded = (value: string) => this.engine.isExpanded(value);
  private readonly _isEffectivelyDisabled = (itemDisabled: boolean) =>
    this.engine.isEffectivelyDisabled(itemDisabled);

  private readonly _requestToggle = (itemValue: string, itemDisabled: boolean): void => {
    this.handleToggle(itemValue, itemDisabled);
  };

  private readonly _registerItem = (item: HTMLElement, value: string): void => {
    this.registry.registerItem(item, value);
  };

  private readonly _unregisterItem = (item: HTMLElement): void => {
    this.registry.unregisterItem(item);
  };

  private readonly _indexOf = (item: HTMLElement) => this.registry.indexOf(item);

  private readonly _attachTrigger = (item: HTMLElement, trigger: HTMLElement): void => {
    this.registry.attachTrigger(item, trigger);
  };

  private readonly _detachTrigger = (item: HTMLElement): void => {
    this.registry.detachTrigger(item);
  };

  private readonly _attachPanel = (item: HTMLElement, panel: HTMLElement): void => {
    this.registry.attachPanel(item, panel);
  };

  private readonly _detachPanel = (item: HTMLElement): void => {
    this.registry.detachPanel(item);
  };

  // Class field initializer — ensures exactly one controller instance per element lifetime.
  // Constructing in connectedCallback would create a new instance (and duplicate keydown
  // listeners) on every disconnect+reconnect cycle. willUpdate syncs the live options.
  private readonly rovingFocus = new RovingFocusController(this, {
    orientation: 'vertical',
    loop: true,
    getItems: () =>
      this.registry.items
        .map((r) => r.trigger?.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]') ?? null)
        .filter((t): t is HTMLElement => t !== null),
  });

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: AccordionHostSnapshot = {
      value: this.value,
      defaultValue: this.defaultValue,
      multiple: this.multiple,
      disabled: this.disabled,
    };
    this.engine.syncFromHost(snapshot);

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
      isExpanded: this._isExpanded,
      isEffectivelyDisabled: this._isEffectivelyDisabled,
      orientation: this.orientation,
      keepMounted: this.keepMounted,
      hiddenUntilFound: this.hiddenUntilFound,
      requestToggle: this._requestToggle,
      registerItem: this._registerItem,
      unregisterItem: this._unregisterItem,
      indexOf: this._indexOf,
      attachTrigger: this._attachTrigger,
      detachTrigger: this._detachTrigger,
      attachPanel: this._attachPanel,
      detachPanel: this._detachPanel,
    };
  }

  private handleToggle(itemValue: string, itemDisabled: boolean): void {
    const result = this.engine.requestToggle(itemValue, itemDisabled);

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

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-accordion')) {
  customElements.define('grund-accordion', GrundAccordion);
}
