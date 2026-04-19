import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { avatarContext } from './avatar.context';

import type { AvatarContext } from './avatar.context';

/**
 * Fallback content displayed while the avatar image is loading or has failed.
 *
 * @element grund-avatar-fallback
 * @slot - Fallback content (initials, icon)
 * @csspart fallback - Wrapper span
 */
export class GrundAvatarFallback extends LitElement {
  public static override readonly styles = css`
    :host {
      display: none; /* display:none so the fallback occupies no space while hidden */
    }
    :host([data-visible]) {
      display: inline; /* reveal once status is idle or error and delay has elapsed */
    }
  `;

  /** Milliseconds to wait before showing the fallback. Useful to avoid FOUC on fast connections. */
  @property({ type: Number }) public delay = 0;

  @consume({ context: avatarContext, subscribe: true })
  @state()
  private _ctx: AvatarContext | undefined;

  private _delayPassed = false;

  private _delayTimer: ReturnType<typeof setTimeout> | null = null;

  public override connectedCallback(): void {
    super.connectedCallback();

    if (this.delay > 0) {
      this._delayTimer = setTimeout(() => {
        this._delayPassed = true;
        this._delayTimer = null;
        this.requestUpdate();
      }, this.delay);
    } else {
      this._delayPassed = true;
    }

  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._delayTimer !== null) {
      clearTimeout(this._delayTimer);
      this._delayTimer = null;
    }
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (import.meta.env.DEV) {
      if (this._ctx === undefined) {
        console.warn(
          '[grund-avatar-fallback] Must be used inside <grund-avatar>. Wrap this element in <grund-avatar>.',
        );
      }
    }

    if (changed.has('delay') && this.hasUpdated) {
      if (this._delayTimer !== null) {
        clearTimeout(this._delayTimer);
        this._delayTimer = null;
      }
      if (this.delay > 0) {
        this._delayTimer = setTimeout(() => {
          this._delayPassed = true;
          this._delayTimer = null;
          this.requestUpdate();
        }, this.delay);
      } else {
        this._delayPassed = true;
      }
    }

    const status = this._ctx?.status ?? 'idle';
    const shouldBeVisible = (status === 'idle' || status === 'error') && this._delayPassed;
    this.toggleAttribute('data-visible', shouldBeVisible);
  }

  protected override render() {
    return html`<span part="fallback"><slot></slot></span>`;
  }
}

if (!customElements.get('grund-avatar-fallback')) {
  customElements.define('grund-avatar-fallback', GrundAvatarFallback);
}
