import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume, provide } from '@lit/context';

import { accordionRootContext, accordionItemContext } from './accordion.context';
import { disabledContext } from '../../context/disabled.context';

import type { AccordionRootContext, AccordionItemContext } from './accordion.context';
import type { AccordionOpenChangeDetail } from './types';

export class GrundAccordionItem extends LitElement {
  public static override readonly styles = css`
    :host {
      display: block;
    }
  `;

  @property() public value = '';
  @property({ type: Boolean }) public disabled = false;

  @consume({ context: accordionRootContext, subscribe: true })
  @state()
  private readonly rootCtx?: AccordionRootContext;

  @consume({ context: disabledContext, subscribe: true })
  @state()
  private readonly ancestorDisabled = false;

  @provide({ context: accordionItemContext })
  @state()
  protected itemCtx: AccordionItemContext = this.createItemContext();

  @provide({ context: disabledContext })
  @state()
  protected disabledCtx = false;

  private hasSettled = false;
  private prevExpanded: boolean | undefined = undefined;
  private isRegistered = false;

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

  public override connectedCallback(): void {
    super.connectedCallback();
    if (!this.value) {
      this.value = crypto.randomUUID().slice(0, 8);
      if (import.meta.env.DEV) {
        console.warn(
          '[grund-accordion-item] No value provided. ' +
            'Set value="..." for SSR-safe, deterministic IDs.',
        );
      }
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.isRegistered) {
      this.rootCtx?.unregisterItem(this);
      this.isRegistered = false;
    }
    this.hasSettled = false;
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (!this.rootCtx) {
      return;
    }

    if (!this.isRegistered) {
      this.rootCtx.registerItem(this, this.value);
      this.isRegistered = true;
    }

    if (changed.has('value') && changed.get('value') !== undefined && this.isRegistered) {
      this.rootCtx.unregisterItem(this);
      this.rootCtx.registerItem(this, this.value);
    }

    const expanded = this.rootCtx.isExpanded(this.value);
    const mergedDisabled = this.ancestorDisabled || this.disabled;
    const index = this.rootCtx.indexOf(this);

    this.toggleAttribute('data-open', expanded);
    this.toggleAttribute('data-disabled', mergedDisabled);
    this.disabledCtx = mergedDisabled;
    this.dataset.index = String(index);

    if (
      !this.hasUpdated ||
      changed.has('rootCtx') ||
      changed.has('ancestorDisabled') ||
      changed.has('value') ||
      changed.has('disabled')
    ) {
      this.itemCtx = this.createItemContext();
    }
  }

  protected override updated(_changed: Map<PropertyKey, unknown>): void {
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
    const mergedDisabled = this.ancestorDisabled || this.disabled;

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

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-accordion-item')) {
  customElements.define('grund-accordion-item', GrundAccordionItem);
}
