import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { provide } from '@lit/context';

import { AvatarEngine } from './avatar.engine';
import { avatarContext } from './avatar.context';

import type { AvatarContext } from './avatar.context';
import type { AvatarStatus, AvatarStatusChangeDetail } from './types';

/**
 * Root container for the Avatar compound component.
 *
 * @element grund-avatar
 * @slot - Default slot for `<grund-avatar-image>` and `<grund-avatar-fallback>`
 * @fires {CustomEvent<AvatarStatusChangeDetail>} grund-status-change - When the image loading status transitions
 * @csspart root - Host container
 */
export class GrundAvatar extends LitElement {
  public static override readonly styles = css`
    :host {
      display: inline-block;
      /* inline-block: avatar wraps inline content but itself is a sized box */
    }
  `;

  @provide({ context: avatarContext })
  @state()
  protected avatarCtx!: AvatarContext;

  private readonly engine = new AvatarEngine();

  private _previousStatus: AvatarStatus | null = null;

  private _unsubscribe: (() => void) | null = null;

  private readonly _setStatus = (next: AvatarStatus): void => {
    this.engine.setStatus(next);
  };

  constructor() {
    super();
    // Engine is not a ReactiveController, so it won't trigger Lit updates automatically.
    this._unsubscribe = this.engine.onChange(() => {
      this.requestUpdate();
    });
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = null;
  }

  protected override willUpdate(): void {
    const status = this.engine.status;

    this.dataset.status = status;

    if (!this.hasUpdated || this.engine.status !== this.avatarCtx?.status) {
      this.avatarCtx = { status, setStatus: this._setStatus };
    }
  }

  protected override firstUpdated(): void {
    if (import.meta.env.DEV) {
      const slot = this.shadowRoot!.querySelector('slot')!;
      slot.addEventListener('slotchange', () => {
        const children = slot.assignedElements({ flatten: true });
        const images = children.filter(el => el.tagName === 'GRUND-AVATAR-IMAGE');
        const fallbacks = children.filter(el => el.tagName === 'GRUND-AVATAR-FALLBACK');
        if (images.length > 1) {
          console.warn('[grund-avatar-image] more than one <grund-avatar-image> inside a <grund-avatar>. Use at most one.');
        }
        if (fallbacks.length > 1) {
          console.warn('[grund-avatar-fallback] more than one <grund-avatar-fallback> inside a <grund-avatar>. Use at most one.');
        }
      });
    }
  }

  protected override updated(): void {
    const status = this.engine.status;
    if (this._previousStatus !== null && this._previousStatus !== status) {
      this.dispatchEvent(
        new CustomEvent<AvatarStatusChangeDetail>('grund-status-change', {
          detail: { status },
          bubbles: true,
          composed: false,
        }),
      );
    }
    this._previousStatus = status;
  }

  protected override render() {
    return html`<div part="root"><slot></slot></div>`;
  }
}

if (!customElements.get('grund-avatar')) {
  customElements.define('grund-avatar', GrundAvatar);
}

export { GrundAvatarImage } from './avatar-image';
export { GrundAvatarFallback } from './avatar-fallback';
export type { AvatarStatus, AvatarStatusChangeDetail } from './types';
