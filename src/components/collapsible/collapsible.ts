import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { CollapsibleEngine } from './collapsible.engine';
import { collapsibleRootContext } from './collapsible.context';

import type { CollapsibleRootContext } from './collapsible.context';
import type { CollapsibleHostSnapshot, CollapsibleOpenChangeDetail, CollapsibleOpenChangeReason } from './types';

export class GrundCollapsible extends LitElement {
  public static override readonly styles = css`
    /* Headless — only display mode for layout participation */
    :host { display: block; }
  `;

  @property({ type: Boolean, reflect: false }) public open: boolean | undefined = undefined;
  @property({ type: Boolean, attribute: 'default-open' }) public defaultOpen = false;
  @property({ type: Boolean }) public disabled = false;

  @provide({ context: collapsibleRootContext })
  @state()
  protected rootCtx!: CollapsibleRootContext;

  private readonly engine = new CollapsibleEngine();
  private triggerElement: HTMLElement | null = null;
  private panelElement: HTMLElement | null = null;

  // Stable callback references
  private readonly _requestToggle = (reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void => {
    this.handleToggle(reason, trigger);
  };
  private readonly _requestOpen = (reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void => {
    this.handleOpen(reason, trigger);
  };
  private readonly _registerTrigger = (el: HTMLElement): void => {
    if (this.triggerElement === el) return;
    this.triggerElement = el;
    this.rootCtx = this.createRootContext();
  };
  private readonly _unregisterTrigger = (el: HTMLElement): void => {
    if (this.triggerElement !== el) return;
    this.triggerElement = null;
    this.rootCtx = this.createRootContext();
  };
  private readonly _registerPanel = (el: HTMLElement): void => {
    if (this.panelElement === el) return;
    this.panelElement = el;
    this.rootCtx = this.createRootContext();
  };
  private readonly _unregisterPanel = (el: HTMLElement): void => {
    if (this.panelElement !== el) return;
    this.panelElement = null;
    this.rootCtx = this.createRootContext();
  };
  private readonly _getTriggerElement = (): HTMLElement | null => this.triggerElement;
  private readonly _getPanelElement = (): HTMLElement | null => this.panelElement;

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: CollapsibleHostSnapshot = {
      open: this.open,
      defaultOpen: this.defaultOpen,
      disabled: this.disabled,
    };
    this.engine.syncFromHost(snapshot);

    this.toggleAttribute('data-open', this.engine.isOpen);
    this.toggleAttribute('data-disabled', this.disabled);

    if (!this.hasUpdated || changed.has('open') || changed.has('defaultOpen') || changed.has('disabled')) {
      this.rootCtx = this.createRootContext();
    }
  }

  private createRootContext(): CollapsibleRootContext {
    return {
      open: this.engine.isOpen,
      disabled: this.disabled,
      requestToggle: this._requestToggle,
      requestOpen: this._requestOpen,
      registerTrigger: this._registerTrigger,
      unregisterTrigger: this._unregisterTrigger,
      registerPanel: this._registerPanel,
      unregisterPanel: this._unregisterPanel,
      getTriggerElement: this._getTriggerElement,
      getPanelElement: this._getPanelElement,
    };
  }

  private handleToggle(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void {
    const result = this.engine.requestToggle();
    if (result === null) return;

    this.emitOpenChange(result, reason, trigger);
  }

  private handleOpen(reason: CollapsibleOpenChangeReason, trigger: HTMLElement | null): void {
    if (this.engine.isOpen) return;

    const result = this.engine.requestOpen({ ignoreDisabled: reason === 'programmatic' });
    if (result === null) return;

    this.emitOpenChange(result, reason, trigger);
  }

  private emitOpenChange(
    open: boolean,
    reason: CollapsibleOpenChangeReason,
    trigger: HTMLElement | null,
  ): void {
    this.dispatchEvent(
      new CustomEvent<CollapsibleOpenChangeDetail>('grund-open-change', {
        detail: { open, reason, trigger },
        bubbles: true,
        composed: false,
      }),
    );

    // Re-provide context so children re-render
    this.rootCtx = this.createRootContext();
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-collapsible')) {
  customElements.define('grund-collapsible', GrundCollapsible);
}
