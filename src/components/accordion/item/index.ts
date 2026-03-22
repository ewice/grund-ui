import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';

import {
  accordionRootContext,
  accordionItemContext,
} from '../context/accordion.context.js';

import type { AccordionRootContext, AccordionItemContext } from '../context/accordion.context.js';
import type { AccordionOpenChangeDetail } from '../types.js';

/**
 * Accordion item container. Bridges root and leaf element context.
 *
 * @element grund-accordion-item
 * @slot - Header and panel elements
 * @fires {CustomEvent<AccordionOpenChangeDetail>} grund-open-change - When this item's open state changes (after initial mount)
 */
export class GrundAccordionItem extends LitElement {
  static override styles = css`
    :host { display: block; }
  `;

  @property() value = '';
  @property({ type: Boolean }) disabled = false;

  @consume({ context: accordionRootContext, subscribe: true })
  @state()
  private rootCtx?: AccordionRootContext;

  @provide({ context: accordionItemContext })
  @state()
  protected itemCtx: AccordionItemContext = this.createItemContext();

  private hasSettled = false;
  private prevExpanded: boolean | undefined = undefined;
  private isRegistered = false;

  // Stable callback references — bound once, reused across context recreations
  private readonly boundToggle = () => {
    this.rootCtx?.requestToggle(this.value, this.disabled);
  };
  private readonly boundAttachTrigger = (el: HTMLElement) => {
    this.rootCtx?.attachTrigger(this, el);
  };
  private readonly boundDetachTrigger = (_el: HTMLElement) => {
    this.rootCtx?.detachTrigger(this);
  };
  private readonly boundAttachPanel = (el: HTMLElement) => {
    this.rootCtx?.attachPanel(this, el);
  };
  private readonly boundDetachPanel = (_el: HTMLElement) => {
    this.rootCtx?.detachPanel(this);
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('exportparts', 'trigger,panel');
    if (!this.value) {
      this.value = crypto.randomUUID().slice(0, 8);
      if (import.meta.env.DEV) {
        console.warn(
          '[grund-accordion-item] No value provided. ' +
          'Set value="..." for SSR-safe, deterministic IDs.',
        );
      }
    }
    // rootCtx may not be available yet at connectedCallback time.
    // Registration is handled in willUpdate when rootCtx first becomes available.
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isRegistered) {
      this.rootCtx?.unregisterItem(this);
      this.isRegistered = false;
    }
    this.hasSettled = false;
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (!this.rootCtx) return;

    // Register on first availability of rootCtx
    if (!this.isRegistered) {
      this.rootCtx.registerItem(this, this.value);
      this.isRegistered = true;
    }

    // Re-register if value changed
    if (changed.has('value') && changed.get('value') !== undefined && this.isRegistered) {
      this.rootCtx.unregisterItem(this);
      this.rootCtx.registerItem(this, this.value);
    }

    const expanded = this.rootCtx.isExpanded(this.value);
    const mergedDisabled = this.rootCtx.disabled || this.disabled;
    const index = this.rootCtx.indexOf(this);

    this.toggleAttribute('data-open', expanded);
    this.toggleAttribute('data-disabled', mergedDisabled);
    this.dataset.index = String(index);

    // Only recreate item context when relevant state changes.
    // IMPORTANT: rootCtx is always a new object when root re-renders
    // (because @lit/context notifies on object reference change),
    // so changed.has('rootCtx') covers all root state changes.
    if (
      !this.hasUpdated ||
      changed.has('rootCtx') ||
      changed.has('value') ||
      changed.has('disabled')
    ) {
      this.itemCtx = this.createItemContext();
    }
  }

  override updated(_changed: Map<PropertyKey, unknown>): void {
    const expanded = this.rootCtx?.isExpanded(this.value) ?? false;

    if (this.hasSettled && this.prevExpanded !== expanded) {
      this.dispatchEvent(
        new CustomEvent<AccordionOpenChangeDetail>('grund-open-change', {
          detail: {
            open: expanded,
            value: this.value,
            index: Number(this.dataset.index ?? 0),
          },
          bubbles: true,
          composed: false,
        }),
      );
    }

    this.prevExpanded = expanded;
    this.hasSettled = true;
  }

  private createItemContext(): AccordionItemContext {
    const expanded = this.rootCtx?.isExpanded(this.value) ?? false;
    const mergedDisabled = (this.rootCtx?.disabled ?? false) || this.disabled;

    return {
      value: this.value,
      index: Number(this.dataset.index ?? 0),
      expanded,
      disabled: mergedDisabled,
      orientation: this.rootCtx?.orientation ?? 'vertical',
      keepMounted: this.rootCtx?.keepMounted ?? false,
      hiddenUntilFound: this.rootCtx?.hiddenUntilFound ?? false,
      triggerId: `grund-accordion-trigger-${this.value}`,
      panelId: `grund-accordion-panel-${this.value}`,
      toggle: this.boundToggle,
      attachTrigger: this.boundAttachTrigger,
      detachTrigger: this.boundDetachTrigger,
      attachPanel: this.boundAttachPanel,
      detachPanel: this.boundDetachPanel,
    };
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-accordion-item')) {
  customElements.define('grund-accordion-item', GrundAccordionItem);
}
