import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';

import { avatarContext } from './avatar.context';

import type { AvatarContext } from './avatar.context';

export class GrundAvatarFallback extends LitElement {
  public static override readonly styles = css`
    :host {
      display: none;
    }
    :host([data-visible]) {
      display: inline;
    }
  `;

  @property({ type: Number }) public delay = 0;

  @consume({ context: avatarContext, subscribe: true })
  @state()
  private _ctx: AvatarContext | undefined;

  private _delayPassed = false;
  private _warnedMissingParent = false;
  private _warnedDuplicate = false;

  private _delayTimer: ReturnType<typeof setTimeout> | null = null;

  public override connectedCallback(): void {
    super.connectedCallback();
    this._startDelay();
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearDelayTimer();
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (import.meta.env.DEV) {
      this._warnForMisuse();
    }

    if (changed.has('delay') && this.hasUpdated) {
      this._clearDelayTimer();
      this._startDelay();
    }

    const status = this._ctx?.status ?? 'idle';
    const shouldBeVisible = status !== 'loaded' && this._delayPassed;
    this.toggleAttribute('data-visible', shouldBeVisible);
  }

  private _warnForMisuse(): void {
    const parent = this.parentElement;

    if (parent?.localName !== 'grund-avatar') {
      if (!this._warnedMissingParent) {
        console.warn(
          '[grund-avatar-fallback] Must be used inside <grund-avatar>. ' +
            'Wrap this element in <grund-avatar>.',
        );
        this._warnedMissingParent = true;
      }
      return;
    }

    const fallbackCount = Array.from(parent.children).filter(
      (child) => child.localName === 'grund-avatar-fallback',
    ).length;

    if (fallbackCount > 1 && !this._warnedDuplicate) {
      console.warn(
        '[grund-avatar-fallback] Found more than one <grund-avatar-fallback>. ' +
          'Use a single fallback inside each <grund-avatar>.',
      );
      this._warnedDuplicate = true;
    }
  }

  private _startDelay(): void {
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

  private _clearDelayTimer(): void {
    if (this._delayTimer !== null) {
      clearTimeout(this._delayTimer);
      this._delayTimer = null;
    }
  }

  protected override render() {
    return html`<span part="fallback"><slot></slot></span>`;
  }
}

if (!customElements.get('grund-avatar-fallback')) {
  customElements.define('grund-avatar-fallback', GrundAvatarFallback);
}
