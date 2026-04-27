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
  private readonly ctx: AvatarContext | undefined;

  private delayPassed = false;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;

  public override connectedCallback(): void {
    super.connectedCallback();
    this.startDelay();
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearDelayTimer();
  }

  protected override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('delay') && this.hasUpdated) {
      this.clearDelayTimer();
      this.startDelay();
    }

    const status = this.ctx?.status ?? 'idle';
    const shouldBeVisible = status !== 'loaded' && this.delayPassed;
    this.toggleAttribute('data-visible', shouldBeVisible);
  }

  private startDelay(): void {
    if (this.delay > 0) {
      this.delayTimer = setTimeout(() => {
        this.delayPassed = true;
        this.delayTimer = null;
        this.requestUpdate();
      }, this.delay);
    } else {
      this.delayPassed = true;
    }
  }

  private clearDelayTimer(): void {
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
  }

  protected override render() {
    return html`<span part="fallback"><slot></slot></span>`;
  }
}

if (!customElements.get('grund-avatar-fallback')) {
  customElements.define('grund-avatar-fallback', GrundAvatarFallback);
}
