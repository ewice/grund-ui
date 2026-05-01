import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { CollapsibleEngine } from './collapsible.engine';
import { collapsibleRootContext } from './collapsible.context';
import { disabledContext } from '../../context/disabled.context';

import type { CollapsibleRootContext } from './collapsible.context';
import type {
  CollapsibleHostSnapshot,
  CollapsibleOpenChangeDetail,
  CollapsibleOpenChangeReason,
} from './types';

export class GrundCollapsible extends LitElement {
  public static override readonly styles = css`
    :host {
      display: block;
    }
  `;

  @property({ type: Boolean, reflect: false }) public open: boolean | undefined = undefined;
  @property({ type: Boolean, attribute: 'default-open' }) public defaultOpen = false;
  @property({ type: Boolean }) public disabled = false;

  @property({ attribute: 'data-open', reflect: true, type: Boolean })
  private hostOpen = false;

  @property({ attribute: 'data-disabled', reflect: true, type: Boolean })
  private hostDisabled = false;

  @provide({ context: collapsibleRootContext })
  @state()
  protected rootCtx!: CollapsibleRootContext;

  @provide({ context: disabledContext })
  @state()
  protected disabledCtx = false;

  private readonly engine = new CollapsibleEngine();
  private triggerElement: HTMLElement | null = null;
  private panelElement: HTMLElement | null = null;

  private readonly _attachTrigger = (el: HTMLElement): void => {
    if (this.triggerElement === el) {
      return;
    }
    this.triggerElement = el;
    this.rootCtx = this.createRootContext();
  };
  private readonly _detachTrigger = (el: HTMLElement): void => {
    if (this.triggerElement !== el) {
      return;
    }
    this.triggerElement = null;
    this.rootCtx = this.createRootContext();
  };
  private readonly _attachPanel = (el: HTMLElement): void => {
    if (this.panelElement === el) {
      return;
    }
    this.panelElement = el;
    this.rootCtx = this.createRootContext();
  };
  private readonly _detachPanel = (el: HTMLElement): void => {
    if (this.panelElement !== el) {
      return;
    }
    this.panelElement = null;
    this.rootCtx = this.createRootContext();
  };

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const snapshot: CollapsibleHostSnapshot = {
      open: this.open,
      defaultOpen: this.defaultOpen,
      disabled: this.disabled,
    };
    this.engine.syncFromHost(snapshot);

    const open = this.engine.isOpen;
    if (this.hostOpen !== open) {
      this.hostOpen = open;
    }
    if (this.hostDisabled !== this.disabled) {
      this.hostDisabled = this.disabled;
    }
    this.disabledCtx = this.disabled;

    if (
      !this.hasUpdated ||
      changed.has('open') ||
      changed.has('defaultOpen') ||
      changed.has('disabled')
    ) {
      this.rootCtx = this.createRootContext();
    }
  }

  private createRootContext(): CollapsibleRootContext {
    return {
      open: this.engine.isOpen,
      disabled: this.disabled,
      requestToggle: this.handleToggle,
      requestOpen: this.handleOpen,
      requestClose: this.handleClose,
      attachTrigger: this._attachTrigger,
      detachTrigger: this._detachTrigger,
      attachPanel: this._attachPanel,
      detachPanel: this._detachPanel,
      triggerElement: this.triggerElement,
      panelElement: this.panelElement,
    };
  }

  private readonly handleToggle = (reason: CollapsibleOpenChangeReason): void => {
    const result = this.engine.requestToggle();
    if (result === null) {
      return;
    }

    this.emitOpenChange(result, reason);
  }

  private readonly handleOpen = (reason: CollapsibleOpenChangeReason): void => {
    if (this.engine.isOpen) {
      return;
    }

    const result = this.engine.requestOpen({ ignoreDisabled: reason === 'programmatic' });
    if (result === null) {
      return;
    }

    this.emitOpenChange(result, reason);
  }

  private readonly handleClose = (reason: CollapsibleOpenChangeReason): void => {
    if (!this.engine.isOpen) {
      return;
    }

    const result = this.engine.requestClose({ ignoreDisabled: reason === 'programmatic' });
    if (result === null) {
      return;
    }

    this.emitOpenChange(result, reason);
  }

  private emitOpenChange(open: boolean, reason: CollapsibleOpenChangeReason): void {
    this.dispatchEvent(
      new CustomEvent<CollapsibleOpenChangeDetail>('grund-open-change', {
        detail: { open, reason, trigger: this.triggerElement },
        bubbles: true,
        composed: false,
      }),
    );

    if (this.rootCtx.open !== this.engine.isOpen) {
      this.rootCtx = this.createRootContext();
    }
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get('grund-collapsible')) {
  customElements.define('grund-collapsible', GrundCollapsible);
}
