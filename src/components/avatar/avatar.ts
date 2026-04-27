import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { AvatarEngine } from './avatar.engine';
import { avatarContext } from './avatar.context';

import type { AvatarContext } from './avatar.context';
import type { AvatarStatus, AvatarStatusChangeDetail } from './types';

export class GrundAvatar extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline-block;
    }
  `;

  @provide({ context: avatarContext })
  @state()
  protected avatarCtx!: AvatarContext;

  private readonly engine = new AvatarEngine();

  private readonly setStatus = (next: AvatarStatus): void => {
    this.engine.setStatus(next);
  };

  private previousStatus: AvatarStatus | null = null;
  private unsubscribe: (() => void) | null = null;

  public override connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe ??= this.engine.onChange(() => this.requestUpdate());
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  protected override willUpdate(): void {
    const status = this.engine.status;

    this.dataset.status = status;

    if (!this.hasUpdated || status !== this.avatarCtx?.status) {
      this.avatarCtx = { status, setStatus: this.setStatus };
    }
  }

  protected override updated(): void {
    const status = this.engine.status;

    if (this.previousStatus !== null && this.previousStatus !== status) {
      this.dispatchEvent(
        new CustomEvent<AvatarStatusChangeDetail>('grund-status-change', {
          detail: { status },
          bubbles: true,
          composed: false,
        }),
      );
    }

    this.previousStatus = status;
  }

  protected override render() {
    return html`<div part="root"><slot></slot></div>`;
  }
}

if (!customElements.get('grund-avatar')) {
  customElements.define('grund-avatar', GrundAvatar);
}

